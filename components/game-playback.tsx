// 게임 재생 컴포넌트 - 녹화 데이터를 재생/컨트롤
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, FastForward, Rewind } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface GamePlaybackProps {
  recording: GameRecording
  onPlaybackAction: (action: GameAction) => void
  className?: string
}

export function GamePlayback({ recording, onPlaybackAction, className }: GamePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { recordingData, duration } = recording

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 재생 제어
  const togglePlayback = () => {
    setIsPlaying((prev) => !prev)
  }

  // 재생 속도 변경
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    if (isPlaying && playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
      startPlaybackInterval(speed)
    }
  }

  // 특정 시간으로 이동
  const seekTo = (time: number) => {
    setCurrentTime(time)

    // 해당 시간에 맞는 액션 인덱스 찾기
    let newIndex = 0
    for (let i = 0; i < recordingData.length; i++) {
      if (recordingData[i].timestamp > time * 1000) {
        break
      }
      newIndex = i
    }
    setCurrentActionIndex(newIndex)

    // 해당 시간까지의 모든 액션 실행
    for (let i = 0; i <= newIndex; i++) {
      onPlaybackAction(recordingData[i])
    }
  }

  // 재생 인터벌 시작
  const startPlaybackInterval = (speed: number) => {
    playbackIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          clearInterval(playbackIntervalRef.current as NodeJS.Timeout)
          setIsPlaying(false)
          return duration
        }
        return prev + 0.1 * speed
      })
    }, 100)
  }

  // 재생 상태 변경 시 인터벌 처리
  useEffect(() => {
    if (isPlaying) {
      startPlaybackInterval(playbackSpeed)
    } else if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed])

  // 현재 시간에 맞는 액션 실행
  useEffect(() => {
    const currentTimeMs = currentTime * 1000

    // 다음 액션이 있고, 현재 시간이 해당 액션의 타임스탬프를 지났다면 실행
    if (
      currentActionIndex < recordingData.length - 1 &&
      currentTimeMs >= recordingData[currentActionIndex + 1].timestamp
    ) {
      setCurrentActionIndex((prev) => {
        const newIndex = prev + 1
        onPlaybackAction(recordingData[newIndex])
        return newIndex
      })
    }
  }, [currentTime, currentActionIndex, recordingData, onPlaybackAction])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{recording.title}</div>
        <div className="text-xs text-muted-foreground">{new Date(recording.timestamp).toLocaleDateString()}</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seekTo(Math.max(0, currentTime - 10))}>
            <Rewind className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" className="h-10 w-10" onClick={togglePlayback}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => seekTo(Math.min(duration, currentTime + 5))}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => seekTo(Math.min(duration, currentTime + 10))}
          >
            <FastForward className="h-4 w-4" />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs font-medium">속도:</div>
            <Button
              variant={playbackSpeed === 0.5 ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => changePlaybackSpeed(0.5)}
            >
              0.5x
            </Button>
            <Button
              variant={playbackSpeed === 1 ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => changePlaybackSpeed(1)}
            >
              1x
            </Button>
            <Button
              variant={playbackSpeed === 2 ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => changePlaybackSpeed(2)}
            >
              2x
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs w-16 text-right">{formatTime(currentTime)}</div>
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={(value) => seekTo(value[0])}
            className="flex-1"
          />
          <div className="text-xs w-16">{formatTime(duration)}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        현재 액션: {currentActionIndex + 1} / {recordingData.length}
      </div>
    </div>
  )
}
