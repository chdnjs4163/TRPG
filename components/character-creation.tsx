// 캐릭터 생성' 컴포넌트
// 사용자가 게임에서 사용할 새로운 캐릭터를 만드는 UI 화면

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type CharacterProfile } from "@/lib/data";

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
  const [characterData, setCharacterData] = useState<CharacterCreationData>({
    name: "",
    background: "",
    class: "",
    race: "",
  });

  // [수정 1] 확인 모달을 띄우기 위한 상태 추가
  const [showConfirm, setShowConfirm] = useState(false);

  const handleInputChange = (field: keyof CharacterCreationData, value: string) => {
    setCharacterData((prev) => ({ ...prev, [field]: value }));
  };

  // [수정 2] '캐릭터 생성 완료' 버튼 클릭 시, 바로 생성하지 않고 확인 모달을 띄움
  const handleSubmit = () => {
    if (characterData.name && characterData.class && characterData.race) {
      setShowConfirm(true);
    } else {
      alert("이름, 종족, 직업은 필수 항목입니다.");
    }
  };
  
  // [수정 3] 확인 모달의 '게임 진입' 버튼을 눌렀을 때 실행될 함수
  const handleConfirmCreation = () => {
    const newCharacter: CharacterProfile = {
      id: Date.now(),
      ...characterData,
      level: 1,
      avatar: `/avatars/default.png`,
      favorite: false,
    };
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
            <Button onClick={handleSubmit} disabled={!characterData.name || !characterData.class || !characterData.race}>
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