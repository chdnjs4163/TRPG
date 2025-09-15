// 메인 네비게이션 - 좌측 사이드바 메뉴
// 카테고리 클릭 페이지
"use client";

import type React from "react";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
}

interface MainNavigationProps {
  onNavItemClick?: (item: NavItem) => void;
}

export function MainNavigation({ onNavItemClick }: MainNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
    
  ];

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
  ];

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
  ];

  const handleNavItemClick = (item: NavItem) => {
    if (onNavItemClick) {
      onNavItemClick(item);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="hidden md:flex flex-col w-64 border-r bg-background">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Gamepad2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">TRPG 플랫폼</h2>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-6">
              <nav className="flex flex-col space-y-1">
                {mainNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      {item.title}
                    </Link>
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
                      asChild
                      className={cn(
                        "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        {item.icon}
                        {item.title}
                      </Link>
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
                      asChild
                      className={cn(
                        "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        {item.icon}
                        {item.title}
                      </Link>
                    </Button>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="mb-2 px-3 text-sm font-semibold">계정</h3>
                <nav className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === "/profile"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <Link href="/profile">
                      <User className="w-5 h-5" />
                      프로필
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === "/settings"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <Link href="/settings">
                      <Settings className="w-5 h-5" />
                      설정
                    </Link>
                  </Button>
                </nav>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
