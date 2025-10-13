// app/game/[id]/page.tsx

"use client";
import React from "react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AiWebSocketClient } from "@/lib/ws";
import { AI_SERVER_HTTP_URL } from "@/app/config";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 인터페이스 정의 ---
interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type?: "system" | "chat" | "dice" | "combat";
}
interface Player {
  id: number;
  name: string;
  role: string;
  avatar: string;
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
  level: number;
}

const FLASK_AI_SERVICE_URL = AI_SERVER_HTTP_URL;

export default function GamePage() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 상태 관리 ---
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState("시나리오 생성 중...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isError, setIsError] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<AiWebSocketClient | null>(null);

  // 플레이어 설정 전용 useEffect
  useEffect(() => {
    const characterParam = searchParams.get("character");
    if (characterParam) {
      try {
        const character = JSON.parse(decodeURIComponent(characterParam));
        const newPlayer: Player = {
          id: character.id || Date.now(),
          name: character.name,
          role: character.class,
          avatar: character.avatar,
          health: 100, maxHealth: 100,
          mana: character.class.toLowerCase().includes("mage") ? 100 : undefined,
          maxMana: character.class.toLowerCase().includes("mage") ? 100 : undefined,
          level: character.level || 1,
        };
        setPlayers([newPlayer]);
      } catch (error) {
        console.error("캐릭터 정보 파싱 실패:", error);
      }
    }
  }, [searchParams]);

  // AI 세션 시작 + 시나리오 로딩
  useEffect(() => {
    const startSessionAndFetchScenario = async () => {
      setIsLoading(true);
      try {
        const templateTitle = searchParams.get("title") || "기본 던전";

        // 1) 세션 시작 (게임/유저/캐릭터 ID 전달)
        const gameId = searchParams.get("gameId") || searchParams.get("id") || "";
        const userId = (typeof window !== "undefined" && localStorage.getItem("userId")) || "guest";
        const characterParam = searchParams.get("character");
        const character = characterParam ? JSON.parse(decodeURIComponent(characterParam)) : null;

        const startRes = await fetch("/api/ai/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ gameId, userId, characterId: character?.id ?? "unknown" }),
        });
        const startData = await startRes.json();
        if (!startRes.ok) throw new Error(startData?.error || "세션 시작 실패");
        const newSessionId: string = startData.sessionId || startData.id || String(Date.now());
        setSessionId(newSessionId);

        // 2) 초기 시나리오 요청 (AI 서버 HTTP)
        const url = `${FLASK_AI_SERVICE_URL}/api/ai/generate-scenario?timestamp=${Date.now()}`;
        const response = await axios.post(url, { templateTitle, sessionId: newSessionId });
        
        if (response.data) {
          setGameTitle(response.data.gameTitle);
          setMessages([
            {
              id: Date.now(), sender: "시스템", content: response.data.initialMessage,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: "system",
            },
          ]);
        } else { throw new Error("서버 응답 데이터 형식이 잘못되었습니다."); }
      } catch (error) {
        console.error("초기 시나리오 생성 실패:", error);
        setGameTitle("오류 발생");
        setMessages([
          {
            id: Date.now(), sender: "시스템",
            content: "시나리오를 불러오는 데 실패했습니다. 서버 상태를 확인해주세요.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "system",
          },
        ]);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    startSessionAndFetchScenario();
  }, [searchParams]);

  // WebSocket 연결 관리
  useEffect(() => {
    if (!sessionId) return;
    const client = new AiWebSocketClient({
      sessionId,
      onEvent: (evt) => {
        if (evt.type === "message") {
          const m = evt.data;
          if (m.kind === "chat") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: m.role === "assistant" ? "시스템" : "플레이어",
                content: m.content,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type: m.role === "system" ? "system" : "chat",
              },
            ]);
          } else if (m.kind === "image") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: "시스템",
                content: `이미지 생성됨 (${m.mime})`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type: "system",
              },
            ]);
          }
        }
      },
    });
    client.connect();
    socketRef.current = client;
    return () => client.close();
  }, [sessionId]);

  // 채팅 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const content = message.trim();
    if (!content) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "플레이어",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "chat",
      },
    ]);
    setMessage("");
    socketRef.current?.sendUserMessage(content);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <aside className="w-60 border-r bg-card p-4">
          <h2 className="text-lg font-semibold mb-4">플레이어</h2>
          <div className="space-y-4">{players.map((player) => (<Card key={player.id}><CardContent className="p-4"><div className="flex items-center space-x-3 mb-3"><Avatar><AvatarImage src={player.avatar} alt={player.name} /><AvatarFallback>{player.name[0]}</AvatarFallback></Avatar><div><h3 className="font-semibold">{player.name}</h3><p className="text-sm text-muted-foreground">{player.role}</p></div></div></CardContent></Card>))}</div>
        </aside>
        <main className="flex-1 flex flex-col justify-center items-center">
          <p className="text-lg font-semibold">✨ 모험을 준비 중입니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-60 border-r bg-card p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">플레이어</h2>
        <div className="space-y-4">
          {players.map((player) => (
            <Card key={player.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar><AvatarImage src={player.avatar} alt={player.name} /><AvatarFallback>{player.name[0]}</AvatarFallback></Avatar>
                  <div><h3 className="font-semibold">{player.name}</h3><p className="text-sm text-muted-foreground">{player.role}</p></div>
                </div>
                <div className="space-y-2">
                  <div><div className="flex justify-between text-sm"><span>체력</span><span>{player.health}/{player.maxHealth}</span></div><Progress value={(player.health / player.maxHealth) * 100} className="h-2"/></div>
                  {player.mana != null && (<div><div className="flex justify-between text-sm"><span>마나</span><span>{player.mana}/{player.maxMana}</span></div><Progress value={(player.mana / (player.maxMana || 100)) * 100} className="h-2" /></div>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </aside>
      
      {/* [핵심 수정] isError 여부와 관계없이 항상 동일한 레이아웃을 사용합니다. */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 제목 영역 */}
        <div className="h-1/2 border-b p-4 flex items-end bg-black/10">
          <h3 className="text-2xl font-bold text-foreground">{gameTitle}</h3>
        </div>

        {/* 하단 채팅 영역 */}
        <div className="h-1/2 flex flex-col overflow-hidden p-4">
          <div className="flex flex-col justify-end flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex items-start gap-3 max-w-[85%]", msg.sender !== "시스템" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                <Avatar className="h-8 w-8"><AvatarImage src={msg.sender === "시스템" ? undefined : players.find((p) => p.name === msg.sender)?.avatar} /><AvatarFallback>{msg.sender[0]}</AvatarFallback></Avatar>
                <div className={cn("rounded-lg p-3", msg.sender !== "시스템" ? "bg-primary text-primary-foreground" : "bg-muted")}><p className="text-sm font-medium mb-1">{msg.sender}</p><p className="whitespace-pre-wrap">{msg.content}</p></div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t pt-4">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
            <Button onClick={handleSendMessage} className="h-auto"><Send className="h-5 w-5" /></Button>
          </div>
        </div>
      </main>
    </div>
  );
}