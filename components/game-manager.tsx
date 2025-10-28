// 게임에 진입하기 전까지의 모든 과정을 관리하는 페이지
// 캐릭터 선택, 생성, 로딩 화면 등을 포함

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type CharacterProfile } from "@/lib/data";
import CharacterCreation from "./character-creation";
import GameLoading from "./game-loading";
import CreatingCharacters from "./creating_characters";

export default function GameManager() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'select' | 'create' | 'loading'>('select');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [existingCharacters, setExistingCharacters] = useState<CharacterProfile[]>([]);
  
  // [수정 1] 초기 데이터 로딩 상태를 관리하는 state 추가
  const [isLoading, setIsLoading] = useState(true);

  const gameInfo = { id: 1, title: "던전 앤 드래곤" };

  // [수정 2] 컴포넌트가 로드될 때 항상 localStorage를 확인하여 상태를 설정
  useEffect(() => {
    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      setExistingCharacters(JSON.parse(savedCharacters));
    }
    // 데이터 로딩이 끝났음을 표시
    setIsLoading(false); 
  }, []);

  // [수정 3] 캐릭터 생성 완료 로직 단순화
  const handleCharacterCreated = (newCharacter: CharacterProfile) => {
    // 기존 캐릭터 배열에 새 캐릭터를 추가
    const updatedCharacters = [...existingCharacters, newCharacter];
    
    // state와 localStorage를 모두 업데이트
    setExistingCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
    
    // [단순화] 첫 플레이어 여부와 상관없이, 생성 후에는 항상 로딩 화면으로 이동
    setSelectedCharacter(newCharacter);
    setCurrentView('loading'); 
  };

  // 기존 캐릭터 선택 처리는 변경 없음
  const handleSelectCharacter = (character: CharacterProfile) => {
    setSelectedCharacter(character);
    setCurrentView('loading');
  };

  const handleGameStart = () => {
    if (selectedCharacter) {
      const characterParam = encodeURIComponent(JSON.stringify(selectedCharacter));
      router.push(`/game?title=${encodeURIComponent(gameInfo.title)}&character=${characterParam}`);
    }
  };

  // [수정 4] 초기 캐릭터 정보를 불러오는 동안 로딩 화면 표시
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p>캐릭터 정보를 불러오는 중...</p>
        </div>
    );
  }
  
  const handleDeleteCharacter = (characterId: CharacterProfile["id"]) => {
  const updated = existingCharacters.filter((c) => c.id !== characterId);
  setExistingCharacters(updated);
  localStorage.setItem("characters", JSON.stringify(updated));
};

  return (
    <div>
      {currentView === 'select' && (
        <CreatingCharacters
          existingCharacters={existingCharacters}
          onSelectCharacter={handleSelectCharacter}
          onCreateNew={() => setCurrentView('create')}
          onCancel={() => router.back()} // 예: 이전 페이지로 이동
          onDeleteCharacter={handleDeleteCharacter}
        />
      )}

      {currentView === 'create' && (
        <CharacterCreation
          gameInfo={gameInfo}
          onCharacterCreated={handleCharacterCreated}
          onCancel={() => setCurrentView('select')}
        />
      )}

      {currentView === 'loading' && selectedCharacter && (
        <GameLoading
          gameInfo={gameInfo}
          selectedCharacter={selectedCharacter}
          onGameStart={handleGameStart}
          onCancel={() => setCurrentView('select')}
        />
      )}
    </div>
  );
}
