"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type CharacterProfile } from "@/lib/data";

interface Character {
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

export default function CharacterCreation({ gameInfo, onCharacterCreated, onCancel }: CharacterCreationProps) {
  const [character, setCharacter] = useState<Character>({
    name: "",
    background: "",
    class: "",
    race: "",
  });

  const handleInputChange = (field: keyof Character, value: string) => {
    setCharacter((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (character.name && character.class && character.race) {
      onCharacterCreated({
        ...character,
        id: Date.now(),
        level: 1,
        avatar: `/avatars/default.png`,
        favorite: false,
      });
    } else {
      alert("이름, 종족, 직업은 필수 항목입니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                <Input
                  id="name"
                  value={character.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="캐릭터 이름"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">종족 *</Label>
                <Input
                  id="race"
                  value={character.race}
                  onChange={(e) => handleInputChange("race", e.target.value)}
                  placeholder="예: 인간, 엘프"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">직업 *</Label>
              <Input
                id="class"
                value={character.class}
                onChange={(e) => handleInputChange("class", e.target.value)}
                placeholder="예: 전사, 마법사"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">배경 스토리</Label>
              <Textarea
                id="background"
                value={character.background}
                onChange={(e) => handleInputChange("background", e.target.value)}
                placeholder="캐릭터 배경 설명"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>취소</Button>
            <Button onClick={handleSubmit} disabled={!character.name || !character.class || !character.race}>
              캐릭터 생성 완료
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
