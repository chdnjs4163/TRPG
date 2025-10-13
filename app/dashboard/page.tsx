"use client";

import { useState, useEffect } from "react";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Gamepad2, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AiChatbot } from "@/components/ai-chatbot";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface Game {
  id: number;
  title: string;
  date: string;
  image?: string;
}

interface Template {
  id: number;
  title: string;
  description: string;
  image?: string;
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("홈");
  const [recentGamesPage, setRecentGamesPage] = useState(0);
  const [templatesPage, setTemplatesPage] = useState(0);

  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      window.location.href = "/login";
      return;
    }

    // --- userId 콘솔 출력 ---
    console.log("로그인된 userId:", userId);

    // --- 로그인 사용자 정보 가져오기 & 콘솔 출력 ---
    fetch("http://localhost:1024/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          console.log("로그인 사용자 정보:", data); // 👈 여기서 출력
        })
        .catch(err => {
          console.error("사용자 정보 조회 실패:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          window.location.href = "/login";
        });



    // 최근 플레이 게임 불러오기
    fetch(`http://localhost:1024/api/games/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then((res) => res.json())
        .then((result) => setRecentGames(result?.data || []))
        .catch((err) => console.error("최근 게임 불러오기 실패:", err));

    // 템플릿 불러오기
    fetch("http://localhost:1024/api/game_titles?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then((res) => res.json())
        .then((result) => setTemplates(result?.data || []))
        .catch((err) => console.error("템플릿 불러오기 실패:", err));
  }, []);

  const handleNavItemClick = (item: NavItem) => {
    setActiveSection(item.title);
  };

  const changePage = (
      type: "recentGames" | "templates",
      direction: "prev" | "next"
  ) => {
    if (type === "recentGames") {
      const maxPage = Math.ceil(recentGames.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && recentGamesPage > 0) {
        setRecentGamesPage(recentGamesPage - 1);
      } else if (direction === "next" && recentGamesPage < maxPage) {
        setRecentGamesPage(recentGamesPage + 1);
      }
    } else {
      const maxPage = Math.ceil(templates.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && templatesPage > 0) {
        setTemplatesPage(templatesPage - 1);
      } else if (direction === "next" && templatesPage < maxPage) {
        setTemplatesPage(templatesPage + 1);
      }
    }
  };

  const getCurrentPageItems = (items: any[], page: number) => {
    const startIndex = page * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
      <div className="flex min-h-screen bg-background">
        <MainNavigation onNavItemClick={handleNavItemClick} />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{activeSection}</h1>
            <UserNav />
          </div>

          {activeSection === "홈" && (
              <>
                {/* 최근 플레이한 게임 */}
                <section className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">최근 플레이한 게임</h2>
                    <div className="flex gap-2">
                      <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changePage("recentGames", "prev")}
                          disabled={recentGamesPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changePage("recentGames", "next")}
                          disabled={
                              recentGamesPage >=
                              Math.ceil(recentGames.length / ITEMS_PER_PAGE) - 1
                          }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {recentGames.length > 0 ? (
                      <div className="grid grid-cols-5 gap-4">
                        {getCurrentPageItems(recentGames, recentGamesPage).map((game) => (
                            <Link href={`/game/${game.id}`} key={game.id} className="block">
                              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardHeader className="p-0">
                                  <div className="relative w-full h-40">
                                    <Image
                                        src={game.image || "/placeholder.svg"}
                                        alt={game.title}
                                        fill
                                        className="object-cover rounded-t-lg"
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <CardTitle className="text-lg">{game.title}</CardTitle>
                                  <CardDescription>
                                    마지막 플레이: {game.date}
                                  </CardDescription>
                                </CardContent>
                              </Card>
                            </Link>
                        ))}
                      </div>
                  ) : (
                      <p className="text-muted-foreground">최근 플레이 기록이 없습니다.</p>
                  )}
                </section>

                {/* 새 템플릿 */}
                <section className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">새로 제작된 템플릿</h2>
                    <div className="flex gap-2">
                      <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changePage("templates", "prev")}
                          disabled={templatesPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changePage("templates", "next")}
                          disabled={
                              templatesPage >=
                              Math.ceil(templates.length / ITEMS_PER_PAGE) - 1
                          }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {templates.length > 0 ? (
                      <div className="grid grid-cols-5 gap-4">
                        {getCurrentPageItems(templates, templatesPage).map((tpl) => (
                            <Link href={`/template/${tpl.id}`} key={tpl.id} className="block">
                              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardHeader className="p-0">
                                  <div className="relative w-full h-40">
                                    <Image
                                        src={tpl.image || "/placeholder.svg"}
                                        alt={tpl.title}
                                        fill
                                        className="object-cover rounded-t-lg"
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <CardTitle className="text-lg">{tpl.title}</CardTitle>
                                  <CardDescription>{tpl.description}</CardDescription>
                                </CardContent>
                              </Card>
                            </Link>
                        ))}
                      </div>
                  ) : (
                      <p className="text-muted-foreground">등록된 템플릿이 없습니다.</p>
                  )}
                </section>

                {/* 가이드 & AI 챗봇 */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5" />
                        TRPG 가이드
                      </CardTitle>
                      <CardDescription>
                        TRPG 게임 플레이 방법에 대한 가이드
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>
                        테이블탑 롤플레잉 게임(TRPG)의 기본 규칙과 플레이 방법을 알아보세요.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" asChild>
                        <Link href="/guide/trpg">자세히 보기</Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        웹사이트 사용 가이드
                      </CardTitle>
                      <CardDescription>
                        플랫폼 사용 방법에 대한 안내
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>TRPG 플랫폼의 다양한 기능과 사용 방법에 대해 알아보세요.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" asChild>
                        <Link href="/guide/website">자세히 보기</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </section>

                <section className="mt-10">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI 게임 마스터와 대화하기</CardTitle>
                      <CardDescription>
                        AI 게임 마스터와 대화하여 게임 아이디어를 얻거나 규칙에 대해 질문해보세요.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AiChatbot />
                    </CardContent>
                  </Card>
                </section>
              </>
          )}
        </div>
      </div>
  );
}
