"use client"
// dashboard/page.tsx
import { useState, useEffect } from "react";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Game {
  id: number;
  title: string;
  description?: string;
  image?: string;
  date?: string;
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("홈");
  const [recentGamesPage, setRecentGamesPage] = useState(0);
  const [templatesPage, setTemplatesPage] = useState(0);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [templates, setTemplates] = useState<Game[]>([]);
  const [themeGames, setThemeGames] = useState<Game[]>([]);
  const ITEMS_PER_PAGE = 5;
  const router = useRouter();

  useEffect(() => {
    if (activeSection === "홈" || activeSection === "최근 플레이") {
      fetchGames({ recent: true }).then(setRecentGames);
    } else if (activeSection === "템플릿") {
      fetchGames({ template: true }).then(setTemplates);
    } else if (["판타지", "SF", "호러", "모험"].includes(activeSection)) {
      fetchGames({ theme: activeSection }).then(setThemeGames);
    }
  }, [activeSection]);

  const fetchGames = async ({
                              theme,
                              recent,
                              template,
                            }: { theme?: string; recent?: boolean; template?: boolean }) => {
    const params = new URLSearchParams();
    if (theme) params.append("theme", theme);
    if (recent) params.append("recent", "true");
    if (template) params.append("template", "true");
    params.append("limit", "50");

    const res = await fetch(`http://localhost:5000/api/game?${params.toString()}`);
    if (!res.ok) {
      console.error("게임 데이터를 가져오는데 실패했습니다.", res.status);
      return [];
    }
    const data = await res.json();
    return data;
  };

  const changePage = (type: "recentGames" | "templates", direction: "prev" | "next") => {
    if (type === "recentGames") {
      const maxPage = Math.ceil(recentGames.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && recentGamesPage > 0) setRecentGamesPage(recentGamesPage - 1);
      else if (direction === "next" && recentGamesPage < maxPage) setRecentGamesPage(recentGamesPage + 1);
    } else {
      const maxPage = Math.ceil(templates.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && templatesPage > 0) setTemplatesPage(templatesPage - 1);
      else if (direction === "next" && templatesPage < maxPage) setTemplatesPage(templatesPage + 1);
    }
  };

  const getCurrentPageItems = (items: Game[], page: number) => {
    const startIndex = page * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleNavItemClick = (title: string) => {
    setActiveSection(title);
  };

  const renderCards = (games: Game[], page: number, isTemplate = false) => (
      <>
        <div className="grid grid-cols-5 gap-4">
          {getCurrentPageItems(games, page).map((game) => (
              <Link href={isTemplate ? `/template/${game.id}` : `/game/${game.id}`} key={game.id}>
                <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-40">
                      <Image
                          src={game.image || "/placeholder.svg"}
                          alt={game.title || "게임 이미지"}
                          fill
                          className="object-cover rounded-t-lg"
                          priority
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle>{game.title}</CardTitle>
                    {game.date && <CardDescription>마지막 플레이: {game.date}</CardDescription>}
                    {game.description && <CardDescription>{game.description}</CardDescription>}
                  </CardContent>
                </Card>
              </Link>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <p className="text-sm text-muted-foreground">
            페이지 {page + 1} / {Math.ceil(games.length / ITEMS_PER_PAGE)}
          </p>
        </div>
      </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "홈":
      case "최근 플레이":
        return (
            <>
              <section className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">최근 플레이한 게임</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => changePage("recentGames", "prev")} disabled={recentGamesPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => changePage("recentGames", "next")} disabled={recentGamesPage >= Math.ceil(recentGames.length / ITEMS_PER_PAGE) - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {renderCards(recentGames, recentGamesPage)}
              </section>

              <section className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">새로 제작된 템플릿</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => changePage("templates", "prev")} disabled={templatesPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => changePage("templates", "next")} disabled={templatesPage >= Math.ceil(templates.length / ITEMS_PER_PAGE) - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {renderCards(templates, templatesPage, true)}
              </section>
            </>
        );
      case "판타지":
      case "SF":
      case "호러":
      case "모험":
        return (
            <section>
              <h2 className="text-2xl font-semibold mb-6">{activeSection} 게임</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {themeGames.map((game) => (
                    // 게임 카드를 클릭했을 때 이동하는 하이퍼링크 위치
                    <Link href={`/game/${game.id}`} key={game.id}>
                      <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardHeader className="p-0">
                          <div className="relative w-full h-40">
                            <Image
                                src={game.image || "/placeholder.svg"}
                                alt={game.title || "게임 이미지"}
                                fill
                                className="object-cover rounded-t-lg"
                                priority
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <CardTitle>{game.title}</CardTitle>
                          {game.date && <CardDescription>마지막 플레이: {game.date}</CardDescription>}
                          {game.description && <CardDescription>{game.description}</CardDescription>}
                        </CardContent>
                      </Card>
                    </Link>
                ))}
              </div>
            </section>
        );
      default:
        return <section>해당 섹션의 콘텐츠를 준비 중입니다.</section>;
    }
  };

  // @ts-ignore
  return (
      <div className="flex min-h-screen bg-background">
        <MainNavigation onNavItemClick={handleNavItemClick} />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{activeSection}</h1>
            <UserNav />
          </div>
          {renderContent()}
        </div>
      </div>
  );
}
