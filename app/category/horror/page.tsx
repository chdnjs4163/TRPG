// 호러 카테고리 페이지 - 공포 장르 게임 목록 및 안내
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { GameInfo } from "@/components/game-info";
import { gamesByGenre } from "@/lib/catalog";

export default function HorrorCategoryPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const ITEMS_PER_PAGE = 6;
  const horrorGames = gamesByGenre["호러"];

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(horrorGames.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return horrorGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleGameClick = (game: any) => {
    setSelectedGame({
      id: Date.now(),
      title: game.title,
      description: game.description,
      image: game.image,
      genre: game.genre,
    });
  };

  const handleBack = () => {
    setSelectedGame(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">호러 게임</h1>
            <p className="text-muted-foreground mt-2">긴장감과 공포가 가득한 호러 세계로 떠나보세요</p>
          </div>
          <UserNav />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">호러 게임 모음</h2>
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
                disabled={currentPage >= Math.ceil(horrorGames.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentPageItems().map((game) => (
              <Card 
                key={game.title} 
                className="h-full hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleGameClick(game)}
              >
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
                  <CardDescription>{game.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <p className="text-sm text-muted-foreground">
              페이지 {currentPage + 1} / {Math.ceil(horrorGames.length / ITEMS_PER_PAGE)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">호러 게임 특징</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>긴장감과 공포</CardTitle>
              </CardHeader>
              <CardContent>
                <p>심리적 긴장감과 공포를 통해 몰입감 있는 게임 경험을 제공합니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>생존 요소</CardTitle>
              </CardHeader>
              <CardContent>
                <p>제한된 자원과 시간 내에 생존해야 하는 도전적인 요소가 포함되어 있습니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 게임 정보 모달 */}
      {selectedGame && (
        <GameInfo
          gameInfo={selectedGame}
          onStartGame={() => window.location.href = `/templates?title=${encodeURIComponent(selectedGame.title)}`}
          onBack={handleBack}
        />
      )}
    </div>
  );
} 