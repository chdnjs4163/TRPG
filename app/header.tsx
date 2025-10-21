// 공통 헤더 컴포넌트 - 로고/네비/유저 메뉴 영역
//재사용 가능한 헤더 구성요소를 정의하는 페이지 
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { Gamepad2, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/app/config"

interface GameTitle {
  id: number
  title: string
  theme?: string
  description?: string
}

const AVATAR_UPDATED_EVENT = "trpg-avatar-updated"

export function Header() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("avatarUrl") ?? ""
    }
    return ""
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [titles, setTitles] = useState<GameTitle[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setIsLoggedIn(false)
        return
      }
      // 토큰 존재 시 사용자 정보 조회
      fetch("http://192.168.26.165:1024/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject(res))
        .then((data) => {
          setIsLoggedIn(true)
          const profile = data?.data || data
          setUserName(profile?.name || profile?.username || "")
          setUserEmail(profile?.email || "")
          const rawAvatar = profile?.avatarUrl || profile?.avatar_url || ""
          const trimmedAvatar = typeof rawAvatar === "string" ? rawAvatar.trim() : ""
          setUserAvatar(trimmedAvatar)
          if (typeof window !== "undefined") {
            if (trimmedAvatar.length > 0) {
              localStorage.setItem("avatarUrl", trimmedAvatar)
            } else {
              localStorage.removeItem("avatarUrl")
            }
            window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: trimmedAvatar }))
          }
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
      localStorage.removeItem('avatarUrl')
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: "" }))
      setUserAvatar("")
    } finally {
      window.location.href = "/login"
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "avatarUrl") return
      const value = event.newValue?.trim() ?? ""
      setUserAvatar(value)
    }
    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail ?? ""
      setUserAvatar(typeof detail === "string" ? detail : "")
    }
    window.addEventListener("storage", handleStorage)
    window.addEventListener(AVATAR_UPDATED_EVENT, handleCustom as EventListener)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(AVATAR_UPDATED_EVENT, handleCustom as EventListener)
    }
  }, [])

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/game_titles?limit=200`)
        const json = await response.json()
        const rows: GameTitle[] = Array.isArray(json?.data)
          ? json.data
              .map((item: any) => ({
                id: Number(item.title_id ?? item.id ?? Date.now()),
                title: item.title_name ?? item.title ?? "제목 없음",
                theme: item.theme ?? item.category ?? item.genre ?? undefined,
                description: item.description ?? "",
              }))
              .filter((row) => row.title.trim().length > 0)
          : []
        setTitles(rows)
      } catch (err) {
        console.error("헤더 검색 데이터 불러오기 실패", err)
        setTitles([])
      }
    }

    fetchTitles()
  }, [])

  const themeMatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return []
    const seen = new Set<string>()
    const matches: { theme: string }[] = []

    titles.forEach((title) => {
      const themeValue = title.theme?.trim()
      if (!themeValue) return
      const key = themeValue.toLowerCase()
      if (seen.has(key)) return
      if (key.includes(query) || themeValue.toLowerCase().includes(query)) {
        seen.add(key)
        matches.push({ theme: themeValue })
      }
    })

    return matches.slice(0, 5)
  }, [searchTerm, titles])

  const titleMatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return []
    return titles
      .filter((title) => {
        const name = title.title.toLowerCase()
        const theme = (title.theme ?? "").toLowerCase()
        return name.includes(query) || theme.includes(query)
      })
      .slice(0, 8)
  }, [searchTerm, titles])

  const hasResults = searchTerm.trim().length > 0 && (titleMatches.length > 0 || themeMatches.length > 0)

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")

  const handleThemeSelect = (theme: string) => {
    setSearchTerm("")
    router.push(`/category/${encodeURIComponent(slugify(theme))}`)
  }

  const handleTitleSelect = (title: GameTitle) => {
    setSearchTerm("")
    router.push(`/template/${title.id}`)
  }

  const handleSearchSubmit = () => {
    if (titleMatches.length > 0) {
      handleTitleSelect(titleMatches[0])
    } else if (themeMatches.length > 0) {
      handleThemeSelect(themeMatches[0].theme)
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
          <Input
            placeholder="템플릿 이름 또는 테마 검색"
            className="bg-background border-input focus:border-primary focus:ring-primary pr-10"
            value={searchTerm}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleSearchSubmit()
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-full hover:text-primary hover:bg-transparent"
            onMouseDown={(event) => {
              event.preventDefault()
              handleSearchSubmit()
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          {hasResults && isSearchFocused && (
            <div className="absolute left-0 top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
              <div className="p-2 space-y-1">
                {titleMatches.map((title) => (
                  <button
                    key={`title-${title.id}`}
                    className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleTitleSelect(title)}
                  >
                    <div className="font-medium">{title.title}</div>
                    {title.theme && <div className="text-xs text-muted-foreground">{title.theme}</div>}
                  </button>
                ))}
                {themeMatches.map(({ theme }) => (
                  <button
                    key={`theme-${theme}`}
                    className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <div className="font-medium">테마: {theme}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <UserNav userName={userName} userEmail={userEmail} userAvatar={userAvatar} onLogout={handleLogout} />
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
