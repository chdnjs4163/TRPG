"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  type?: "system" | "chat" | "dice"
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
  // Additional character stats could be added here
}

interface GameMap {
  id: number
  name: string
  image: string
}

interface GameNote {
  id: number
  title: string
  content: string
  createdAt: string
}

export default function PlayGamePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState("")
  const [isMusicMuted, setIsMusicMuted] = useState(false)
  const [isVoiceMuted, setIsVoiceMuted] = useState(false)
  const [musicVolume, setMusicVolume] = useState(50)
  const [voiceVolume, setVoiceVolume] = useState(70)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeMapIndex, setActiveMapIndex] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false)
  const [playerVolumes, setPlayerVolumes] = useState<Record<number, number>>({
    1: 80,
    2: 80,
    3: 80,
    4: 80,
  })

  // 게임 데이터
  const gameTitle = "던전 탐험: 잊혀진 왕국의 비밀"
  const gameDescription = "고대 왕국의 유적을 탐험하며 숨겨진 보물과 위험한 함정을 발견하는 모험"

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "GM",
      content: "여러분은 어두운 던전의 입구에 서 있습니다. 앞으로 나아갈 준비가 되었나요?",
      timestamp: "10:00",
    },
    {
      id: 2,
      sender: "플레이어1",
      content: "저는 준비됐어요! 제 검을 들고 앞장서겠습니다.",
      timestamp: "10:01",
    },
    {
      id: 3,
      sender: "플레이어2",
      content: "저는 뒤에서 마법으로 지원하겠습니다.",
      timestamp: "10:02",
    },
    {
      id: 4,
      sender: "GM",
      content: "앞으로 나아가자 거대한 문이 보입니다. 문에는 이상한 문양이 새겨져 있습니다.",
      timestamp: "10:03",
    },
    {
      id: 5,
      sender: "시스템",
      content: "플레이어1이 주사위 20면체를 굴려 15가 나왔습니다.",
      timestamp: "10:04",
      type: "dice",
    },
    {
      id: 6,
      sender: "GM",
      content:
        "성공! 문양을 해독했습니다. 이 문은 고대 드워프 문자로 '용기있는 자만이 지나갈 수 있다'고 쓰여 있습니다.",
      timestamp: "10:05",
    },
    {
      id: 7,
      sender: "시스템",
      content: "게임 마스터가 새로운 맵 '고대 던전 입구'를 공개했습니다.",
      timestamp: "10:06",
      type: "system",
    },
  ])

  const players: Player[] = [
    {
      id: 1,
      name: "아서",
      role: "전사",
      avatar: "/images/warrior.png",
      health: 85,
      maxHealth: 100,
      status: ["중독됨"],
    },
    {
      id: 2,
      name: "멀린",
      role: "마법사",
      avatar: "/images/wizard.png",
      health: 50,
      maxHealth: 70,
      mana: 80,
      maxMana: 100,
      status: ["마법 강화"],
    },
    {
      id: 3,
      name: "토린",
      role: "궁수",
      avatar: "/images/elf archer.png",
      health: 70,
      maxHealth: 80,
    },
    {
      id: 4,
      name: "GM",
      role: "게임 마스터",
      avatar: "/images/game master.png",
      health: 100,
      maxHealth: 100,
    },
  ]

  const maps: GameMap[] = [
    { id: 1, name: "고대 던전 입구", image: "/images/assets.png" },
    { id: 2, name: "보물 방", image: "/images/rom.png" },
    { id: 3, name: "함정 복도", image: "/images/trap.png" },
  ]

  const notes: GameNote[] = [
    {
      id: 1,
      title: "던전 정보",
      content: "이 던전은 고대 드워프 왕국의 유적으로, 수많은 보물과 함정이 있다고 알려져 있다.",
      createdAt: "2023-04-20",
    },
    {
      id: 2,
      title: "퀘스트 목표",
      content: "왕관을 찾아 던전의 가장 깊은 곳에 있는 왕의 무덤으로 가져가야 한다.",
      createdAt: "2023-04-20",
    },
    {
      id: 3,
      title: "주의사항",
      content: "던전 내부에는 함정과 몬스터가 있으니 주의해야 한다. 특히 푸른 빛이 나는 방은 위험하다.",
      createdAt: "2023-04-20",
    },
  ]

  // 주사위 굴리기 함수
  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1
    const newMessage: Message = {
      id: messages.length + 1,
      sender: "시스템",
      content: `${players[0].name}이(가) ${sides}면체 주사위를 굴려 ${result}이(가) 나왔습니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "dice",
    }
    setMessages([...messages, newMessage])
  }

  // 메시지 전송 함수
  const handleSendMessage = () => {
    if (message.trim() === "") return

    const newMessage: Message = {
      id: messages.length + 1,
      sender: players[0].name,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "chat",
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  // 맵 변경 함수
  const changeMap = (direction: "prev" | "next") => {
    if (direction === "prev" && activeMapIndex > 0) {
      setActiveMapIndex(activeMapIndex - 1)
    } else if (direction === "next" && activeMapIndex < maps.length - 1) {
      setActiveMapIndex(activeMapIndex + 1)
    }
  }

  // 게임 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setGameTime((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused])

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 게임 시간 포맷팅
  const formatGameTime = () => {
    const hours = Math.floor(gameTime / 3600)
    const minutes = Math.floor((gameTime % 3600) / 60)
    const seconds = gameTime % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePlayerVolumeChange = (playerId: number, volume: number) => {
    setPlayerVolumes((prev) => ({
      ...prev,
      [playerId]: volume,
    }))
  }

  return (
    <div className={cn("flex flex-col h-screen bg-background", isFullscreen && "fixed inset-0 z-50")}>
      {/* 게임 헤더 */}
      <header className="flex justify-between items-center p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{gameTitle}</h1>
            <p className="text-xs text-muted-foreground hidden md:block">{gameDescription}</p>
          </div>
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

          <Button variant="ghost" size="icon" onClick={() => setIsMusicMuted(!isMusicMuted)} title="배경음악 음소거">
            {isMusicMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>게임 설정</DialogTitle>
                <DialogDescription>게임 환경을 설정합니다.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <label className="w-24">배경음악</label>
                  <Slider
                    value={[musicVolume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setMusicVolume(value[0])}
                  />
                  <span className="w-8 text-right">{musicVolume}%</span>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24">음성</label>
                  <Slider
                    value={[voiceVolume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVoiceVolume(value[0])}
                  />
                  <span className="w-8 text-right">{voiceVolume}%</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="destructive" size="sm" onClick={() => setIsExitDialogOpen(true)}>
            나가기
          </Button>
        </div>
      </header>

      {/* 메인 게임 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 (모바일에서는 메뉴로 표시) */}
        <div
          className={cn("w-64 border-r bg-card hidden md:block", isMenuOpen && "absolute inset-y-0 left-0 z-40 block")}
        >
          <Tabs defaultValue="players" className="h-full">
            <TabsList className="grid grid-cols-3 h-12">
              <TabsTrigger value="players" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>플레이어</span>
              </TabsTrigger>
              <TabsTrigger value="maps" className="flex items-center gap-1">
                <Map className="h-4 w-4" />
                <span>맵</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>노트</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="p-0 h-[calc(100%-3rem)] overflow-auto">
              <div className="space-y-1">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedPlayer(player)
                      setIsPlayerDialogOpen(true)
                    }}
                  >
                    <Avatar>
                      <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                      <AvatarFallback>{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="maps" className="p-0 h-[calc(100%-3rem)] overflow-auto">
              <div className="p-3 space-y-3">
                {maps.map((map, index) => (
                  <Card
                    key={map.id}
                    className={cn(
                      "overflow-hidden cursor-pointer transition-all",
                      index === activeMapIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                    )}
                    onClick={() => setActiveMapIndex(index)}
                  >
                    <div className="relative h-32">
                      <Image src={map.image || "/placeholder.svg"} alt={map.name} fill className="object-cover" />
                    </div>
                    <CardContent className="p-2">
                      <div className="font-medium text-sm">{map.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="p-0 h-[calc(100%-3rem)] overflow-auto">
              <div className="p-3 space-y-3">
                {notes.map((note) => (
                  <Card key={note.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{note.title}</div>
                      <div className="text-xs text-muted-foreground">{note.createdAt}</div>
                    </div>
                    <div className="mt-2 text-sm">{note.content}</div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 게임 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 맵 영역 */}
          <div className="relative h-64 md:h-80 bg-black">
            <Image
              src={maps[activeMapIndex].image || "/placeholder.svg"}
              alt={maps[activeMapIndex].name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMap("prev")}
                disabled={activeMapIndex === 0}
                className="bg-background/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-white font-medium drop-shadow-md">{maps[activeMapIndex].name}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeMap("next")}
                disabled={activeMapIndex === maps.length - 1}
                className="bg-background/80 backdrop-blur-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.sender === players[0].name && "ml-auto",
                    msg.type === "system" && "mx-auto max-w-full",
                  )}
                >
                  {msg.sender !== players[0].name && msg.type !== "system" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={players.find((p) => p.name === msg.sender)?.avatar || "/placeholder.svg"}
                        alt={msg.sender}
                      />
                      <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-lg p-3",
                      msg.sender === players[0].name
                        ? "bg-primary text-primary-foreground"
                        : msg.type === "system"
                          ? "bg-muted text-muted-foreground text-sm text-center py-1 px-3"
                          : msg.type === "dice"
                            ? "bg-accent text-accent-foreground"
                            : "bg-card border",
                    )}
                  >
                    {msg.type !== "system" && (
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <span className={cn("font-medium text-sm", msg.sender === "GM" && "text-orange-500")}>
                          {msg.sender}
                        </span>
                        <span className="text-xs opacity-70">{msg.timestamp}</span>
                      </div>
                    )}
                    <div className={cn(msg.type === "system" ? "italic" : "text-sm")}>{msg.content}</div>
                  </div>

                  {msg.sender === players[0].name && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={players[0].avatar || "/placeholder.svg"} alt={players[0].name} />
                      <AvatarFallback>{players[0].name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <div className="flex gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Dice5 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => rollDice(4)}>D4</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(6)}>D6</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(8)}>D8</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(10)}>D10</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(12)}>D12</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(20)}>D20</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => rollDice(100)}>D100</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                  title="텍스트 음성 음소거"
                >
                  {isVoiceMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
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

      {/* 플레이어 정보 다이얼로그 */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={selectedPlayer.avatar || "/placeholder.svg"} alt={selectedPlayer.name} />
                    <AvatarFallback>{selectedPlayer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    {selectedPlayer.name}
                    <span className="ml-2 text-sm text-muted-foreground">{selectedPlayer.role}</span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* 플레이어 음량 조절 */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">음량 조절</h4>
                  <div className="flex items-center gap-4">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[playerVolumes[selectedPlayer.id] || 80]}
                      max={100}
                      step={1}
                      onValueChange={(value) => handlePlayerVolumeChange(selectedPlayer.id, value[0])}
                    />
                    <span className="w-8 text-right text-sm">{playerVolumes[selectedPlayer.id] || 80}%</span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handlePlayerVolumeChange(selectedPlayer.id, 0)}
                    >
                      <VolumeX className="h-3 w-3 mr-1" />
                      음소거
                    </Button>
                  </div>
                </div>

                {/* 플레이어 상세 정보 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">캐릭터 정보</h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>체력</span>
                      <span>
                        {selectedPlayer.health}/{selectedPlayer.maxHealth}
                      </span>
                    </div>
                    <Progress value={(selectedPlayer.health / selectedPlayer.maxHealth) * 100} className="h-2" />
                  </div>

                  {selectedPlayer.mana !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>마나</span>
                        <span>
                          {selectedPlayer.mana}/{selectedPlayer.maxMana}
                        </span>
                      </div>
                      <Progress
                        value={(selectedPlayer.mana / (selectedPlayer.maxMana || 1)) * 100}
                        className="h-2 bg-muted"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                  )}

                  {/* 추가 캐릭터 정보 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">레벨</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : Math.floor(Math.random() * 10) + 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">경험치</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : `${Math.floor(Math.random() * 100)}%`}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">힘</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : Math.floor(Math.random() * 20) + 10}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">민첩</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : Math.floor(Math.random() * 20) + 10}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">지능</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : Math.floor(Math.random() * 20) + 10}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">체력</span>
                      <span>{selectedPlayer.id === 4 ? "N/A" : Math.floor(Math.random() * 20) + 10}</span>
                    </div>
                  </div>

                  {/* 상태 효과 */}
                  {selectedPlayer.status && selectedPlayer.status.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">상태 효과</span>
                      <div className="flex gap-1 flex-wrap">
                        {selectedPlayer.status.map((status, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 나가기 확인 다이얼로그 */}
      <AlertDialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게임에서 나가시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 진행 중인 게임에서 나가면 저장되지 않은 진행 상황이 사라질 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => router.push("/dashboard")}>
                나가기
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
