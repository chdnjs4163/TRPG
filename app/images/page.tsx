// 이미지 갤러리 페이지 - 검색/필터/즐겨찾기 등 이미지 관리
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Download, Star, Filter } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ImagesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const ITEMS_PER_PAGE = 12;

  const images = [
    {
      id: 1,
      title: "용 일러스트",
      category: "캐릭터",
      tags: ["용", "판타지", "전투"],
      url: "/images/dragon-quest.png",
      width: 800,
      height: 600,
      favorite: true,
      downloads: 1250,
    },
    {
      id: 2,
      title: "우주 배경",
      category: "배경",
      tags: ["우주", "SF", "행성"],
      url: "/images/space_adventure.png",
      width: 1920,
      height: 1080,
      favorite: true,
      downloads: 890,
    },
    {
      id: 3,
      title: "던전 입구",
      category: "장소",
      tags: ["던전", "판타지", "입구"],
      url: "/images/ancient_ruins.png",
      width: 1200,
      height: 800,
      favorite: false,
      downloads: 650,
    },
    {
      id: 4,
      title: "마법사 캐릭터",
      category: "캐릭터",
      tags: ["마법사", "판타지", "마법"],
      url: "/images/Wizard.png",
      width: 600,
      height: 800,
      favorite: false,
      downloads: 1100,
    },
    {
      id: 5,
      title: "엘프 궁수",
      category: "캐릭터",
      tags: ["엘프", "궁수", "판타지"],
      url: "/images/elfarcher.png",
      width: 700,
      height: 900,
      favorite: true,
      downloads: 750,
    },
    {
      id: 6,
      title: "드워프 전사",
      category: "캐릭터",
      tags: ["드워프", "전사", "판타지"],
      url: "/images/dwarf.jpg",
      width: 600,
      height: 800,
      favorite: false,
      downloads: 520,
    },
    {
      id: 7,
      title: "마법의 숲",
      category: "배경",
      tags: ["숲", "마법", "판타지"],
      url: "/images/magical_forest.png",
      width: 1600,
      height: 900,
      favorite: true,
      downloads: 980,
    },
    {
      id: 8,
      title: "사이버 도시",
      category: "배경",
      tags: ["도시", "SF", "미래"],
      url: "/images/cyber-city.png",
      width: 1920,
      height: 1080,
      favorite: false,
      downloads: 420,
    },
    {
      id: 9,
      title: "해적선",
      category: "장소",
      tags: ["해적", "배", "모험"],
      url: "/images/pirate_Ship.png",
      width: 1400,
      height: 800,
      favorite: true,
      downloads: 680,
    },
    {
      id: 10,
      title: "게임 마스터",
      category: "캐릭터",
      tags: ["GM", "게임마스터", "리더"],
      url: "/images/gamemaster.png",
      width: 600,
      height: 800,
      favorite: false,
      downloads: 320,
    },
    {
      id: 11,
      title: "판타지 세계",
      category: "배경",
      tags: ["판타지", "세계", "마법"],
      url: "/images/the_fantasy_world.png",
      width: 1800,
      height: 1000,
      favorite: true,
      downloads: 850,
    },
    {
      id: 12,
      title: "마법사의 탑",
      category: "장소",
      tags: ["탑", "마법사", "판타지"],
      url: "/images/Tower_of_Wizards.png",
      width: 1200,
      height: 800,
      favorite: false,
      downloads: 590,
    },
  ];

  const categories = ["all", "캐릭터", "배경", "장소"];

  const filteredImages = images.filter((image) => {
    const matchesSearch = image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(filteredImages.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const downloadImage = (image: any) => {
    // 실제 다운로드 로직을 여기에 구현할 수 있습니다
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">이미지 갤러리</h1>
            <p className="text-muted-foreground mt-2">TRPG 게임에 활용할 수 있는 다양한 이미지를 찾아보세요</p>
          </div>
          <UserNav />
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이미지 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category)}
                  className="capitalize"
                >
                  {category === "all" ? "전체" : category}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? "리스트" : "그리드"}
            </Button>
          </div>
        </div>

        {/* 이미지 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedCategory === "all" ? "전체" : selectedCategory} 이미지 
              ({filteredImages.length}개)
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
                disabled={currentPage >= Math.ceil(filteredImages.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getCurrentPageItems().map((image) => (
                <Card key={image.id} className="h-full">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="icon"
                          variant={favorites.includes(image.id) ? "default" : "outline"}
                          onClick={() => toggleFavorite(image.id)}
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => downloadImage(image)}
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{image.title}</CardTitle>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="secondary">{image.category}</Badge>
                      <Badge variant="outline">{image.width}x{image.height}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      다운로드 {image.downloads}회
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {getCurrentPageItems().map((image) => (
                <Card key={image.id}>
                  <div className="flex gap-4">
                    <div className="relative w-32 h-24 flex-shrink-0">
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{image.title}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant={favorites.includes(image.id) ? "default" : "outline"}
                            onClick={() => toggleFavorite(image.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => downloadImage(image)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="secondary">{image.category}</Badge>
                        <Badge variant="outline">{image.width}x{image.height}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {image.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        다운로드 {image.downloads}회
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredImages.length > 0 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                페이지 {currentPage + 1} / {Math.ceil(filteredImages.length / ITEMS_PER_PAGE)}
              </p>
            </div>
          )}

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 이미지가 없습니다.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-4"
              >
                필터 초기화
              </Button>
            </div>
          )}
        </div>

        {/* 이미지 사용 가이드 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">이미지 사용법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>이미지 검색</CardTitle>
              </CardHeader>
              <CardContent>
                <p>제목, 태그, 카테고리로 원하는 이미지를 쉽게 찾을 수 있습니다. 즐겨찾기에 추가하여 나중에 빠르게 접근할 수 있습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>다운로드 및 활용</CardTitle>
              </CardHeader>
              <CardContent>
                <p>원하는 이미지를 다운로드하여 TRPG 게임에서 캐릭터, 배경, 장소 등으로 활용할 수 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 