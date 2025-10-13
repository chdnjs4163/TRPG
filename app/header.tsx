// 공통 헤더 컴포넌트 - 로고/네비/유저 메뉴 영역
//재사용 가능한 헤더 구성요소를 정의하는 페이지 
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { Gamepad2, Search, Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setIsLoggedIn(false)
        return
      }
      // 토큰 존재 시 사용자 정보 조회
      fetch("http://localhost:1024/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject(res))
        .then((data) => {
          setIsLoggedIn(true)
          const profile = data?.data || data
          setUserName(profile?.name || profile?.username || "")
          setUserEmail(profile?.email || "")
        })
        .catch(() => {
          setIsLoggedIn(false)
        })
    } catch {
      setIsLoggedIn(false)
    }
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
    } finally {
      window.location.href = "/login"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-4 flex-1">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <span className="text-xl font-bold hidden sm:inline-block">TRPG 플랫폼</span>
          </Link>

          {/* 네비게이션 링크 */}
          <nav className="hidden md:flex gap-4">

          </nav>
          
        </div>

        {/* 검색창 */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Input placeholder="검색..." className="bg-background border-input focus:border-primary focus:ring-primary" />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-full hover:text-primary hover:bg-transparent"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Bell className="h-5 w-5" />
                <Badge className="absolute top-1 right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                  3
                </Badge>
                <span className="sr-only">알림</span>
              </Button>
              <UserNav userName={userName} userEmail={userEmail} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                <Link href="/login">로그인</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
