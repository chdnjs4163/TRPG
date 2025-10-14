"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { AI_SERVER_HTTP_URL } from "@/app/config"

type MessageRole = "user" | "assistant" | "system"

type AssistantOption = {
  id: string
  label: string
  value: string
}

type AssistantImage = {
  id: string
  src: string
  mime: string
  filename?: string
}

type Message = {
  id: string
  role: MessageRole
  text?: string
  timestamp: Date
  prompt?: string
  options?: AssistantOption[]
  images?: AssistantImage[]
  status?: "normal" | "image-generating"
  raw?: unknown
}

type AiServerImage = {
  filename?: string
  data?: string
  mime?: string
}

type AiServerOption = string | { id?: string; label?: string; value?: string; text?: string }

type AiServerResponse = {
  success?: boolean
  message?: string
  response?: string
  aiResponse?: string
  prompt?: string
  images?: AiServerImage[]
  options?: AiServerOption[]
  need_image?: boolean
  image_info?: { should_generate?: boolean; [key: string]: unknown }
  [key: string]: unknown
}

const AI_DIALOGUE_ENDPOINT = `${AI_SERVER_HTTP_URL.replace(/\/$/, "")}/api/ai/dialogue`

function TimeText({ timestamp }: { timestamp: Date }) {
  const [time, setTime] = useState("")
  useEffect(() => {
    setTime(timestamp.toLocaleTimeString())
  }, [timestamp])
  return <p className="mt-1 text-xs opacity-50">{time}</p>
}

export function AiChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "안녕하세요! TRPG 어드벤처를 도와드릴 AI 게임 마스터입니다. 무엇을 도와드릴까요?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const buildHistoryForPayload = (historyMessages: Message[]) => {
    return historyMessages
      .filter((msg) => (msg.role === "assistant" || msg.role === "user") && (msg.text?.trim().length ?? 0) > 0)
      .map((msg) => ({
        role: msg.role,
        content: msg.text,
      }))
  }

  const normalizeOptions = (options: AiServerOption[] | undefined): AssistantOption[] => {
    if (!Array.isArray(options)) return []
    return options
      .map((opt, index) => {
        if (typeof opt === "string") {
          return { id: `opt-${index}`, label: opt, value: opt }
        }
        if (opt && typeof opt === "object") {
          const value = typeof opt.value === "string" && opt.value.trim().length > 0 ? opt.value : opt.text
          const label = typeof opt.label === "string" && opt.label.trim().length > 0 ? opt.label : value
          if (typeof value === "string" && value.trim().length > 0) {
            return {
              id: opt.id || `opt-${index}`,
              label: label || value,
              value,
            }
          }
        }
        return null
      })
      .filter((opt): opt is AssistantOption => opt !== null)
  }

  const normalizeImages = (images: AiServerImage[] | undefined): AssistantImage[] => {
    if (!Array.isArray(images)) return []
    return images
      .map((img, index) => {
        if (!img || typeof img !== "object") return null
        const { data, mime } = img
        if (typeof data !== "string" || data.trim().length === 0) return null
        const safeMime = typeof mime === "string" && mime.trim().length > 0 ? mime : "image/png"
        return {
          id: img.filename || `image-${index}`,
          src: `data:${safeMime};base64,${data}`,
          mime: safeMime,
          filename: img.filename,
        }
      })
      .filter((img): img is AssistantImage => img !== null)
  }

  const extractAssistantText = (payload: AiServerResponse): string => {
    const candidates = [payload.response, payload.message, payload.aiResponse]
    for (const text of candidates) {
      if (typeof text === "string" && text.trim().length > 0) {
        return text
      }
    }
    return ""
  }

  const createAssistantMessage = (payload: AiServerResponse): Message => {
    const text = extractAssistantText(payload)
    const options = normalizeOptions(payload.options)
    const images = normalizeImages(payload.images)

    const shouldShowImagePlaceholder =
      payload.need_image === true &&
      !!payload.image_info &&
      typeof payload.image_info === "object" &&
      (payload.image_info as { should_generate?: boolean }).should_generate === true &&
      images.length === 0

    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: text || (shouldShowImagePlaceholder ? "이미지 생성 중입니다." : ""),
      timestamp: new Date(),
      prompt: typeof payload.prompt === "string" && payload.prompt.trim().length > 0 ? payload.prompt : undefined,
      options: options.length > 0 ? options : undefined,
      images: images.length > 0 ? images : undefined,
      status: shouldShowImagePlaceholder ? "image-generating" : "normal",
      raw: payload,
    }
  }

  const sendToAiServer = async (body: Record<string, unknown>) => {
    console.log("[AiChatbot] Sending request to AI server:", body)
    const res = await fetch(AI_DIALOGUE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as AiServerResponse
    console.log("[AiChatbot] Raw response from AI server:", data)
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "AI server error")
    }
    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    console.log("[AiChatbot] Submit triggered with:", trimmed)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    }

    const historyForPayload = buildHistoryForPayload([...messages, userMessage])

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const payload = {
        message: trimmed,
        history: historyForPayload,
      }
      const response = await sendToAiServer(payload)
      const assistantMessage = createAssistantMessage(response)
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[AiChatbot] Failed to fetch AI response:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        text: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      console.log("[AiChatbot] Request cycle finished")
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleOptionClick = (value: string) => {
    console.log("[AiChatbot] Option selected:", value)
    setInput(value)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="flex h-[520px] flex-col">
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-md border p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex max-w-[80%] gap-3", message.role === "user" ? "ml-auto flex-row-reverse" : "")}
          >
            {message.role !== "user" ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "min-w-0 rounded-lg p-3",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

              {message.prompt && (
                <p className="mt-2 text-xs text-muted-foreground">프롬프트: {message.prompt}</p>
              )}

              {message.status === "image-generating" && (
                <div className="mt-3 rounded-md border border-dashed border-muted-foreground/50 bg-muted-foreground/10 px-4 py-6 text-center text-sm text-muted-foreground">
                  이미지 생성 중입니다...
                </div>
              )}

              {message.images && message.images.length > 0 && (
                <div className="mt-3 grid gap-3">
                  {message.images.map((img) => (
                    <div key={img.id} className="overflow-hidden rounded-md border bg-background">
                      <img src={img.src} alt={img.filename || "AI generated"} className="h-auto w-full object-cover" />
                      {img.filename && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">파일명: {img.filename}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.options && message.options.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.options.map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOptionClick(opt.value)}
                      disabled={isLoading}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              )}

              <TimeText timestamp={message.timestamp} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력해 주세요..."
          className="min-h-[60px] flex-1"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (!isLoading) {
                handleSubmit(e)
              }
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
