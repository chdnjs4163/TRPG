"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { GameInfo } from "@/components/game-info";
import CharacterCreation from "@/components/character-creation";
import type { CharacterProfile as UiCharacterProfile } from "@/lib/data";

interface DbCharacter {
  id?: number | string;
  character_id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  gameId?: number | string;
  game_id?: number | string;
  name: string;
  class: string;
  level?: number;
  stats?: any;
  inventory?: any;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const parseScenario = (raw: unknown): Record<string, unknown> | undefined => {
  if (!raw) return undefined;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeTemplate = (template: any) => {
  if (!template || typeof template !== "object") return null;
  const scenario =
    template.scenario ??
    parseScenario(template.scenario_json) ??
    parseScenario(template.scenarioJson);
  return {
    ...template,
    scenario,
  };
};

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const templateId = params?.id ? String(params.id) : '';
  const [step, setStep] = useState<'info' | 'creation'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<number | null>(null);

  const TITLES_API_URL = "http://192.168.26.165:1024/api/game_titles";
  const GAMES_API_URL = "http://192.168.26.165:1024/api/games";
  const CHAR_API_URL = "http://192.168.26.165:1024/api/characters";

  // --- 게임 템플릿 정보 불러오기 ---
  useEffect(() => {
    const fetchGameTemplate = async () => {
      try {
        const res = await axios.get(`${TITLES_API_URL}/${templateId}`);
        const template = normalizeTemplate(res.data?.data || res.data);
        setGameTemplate(template || null);
      } catch (err) {
        console.error("게임 템플릿 불러오기 실패:", err);
      }
    };
    fetchGameTemplate();
  }, [templateId]);

  // --- 사용자 슬롯 조회 (생성은 실제 시작 시점으로 이동) ---
  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.error("template userid:",localStorage.getItem('userId') );
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (!userId || !templateId) return;
        // 1) 해당 사용자/타이틀의 최근 슬롯 찾기 (생성 X)
        const found = await axios.get(`${GAMES_API_URL}/find`, { params: { user_id: userId, title_id: templateId } });
        const slot = found.data?.data || found.data;
        const gid = slot?.id ?? null;
        setGameId(gid);
      } catch (err) {
        console.error('슬롯/캐릭터 초기화 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [templateId]);

  // 실제 시작 시점에만 게임 슬롯 생성 보장
  const ensureGameSlot = async (): Promise<number> => {
    if (gameId) return gameId;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) throw new Error('로그인이 필요합니다.');
    const created = await axios.post(GAMES_API_URL, { user_id: userId, title_id: Number(templateId), slot_number: 1, status: 'ongoing' });
    const gid = (created.data?.data || created.data)?.id as number;
    setGameId(gid);
    return gid;
  };

  // --- 캐릭터 생성 ---
  const handleCharacterCreated = async (newChar: UiCharacterProfile) => {
    try {
      const gid = await ensureGameSlot();
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!userId) throw new Error('로그인이 필요합니다.');
      const payload = {
        game_id: gid,
        user_id: userId,
        name: newChar.name,
        class: newChar.class,
        level: newChar.level ?? 1,
        stats: newChar.stats ?? {},
        inventory: newChar.inventory ?? [],
        avatar: newChar.avatar,
      } as const;
      const res = await axios.post(CHAR_API_URL, payload);
      const created: DbCharacter = (res.data?.data || res.data) as DbCharacter;
      const createdUi: UiCharacterProfile = {
        id: created.character_id,
        name: created.name || newChar.name,
        race: "",
        class: created.class || newChar.class,
        level: created.level ?? newChar.level ?? 1,
        avatar: newChar.avatar || "/placeholder-user.jpg",
        favorite: false,
        stats: newChar.stats ?? undefined,
        inventory: Array.isArray(created.inventory)
          ? created.inventory
          : newChar.inventory ?? [],
      };
      const query = new URLSearchParams({ character: encodeURIComponent(JSON.stringify(createdUi)) });
      router.push(`/game/${gid}?${query.toString()}`);
    } catch (err) {
      console.error("캐릭터 생성 실패:", err);
    }
  };

  const handleCancel = () => {
    if (step === 'creation') setStep('info');
    else router.back();
  };

  const handleStartGame = async () => {
    try {
      const gid = await ensureGameSlot();
      setStep('creation');
    } catch (e) {
      alert('게임을 시작할 수 없습니다. 다시 로그인해 주세요.');
    }
  };

  if (loading) return <div>템플릿 정보 및 캐릭터 불러오는 중...</div>;
  if (!gameTemplate) return <div>해당 게임 템플릿이 존재하지 않습니다.</div>;

  return (
      <div className="p-8">
        {step === 'info' && (
            <GameInfo
                gameInfo={gameTemplate}
                onStartGame={handleStartGame}
                onBack={handleCancel}
            />
        )}

        {step === 'creation' && (
            <CharacterCreation
                gameInfo={gameTemplate}
                onCharacterCreated={(charData) => handleCharacterCreated(charData)}
                onCancel={handleCancel}
            />
        )}
      </div>
  );
}
