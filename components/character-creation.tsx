// 캐릭터 생성' 컴포넌트
// 사용자가 게임에서 사용할 새로운 캐릭터를 만드는 UI 화면

"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type CharacterProfile } from "@/lib/data";

const STAT_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type CharacterStats = Record<StatKey, number>;

const RANDOM_POINTS = 20;
const PLAYER_POINTS = 10;
const STAT_LABELS: Record<StatKey, string> = {
  strength: "힘 (STR)",
  dexterity: "민첩 (DEX)",
  constitution: "체력 (CON)",
  intelligence: "지능 (INT)",
  wisdom: "지혜 (WIS)",
  charisma: "매력 (CHA)",
};

const createEmptyStats = (): CharacterStats =>
  STAT_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as CharacterStats);

const rollRandomStats = (): CharacterStats => {
  const baseline = createEmptyStats();
  for (let i = 0; i < RANDOM_POINTS; i++) {
    const key = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
    baseline[key] += 1;
  }
  return baseline;
};

interface CharacterCreationData {
  name: string;
  background: string;
  class: string;
  race: string;
}

interface CharacterCreationProps {
  gameInfo: { title: string };
  onCharacterCreated: (character: CharacterProfile) => void;
  onCancel: () => void;
}

export default function CharacterCreation({
  gameInfo,
  onCharacterCreated,
  onCancel,
}: CharacterCreationProps) {
  const [playerPointsBudget, setPlayerPointsBudget] = useState<number>(PLAYER_POINTS);
  const [randomStats, setRandomStats] = useState<CharacterStats>(() => rollRandomStats());
  const [allocatedStats, setAllocatedStats] = useState<CharacterStats>(() => createEmptyStats());
  const [characterData, setCharacterData] = useState<CharacterCreationData>({
    name: "",
    background: "",
    class: "",
    race: "",
  });

  // [수정 1] 확인 모달을 띄우기 위한 상태 추가
  const [showConfirm, setShowConfirm] = useState(false);

  const totalAllocated = useMemo(
    () => STAT_KEYS.reduce((sum, key) => sum + allocatedStats[key], 0),
    [allocatedStats],
  );

  const remainingPoints = Math.max(playerPointsBudget - totalAllocated, 0);

  const handleAdjustStat = (key: StatKey, delta: number) => {
    if (delta === 0) return;
    const budget = playerPointsBudget;
    setAllocatedStats((prev) => {
      const next = { ...prev };
      const currentTotal = STAT_KEYS.reduce((sum, statKey) => sum + prev[statKey], 0);
      const nextValue = next[key] + delta;
      if (nextValue < 0) return prev;
      if (delta > 0 && currentTotal >= budget) return prev;
      next[key] = nextValue;
      return next;
    });
  };

  const handleRerollStats = () => {
    setPlayerPointsBudget((prev) => Math.max(prev - 1, 0));
    setRandomStats(rollRandomStats());
    setAllocatedStats(createEmptyStats());
  };

  const handleInputChange = (field: keyof CharacterCreationData, value: string) => {
    setCharacterData((prev) => ({ ...prev, [field]: value }));
  };

  // [수정 2] '캐릭터 생성 완료' 버튼 클릭 시, 바로 생성하지 않고 확인 모달을 띄움
  const handleSubmit = () => {
    if (!characterData.name || !characterData.class || !characterData.race) {
      alert("이름, 종족, 직업은 필수 항목입니다.");
      return;
    }
    if (remainingPoints > 0) {
      alert(`남은 배분 포인트 ${remainingPoints}개를 모두 사용해주세요.`);
      return;
    }
    if (characterData.name && characterData.class && characterData.race) {
      setShowConfirm(true);
    }
  };
  
  // [수정 3] 확인 모달의 '게임 진입' 버튼을 눌렀을 때 실행될 함수
  const handleConfirmCreation = () => {
    const finalStats = STAT_KEYS.reduce((acc, key) => {
      acc[key] = randomStats[key] + allocatedStats[key];
      return acc;
    }, {} as CharacterStats);
    const newCharacter: CharacterProfile = {
      id: Date.now(),
      ...characterData,
      level: 1,
      avatar: `/placeholder-user.jpg`,
      favorite: false,
      stats: finalStats,
      inventory: [],
    };
    setShowConfirm(false);
    onCharacterCreated(newCharacter);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {/* 캐릭터 생성 폼 카드 */}
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">캐릭터 생성</CardTitle>
          <CardDescription>'{gameInfo.title}'에서 플레이할 캐릭터를 만들어보세요</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">기본 스탯</p>
                <p className="text-sm text-muted-foreground">
                  랜덤 배분 {RANDOM_POINTS} + 플레이어 배분 {playerPointsBudget} = 총 {RANDOM_POINTS + playerPointsBudget}
                </p>
                <p className="text-xs text-muted-foreground">
                  랜덤 재배치 시 플레이어 배분 포인트가 1 감소합니다.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRerollStats}>
                랜덤 재배치
              </Button>
            </div>
            <div className="rounded-lg border divide-y">
              {STAT_KEYS.map((key) => (
                <div key={key} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{STAT_LABELS[key]}</p>
                    <p className="text-xs text-muted-foreground">
                      기본 {randomStats[key]} / 추가 {allocatedStats[key]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAdjustStat(key, -1)}
                      disabled={allocatedStats[key] === 0}
                      aria-label={`${key} 감소`}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-mono text-lg">
                      {randomStats[key] + allocatedStats[key]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAdjustStat(key, 1)}
                      disabled={remainingPoints <= 0}
                      aria-label={`${key} 증가`}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-right text-sm text-muted-foreground">
              남은 배분 포인트: <span className="font-semibold">{remainingPoints}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">캐릭터 이름 *</Label>
                <Input id="name" value={characterData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="캐릭터 이름"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">종족 *</Label>
                <Input id="race" value={characterData.race} onChange={(e) => handleInputChange("race", e.target.value)} placeholder="예: 인간, 엘프"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">직업 *</Label>
              <Input id="class" value={characterData.class} onChange={(e) => handleInputChange("class", e.target.value)} placeholder="예: 전사, 마법사"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background">배경 스토리</Label>
              <Textarea id="background" value={characterData.background} onChange={(e) => handleInputChange("background", e.target.value)} placeholder="캐릭터 배경 설명" rows={4}/>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>취소</Button>
            <Button
              onClick={handleSubmit}
              disabled={!characterData.name || !characterData.class || !characterData.race || remainingPoints > 0}
            >
              캐릭터 생성 완료
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* [수정 4] 확인 모달 구현 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle className="text-2xl">캐릭터 생성 완료!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">"{characterData.name}" 캐릭터가 생성되었습니다.</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  돌아가기
                </Button>
                <Button onClick={handleConfirmCreation}>
                  게임 진입
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
