"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Home,
  Search,
  BookOpen,
  Gamepad2,
  FileText,
  ImageIcon,
  Menu,
  User,
  Settings,
  History,
  BookMarked,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  content?: React.ReactNode
}

interface MainNavigationProps {
  onNavItemClick?: (item: NavItem) => void
}

export function MainNavigation({ onNavItemClick }: MainNavigationProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const mainNavItems: NavItem[] = [
    {
      title: "홈",
      href: "/",
      icon: <Home className="w-5 h-5" />,
    },
    {
      title: "최근 플레이",
      href: "/recent",
      icon: <History className="w-5 h-5" />,
    },
    {
      title: "템플릿",
      href: "/templates",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: "프롬프트",
      href: "/prompts",
      icon: <BookMarked className="w-5 h-5" />,
    },
    {
      title: "이미지",
      href: "/images",
      icon: <ImageIcon className="w-5 h-5" />,
    },
  ]

  const categoryItems: NavItem[] = [
    {
      title: "판타지",
      href: "/category/fantasy",
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      title: "SF",
      href: "/category/sci-fi",
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      title: "호러",
      href: "/category/horror",
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      title: "모험",
      href: "/category/adventure",
      icon: <Gamepad2 className="w-5 h-5" />,
    },
  ]

  const guideItems: NavItem[] = [
    {
      title: "TRPG 가이드",
      href: "/guide/trpg",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: "웹사이트 사용법",
      href: "/guide/website",
      icon: <BookOpen className="w-5 h-5" />,
    },
  ]

  const handleNavItemClick = (item: NavItem) => {
    if (onNavItemClick) {
      onNavItemClick(item)
      setIsOpen(false)
    }
  }

  return (
    <>
      <div className="hidden md:flex flex-col w-64 border-r bg-background">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Gamepad2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">TRPG 플랫폼</h2>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="검색..." className="pl-8" />
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-6">
              <nav className="flex flex-col space-y-1">
                {mainNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                    onClick={() => handleNavItemClick(item)}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                ))}
              </nav>

              <div>
                <h3 className="mb-2 px-3 text-sm font-semibold">카테고리</h3>
                <nav className="flex flex-col space-y-1">
                  {categoryItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                      onClick={() => handleNavItemClick(item)}
                    >
                      {item.icon}
                      {item.title}
                    </Button>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="mb-2 px-3 text-sm font-semibold">가이드</h3>
                <nav className="flex flex-col space-y-1">
                  {guideItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                      onClick={() => handleNavItemClick(item)}
                    >
                      {item.icon}
                      {item.title}
                    </Button>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="mb-2 px-3 text-sm font-semibold">계정</h3>
                <nav className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === "/profile"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                    onClick={() =>
                      handleNavItemClick({
                        title: "프로필",
                        href: "/profile",
                        icon: <User className="w-5 h-5" />,
                      })
                    }
                  >
                    <User className="w-5 h-5" />
                    프로필
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === "/settings"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                    onClick={() =>
                      handleNavItemClick({
                        title: "설정",
                        href: "/settings",
                        icon: <Settings className="w-5 h-5" />,
                      })
                    }
                  >
                    <Settings className="w-5 h-5" />
                    설정
                  </Button>
                </nav>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-6">
              <Gamepad2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">TRPG 플랫폼</h2>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="검색..." className="pl-8" />
            </div>

            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-6">
                <nav className="flex flex-col space-y-1">
                  {mainNavItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                      onClick={() => handleNavItemClick(item)}
                    >
                      {item.icon}
                      {item.title}
                    </Button>
                  ))}
                </nav>

                <div>
                  <h3 className="mb-2 px-3 text-sm font-semibold">카테고리</h3>
                  <nav className="flex flex-col space-y-1">
                    {categoryItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50 hover:text-accent-foreground",
                        )}
                        onClick={() => handleNavItemClick(item)}
                      >
                        {item.icon}
                        {item.title}
                      </Button>
                    ))}
                  </nav>
                </div>

                <div>
                  <h3 className="mb-2 px-3 text-sm font-semibold">가이드</h3>
                  <nav className="flex flex-col space-y-1">
                    {guideItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50 hover:text-accent-foreground",
                        )}
                        onClick={() => handleNavItemClick(item)}
                      >
                        {item.icon}
                        {item.title}
                      </Button>
                    ))}
                  </nav>
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
