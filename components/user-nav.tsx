// 유저 네비게이션 - 프로필,플레이어 기록, 설정 등 수정하는 페이지
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { History, LogOut, Settings, User } from "lucide-react"

interface UserNavProps {
  userName?: string
  userEmail?: string
  userAvatar?: string | null
  onLogout?: () => void
}

const PLACEHOLDER_AVATAR = "/placeholder.svg?height=32&width=32"
const AVATAR_UPDATED_EVENT = "trpg-avatar-updated"

export function UserNav({ userName, userEmail, userAvatar, onLogout }: UserNavProps) {
  const displayName = userName && userName.trim().length > 0 ? userName : "플레이어"
  const displayEmail = userEmail && userEmail.trim().length > 0 ? userEmail : ""
  const avatarFallback = displayName.slice(0, 1).toUpperCase()
  const [avatarSrc, setAvatarSrc] = useState<string>(PLACEHOLDER_AVATAR)

  const applyAvatarSrc = (value?: string | null) => {
    const trimmed = typeof value === "string" ? value.trim() : ""
    if (trimmed.length > 0) {
      setAvatarSrc(trimmed)
    } else {
      setAvatarSrc(PLACEHOLDER_AVATAR)
    }
  }

  useEffect(() => {
    if (userAvatar && userAvatar.trim().length > 0) {
      applyAvatarSrc(userAvatar)
      return
    }
    if (typeof window !== "undefined") {
      applyAvatarSrc(localStorage.getItem("avatarUrl"))
    } else {
      applyAvatarSrc(null)
    }
  }, [userAvatar])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "avatarUrl") return
      applyAvatarSrc(event.newValue)
    }
    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail ?? null
      applyAvatarSrc(detail)
    }
    window.addEventListener("storage", handleStorage)
    window.addEventListener(AVATAR_UPDATED_EVENT, handleCustom as EventListener)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(AVATAR_UPDATED_EVENT, handleCustom as EventListener)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt="프로필 이미지" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {displayEmail && (
              <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex w-full cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/recent" className="flex w-full cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              <span>플레이 기록</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex w-full cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>설정</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
