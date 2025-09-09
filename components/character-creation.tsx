"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Sword, Shield, Sparkles } from "lucide-react";

interface Character {
  name: string;
  age: number;
  background: string;
  class: string;
  race: string;
  avatar: string;
}

interface CharacterCreationProps {
  gameInfo: {
    id: number;
    title: string;
    description: string;
    image: string;
    genre: string;
  };
  onCharacterCreated: (character: Character) => void;
  onCancel: () => void;
}

const characterClasses = [
  { value: "warrior", label: "전사", icon: "⚔️", description: "강력한 근접 전투의 달인" },
  { value: "mage", label: "마법사", icon: "🔮", description: "마법으로 적을 제압하는 지혜로운 자" },
  { value: "archer", label: "궁수", icon: "🏹", description: "정확한 원거리 공격의 전문가" },
  { value: "rogue", label: "도적", icon: "🗡️", description: "은밀함과 교묘함의 대가" },
  { value: "cleric", label: "성직자", icon: "⛑️", description: "신의 은총으로 동료를 치유하는 자" },
];

const characterRaces = [
  { value: "human", label: "인간", description: "균형잡힌 능력치를 가진 종족" },
  { value: "elf", label: "엘프", description: "민첩하고 지능이 높은 종족" },
  { value: "dwarf", label: "드워프", description: "강인하고 지혜로운 종족" },
  { value: "halfling", label: "하플링", description: "작지만 용감한 종족" },
];

const avatarOptions = [
  "/images/warrior.png",
  "/images/Wizard.png", 
  "/images/elfarcher.png",
  "/images/dwarf.png",
  "/images/gamemaster.png"
];

export function CharacterCreation({ gameInfo, onCharacterCreated, onCancel }: CharacterCreationProps) {
  const [character, setCharacter] = useState<Character>({
    name: "",
    age: 20,
    background: "",
    class: "",
    race: "",
    avatar: avatarOptions[0],
  });

  const [step, setStep] = useState(1);

  const handleInputChange = (field: keyof Character, value: string | number) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (character.name && character.class && character.race) {
      onCharacterCreated(character);
    }
  };

  const selectedClass = characterClasses.find(c => c.value === character.class);
  const selectedRace = characterRaces.find(r => r.value === character.race);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">캐릭터 생성</CardTitle>
          <CardDescription>
            {gameInfo.title}에서 플레이할 캐릭터를 만들어보세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 게임 정보 미리보기 */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                <img 
                  src={gameInfo.image} 
                  alt={gameInfo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{gameInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{gameInfo.description}</p>
                <Badge variant="secondary" className="mt-1">{gameInfo.genre}</Badge>
              </div>
            </div>
          </div>

          {/* 단계별 진행 표시 */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      step > stepNum ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 1단계: 기본 정보 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                기본 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">캐릭터 이름 *</Label>
                  <Input
                    id="name"
                    value={character.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="캐릭터 이름을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">나이 *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={character.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 20)}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">배경 스토리</Label>
                <Textarea
                  id="background"
                  value={character.background}
                  onChange={(e) => handleInputChange('background', e.target.value)}
                  placeholder="캐릭터의 과거와 배경을 간단히 설명해주세요..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* 2단계: 직업 선택 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sword className="w-5 h-5" />
                직업 선택
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characterClasses.map((cls) => (
                  <Card 
                    key={cls.value}
                    className={`cursor-pointer transition-all ${
                      character.class === cls.value ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleInputChange('class', cls.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{cls.icon}</div>
                        <div>
                          <h4 className="font-semibold">{cls.label}</h4>
                          <p className="text-sm text-muted-foreground">{cls.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 3단계: 종족 및 아바타 선택 */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                종족 및 외모
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label>종족 선택 *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {characterRaces.map((race) => (
                      <Card 
                        key={race.value}
                        className={`cursor-pointer transition-all ${
                          character.race === race.value ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleInputChange('race', race.value)}
                      >
                        <CardContent className="p-3">
                          <h4 className="font-semibold">{race.label}</h4>
                          <p className="text-sm text-muted-foreground">{race.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>아바타 선택</Label>
                  <div className="flex gap-3 mt-2">
                    {avatarOptions.map((avatar) => (
                      <div
                        key={avatar}
                        className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          character.avatar === avatar ? 'border-primary' : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => handleInputChange('avatar', avatar)}
                      >
                        <img 
                          src={avatar} 
                          alt="아바타"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 캐릭터 미리보기 */}
          {character.name && character.class && character.race && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                캐릭터 미리보기
              </h4>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={character.avatar} />
                  <AvatarFallback>{character.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h5 className="font-semibold text-lg">{character.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedRace?.label} {selectedClass?.label} | {character.age}세
                  </p>
                  {character.background && (
                    <p className="text-sm mt-1">{character.background}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrev}>
                  이전
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={handleNext}
                  disabled={step === 1 && !character.name}
                >
                  다음
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!character.name || !character.class || !character.race}
                >
                  캐릭터 생성 완료
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
