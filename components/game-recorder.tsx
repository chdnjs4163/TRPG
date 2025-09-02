// 게임 녹화 컴포넌트 - 이벤트 기록/내보내기
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RepeatIcon as Record, StopCircle, Download, Play, Pause, SkipForward, SkipBack } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameAction {
  type: string
  payload: any
  timestamp: number
}

interface GameRecorderProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onSaveRecording: () => void
  recordingTime: number
  recordingData: GameAction[]
  className?: string
}

export function GameRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  onSaveRecording,
  recordingTime,
  recordingData,
  className,
}: GameRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 녹화 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 재생 기능
  const handlePlayback = () => {
    if (isPlaying) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playbackIntervalRef.current = setInterval(() => {
        setCurrentPlaybackTime((prev) => {
          if (prev >= recordingTime) {
            clearInterval(playbackIntervalRef.current as NodeJS.Timeout)
            setIsPlaying(false)
            return recordingTime
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  // 빨리 감기/되감기
  const handleSkip = (direction: "forward" | "backward") => {
    setCurrentPlaybackTime((prev) => {
      const newTime = direction === "forward" ? Math.min(prev + 10, recordingTime) : Math.max(prev - 10, 0)
      return newTime
    })
  }

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("flex flex-col gap-2 p-2 border rounded-md", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {isRecording ? (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              녹화 중: {formatTime(recordingTime)}
            </span>
          ) : (
            <span>녹화 준비됨</span>
          )}
        </div>
        <div className="flex gap-1">
          {!isRecording ? (
            <Button variant="outline" size="sm" onClick={onStartRecording} className="flex items-center gap-1">
              <Record className="h-4 w-4 text-red-500" />
              <span>녹화</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onStopRecording} className="flex items-center gap-1">
              <StopCircle className="h-4 w-4" />
              <span>중지</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveRecording}
            disabled={recordingData.length === 0}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>저장</span>
          </Button>
        </div>
      </div>

      {recordingData.length > 0 && !isRecording && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => handleSkip("backward")}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={handlePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => handleSkip("forward")}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="text-xs">
              {formatTime(currentPlaybackTime)} / {formatTime(recordingTime)}
            </div>
          </div>

          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentPlaybackTime / recordingTime) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
