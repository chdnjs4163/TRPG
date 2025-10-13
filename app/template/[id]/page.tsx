"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { GameInfo } from "@/components/game-info";
import CreatingCharacters from "@/components/creating_characters";
import CharacterCreation from "@/components/character-creation";
import type { CharacterProfile as UiCharacterProfile } from "@/lib/data";

interface DbCharacter {
  character_id: number;
  game_id: number;
  name: string;
  class: string;
  level: number;
  stats: any;
  inventory: any;
}

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const templateId = params?.id ? String(params.id) : '';
  const [step, setStep] = useState<'info' | 'selection' | 'creation'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [existingCharacters, setExistingCharacters] = useState<UiCharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<number | null>(null);

  const TITLES_API_URL = "http://localhost:5000/api/game_titles";
  const GAMES_API_URL = "http://localhost:5000/api/games";
  const CHAR_API_URL = "http://localhost:5000/api/characters";

  // --- 게임 템플릿 정보 불러오기 ---
  useEffect(() => {
    const fetchGameTemplate = async () => {
      try {
        const res = await axios.get(`${TITLES_API_URL}/${templateId}`);
        const template = res.data?.data || res.data;
        setGameTemplate(template || null);
      } catch (err) {
        console.error("게임 템플릿 불러오기 실패:", err);
      }
    };
    fetchGameTemplate();
  }, [templateId]);

  // --- 사용자 슬롯 조회/생성 후 캐릭터 목록 불러오기 ---
  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.error("template userid:",localStorage.getItem('userId') );
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (!userId || !templateId) return;
        // 1) 해당 사용자/타이틀의 최근 슬롯 찾기
        const found = await axios.get(`${GAMES_API_URL}/find`, { params: { user_id: userId, title_id: templateId } });
        const slot = found.data?.data || found.data;
        let gid = slot?.id;
        // 2) 없으면 생성
        if (!gid) {
          const created = await axios.post(GAMES_API_URL, { user_id: userId, title_id: Number(templateId), slot_number: 1, status: 'ongoing' });
          gid = (created.data?.data || created.data)?.id;
        }
        setGameId(gid || null);
        // 3) 캐릭터 로드
        const resChars = await axios.get(`${CHAR_API_URL}/game/${gid}`);
        const rows: DbCharacter[] = resChars.data?.data || resChars.data || [];
        const uiChars: UiCharacterProfile[] = rows.map((c) => ({
          id: c.character_id,
          name: c.name,
          race: "",
          class: c.class,
          level: c.level ?? 1,
          avatar: "/avatars/default.png",
          favorite: false,
        }));
        setExistingCharacters(uiChars);
      } catch (err) {
        console.error('슬롯/캐릭터 초기화 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [templateId]);

  // --- 캐릭터 선택 ---
  const handleSelectCharacter = (character: UiCharacterProfile) => {
    if (gameTemplate) {
      router.push(`/game/${gameTemplate.id}?character=${encodeURIComponent(JSON.stringify(character))}`);
    }
  };

  // --- 캐릭터 생성 ---
  const handleCharacterCreated = async (newChar: UiCharacterProfile) => {
    try {
      if (!gameId) throw new Error('gameId가 준비되지 않았습니다.');
      const payload = {
        game_id: gameId,
        name: newChar.name,
        class: newChar.class,
        level: newChar.level ?? 1,
        stats: {},
        inventory: [],
      };
      const res = await axios.post(CHAR_API_URL, payload);
      const created: DbCharacter = (res.data?.data || res.data) as DbCharacter;
      const createdUi: UiCharacterProfile = {
        id: created.character_id,
        name: created.name || newChar.name,
        race: "",
        class: created.class || newChar.class,
        level: created.level ?? newChar.level ?? 1,
        avatar: "/avatars/default.png",
        favorite: false,
      };
      setExistingCharacters([...existingCharacters, createdUi]);
      handleSelectCharacter(createdUi);
    } catch (err) {
      console.error("캐릭터 생성 실패:", err);
    }
  };

  // --- 캐릭터 삭제 ---
  const handleDeleteCharacter = async (characterId: number) => {
    if (!window.confirm("정말로 이 캐릭터를 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${CHAR_API_URL}/${characterId}`);
      setExistingCharacters(existingCharacters.filter(c => c.id !== characterId));
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
                onCharacterCreated={(charData) => handleCharacterCreated(charData)}
                onCancel={() => setStep('selection')}
            />
        )}
      </div>
  );
}
