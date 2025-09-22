// 최근 플레이 페이지 - 최근 게임 기록 검색/필터/통계 확인
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RecentPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const ITEMS_PER_PAGE = 8;

  const [recentGames, setRecentGames] = useState<any[]>([]);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) return;
    fetch(`http://localhost:5000/api/games/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(result => setRecentGames(result?.data || []))
      .catch(e => console.error('최근 게임 불러오기 실패:', e));
  }, []);

  const genres = ["all", "판타지", "SF", "호러", "모험"];

  const filteredGames = recentGames.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || game.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(filteredGames.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(0);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">최근 플레이</h1>
            <p className="text-muted-foreground mt-2">최근에 플레이한 TRPG 게임 기록을 확인하세요</p>
          </div>
          <UserNav />
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="게임 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  onClick={() => handleGenreChange(genre)}
                  className="capitalize"
                >
                  {genre === "all" ? "전체" : genre}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 게임 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedGenre === "all" ? "전체" : selectedGenre} 게임 
              ({filteredGames.length}개)
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage("prev")}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage("next")}
                disabled={currentPage >= Math.ceil(filteredGames.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getCurrentPageItems().map((game) => (
              <Link href={`/game/${game.id}`} key={game.id} className="block">
                <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{game.title}</CardTitle>
                    <CardDescription className="mb-3">{game.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredGames.length > 0 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                페이지 {currentPage + 1} / {Math.ceil(filteredGames.length / ITEMS_PER_PAGE)}
              </p>
            </div>
          )}

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 게임이 없습니다.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("all");
                }}
                className="mt-4"
              >
                필터 초기화
              </Button>
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">게임 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">총 게임 수</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{recentGames.length}개</p>
                <p className="text-sm text-muted-foreground">플레이한 게임</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">선호 장르</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">판타지</p>
                <p className="text-sm text-muted-foreground">가장 많이 플레이</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">게임 카테고리</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">4개</p>
                <p className="text-sm text-muted-foreground">다양한 장르</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}