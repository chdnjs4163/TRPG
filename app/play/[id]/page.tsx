// 게임이 진행되는 메인 게임 플레이 페이지

"use client";
import React from "react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
// ... 기타 필요한 인터페이스

const FLASK_AI_SERVICE_URL = "http://localhost:1024";

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

  // --- [수정 1] 플레이어 설정 전용 useEffect ---
  // 이 useEffect는 URL에서 캐릭터 정보를 읽어와 'players' 상태를 설정하는 역할만 합니다.
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
        setIsError(true);
        setGameTitle("캐릭터 정보 오류");
        setMessages([{id: Date.now(), sender: "시스템", content: "캐릭터 정보를 읽어오는 데 실패했습니다.", timestamp: "", type: "system"}]);
      }
    }
  }, [searchParams]);

  // --- [수정 2] AI 시나리오 로딩 전용 useEffect ---
  // 이 useEffect는 AI 서버와 통신하여 게임 시나리오를 가져오는 역할만 합니다.
  useEffect(() => {
    const fetchInitialScenario = async () => {
      try {
        const templateTitle = searchParams.get("title") || "기본 던전";
        const url = `${FLASK_AI_SERVICE_URL}/api/ai/generate-scenario?timestamp=${Date.now()}`;
        const response = await axios.post(url, { templateTitle });
        
        if (response.data) {
          const { gameTitle, initialMessage } = response.data;
          setGameTitle(gameTitle);
          setMessages([
            {
              id: Date.now(), sender: "시스템", content: initialMessage,
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

    fetchInitialScenario();
  }, [searchParams]);

  // 채팅 메시지 스크롤 (기존과 동일)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => { /* 메시지 전송 로직 */ };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-lg font-semibold">✨ 모험을 준비 중입니다...</p>
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
                  <Avatar>
                    <AvatarImage src={player.avatar} alt={player.name} />
                    <AvatarFallback>{player.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>체력</span>
                      <span>{player.health}/{player.maxHealth}</span>
                    </div>
                    <Progress value={(player.health / player.maxHealth) * 100} className="h-2"/>
                  </div>
                  {player.mana != null && (
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>마나</span>
                        <span>{player.mana}/{player.maxMana}</span>
                      </div>
                      <Progress value={(player.mana / (player.maxMana || 100)) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {isError ? (
          <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
            <h3 className="text-2xl font-bold mb-2">{gameTitle}</h3>
            <div className="bg-muted rounded-lg p-3 max-w-md">
              <p className="text-muted-foreground">
                {messages[0]?.content || "알 수 없는 오류가 발생했습니다."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-1/6 border-b p-4 flex items-end bg-black/10">
              <h3 className="text-2xl font-bold text-foreground">{gameTitle}</h3>
            </div>
            <div className="h-5/6 flex flex-col overflow-hidden p-4">
              <div className="flex flex-col justify-end flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex items-start gap-3 max-w-[85%]", msg.sender !== "시스템" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender === "시스템" ? undefined : players.find((p) => p.name === msg.sender)?.avatar} />
                      <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("rounded-lg p-3", msg.sender !== "시스템" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <p className="text-sm font-medium mb-1">{msg.sender}</p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 border-t pt-4">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                <Button onClick={handleSendMessage} className="h-auto">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}