"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/app/config";

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

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const aliasMap: Record<string, string> = {
  fantasy: "판타지",
  "sci-fi": "SF",
  scifi: "SF",
  horror: "호러",
  adventure: "모험",
};

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const [titles, setTitles] = useState<GameTitle[]>([]);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 6;

  const resolvedSlug = decodeURIComponent(params.slug || "").trim().toLowerCase();
  const targetThemeRaw = aliasMap[resolvedSlug] ?? params.slug ?? "";

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/game_titles`);
        const data = await res.json();
        const rows: GameTitle[] = Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: Number(item.id ?? item.title_id ?? Date.now()),
              title: item.title ?? item.title_name ?? "제목 없음",
              description: item.description ?? "",
              image: item.image ?? undefined,
              theme: item.theme ?? item.category ?? item.genre ?? "기타",
            }))
          : [];
        setTitles(rows);
      } catch (err) {
        console.error("카테고리 타이틀 불러오기 실패", err);
        setTitles([]);
      }
    };
    fetchTitles();
  }, []);

  const themeGroups = useMemo(() => {
    const groups = titles.reduce<Record<string, { display: string; titles: GameTitle[] }>>(
      (acc, title) => {
        const themeValue = title.theme?.trim() || "기타";
        const key = themeValue.toLowerCase();
        if (!acc[key]) acc[key] = { display: themeValue, titles: [] };
        acc[key].titles.push(title);
        return acc;
      },
      {}
    );
    const mapped = Object.values(groups)
      .map(({ display, titles }) => ({ theme: display, titles }))
      .sort((a, b) => a.theme.localeCompare(b.theme));
    return mapped;
  }, [titles]);

  const targetTheme = useMemo(() => {
    const lower = targetThemeRaw.trim().toLowerCase();
    const match = themeGroups.find((group) => {
      const groupLower = group.theme.trim().toLowerCase();
      return (
        groupLower === lower ||
        slugify(group.theme) === resolvedSlug ||
        slugify(group.theme) === lower ||
        encodeURIComponent(group.theme).toLowerCase() === encodeURIComponent(targetThemeRaw).toLowerCase()
      );
    });
    return match ?? null;
  }, [themeGroups, targetThemeRaw, resolvedSlug]);

  const filteredTitles = useMemo(() => {
    if (!targetTheme) return [];
    if (searchQuery.trim().length === 0) return targetTheme.titles;
    const query = searchQuery.trim().toLowerCase();
    return targetTheme.titles.filter((title) =>
      title.title.toLowerCase().includes(query) ||
      (title.description ?? "").toLowerCase().includes(query)
    );
  }, [targetTheme, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, targetTheme?.theme]);

  const maxPage = Math.max(Math.ceil(filteredTitles.length / ITEMS_PER_PAGE) - 1, 0);
  useEffect(() => {
    if (page > maxPage) setPage(0);
  }, [page, maxPage]);

  const currentItems = filteredTitles.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation
        themes={themeGroups}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold capitalize">{targetTheme?.theme ?? targetThemeRaw}</h1>
            <p className="text-muted-foreground mt-2">
              {targetTheme
                ? `${targetTheme.theme} 테마의 템플릿이 ${targetTheme.titles.length}개 있습니다.`
                : "해당하는 테마의 템플릿을 찾을 수 없습니다."}
            </p>
          </div>
          <UserNav />
        </div>

        {targetTheme ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">게임 템플릿</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
                  disabled={page >= maxPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {currentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map((tpl) => (
                  <Link href={`/template/${tpl.id}`} key={tpl.id} className="block">
                    <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardHeader className="p-0">
                        <div className="relative w-full h-48">
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
                          <CardDescription className="line-clamp-3">
                            {tpl.description}
                          </CardDescription>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {searchQuery.trim().length > 0
                  ? "검색 결과가 없습니다."
                  : "이 테마에 등록된 템플릿이 아직 없습니다."}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            요청하신 카테고리를 찾을 수 없습니다. 다른 테마를 선택해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
