// 실시간 플레이 페이지 - 대화형 스토리텔링/맵/플레이어/녹화 등 종합 인터페이스
"use client"
import React from "react"
import axios from "axios"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Menu,
  Settings,
  Users,
  Map,
  FileText,
  Dice5,
  PauseCircle,
  PlayCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Swords,
  FlaskRoundIcon as Flask,
  Backpack,
  RepeatIcon as Record,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GameRecorder } from "@/components/game-recorder"

// --- 인터페이스 정의 ---
interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  type?: "system" | "chat" | "dice" | "combat"
}
interface Player {
  id: number
  name: string
  role: string
  avatar: string
  health: number
  maxHealth: number
  mana?: number
  maxMana?: number
  status?: string[]
  inventory?: Item[]
  equipment?: Equipment
  stats: {
    strength: number
    dexterity: number
    intelligence: number
    constitution: number
  }
  level: number
  experience: number
}
interface Item {
  id: number
  name: string
  type: "weapon" | "armor" | "potion" | "scroll" | "misc"
  description: string
  effect?: string
  value?: number
}
interface Equipment {
  weapon?: Item
  armor?: Item
  accessory?: Item
}
interface Enemy {
  id: number
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  image: string
}
interface GameMap {
  id: number
  name: string
  image: string
  description: string
  enemies?: Enemy[]
  items?: Item[]
}
interface GameAction {
  type: string
  payload: any
  timestamp: number
}

// Flask 서버 주소
const FLASK_AI_SERVICE_URL = "http://localhost:5000"

