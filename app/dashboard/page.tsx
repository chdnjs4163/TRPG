// 대시보드 페이지 - 홈/최근/템플릿/가이드/AI 챗봇 허브
"use client";

import { useState } from "react";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
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
import Image from "next/image";
import { AiChatbot } from "@/components/ai-chatbot";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("홈");
  const [recentGamesPage, setRecentGamesPage] = useState(0);
  const [templatesPage, setTemplatesPage] = useState(0);

  const ITEMS_PER_PAGE = 5;

  const recentGames = [
    {
      id: 1,
      title: "던전 탐험",
      date: "2023-04-20",
      image: "/images/DungeonExploration.png",
    },
    {
      id: 2,
      title: "우주 정거장",
      date: "2023-04-15",
      image: "/images/space_adventure.png",
    },
    {
      id: 3,
      title: "유령의 저택",
      date: "2023-04-10",
      image: "/images/ghost_mansion.png",
    },
    {
      id: 4,
      title: "사이버펑크 도시",
      date: "2023-04-05",
      image: "/images/cyber-city.png",
    },
    {
      id: 5,
      title: "마법의 숲",
      date: "2023-04-01",
      image: "/images/magical_forest.png",
    },
    {
      id: 6,
      title: "잃어버린 보물",
      date: "2023-03-28",
      image: "/images/Pirate_Ship_Adventure.png",
    },
    {
      id: 7,
      title: "유령늑대와 전투",
      date: "2023-03-25",
      image: "/images/wefl.png",
    },
    {
      id: 8,
      title: "드래곤 퀘스트",
      date: "2023-03-15",
      image: "/images/dragon-quest.png",
    },
  ];

  const templates = [
    {
      id: 1,
      title: "던전 마스터",
      description: "던전 탐험을 위한 템플릿",
      image: "/images/dungeon_master.png",
    },
    {
      id: 2,
      title: "심해속에서 유령과 전투",
      description: "공포 분위기의 게임을 위한 템플릿",
      image: "/images/deep-seaghost.png",
    },
    {
      id: 3,
      title: "판타지 왕국",
      description: "판타지 세계에서의 모험 템플릿",
      image: "/images/fantasy-kingdom.png",
    },
    {
      id: 4,
      title: "외계인 침공",
      description: "외계 생명체와의 조우 템플릿",
      image: "/images/alien_invasion.png",
    },
  ];

  const fantasyGames = [
    {
      id: 1,
      title: "마법의 숲",
      date: "2023-05-10",
      image: "/images/magical_forest.png",
    },
    {
      id: 2,
      title: "드래곤 퀘스트",
      date: "2023-05-05",
      image: "/images/dragon-quest.png",
    },
    {
      id: 3,
      title: "던전 입구",
      date: "2023-04-28",
      image: "/images/entrance_to_dungeon.png",
    },
  ];

  const scifiGames = [
    {
      id: 1,
      title: "우주 정거장",
      date: "2023-05-12",
      image: "/images/space_adventure.png",
    },
    {
      id: 2,
      title: "외계 행성",
      date: "2023-05-07",
      image: "/images/spae.png",
    },
    {
      id: 3,
      title: "사이버 도시",
      date: "2023-04-30",
      image: "/images/cyber-city.png",
    },
  ];

  const horrorGames = [
    {
      id: 1,
      title: "유령의 저택",
      date: "2023-05-15",
      image: "/images/ghost_mansion.png",
    },
    {
      id: 2,
      title: "유령의 숲",
      date: "2023-05-08",
      image: "/images/forestghost.png",
    },
    {
      id: 3,
      title: "유령늑대와 전투",
      date: "2023-05-01",
      image: "/images/wefl.png",
    },
  ];

  const adventureGames = [
    {
      id: 1,
      title: "잃어버린 보물",
      date: "2023-05-18",
      image: "/images/pirate_Ship_Adventure.png",
    },
    {
      id: 2,
      title: "던전 탐험",
      date: "2023-05-11",
      image: "/images/dungeon_exploration.png",
    },
    {
      id: 3,
      title: "해적선",
      date: "2023-05-04",
      image: "/images/prate_Ship.png",
    },
  ];

  const handleNavItemClick = (item: NavItem) => {
    setActiveSection(item.title);
  };

  const changePage = (
    type: "recentGames" | "templates",
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
      const maxPage = Math.ceil(templates.length / ITEMS_PER_PAGE) - 1;
      if (direction === "prev" && templatesPage > 0) {
        setTemplatesPage(templatesPage - 1);
      } else if (direction === "next" && templatesPage < maxPage) {
        setTemplatesPage(templatesPage + 1);
      }
    }
  };

  const getCurrentPageItems = (items: any[], page: number) => {
    const startIndex = page * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation onNavItemClick={handleNavItemClick} />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{activeSection}</h1>
          <UserNav />
        </div>
        {activeSection === "홈" && (
          <>
            {/* 최근 플레이한 게임 섹션 */}
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
              <div className="grid grid-cols-5 gap-4">
                {getCurrentPageItems(recentGames, recentGamesPage).map((game) => (
                  <Link
                    href={`/game/${game.id}`}
                    key={game.id}
                    className="block"
                  >
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
                        <CardDescription>마지막 플레이: {game.date}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <p className="text-sm text-muted-foreground">
                  페이지 {recentGamesPage + 1} / {Math.ceil(recentGames.length / ITEMS_PER_PAGE)}
                </p>
              </div>
            </section>

            {/* 템플릿 섹션 */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">새로 제작된 템플릿</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changePage("templates", "prev")}
                    disabled={templatesPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changePage("templates", "next")}
                    disabled={
                      templatesPage >=
                      Math.ceil(templates.length / ITEMS_PER_PAGE) - 1
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {getCurrentPageItems(templates, templatesPage).map((template) => (
                  <Link
                    href={`/template/${template.id}`}
                    key={template.id}
                    className="block"
                  >
                    <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardHeader className="p-0">
                        <div className="relative w-full h-40">
                          <Image
                            src={template.image || "/placeholder.svg"}
                            alt={template.title}
                            fill
                            className="object-cover rounded-t-lg"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <p className="text-sm text-muted-foreground">
                  페이지 {templatesPage + 1} / {Math.ceil(templates.length / ITEMS_PER_PAGE)}
                </p>
              </div>
            </section>

            {/* 가이드 섹션 */}
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
                  <p>테이블탑 롤플레잉 게임(TRPG)의 기본 규칙과 플레이 방법을 알아보세요.</p>
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

            {/* AI 채팅 섹션 */}
            <section className="mt-10">
              <Card>
                <CardHeader>
                  <CardTitle>AI 게임 마스터와 대화하기</CardTitle>
                  <CardDescription>
                    AI 게임 마스터와 대화하여 게임 아이디어를 얻거나 규칙에 대해 질문해보세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AiChatbot />
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {activeSection === "판타지" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">판타지 게임</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {fantasyGames.map((game) => (
                <Link href={`/game/${game.id}`} key={game.id}>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeSection === "SF" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">SF 게임</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scifiGames.map((game) => (
                <Link href={`/game/${game.id}`} key={game.id}>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeSection === "호러" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">호러 게임</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {horrorGames.map((game) => (
                <Link href={`/game/${game.id}`} key={game.id}>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeSection === "모험" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">모험 게임</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {adventureGames.map((game) => (
                <Link href={`/game/${game.id}`} key={game.id}>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeSection === "TRPG 가이드" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">TRPG 가이드</h2>
            <Card>
              <CardHeader>
                <CardTitle>TRPG란 무엇인가요?</CardTitle>
                <CardDescription>
                  테이블탑 롤플레잉 게임의 기본 개념
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  테이블탑 롤플레잉 게임(TRPG)은 참가자들이 가상의 캐릭터를
                  연기하며 이야기를 만들어가는 협력적인 스토리텔링 게임입니다.
                  게임 마스터(GM)가 세계관과 상황을 설명하고, 플레이어들은 그
                  세계 속에서 자신의 캐릭터로 행동합니다.
                </p>
                <p>TRPG의 핵심 요소:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>스토리텔링</strong> - GM과 플레이어들이 함께
                    이야기를 만들어갑니다.
                  </li>
                  <li>
                    <strong>롤플레잉</strong> - 플레이어들은 자신의 캐릭터가
                    되어 연기합니다.
                  </li>
                  <li>
                    <strong>주사위 시스템</strong> - 행동의 성공 여부를 결정하기
                    위해 주사위를 사용합니다.
                  </li>
                  <li>
                    <strong>규칙</strong> - 게임 진행을 위한 기본 규칙이
                    있습니다.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "웹사이트 사용법" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">웹사이트 사용법</h2>
            <Card>
              <CardHeader>
                <CardTitle>TRPG 플랫폼 사용 가이드</CardTitle>
                <CardDescription>
                  플랫폼의 주요 기능과 사용 방법
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  TRPG 플랫폼은 테이블탑 롤플레잉 게임을 온라인에서 즐길 수 있는
                  서비스입니다. 다양한 기능을 통해 게임 마스터와 플레이어들이
                  쉽게 게임을 진행할 수 있습니다.
                </p>
                <p>주요 기능:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>게임 세션</strong> - 실시간으로 게임을 진행할 수
                    있는 가상 테이블
                  </li>
                  <li>
                    <strong>캐릭터 관리</strong> - 캐릭터 생성 및 관리 기능
                  </li>
                  <li>
                    <strong>주사위 시스템</strong> - 다양한 주사위를 굴릴 수
                    있는 기능
                  </li>
                  <li>
                    <strong>AI 게임 마스터</strong> - AI를 활용한 게임 진행 지원
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 기본/예외 섹션 */}
        {["홈", "판타지", "SF", "호러", "모험", "TRPG 가이드", "웹사이트 사용법"].indexOf(activeSection) === -1 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">{activeSection}</h2>
            <p>해당 섹션의 콘텐츠를 준비 중입니다.</p>
          </section>
        )}
      </div>
    </div>
  );
}