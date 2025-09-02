// 템플릿 페이지 - 장르별 게임 템플릿 탐색/검색/상세 이동
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TemplatesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const ITEMS_PER_PAGE = 8;

  const templates = [
    {
      id: 1,
      title: "던전 마스터",
      description: "던전 탐험을 위한 템플릿",
      genre: "판타지",
      players: "3-5명",
      duration: "2-4시간",
      image: "/images/dungeon_master.png",
      rating: 4.8,
    },
    {
      id: 2,
      title: "우주 탐험",
      description: "우주 모험을 위한 템플릿",
      genre: "SF",
      players: "2-4명",
      duration: "3-5시간",
      image: "/images/spae.png",
      rating: 4.6,
    },
    {
      id: 3,
      title: "판타지 세계",
      description: "판타지 세계를 위한 템플릿",
      genre: "판타지",
      players: "4-6명",
      duration: "4-6시간",
      image: "/images/the_fantasy_world.png",
      rating: 4.9,
    },
    {
      id: 4,
      title: "호러 저택",
      description: "공포 분위기의 게임을 위한 템플릿",
      genre: "호러",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/ghost_mansion.png",
      rating: 4.7,
    },
    {
      id: 5,
      title: "해적 모험",
      description: "바다 모험을 위한 템플릿",
      genre: "모험",
      players: "3-6명",
      duration: "3-4시간",
      image: "/images/pirate_Ship.png",
      rating: 4.5,
    },
    {
      id: 6,
      title: "사이버펑크",
      description: "미래 도시를 배경으로 한 템플릿",
      genre: "SF",
      players: "2-4명",
      duration: "2-4시간",
      image: "/images/Pink_City.png",
      rating: 4.4,
    },
    {
      id: 7,
      title: "마법 학교",
      description: "마법을 배우는 학교 템플릿",
      genre: "판타지",
      players: "4-8명",
      duration: "5-8시간",
      image: "/images/mag.png",
      rating: 4.8,
    },
    {
      id: 8,
      title: "외계인 침공",
      description: "외계 생명체와의 조우 템플릿",
      genre: "SF",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/alien_invasion.png",
      rating: 4.6,
    },
  ];

  const genres = ["all", "판타지", "SF", "호러", "모험"];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || template.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
            <h1 className="text-3xl font-bold">게임 템플릿</h1>
            <p className="text-muted-foreground mt-2">다양한 장르의 TRPG 게임 템플릿을 찾아보세요</p>
          </div>
          <UserNav />
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="템플릿 검색..."
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

        {/* 템플릿 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedGenre === "all" ? "전체" : selectedGenre} 템플릿 
              ({filteredTemplates.length}개)
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
                disabled={currentPage >= Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getCurrentPageItems().map((template) => (
              <Link href={`/template/${template.id}`} key={template.id} className="block">
                <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={template.image || "/placeholder.svg"}
                        alt={template.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
                        ⭐ {template.rating}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                    <CardDescription className="mb-3">{template.description}</CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장르:</span>
                        <span className="font-medium">{template.genre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">플레이어:</span>
                        <span className="font-medium">{template.players}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">소요시간:</span>
                        <span className="font-medium">{template.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredTemplates.length > 0 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                페이지 {currentPage + 1} / {Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE)}
              </p>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 템플릿이 없습니다.</p>
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

        {/* 템플릿 사용 가이드 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">템플릿 사용법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>템플릿 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <p>게임 장르와 플레이어 수, 소요시간을 고려하여 적합한 템플릿을 선택하세요.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>커스터마이징</CardTitle>
              </CardHeader>
              <CardContent>
                <p>선택한 템플릿을 기반으로 자신만의 스토리와 설정을 추가하여 게임을 진행하세요.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 