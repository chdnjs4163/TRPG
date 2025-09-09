"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, MapPin, Sword, Shield, Sparkles } from "lucide-react";
import Image from "next/image";

interface GameInfoProps {
  gameInfo: {
    id: number;
    title: string;
    description: string;
    image: string;
    genre: string;
    difficulty?: "easy" | "medium" | "hard";
    estimatedTime?: string;
    maxPlayers?: number;
    rating?: number;
    features?: string[];
    setting?: string;
    recommendedLevel?: string;
    scenario?: {
      hook?: string;
      role?: string;
      mission?: string;
    };
    tags?: string[];
    platformFeatures?: string[];
  };
  onStartGame: () => void;
  onBack: () => void;
}

const difficultyLabels = {
  easy: "쉬움",
  medium: "보통", 
  hard: "어려움"
};

const difficultyColors = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500"
};

export function GameInfo({ gameInfo, onStartGame, onBack }: GameInfoProps) {
  const {
    title,
    description,
    image,
    genre,
    difficulty = "medium",
    estimatedTime = "2-3시간",
    maxPlayers = 4,
    rating = 4.5,
    features = [],
    setting = "판타지 세계",
    recommendedLevel = "초급자",
    scenario,
    tags,
    platformFeatures
  } = gameInfo;

  const defaultFeatures = [
    "AI 게임마스터",
    "실시간 채팅",
    "다이스 롤러",
    "캐릭터 관리",
    "맵 시스템"
  ];

  const displayPlatformFeatures = platformFeatures && platformFeatures.length > 0 ? platformFeatures : defaultFeatures;
  const displayTags = tags && tags.length > 0
    ? tags
    : [
        `#${genre}`,
        "#모험",
        difficulty === "easy" ? "#초급자용" : difficulty === "hard" ? "#고급자용" : "#중급자용",
        "#스토리중심",
      ];

  const scenarioHook = scenario?.hook || `고요하던 ${setting}에 불길한 그림자가 드리웁니다. 이상 징후가 곳곳에서 감지됩니다.`;
  const scenarioRole = scenario?.role || `당신은 ${setting}을 지켜온 모험가로, 현지 수호자들과 협력해 위기의 근원을 추적해야 합니다.`;
  const scenarioMission = scenario?.mission || `${setting}의 중심지로 향해 위협의 근원을 밝혀내고 ${title}에 다시 평화를 되찾으세요.`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-lg mt-1">{description}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{genre}</Badge>
                  <Badge 
                    variant="outline" 
                    className={`${difficultyColors[difficulty]} text-white border-0`}
                  >
                    {difficultyLabels[difficulty]}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              뒤로가기
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 템플릿 정보 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">예상 플레이 시간</span>
                </div>
                <p className="text-lg font-semibold">{estimatedTime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">최대 플레이어</span>
                </div>
                <p className="text-lg font-semibold">{maxPlayers}명</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">평점</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-semibold">{rating}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 시나리오 개요 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sword className="w-5 h-5" />
                시나리오 개요 (Scenario Outline)
              </CardTitle>
              <CardDescription>{setting}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">도입부 (Hook)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{scenarioHook}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">당신의 역할 (Your Role)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{scenarioRole}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">핵심 과제 (The Mission)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{scenarioMission}</p>
              </div>
            </CardContent>
          </Card>

          {/* 템플릿 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                템플릿 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {displayTags.map((t, idx) => (
                  <Badge key={idx} variant="secondary">{t}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>플레이 정보: 1-{maxPlayers}명</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>소요 시간: {estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>세계관: {setting}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">플랫폼 기능 (템플릿 고유 요소가 아닌, TRPG 플랫폼 공통 기능)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayPlatformFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시작 버튼 */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={onStartGame}
              className="px-8 py-3 text-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              게임 시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
