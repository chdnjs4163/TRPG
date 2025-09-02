// 게임 사이드바 - 플레이어/맵/인벤토리 탭 UI
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Users, BookOpen, Info } from "lucide-react"

interface Player {
  id: number
  name: string
  role: string
  avatar: string
}

interface GameSidebarProps {
  gameId: string
  onPlayerClick?: (player: Player) => void
  children?: React.ReactNode
}

export function GameSidebar({ gameId, onPlayerClick, children }: GameSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const players = [
    { id: 1, name: "플레이어1", role: "전사", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 2, name: "플레이어2", role: "마법사", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 3, name: "플레이어3", role: "궁수", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 4, name: "GM", role: "게임 마스터", avatar: "/placeholder.svg?height=40&width=40" },
  ]

  return (
    <div
      className={cn(
        "relative h-screen border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 rounded-full border shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className={cn("h-full", isCollapsed ? "overflow-hidden" : "")}>
        <Tabs defaultValue="players" className="h-full">
          <TabsList className={cn("grid h-14 w-full", isCollapsed ? "grid-cols-1" : "grid-cols-3")}>
            <TabsTrigger value="players" className="flex items-center justify-center">
              <Users className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">플레이어</span>}
            </TabsTrigger>
            <TabsTrigger value="guide" className={cn(isCollapsed && "hidden")}>
              <BookOpen className="h-5 w-5 mr-2" />
              가이드
            </TabsTrigger>
            <TabsTrigger value="info" className={cn(isCollapsed && "hidden")}>
              <Info className="h-5 w-5 mr-2" />
              정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="h-[calc(100%-3.5rem)] p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {children ? (
                  children
                ) : (
                  <>
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 cursor-pointer"
                        onClick={() => onPlayerClick && onPlayerClick(player)}
                      >
                        <Avatar>
                          <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.role}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="guide" className={cn("h-[calc(100%-3.5rem)] p-4", isCollapsed && "hidden")}>
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">게임 가이드</h3>
                <div className="space-y-2">
                  <h4 className="font-medium">주사위 굴리기</h4>
                  <p className="text-sm text-muted-foreground">
                    주사위 버튼을 클릭하여 4, 8, 12, 20, 100면체 주사위를 굴릴 수 있습니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">명령어</h4>
                  <p className="text-sm text-muted-foreground">
                    /roll d20 - 20면체 주사위를 굴립니다.
                    <br />
                    /whisper [이름] [메시지] - 특정 플레이어에게 귓속말을 보냅니다.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className={cn("h-[calc(100%-3.5rem)] p-4", isCollapsed && "hidden")}>
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">게임 정보</h3>
                <div className="space-y-2">
                  <h4 className="font-medium">던전 탐험</h4>
                  <p className="text-sm text-muted-foreground">
                    세션 #{gameId}
                    <br />
                    시작: 2023-04-20 19:00
                    <br />
                    GM: 게임마스터
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">현재 위치</h4>
                  <p className="text-sm text-muted-foreground">어두운 던전 - 1층 입구</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
