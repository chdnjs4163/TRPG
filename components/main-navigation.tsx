// 메인 네비게이션 - 좌측 사이드바 메뉴
// 카테고리 클릭 페이지
"use client";

import type React from "react";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Gamepad2,
  FileText,
  User,
  Settings,
  History,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
}

interface CategoryInput extends NavItem {
  theme: string;
}

interface MainNavigationProps {
  onNavItemClick?: (item: NavItem) => void;
  themes?: { theme: string; titles: { id: number; title: string }[] }[];
}

export function MainNavigation({ onNavItemClick, themes = [] }: MainNavigationProps) {

  const pathname = usePathname();
  const router = useRouter();

  const decodedPathname = decodeURIComponent(pathname);

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

  const defaultCategoryItems: CategoryInput[] = [
    { title: "판타지", href: "/category/fantasy", icon: <Gamepad2 className="w-5 h-5" />, theme: "판타지" },
    { title: "SF", href: "/category/sci-fi", icon: <Gamepad2 className="w-5 h-5" />, theme: "SF" },
    { title: "호러", href: "/category/horror", icon: <Gamepad2 className="w-5 h-5" />, theme: "호러" },
    { title: "모험", href: "/category/adventure", icon: <Gamepad2 className="w-5 h-5" />, theme: "모험" },
  ];

  const categoryItems: CategoryInput[] = themes.length > 0
    ? themes.map((group) => ({
        title: group.theme,
        href: `/category/${encodeURIComponent(group.theme)}`,
        icon: <Gamepad2 className="w-5 h-5" />,
        theme: group.theme,
      }))
    : defaultCategoryItems;

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
    }
  };

  return (
    <>
      <div className="hidden md:flex flex-col w-64 border-r bg-background">
        <div className="p-4">
          <ScrollArea className="mt-4 h-[calc(100vh-220px)]">
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
                <nav className="flex flex-col space-y-2">
                  {categoryItems.length === 0 ? (
                    <p className="px-3 text-xs text-muted-foreground">표시할 테마가 없습니다.</p>
                  ) : (
                    categoryItems.map((item) => (
                      <div key={item.href} className="px-2">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            decodedPathname === decodeURIComponent(item.href)
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                          onClick={() => {
                            if (onNavItemClick) onNavItemClick(item);
                            router.push(item.href);
                          }}
                        >
                          {item.icon}
                          <span className="flex-1 text-left capitalize">{item.title}</span>
                        </Button>
                        {item.theme && (
                          <div className="ml-10 mt-1 space-y-1">
                            {(themes.find((theme) => theme.theme === item.theme)?.titles || [])
                              .slice(0, 5)
                              .map((title) => (
                                <Button
                                  key={title.id}
                                  variant="link"
                                  className="w-full justify-start px-0 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    onNavItemClick?.({
                                      title: item.title,
                                      href: item.href,
                                      icon: item.icon,
                                    });
                                    router.push(`/template/${title.id}`);
                                  }}
                                >
                                  · {title.title}
                                </Button>
                              ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
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
