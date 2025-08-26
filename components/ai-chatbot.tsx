"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// 시간 표시를 클라이언트에서만 렌더링하는 컴포넌트
function TimeText({ timestamp }: { timestamp: Date }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    setTime(timestamp.toLocaleTimeString());
  }, [timestamp]);
  return <p className="text-xs opacity-50 mt-1">{time}</p>;
}

export function AiChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "안녕하세요! TRPG 플랫폼의 AI 게임 마스터입니다. 어떤 도움이 필요하신가요?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // AI 응답 생성 함수
  const generateAiResponse = (userMessage: string): Promise<string> => {
    return new Promise((resolve) => {
      // 간단한 키워드 기반 응답
      const lowerMsg = userMessage.toLowerCase()

      setTimeout(() => {
        if (lowerMsg.includes("안녕") || lowerMsg.includes("반가워") || lowerMsg.includes("hello")) {
          resolve("안녕하세요! 오늘 어떤 모험을 계획하고 계신가요?")
        } else if (lowerMsg.includes("규칙") || lowerMsg.includes("룰")) {
          resolve(
            "TRPG의 기본 규칙은 게임 마스터(GM)가 이야기를 이끌고, 플레이어들이 캐릭터를 연기하며 주사위 굴림으로 행동의 성공 여부를 결정하는 것입니다. 더 자세한 규칙이 필요하신가요?",
          )
        } else if (lowerMsg.includes("주사위") || lowerMsg.includes("다이스")) {
          resolve(
            "TRPG에서는 D4, D6, D8, D10, D12, D20 등 다양한 주사위를 사용합니다. 주사위 굴림은 '/roll d20'과 같은 명령어로 할 수 있습니다.",
          )
        } else if (lowerMsg.includes("캐릭터") || lowerMsg.includes("케릭터")) {
          resolve(
            "캐릭터 생성은 TRPG의 중요한 부분입니다. 종족, 직업, 능력치, 배경 스토리 등을 선택하여 자신만의 캐릭터를 만들 수 있습니다. 어떤 캐릭터를 만들고 싶으신가요?",
          )
        } else if (lowerMsg.includes("게임") || lowerMsg.includes("플레이")) {
          resolve(
            "새 게임을 시작하려면 템플릿을 선택하거나 직접 세션을 만들 수 있습니다. 어떤 장르의 게임에 관심이 있으신가요? 판타지, SF, 호러 등 다양한 장르를 지원합니다.",
          )
        } else {
          resolve(
            "흥미로운 질문이네요! TRPG에 관한 더 구체적인 질문이 있으시면 언제든지 물어보세요. 게임 규칙, 캐릭터 생성, 세션 진행 등에 대해 도움을 드릴 수 있습니다.",
          )
        }
      }, 1000) // 1초 지연으로 응답 시간 시뮬레이션
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // AI 응답 생성
      const aiResponse = await generateAiResponse(input)

      // AI 메시지 추가
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-md mb-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-3 max-w-[80%]", message.role === "user" ? "ml-auto" : "")}>
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "rounded-lg p-3",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <p>{message.content}</p>
              <TimeText timestamp={message.timestamp} />
            </div>
            {message.role === "user" && (
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="min-h-[60px] flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" className="self-end" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
