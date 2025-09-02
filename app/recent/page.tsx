// 최근 플레이 페이지 - 최근 게임 기록 검색/필터/통계 확인
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter, Calendar, Users, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RecentPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const ITEMS_PER_PAGE = 8;

  const recentGames = [
    {
      id: 1,
      title: "던전 탐험",
      date: "2023-04-20",
      duration: "3시간 15분",
      players: 4,
      genre: "판타지",
      image: "/images/DungeonExploration.png",
      status: "완료",
      rating: 4.8,
    },
    {
      id: 2,
      title: "우주 모험",
      date: "2023-04-15",
      duration: "4시간 30분",
      players: 3,
      genre: "SF",
      image: "/images/space_adventure.png",
      status: "완료",
      rating: 4.6,
    },
    {
      id: 3,
      title: "판타지 왕국",
      date: "2023-04-10",
      duration: "5시간 45분",
      players: 5,
      genre: "판타지",
      image: "/images/fantasy-kingdom.png",
      status: "완료",
      rating: 4.9,
    },
    {
      id: 4,
      title: "사이버펑크 도시",
      date: "2023-04-05",
      duration: "2시간 50분",
      players: 4,
      genre: "SF",
      image: "/images/cyber-city.png",
      status: "완료",
      rating: 4.5,
    },
    {
      id: 5,
      title: "마법의 숲",
      date: "2023-04-01",
      duration: "3시간 20분",
      players: 3,
      genre: "판타지",
      image: "/images/magical_forest.png",
      status: "완료",
      rating: 4.7,
    },
    {
      id: 6,
      title: "해적선 모험",
      date: "2023-03-28",
      duration: "4시간 10분",
      players: 4,
      genre: "모험",
      image: "/images/Pirate_Ship_Adventure.png",
      status: "완료",
      rating: 4.4,
    },
    {
      id: 7,
      title: "유령의 저택",
      date: "2023-03-25",
      duration: "2시간 30분",
      players: 3,
      genre: "호러",
      image: "/images/got.png",
      status: "완료",
      rating: 4.6,
    },
    {
      id: 8,
      title: "외계 행성",
      date: "2023-03-20",
      duration: "3시간 45분",
      players: 4,
      genre: "SF",
      image: "/images/planet.png",
      status: "완료",
      rating: 4.3,
    },
    {
      id: 9,
      title: "드래곤 퀘스트",
      date: "2023-03-15",
      duration: "6시간 20분",
      players: 5,
      genre: "판타지",
      image: "/images/dragon-quest.png",
      status: "완료",
      rating: 4.8,
    },
    {
      id: 10,
      title: "고대 유적",
      date: "2023-03-10",
      duration: "4시간 15분",
      players: 4,
      genre: "모험",
      image: "/images/entrance_to_dungeon.png",
      status: "완료",
      rating: 4.5,
    },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료": return "bg-green-100 text-green-800";
      case "진행중": return "bg-blue-100 text-blue-800";
      case "일시정지": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
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
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge variant="outline" className={getStatusColor(game.status)}>
                          {game.status}
                        </Badge>
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                          ⭐ {game.rating}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{game.title}</CardTitle>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{game.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{game.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{game.players}명</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{game.genre}</Badge>
                      </div>
                    </div>
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
          <h3 className="text-xl font-semibold mb-4">플레이 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">총 플레이 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">42시간 35분</p>
                <p className="text-sm text-muted-foreground">이번 달</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">참여한 게임</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{recentGames.length}개</p>
                <p className="text-sm text-muted-foreground">총 게임 수</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">평균 평점</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">4.6</p>
                <p className="text-sm text-muted-foreground">게임 만족도</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 