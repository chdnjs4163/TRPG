"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { GameInfo } from "@/components/game-info";
import CharacterCreation from "@/components/character-creation";
import type { CharacterProfile as UiCharacterProfile } from "@/lib/data";
import { API_BASE_URL } from "@/app/config";

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

const calculateHealthFromStats = (stats?: Record<string, number>): number => {
  const base = 100;
  if (!stats) return base;
  let total = 0;
  for (const value of Object.values(stats)) {
    const num = Number(value);
    if (!Number.isNaN(num)) total += num;
  }
  return Math.round(base + base * (total / 100));
};

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const templateId = params?.id ? String(params.id) : '';
  const [step, setStep] = useState<'info' | 'creation'>('info');
  const [gameTemplate, setGameTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<string | null>(null);

  const TITLES_API_URL = `${API_BASE_URL}/api/game_titles`;
  const GAMES_API_URL = `${API_BASE_URL}/api/games`;
  const CHAR_API_URL = `${API_BASE_URL}/api/characters`;

  // --- 게임 템플릿 정보 불러오기 ---
  useEffect(() => {
    const fetchGameTemplate = async () => {
      try {
        const res = await axios.get(`${TITLES_API_URL}/${templateId}`);
        const template = normalizeTemplate(res.data?.data || res.data);
        setGameTemplate(template || null);
      } catch (err) {
        console.error("게임 템플릿 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGameTemplate();
  }, [templateId]);

  const ensureGameInstance = async (): Promise<string> => {
    if (gameId) return gameId;
    const templateTitle =
      gameTemplate?.title ??
      gameTemplate?.title_name ??
      gameTemplate?.name ??
      "새로운 모험";
    const generatedId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `game-${crypto.randomUUID()}`
        : `game-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const payload = {
      id: generatedId,
      title: templateTitle,
      genre: gameTemplate?.theme ?? gameTemplate?.genre ?? null,
      metadata: {
        templateId,
        templateTitle,
        thumbnail: gameTemplate?.thumbnail_url ?? gameTemplate?.image ?? null,
        status: "ongoing",
        genre: gameTemplate?.theme ?? gameTemplate?.genre ?? null,
        description: gameTemplate?.description ?? null,
      },
    };
    const res = await axios.post(GAMES_API_URL, payload);
    const created = res.data?.data || res.data;
    const resolvedId =
      typeof created === "object" && created
        ? created.id ?? created.game_id ?? generatedId
        : generatedId;
    setGameId(String(resolvedId));
    return String(resolvedId);
  };

  // --- 캐릭터 생성 ---
  const handleCharacterCreated = async (newChar: UiCharacterProfile) => {
    try {
      const gid = await ensureGameInstance();
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!userId) throw new Error('로그인이 필요합니다.');
      const stats = newChar.stats ?? {};
      const computedHealth = newChar.health ?? 100;
      const payload = {
        game_id: gid,
        user_id: userId,
        name: newChar.name,
        class: newChar.class,
        level: newChar.level ?? 1,
        stats,
        inventory: newChar.inventory ?? [],
        avatar: newChar.avatar,
      } as const;
      const res = await axios.post(CHAR_API_URL, payload);
      const created: DbCharacter = (res.data?.data || res.data) as DbCharacter;
      const rawCharacterId = created.character_id ?? created.id ?? gid;
      const characterId = typeof rawCharacterId === "string" ? rawCharacterId : String(rawCharacterId);
      const createdUi: UiCharacterProfile = {
        id: characterId,
        name: created.name || newChar.name,
        race: "",
        class: created.class || newChar.class,
        level: created.level ?? newChar.level ?? 1,
        avatar: newChar.avatar || "/placeholder-user.jpg",
        favorite: false,
        stats,
        inventory: Array.isArray(created.inventory)
          ? created.inventory
          : newChar.inventory ?? [],
        health: computedHealth,
        maxHealth: computedHealth,
      };
      const query = new URLSearchParams({ character: encodeURIComponent(JSON.stringify(createdUi)) });
      router.push(`/game/${gid}?${query.toString()}`);
    } catch (err) {
      console.error("캐릭터 생성 실패:", err);
    }
  };

  const handleCancel = () => {
    if (step === 'creation') {
      setStep('info');
    } else {
      router.back();
    }
  };

  const handleStartGame = async () => {
    setStep('creation');
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
