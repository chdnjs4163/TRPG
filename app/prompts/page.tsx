// 프롬프트 페이지 - 장르별 프롬프트 검색/복사/즐겨찾기
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Copy, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PromptsPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const ITEMS_PER_PAGE = 6;

  const prompts = [
    {
      id: 1,
      title: "판타지 세계관 프롬프트",
      description: "고대의 마법이 살아 숨쉬는 세계에서 영웅들은 어둠의 세력에 맞서 싸운다. 플레이어들은 각자의 종족과 직업을 선택하여 모험을 떠난다...",
      category: "판타지",
      difficulty: "초급",
      tags: ["세계관", "마법", "영웅"],
      usageCount: 1250,
      rating: 4.8,
    },
    {
      id: 2,
      title: "SF 우주 탐험 프롬프트",
      description: "인류는 우주로 진출하여 새로운 행성을 탐험하고 있다. 플레이어들은 우주선의 승무원으로서 미지의 행성에서 마주치는 위험과 비밀을 탐험한다...",
      category: "SF",
      difficulty: "중급",
      tags: ["우주", "탐험", "미래"],
      usageCount: 890,
      rating: 4.6,
    },
    {
      id: 3,
      title: "호러 시나리오 프롬프트",
      description: "오래된 저택에 모인 일행은 이상한 현상을 경험하기 시작한다. 플레이어들은 저택의 비밀을 파헤치며 생존을 위해 협력해야 한다...",
      category: "호러",
      difficulty: "고급",
      tags: ["공포", "생존", "협력"],
      usageCount: 650,
      rating: 4.7,
    },
    {
      id: 4,
      title: "모험 시나리오 프롬프트",
      description: "잃어버린 보물을 찾아 떠나는 모험가들. 위험한 정글과 고대 유적을 탐험하며 다양한 장애물과 퍼즐을 해결해야 한다...",
      category: "모험",
      difficulty: "중급",
      tags: ["탐험", "보물", "퍼즐"],
      usageCount: 1100,
      rating: 4.5,
    },
    {
      id: 5,
      title: "마법사 길드 프롬프트",
      description: "마법사들이 모여 지식을 공유하고 연구하는 길드. 플레이어들은 마법을 배우고 연구하며 길드의 비밀을 탐구한다...",
      category: "판타지",
      difficulty: "중급",
      tags: ["마법", "길드", "연구"],
      usageCount: 750,
      rating: 4.4,
    },
    {
      id: 6,
      title: "사이버펑크 도시 프롬프트",
      description: "미래의 메가시티에서 기업과 범죄조직이 권력을 다툰다. 플레이어들은 네트러너로서 디지털 세계를 탐험한다...",
      category: "SF",
      difficulty: "고급",
      tags: ["미래", "기업", "디지털"],
      usageCount: 520,
      rating: 4.3,
    },
  ];

  const categories = ["all", "판타지", "SF", "호러", "모험"];

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredPrompts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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

  const copyPrompt = (prompt: any) => {
    const textToCopy = `${prompt.title}\n\n${prompt.description}\n\n카테고리: ${prompt.category}\n난이도: ${prompt.difficulty}\n태그: ${prompt.tags.join(', ')}`;
    navigator.clipboard.writeText(textToCopy);
    // 여기에 토스트 알림을 추가할 수 있습니다
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급": return "bg-green-100 text-green-800";
      case "중급": return "bg-yellow-100 text-yellow-800";
      case "고급": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">게임 프롬프트</h1>
            <p className="text-muted-foreground mt-2">TRPG 게임을 위한 다양한 프롬프트를 찾아보세요</p>
          </div>
          <UserNav />
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프롬프트 검색..."
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
          </div>
        </div>

        {/* 프롬프트 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedCategory === "all" ? "전체" : selectedCategory} 프롬프트 
              ({filteredPrompts.length}개)
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
                disabled={currentPage >= Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getCurrentPageItems().map((prompt) => (
              <Card key={prompt.id} className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{prompt.title}</CardTitle>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline" className={getDifficultyColor(prompt.difficulty)}>
                          {prompt.difficulty}
                        </Badge>
                        <Badge variant="secondary">{prompt.category}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant={favorites.includes(prompt.id) ? "default" : "outline"}
                        onClick={() => toggleFavorite(prompt.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyPrompt(prompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {prompt.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>⭐ {prompt.rating}</span>
                        <span>사용 {prompt.usageCount}회</span>
                      </div>
                      <Button size="sm" variant="outline">
                        사용하기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPrompts.length > 0 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                페이지 {currentPage + 1} / {Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE)}
              </p>
            </div>
          )}

          {filteredPrompts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 프롬프트가 없습니다.</p>
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

        {/* 프롬프트 사용 가이드 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">프롬프트 사용법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>프롬프트 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <p>게임 장르와 난이도를 고려하여 적합한 프롬프트를 선택하세요. 즐겨찾기에 추가하여 나중에 쉽게 찾을 수 있습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>커스터마이징</CardTitle>
              </CardHeader>
              <CardContent>
                <p>선택한 프롬프트를 기반으로 자신만의 스토리와 설정을 추가하여 게임을 진행하세요. 복사 기능을 사용하여 편집할 수 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 