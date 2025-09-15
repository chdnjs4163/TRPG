"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { templates, type CharacterProfile } from "@/lib/data";
import { GameInfo } from "@/components/game-info";
import CreatingCharacters from "@/components/creating_characters";
import CharacterCreation from "@/components/character-creation";
import { Button } from "@/components/ui/button";

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'selection'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<CharacterProfile | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      const foundTemplate = templates.find(t => t.id === parseInt(params.id));
      setGameTemplate(foundTemplate);
    }
  }, [params.id]);

  const myCharacters: CharacterProfile[] = [
    { id: 1, name: "아라곤", race: "인간", class: "레인저", level: 5, avatar: "/avatars/aragon.png", favorite: true },
    { id: 2, name: "레골라스", race: "엘프", class: "궁수", level: 5, avatar: "/avatars/legolas.png", favorite: false },
  ];

  const handleSelectCharacter = (character: CharacterProfile) => {
    router.push(`/game/${gameTemplate?.id}?character=${encodeURIComponent(JSON.stringify(character))}`);
  };

  const handleCreateNew = () => setIsCreating(true);

  const handleCharacterCreated = (newChar: CharacterProfile) => {
    setCreatedCharacter(newChar);
    setIsCreating(false);
    setShowCompleteModal(true); // 생성 완료 모달 표시
  };

  const handleModalConfirm = () => {
    if (createdCharacter) {
      router.push(`/game/${gameTemplate?.id}?character=${encodeURIComponent(JSON.stringify(createdCharacter))}`);
    }
  };

  const handleCancel = () => {
    if (isCreating) setIsCreating(false);
    else if (step === 'selection') setStep('info');
    else router.back();
  };

  if (!gameTemplate) return <div>템플릿 정보를 불러오는 중...</div>;

  return (
    <div className="p-8">
      {step === 'info' && (
        <GameInfo
          gameInfo={gameTemplate}
          onStartGame={() => setStep('selection')}
          onBack={handleCancel}
        />
      )}

      {step === 'selection' && (
        <CreatingCharacters
          existingCharacters={myCharacters}
          onSelectCharacter={handleSelectCharacter}
          onCreateNew={handleCreateNew}
          onCancel={handleCancel}
        />
      )}

      {isCreating && (
        <CharacterCreation
          gameInfo={gameTemplate}
          onCharacterCreated={handleCharacterCreated}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* 캐릭터 생성 완료 모달 */}
      {showCompleteModal && createdCharacter && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-2xl font-bold mb-4">캐릭터 생성 완료!</h2>
            <p className="mb-4">{createdCharacter.name} 캐릭터가 생성되었습니다.</p>
            <Button onClick={handleModalConfirm}>게임 시작</Button>
          </div>
        </div>
      )}
    </div>
  );
}
