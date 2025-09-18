"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { GameInfo } from "@/components/game-info";
import CreatingCharacters from "@/components/creating_characters";
import CharacterCreation from "@/components/character-creation";

interface CharacterProfile {
  character_id: number;
  game_id: number;
  name: string;
  class: string;
  level: number;
  stats: any;
  inventory: any;
}

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'selection' | 'creation'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [existingCharacters, setExistingCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const GAME_API_URL = "/api/games";         // game.js
  const CHAR_API_URL = "/api/characters";   // characters.js

  // --- 게임 템플릿 정보 불러오기 ---
  useEffect(() => {
    const fetchGameTemplate = async () => {
      try {
        const res = await axios.get(GAME_API_URL, { params: { limit: 100 } });
        const template = res.data.find((t: any) => t.id === parseInt(params.id));
        setGameTemplate(template || null);
      } catch (err) {
        console.error("게임 템플릿 불러오기 실패:", err);
      }
    };
    fetchGameTemplate();
  }, [params.id]);

  // --- 캐릭터 목록 불러오기 ---
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!params.id) return;
      try {
        const res = await axios.get(`${CHAR_API_URL}/${params.id}`);
        setExistingCharacters(res.data);
      } catch (err) {
        console.error("캐릭터 목록 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [params.id]);

  // --- 캐릭터 선택 ---
  const handleSelectCharacter = (character: CharacterProfile) => {
    if (gameTemplate) {
      router.push(`/game/${gameTemplate.id}?character=${encodeURIComponent(JSON.stringify(character))}`);
    }
  };

  // --- 캐릭터 생성 ---
  const handleCharacterCreated = async (newChar: Omit<CharacterProfile, "character_id">) => {
    try {
      const res = await axios.post(CHAR_API_URL, newChar);
      const createdChar = res.data;
      setExistingCharacters([...existingCharacters, createdChar]);
      handleSelectCharacter(createdChar);
    } catch (err) {
      console.error("캐릭터 생성 실패:", err);
    }
  };

  // --- 캐릭터 삭제 ---
  const handleDeleteCharacter = async (characterId: number) => {
    if (!window.confirm("정말로 이 캐릭터를 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${CHAR_API_URL}/${characterId}`);
      setExistingCharacters(existingCharacters.filter(c => c.character_id !== characterId));
    } catch (err) {
      console.error("캐릭터 삭제 실패:", err);
    }
  };

  const handleCreateNew = () => setStep('creation');
  const handleCancel = () => {
    if (step === 'creation') setStep('selection');
    else if (step === 'selection') setStep('info');
    else router.back();
  };

  if (loading) return <div>템플릿 정보 및 캐릭터 불러오는 중...</div>;
  if (!gameTemplate) return <div>해당 게임 템플릿이 존재하지 않습니다.</div>;

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
                onDeleteCharacter={handleDeleteCharacter}
            />
        )}

        {step === 'creation' && (
            <CharacterCreation
                gameInfo={gameTemplate}
                onCharacterCreated={(charData) => handleCharacterCreated({ ...charData, game_id: gameTemplate.id })}
                onCancel={() => setStep('selection')}
            />
        )}
      </div>
  );
}
