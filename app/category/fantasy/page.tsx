// 판타지 카테고리 페이지 - 판타지 장르 게임 목록 및 안내
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function FantasyCategoryPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const fantasyGames = [
    { id: 1, title: "마법의 숲", date: "2023-05-10", image: "/images/magical_forest.png" },
    { id: 2, title: "드래곤 퀘스트", date: "2023-05-05", image: "/images/dragon-quest.png" },
    { id: 3, title: "마법사의 탑", date: "2023-04-28", image: "/images/Tower_of_Wizards.png" },
    { id: 4, title: "판타지 세계", date: "2023-04-10", image: "/images/the_fantasy_world.png" },
    { id: 5, title: "던전 입구", date: "2023-04-05", image: "/images/entrance_to_dungeon.png" },
    { id: 6, title: "판타지 왕국", date: "2023-03-30", image: "/images/fantasy-kingdom.png" },
  ];

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(fantasyGames.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return fantasyGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">판타지 게임</h1>
            <p className="text-muted-foreground mt-2">마법과 모험이 가득한 판타지 세계로 떠나보세요</p>
          </div>
          <UserNav />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">판타지 게임 모음</h2>
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
                disabled={currentPage >= Math.ceil(fantasyGames.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    <CardDescription>마지막 플레이: {game.date}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <p className="text-sm text-muted-foreground">
              페이지 {currentPage + 1} / {Math.ceil(fantasyGames.length / ITEMS_PER_PAGE)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">판타지 게임 특징</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>마법 시스템</CardTitle>
              </CardHeader>
              <CardContent>
                <p>다양한 마법과 주문을 사용하여 전투와 퍼즐을 해결할 수 있습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>종족과 직업</CardTitle>
              </CardHeader>
              <CardContent>
                <p>엘프, 드워프, 인간 등 다양한 종족과 전사, 마법사, 도적 등의 직업을 선택할 수 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 