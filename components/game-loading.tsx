// 게임 로딩 화면을 보여주는 UI 컴포넌트
//캐릭터 선택/생성 후, 실제 게임 페이지로 넘어가기 전에 사용자에게 게임이 준비 중임을 알려주는 역할
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { type CharacterProfile } from "@/lib/data";

interface GameLoadingProps {
  gameInfo: { title: string };
  selectedCharacter: CharacterProfile;
  onGameStart: () => void;
  onCancel: () => void;
}

export default function GameLoading({ 
  gameInfo, 
  selectedCharacter, 
  onGameStart, 
  onCancel 
}: GameLoadingProps) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps = [
    "게임 정보를 불러오는 중...",
    "캐릭터 정보를 불러오는 중...",
    "월드를 준비하는 중...",
    "로딩 완료!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          setIsComplete(true);
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loadingSteps.length]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md text-center p-6">
        <h2 className="text-xl font-bold mb-4">게임 준비 중</h2>
        
        {/* 캐릭터 정보 표시 */}
        <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-accent/50 rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
            <AvatarFallback>{selectedCharacter.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-bold text-lg">{selectedCharacter.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedCharacter.race} {selectedCharacter.class} (Lv.{selectedCharacter.level})
            </p>
            <p className="text-xs text-muted-foreground">{gameInfo.title}</p>
          </div>
        </div>

        {/* 로딩 상태 */}
        <div className="mb-6">
          {!isComplete ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingSteps[loadingStep]}</span>
            </div>
          ) : (
            <div className="text-green-600 font-semibold mb-2">
              {loadingSteps[loadingStep]}
            </div>
          )}
          
          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onCancel}>취소</Button>
          <Button onClick={onGameStart} disabled={!isComplete}>
            {isComplete ? "게임 진입" : "로딩 중..."}
          </Button>
        </div>
      </Card>
    </div>
  );
}