//'게임 템플릿 상세 정보' 페이지

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { templates, type CharacterProfile } from "@/lib/data";
import { GameInfo } from "@/components/game-info";
import CreatingCharacters from "@/components/creating_characters";
import CharacterCreation from "@/components/character-creation";

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'selection' | 'creation'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [existingCharacters, setExistingCharacters] = useState<CharacterProfile[]>([]);

  useEffect(() => {
    if (params.id) {
      const foundTemplate = templates.find(t => t.id === parseInt(params.id));
      setGameTemplate(foundTemplate);
    }
    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      setExistingCharacters(JSON.parse(savedCharacters));
    }
  }, [params.id]);

  const handleSelectCharacter = (character: CharacterProfile) => {
    if (gameTemplate) {
      router.push(`/game/${gameTemplate.id}?character=${encodeURIComponent(JSON.stringify(character))}`);
    }
  };

  const handleCreateNew = () => setStep('creation');
  
  const handleCancel = () => {
    if (step === 'creation') setStep('selection');
    else if (step === 'selection') setStep('info');
    else router.back();
  };

  const handleCharacterCreated = (newChar: CharacterProfile) => {
    const updatedCharacters = [...existingCharacters, newChar];
    setExistingCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
    handleSelectCharacter(newChar);
  };
  
  // [수정] 이 함수가 직접 삭제를 처리합니다.
  const handleDeleteCharacter = (characterId: number) => {
    if (window.confirm("정말로 이 캐릭터를 삭제하시겠습니까?")) {
        const updatedCharacters = existingCharacters.filter(char => char.id !== characterId);
        setExistingCharacters(updatedCharacters);
        localStorage.setItem('characters', JSON.stringify(updatedCharacters));
    }
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
          existingCharacters={existingCharacters}
          onSelectCharacter={handleSelectCharacter}
          onCreateNew={handleCreateNew}
          onCancel={handleCancel}
          onDeleteCharacter={handleDeleteCharacter} // [수정] onDeleteCharacter를 직접 전달합니다.
        />
      )}

      {step === 'creation' && (
        <CharacterCreation
          gameInfo={gameTemplate}
          onCharacterCreated={handleCharacterCreated}
          onCancel={() => setStep('selection')}
        />
      )}
    </div>
  );
}