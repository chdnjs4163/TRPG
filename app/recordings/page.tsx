// 녹화 기록 페이지 - 게임 녹화 파일 업로드/목록/재생
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GamePlayback } from "@/components/game-playback"
import { Clock, Calendar, ArrowLeft, Upload } from "lucide-react"

interface GameAction {
  type: string
  payload: any
  timestamp: number
}

interface GameRecording {
  gameId: string
  title: string
  recordingData: GameAction[]
  duration: number
  timestamp: string
}

export default function RecordingsPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState<GameRecording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<GameRecording | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 녹화 파일 불러오기
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const recording = JSON.parse(event.target?.result as string) as GameRecording
        setRecordings((prev) => [...prev, recording])
      } catch (error) {
        console.error("Invalid recording file:", error)
        alert("유효하지 않은 녹화 파일입니다.")
      }
    }
    reader.readAsText(file)

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 녹화 재생 액션 처리
  const handlePlaybackAction = (action: GameAction) => {
    console.log("Playback action:", action)
    // 여기서 액션에 따라 게임 상태를 업데이트하는 로직을 구현할 수 있습니다.
    // 실제 구현에서는 게임 상태를 관리하는 컨텍스트나 상태 관리 라이브러리와 연동해야 합니다.
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">게임 녹화 기록</h1>
      </div>

      {selectedRecording ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedRecording(null)}>
            목록으로 돌아가기
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{selectedRecording.title}</CardTitle>
              <CardDescription>
                게임 ID: {selectedRecording.gameId} | 녹화 시간:{" "}
                {new Date(selectedRecording.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GamePlayback recording={selectedRecording} onPlaybackAction={handlePlaybackAction} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>녹화 파일 불러오기</CardTitle>
              <CardDescription>저장된 게임 녹화 파일을 불러와 재생할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="recording-file">녹화 파일</Label>
                <Input id="recording-file" type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
            </CardContent>
          </Card>

          {recordings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map((recording, index) => (
                <Card key={index} className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{recording.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.floor(recording.duration / 60)}분 {recording.duration % 60}초
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(recording.timestamp).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setSelectedRecording(recording)}>
                      재생하기
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">녹화 파일 없음</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                아직 불러온 녹화 파일이 없습니다. 게임 중 녹화한 파일을 업로드하여 재생할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
