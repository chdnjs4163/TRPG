// 채팅 메시지 - 보낸이/내용/타임스탬프 표시 UI
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isSystem = message.sender === "시스템"
  const isGM = message.sender === "GM"

  return (
    <div className={cn("flex gap-3 p-2 rounded-lg", isSystem ? "bg-muted justify-center" : "")}>
      {!isSystem && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg?height=32&width=32" alt={message.sender} />
          <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col", isSystem ? "items-center" : "")}>
        {!isSystem && (
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", isGM ? "text-orange-500" : "")}>{message.sender}</span>
            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
          </div>
        )}

        <div className={cn("text-sm", isSystem ? "text-muted-foreground italic" : "", isGM ? "text-foreground" : "")}>
          {message.content}
        </div>
      </div>
    </div>
  )
}
