// 모험 카테고리 페이지 - 모험 장르 게임 목록 및 안내
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function AdventureCategoryPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const adventureGames = [
    { id: 1, title: "잃어버린 보물", date: "2023-05-18", image: "/images/Pirate_Ship_Adventure.png" },
    { id: 2, title: "정글 탐험", date: "2023-05-11", image: "/images/entrance_to_dungeon.png" },
    { id: 3, title: "해적선", date: "2023-05-04", image: "/images/pirate_Ship.png" },
    { id: 4, title: "던전 탐험", date: "2023-04-28", image: "/images/DungeonExploration.png" },
    { id: 5, title: "던전 마스터", date: "2023-04-18", image: "/images/dungeon_master.png" },
  ];

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(adventureGames.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return adventureGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">모험 게임</h1>
            <p className="text-muted-foreground mt-2">탐험과 발견이 가득한 모험 세계로 떠나보세요</p>
          </div>
          <UserNav />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">모험 게임 모음</h2>
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
                disabled={currentPage >= Math.ceil(adventureGames.length / ITEMS_PER_PAGE) - 1}
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
              페이지 {currentPage + 1} / {Math.ceil(adventureGames.length / ITEMS_PER_PAGE)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">모험 게임 특징</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>탐험과 발견</CardTitle>
              </CardHeader>
              <CardContent>
                <p>미지의 지역을 탐험하며 숨겨진 보물과 비밀을 발견할 수 있습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>협력과 전략</CardTitle>
              </CardHeader>
              <CardContent>
                <p>팀워크와 전략적 사고를 통해 다양한 도전을 극복할 수 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 