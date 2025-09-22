// '게임 정보 표시' 컴포넌트
// 사용자가 선택한 게임의 상세 정보를 보여주고, 게임 시작 또는 뒤로 가기 기능을 제공하는 UI 화면

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sword, Shield } from "lucide-react";
import Image from "next/image";

interface GameInfoProps {
  gameInfo: {
    id: number;
    title: string;
    description?: string;
    image?: string;
    genre?: string;
    difficulty?: "easy" | "medium" | "hard";
    setting?: string;
    scenario?: {
      hook?: string;
      role?: string;
      mission?: string;
    };
    tags?: string[];
  };
  onStartGame: () => void;
  onBack: () => void;
}

// 이 컴포넌트 파일 상단에 있어도 괜찮습니다.
const difficultyLabels = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

const difficultyColors = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500",
};

export function GameInfo({ gameInfo, onStartGame, onBack }: GameInfoProps) {
  const {
    title,
    description,
    image,
    genre,
    difficulty = "medium",
    setting = genre || "판타지 세계",
    scenario,
    tags,
  } = gameInfo;

  // 👇 [수정] tags가 없으면 빈 배열을 사용하도록 로직을 간소화했습니다.
  const displayTags = tags || [];

  // 시나리오만 표시: DB에 존재하는 경우에만 노출, 기본 문구는 제공하지 않음
  const scenarioHook = scenario?.hook;
  const scenarioRole = scenario?.role;
  const scenarioMission = scenario?.mission;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={image || '/placeholder.svg'}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-lg mt-1">
                    {description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {displayTags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              뒤로가기
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* 시나리오 개요 */}
          {(scenarioHook || scenarioRole || scenarioMission) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sword className="w-5 h-5" />
                시나리오 개요 (Scenario Outline)
              </CardTitle>
              <CardDescription>{setting}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scenarioHook && (
                <div>
                  <h4 className="font-semibold mb-1">도입부 (Hook)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenarioHook}
                  </p>
                </div>
              )}
              {scenarioRole && (
                <div>
                  <h4 className="font-semibold mb-1">당신의 역할 (Your Role)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenarioRole}
                  </p>
                </div>
              )}
              {scenarioMission && (
                <div>
                  <h4 className="font-semibold mb-1">핵심 과제 (The Mission)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenarioMission}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )}

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