export default function GamePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // --- 상태(State) 관리 ---
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState("시나리오 생성 중...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [activePlayerId, setActivePlayerId] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  // ... 기타 상태들 ...
  
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: "아서",
      role: "전사",
      avatar: "/images/fantasy-game.png",
      health: 85,
      maxHealth: 100,
      status: ["중독됨"],
      inventory: [{ id: 1, name: "체력 물약", type: "potion", description: "체력을 30 회복합니다.", effect: "health+30", value: 30, }, { id: 4, name: "강철 검", type: "weapon", description: "기본 공격력이 높은 검입니다.", value: 10, }],
      equipment: { weapon: { id: 4, name: "강철 검", type: "weapon", description: "기본 공격력이 높은 검입니다.", value: 10, }, armor: { id: 7, name: "가죽 갑옷", type: "armor", description: "기본적인 방어력을 제공하는 갑옷입니다.", value: 5, }, },
      stats: { strength: 18, dexterity: 14, intelligence: 10, constitution: 16, },
      level: 7,
      experience: 68,
    },
    {
      id: 2,
      name: "메린다",
      role: "마법사",
      avatar: "/images/fantasy-kingdom.png",
      health: 50,
      maxHealth: 70,
      mana: 80,
      maxMana: 100,
      status: ["마법 강화"],
      inventory: [{ id: 2, name: "마나 물약", type: "potion", description: "마나를 20 회복합니다.", effect: "mana+20", value: 20, }, { id: 5, name: "마법 지팡이", type: "weapon", description: "마법 공격력을 높여주는 지팡이입니다.", value: 8, }],
      equipment: { weapon: { id: 5, name: "마법 지팡이", type: "weapon", description: "마법 공격력을 높여주는 지팡이입니다.", value: 8, }, armor: { id: 8, name: "마법사 로브", type: "armor", description: "마법 저항력을 높여주는 로브입니다.", value: 3, }, },
      stats: { strength: 8, dexterity: 12, intelligence: 20, constitution: 9, },
      level: 5,
      experience: 11,
    },
    // ... 나머지 플레이어 데이터
  ]);
  
  // --- 이펙트 훅 (Effects) ---

  useEffect(() => {
    const fetchInitialScenario = async () => {
      try {
        setIsLoading(true);
        const templateTitle = searchParams.get('title') || "기본 던전";

        const response = await axios.post(`${FLASK_AI_SERVICE_URL}/api/ai/generate-scenario`, {
          templateTitle: templateTitle,
        });

        if (response.data && response.data.map) {
          const { gameTitle, initialMessage, map } = response.data;
          setGameTitle(gameTitle);
          setMessages([{
            id: Date.now(),
            sender: "GM",
            content: initialMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "system",
          }]);
          setMaps([{
            id: 1,
            name: map.name,
            image: "/images/assets.png", // TODO: AI 이미지 생성 필요
            description: map.description,
          }]);
        } else {
          throw new Error("서버로부터 받은 데이터의 형식이 올바르지 않습니다.");
        }
      } catch (error) {
        console.error("초기 시나리오 생성에 실패했습니다:", error);
        setGameTitle("오류 발생");
        setMessages([{
          id: Date.now(),
          sender: "시스템",
          content: "시나리오를 불러오는 데 실패했습니다. 서버 상태를 확인해주세요.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "system",
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialScenario();
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setGameTime((prev) => prev + 1)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaused]);

  // --- 함수 (Functions) ---

  const handleSendMessage = async () => {
    if (message.trim() === "") return;
    const userMessageContent = message;
    setMessage("");

    const newMessage: Message = {
      id: Date.now(),
      sender: players.find(p => p.id === activePlayerId)?.name || "User",
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "chat",
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const historyForAI = [...messages, newMessage]
        .filter(msg => msg.type === "chat" || msg.type === "system")
        .map(msg => ({
          role: msg.sender === "GM" ? "assistant" : "user",
          content: msg.content,
        }));

      const response = await axios.post(`${FLASK_AI_SERVICE_URL}/generate-response`, {
        history: historyForAI,
      });

      if (response.data.aiResponse) {
        const gmMessage: Message = {
          id: Date.now() + 1,
          sender: "GM",
          content: response.data.aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "chat",
        };
        setMessages(prev => [...prev, gmMessage]);
      }
    } catch (error) {
        console.error("AI 서비스 호출 중 오류 발생:", error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          sender: "시스템",
          content: "AI 응답을 가져오는 데 실패했습니다. 서버 상태를 확인해주세요.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "system",
        }
        setMessages((prev) => [...prev, errorMessage]);
    }
  };
  
  const formatGameTime = () => {
    const hours = Math.floor(gameTime / 3600);
    const minutes = Math.floor((gameTime % 3600) / 60);
    const seconds = gameTime % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // --- 렌더링 (Rendering) ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold">✨ 당신의 새로운 모험을 생성하는 중...</p>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  // 👇 [수정] 비어있던 return 문을 전체 UI 코드로 복원했습니다.
  return (
    <div className={cn("flex flex-col h-screen bg-background")}>
      {/* 게임 헤더 */}
      <header className="flex justify-between items-center p-3 border-b bg-card">
        <div>
            <h1 className="text-lg font-bold">{gameTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatGameTime()}</span>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? "게임 재개" : "게임 일시정지"}
            >
                {isPaused ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => router.push("/dashboard")}>
                나가기
            </Button>
        </div>
      </header>

      {/* 메인 게임 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <div className="w-64 border-r bg-card hidden md:block">
          <Tabs defaultValue="players" className="h-full">
            <TabsList className="grid grid-cols-3 h-12">
              <TabsTrigger value="players">플레이어</TabsTrigger>
              <TabsTrigger value="maps">맵</TabsTrigger>
              <TabsTrigger value="inventory">인벤토리</TabsTrigger>
            </TabsList>
            <TabsContent value="players" className="p-2 h-[calc(100%-3rem)] overflow-auto">
              {players.map((player) => (
                <Card key={player.id} className="mb-2 p-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback>{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.role}</div>
                      <Progress value={(player.health / player.maxHealth) * 100} className="h-2 mt-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            {/* 맵, 인벤토리 탭 콘텐츠 추가 필요 */}
          </Tabs>
        </div>

        {/* 게임 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 맵 영역 */}
          <div className="relative h-64 md:h-80 bg-black">
            {maps.length > 0 && (
                <Image
                    src={maps[0].image}
                    alt={maps[0].name}
                    fill
                    className="object-cover"
                />
            )}
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-xl font-bold">{maps.length > 0 ? maps[0].name : "맵 정보 없음"}</h2>
              <p className="text-sm">{maps.length > 0 ? maps[0].description : ""}</p>
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "GM" ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-lg p-3 max-w-[85%] ${msg.sender === "GM" ? "bg-card border" : "bg-primary text-primary-foreground"}`}>
                      <div className="font-bold text-sm">{msg.sender}</div>
                      <p>{msg.content}</p>
                      <div className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 채팅 입력창 */}
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                className="min-h-[60px] flex-1"
              />
              <Button onClick={handleSendMessage} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}