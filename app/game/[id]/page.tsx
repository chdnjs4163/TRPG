"use client"
import React, { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Icons
import {
  Volume2,
  Send,
  Menu,
  Users,
  Map,
  FileText,
  Dice5,
  ChevronLeft,
} from "lucide-react"

// Utilities
import { cn } from "@/lib/utils"
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

const FLASK_AI_SERVICE_URL = "http://localhost:5000"

export default function GamePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // --- 상태 관리 ---
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [gameTitle, setGameTitle] = useState("시나리오 생성 중...")
  const [messages, setMessages] = useState<Message[]>([])
  const [maps, setMaps] = useState<GameMap[]>([])
  const [activeTab, setActiveTab] = useState("players")
  const [currentMapIndex, setCurrentMapIndex] = useState(0)

  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "아서", role: "전사", avatar: "/images/fantasy-game.png", health: 85, maxHealth: 100, status: [], inventory: [], equipment: {}, stats: { strength: 18, dexterity: 14, intelligence: 10, constitution: 16 }, level: 7, experience: 68 },
    { id: 2, name: "메린다", role: "마법사", avatar: "/images/fantasy-kingdom.png", health: 50, maxHealth: 70, mana: 80, maxMana: 100, status: [], inventory: [], equipment: {}, stats: { strength: 8, dexterity: 12, intelligence: 20, constitution: 9 }, level: 5, experience: 11 },
    { id: 3, name: "토린", role: "궁수", avatar: "/images/adventure-game.png", health: 70, maxHealth: 80, status: [], inventory: [], equipment: {}, stats: { strength: 13, dexterity: 17, intelligence: 26, constitution: 27 }, level: 6, experience: 45 },
    { id: 4, name: "GM", role: "게임 마스터", avatar: "/images/dungeon-master.png", health: 100, maxHealth: 100, status: [], inventory: [], equipment: {}, stats: { strength: 0, dexterity: 0, intelligence: 0, constitution: 0 }, level: 0, experience: 0 },
  ])

  // --- useEffect ---
  useEffect(() => {
    const fetchInitialScenario = async () => {
      try {
        setIsLoading(true)
        const templateTitle = searchParams.get('title') || "기본 던전"
        // 👇 [수정] URL에 현재 시간을 붙여 매번 새로운 주소인 것처럼 만듭니다.
        const urlWithCacheBusting = `${FLASK_AI_SERVICE_URL}/api/ai/generate-scenario?timestamp=${Date.now()}`;

        const response = await axios.post(urlWithCacheBusting, { // 수정된 URL 사용
          templateTitle: templateTitle,
        });
        
        if (response.data && response.data.map) {
          const { gameTitle, initialMessage, map } = response.data
          setGameTitle(gameTitle)
          setMessages([{
            id: Date.now(),
            sender: "GM",
            content: initialMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "system",
          }])
          setMaps([{
            id: 1,
            name: map.name,
            image: "/images/assets.png", // TODO: AI 이미지 생성 필요
            description: map.description,
          }])
        } else {
          throw new Error("서버로부터 받은 데이터의 형식이 올바르지 않습니다.")
        }
      } catch (error) {
        console.error("초기 시나리오 생성에 실패했습니다:", error)
        setGameTitle("오류 발생")
        setMessages([{
          id: Date.now(),
          sender: "시스템",
          content: "시나리오를 불러오는 데 실패했습니다. 서버 상태를 확인해주세요.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "system",
        }])
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialScenario()
  }, [searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // --- 함수들 ---
  const handleSendMessage = async () => {
    if (!message.trim()) return

    const newUserMessage: Message = {
      id: Date.now(),
      sender: "Player", // TODO: 현재 플레이어 이름으로 변경
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "chat",
    }
    setMessages(prev => [...prev, newUserMessage])
    setMessage("")

    try {
      const history = [...messages, newUserMessage].map(msg => ({
        role: msg.sender === "GM" || msg.sender === "시스템" ? "assistant" : "user",
        content: msg.content
      }))

      const response = await axios.post(`${FLASK_AI_SERVICE_URL}/generate-response`, { history })

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "GM",
        content: response.data.aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "chat",
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error("메시지 전송 실패:", error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "시스템",
        content: "죄송합니다. 응답을 생성하는 데 실패했습니다.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "system",
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold">✨ 당신의 새로운 모험을 생성하는 중...</p>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }
  
  // --- 렌더링 ---
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* 1. 왼쪽 사이드바 (플레이어 목록) */}
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">플레이어</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {players.map((player) => (
                <div key={player.id} className="p-2 rounded-md hover:bg-accent">
                    <div className="flex items-center space-x-3">
                        <Avatar>
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.role}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </aside>

      {/* 2. 중앙 콘텐츠 (맵, 채팅) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 맵 이미지 영역 */}
        <div className="relative h-2/5 border-b">
            {maps.length > 0 && (
                <Image
                    src={maps[currentMapIndex].image}
                    alt={maps[currentMapIndex].name}
                    fill
                    className="object-cover"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-bold">{maps.length > 0 ? maps[currentMapIndex].name : "로딩 중..."}</h3>
                <p className="text-sm">{maps.length > 0 ? maps[currentMapIndex].description : ""}</p>
            </div>
        </div>

        {/* 메시지 및 입력 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* 메시지 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex items-start gap-3 max-w-[85%]",
                            msg.sender !== "GM" && msg.sender !== "시스템" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={players.find(p => p.name === msg.sender)?.avatar} />
                            <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "rounded-lg p-3",
                            msg.sender !== "GM" && msg.sender !== "시스템" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                            <p className="text-sm font-medium mb-1">{msg.sender}</p>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className="flex gap-2 border-t pt-4">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <Button onClick={handleSendMessage} className="h-auto">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
      </main>

      {/* 3. 오른쪽 사이드바 (정보 탭) */}
      <aside className="w-80 border-l bg-card p-4 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">플레이어</TabsTrigger>
            <TabsTrigger value="maps">맵</TabsTrigger>
            <TabsTrigger value="notes">노트</TabsTrigger>
          </TabsList>
          <TabsContent value="players" className="mt-4 space-y-4">
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
                      <div className="flex justify-between text-sm"><span>체력</span><span>{player.health}/{player.maxHealth}</span></div>
                      <Progress value={(player.health / player.maxHealth) * 100} className="h-2" />
                    </div>
                    {player.mana != null && (
                      <div>
                        <div className="flex justify-between text-sm"><span>마나</span><span>{player.mana}/{player.maxMana}</span></div>
                        <Progress value={(player.mana / (player.maxMana || 1)) * 100} className="h-2" indicatorClassName="bg-blue-500" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* 다른 탭 콘텐츠 추가 */}
        </Tabs>
      </aside>
    </div>
  )
}