"use client";

import { useState, useEffect, useMemo } from "react";
import { MainNavigation } from "@/components/main-navigation";
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
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/app/config";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface Game {
  id: string;
  title: string;
  date: string;
  image?: string | null;
  status?: string | null;
  titleId?: string | number | null;
  characterName?: string | null;
}

interface GameTitle {
  id: number;
  title: string;
  description: string;
  image?: string;
  theme?: string;
}

interface ThemeGroup {
  theme: string;
  titles: GameTitle[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("홈");
  const [recentGamesPage, setRecentGamesPage] = useState(0);
  const [themesPage, setThemesPage] = useState(0);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [gameTitles, setGameTitles] = useState<GameTitle[]>([]);
  const [authState, setAuthState] = useState<"pending" | "authorized" | "unauthorized">("pending");

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    if (!token || !userId) {
      setAuthState("unauthorized");
      return;
    }

    // --- userId 콘솔 출력 ---
    console.log("로그인된 userId:", userId);

    // --- 로그인 사용자 정보 가져오기 & 콘솔 출력 ---
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          if (cancelled) return;
          if (!data || data.error) {
            throw new Error(data?.error || "사용자 정보 없음");
          }
          console.log("로그인 사용자 정보:", data); // 👈 여기서 출력
          setAuthState("authorized");
        })
        .catch(err => {
          console.error("사용자 정보 조회 실패:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          if (!cancelled) {
            setAuthState("unauthorized");
          }
        });



    // 최근 플레이 게임 불러오기
    fetch(`${API_BASE_URL}/api/games/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        const normalized: Game[] = rows.map((game: any) => ({
          id: String(game.id ?? game.game_id ?? ""),
          title: game.title ?? "제목 없음",
          date: game.date ?? game.updated_at ?? game.created_at ?? "",
          image: game.image ?? null,
          status: game.status ?? null,
          titleId: game.titleId ?? game.title_id ?? game.metadata?.templateId ?? null,
          characterName: game.characterName ?? game.character_name ?? null,
        })).filter((game) => game.id.length > 0);
        setRecentGames(normalized);
      })
      .catch((err) => console.error("최근 게임 불러오기 실패:", err));

    // 게임 타이틀 불러오기
    fetch(`${API_BASE_URL}/api/game_titles?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        const normalized: GameTitle[] = rows.map((title: any) => ({
          id: Number(title.id ?? title.title_id ?? title.titleId ?? Date.now()),
          title: title.title ?? title.title_name ?? "제목 없음",
          description: title.description ?? "",
          image: title.image ?? undefined,
          theme: title.theme ?? title.category ?? title.genre ?? "기타",
        }));
        setGameTitles(normalized);
      })
      .catch((err) => console.error("게임 타이틀 불러오기 실패:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavItemClick = (item: NavItem) => {
    setActiveSection(item.title);
  };

  const changePage = (
    type: "recentGames" | "themes",
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
      const maxPage = Math.ceil(themeGroups.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && themesPage > 0) {
        setThemesPage(themesPage - 1);
      } else if (direction === "next" && themesPage < maxPage) {
        setThemesPage(themesPage + 1);
      }
    }
  };

  const themeGroups: ThemeGroup[] = useMemo(() => {
    const groups = gameTitles.reduce<Record<string, { display: string; titles: GameTitle[] }>>(
      (acc, title) => {
        const rawTheme = title.theme?.trim() || "기타";
        const key = rawTheme.toLowerCase();
        if (!acc[key]) acc[key] = { display: rawTheme, titles: [] };
        acc[key].titles.push(title);
        return acc;
      },
      {}
    );

    return Object.values(groups)
      .map(({ display, titles }) => ({ theme: display, titles }))
      .sort((a, b) => a.theme.localeCompare(b.theme));
  }, [gameTitles]);

  const getCurrentPageItems = (items: any[], page: number) => {
    const startIndex = page * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const availableTemplates = themeGroups.reduce<GameTitle[]>((acc, group) => {
    acc.push(...group.titles);
    return acc;
  }, []);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(themeGroups.length / ITEMS_PER_PAGE) - 1, 0);
    if (themesPage > maxPage) {
      setThemesPage(0);
    }
  }, [themeGroups.length, themesPage]);

  useEffect(() => {
    if (authState === "unauthorized") {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard")}`);
    }
  }, [authState, router]);

  if (authState === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        대시보드를 불러오는 중입니다...
      </div>
    );
  }

  if (authState !== "authorized") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h2 className="text-xl font-semibold">로그인이 필요합니다.</h2>
        <Button asChild>
          <Link href="/login">로그인 페이지로 이동</Link>
        </Button>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-background">
        <MainNavigation onNavItemClick={handleNavItemClick} themes={themeGroups} />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{activeSection}</h1>
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
                                  <p className="mt-2 text-sm text-foreground/80">
                                    주 캐릭터: {game.characterName ? game.characterName : "미등록"}
                                  </p>
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                    <h2 className="text-2xl font-semibold">새로 제작된 템플릿</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changePage("themes", "prev")}
                        disabled={themesPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changePage("themes", "next")}
                        disabled={
                          themeGroups.length === 0 ||
                          themesPage >= Math.ceil(themeGroups.length / ITEMS_PER_PAGE) - 1
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {availableTemplates.length > 0 ? (
                    <div className="space-y-6">
                      {getCurrentPageItems(themeGroups, themesPage).map((group) => (
                        <div key={group.theme} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold capitalize">{group.theme}</h3>
                            <span className="text-xs text-muted-foreground">
                              {group.titles.length}개 템플릿
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {group.titles.map((tpl) => (
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
                                    {tpl.description && (
                                      <CardDescription className="line-clamp-2">
                                        {tpl.description}
                                      </CardDescription>
                                    )}
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
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

              </>
          )}
        </div>
      </div>
  );
}
