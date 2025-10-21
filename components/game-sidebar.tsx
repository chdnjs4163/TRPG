// 게임 화면의 주요 정보를 보여주는 접이식 사이드바

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Users, BookOpen } from "lucide-react" // Info 아이콘 제거

// [수정] Player 인터페이스는 외부에서 받아올 실제 데이터에 맞게 확장될 수 있습니다.
interface Player {
  id: number
  name: string
  role: string
  avatar: string
}

interface GameSidebarProps {
  players: Player[] // [수정] players를 props로 받도록 변경
  onPlayerClick?: (player: Player) => void
}

export function GameSidebar({ players, onPlayerClick }: GameSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // [제거] 하드코딩된 샘플 players 배열을 삭제했습니다.

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
          {/* [수정] 탭을 2개로 줄입니다. */}
          <TabsList className={cn("grid h-14 w-full", isCollapsed ? "grid-cols-1" : "grid-cols-2")}>
            <TabsTrigger value="players" className="flex items-center justify-center">
              <Users className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">캐릭터</span>}
            </TabsTrigger>
            <TabsTrigger value="guide" className={cn(isCollapsed && "hidden")}>
              <BookOpen className="h-5 w-5 mr-2" />
              가이드
            </TabsTrigger>
            {/* [제거] 정보(Info) 탭을 삭제했습니다. */}
          </TabsList>

          <TabsContent value="players" className="h-[calc(100%-3.5rem)] p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* [수정] props로 받은 players 배열을 사용합니다. */}
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
          
          {/* [제거] 정보(Info) 탭 콘텐츠를 삭제했습니다. */}
        </Tabs>
      </div>
    </div>
  )
}
