// app/game/[id]/page.tsx

"use client";
import React from "react";
import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AiWebSocketClient, type AiServerResponse } from "@/lib/ws";
import { AI_SERVER_HTTP_URL, API_BASE_URL } from "@/app/config";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STAT_LABELS: Record<string, string> = {
  strength: "힘 (STR)",
  dexterity: "민첩 (DEX)",
  wisdom: "지혜 (WIS)",
  charisma: "매력 (CHA)",
};

const formatStatLabel = (key: string) => {
  if (STAT_LABELS[key]) return STAT_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeInventory = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.entries(value).map(([name, payload]) => {
      if (payload && typeof payload === "object") {
        return { name, ...payload };
      }
      return { name, value: payload };
    });
  }
  return value != null ? [value] : [];
};

const resolveStaticUrl = (url?: string | null): string | undefined => {
  if (!url || typeof url !== "string" || url.length === 0) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL.replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

const calculateHealthFromStats = () => {
  const base = 100;
  return base;
};

// --- 인터페이스 정의 ---
interface MessageImage {
  id: string;
  dataUrl: string;
  mime: string;
  filename?: string;
  url?: string;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type?: "system" | "chat" | "dice" | "combat" | "status";
  images?: MessageImage[];
  status?: "image-generating";
  prompt?: string;
  options?: string[];
}

interface Player {
  id: string;
  name: string;
  role: string;
  avatar: string;
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
  level: number;
  stats?: Record<string, number>;
  inventory?: any[];
}

const FLASK_AI_SERVICE_URL = AI_SERVER_HTTP_URL;
const CHAR_API_URL = "http://192.168.26.165:1024/api/characters";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseStatsPayload = (value: unknown): Record<string, number> | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parseStatsPayload(parsed);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(value)) {
    const result: Record<string, number> = {};
    value.forEach((item, index) => {
      const num = Number(item);
      if (!Number.isNaN(num)) {
        result[String(index)] = num;
      }
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }
  if (isRecord(value)) {
    const result: Record<string, number> = {};
    Object.entries(value).forEach(([key, raw]) => {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        result[key] = num;
      }
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return undefined;
};

const collectPlayerUpdateEntries = (payload: AiServerResponse): Record<string, unknown>[] => {
  const updates: Record<string, unknown>[] = [];
  const candidateKeys = [
    "player",
    "playerUpdate",
    "player_update",
    "character",
    "characterUpdate",
    "character_update",
  ];
  candidateKeys.forEach((key) => {
    const value = (payload as Record<string, unknown>)[key];
    if (isRecord(value)) {
      updates.push(value);
    }
  });

  const arrayKeys = ["players", "playerUpdates", "characters", "characterUpdates"];
  arrayKeys.forEach((key) => {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (isRecord(entry)) {
          updates.push(entry);
        }
      });
    }
  });

  if (updates.length === 0 && (payload as Record<string, unknown>).stats) {
    const statsCandidate = parseStatsPayload((payload as Record<string, unknown>).stats);
    if (statsCandidate) {
      updates.push({ stats: statsCandidate });
    }
  }

  if (updates.length === 0 && (payload as Record<string, unknown>).inventory) {
    updates.push({ inventory: (payload as Record<string, unknown>).inventory });
  }

  return updates;
};

const areNumberRecordsEqual = (
  a?: Record<string, number>,
  b?: Record<string, number>,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Number(a[key]) === Number(b[key]));
};

const areInventoriesEqual = (a?: any[], b?: any[]): boolean => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return !a && !b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      return false;
    }
  }
  return true;
};

const convertCharacterToPlayer = (character: any): Player | null => {
  if (!character) return null;
  const parseNumeric = (value: unknown): number | undefined => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };
  const rawStats =
    character?.stats ??
    character?.character_stats ??
    character?.attributes ??
    character?.attributes_map ??
    character?.stats_json;
  const stats = parseStatsPayload(rawStats);
  const inventory = normalizeInventory(
    character.inventory ?? character.items ?? character.character_inventory ?? character.bag,
  );
  const rawId =
    character.id ??
    character.character_id ??
    character.characterId ??
    character.characterIdStr ??
    character.characterIdString;
  const resolvedId = rawId ? String(rawId) : String(Date.now());
  const computedHealth =
    parseNumeric(character.health) ??
    parseNumeric(character.currentHealth) ??
    calculateHealthFromStats(stats);
  const computedMaxHealth =
    parseNumeric(character.maxHealth) ??
    parseNumeric(character.max_health) ??
    calculateHealthFromStats(stats);

  return {
    id: resolvedId,
    name: character.name ?? "이름 없음",
    role: character.class ?? character.role ?? "모험가",
    avatar: character.avatar || "/placeholder-user.jpg",
    health: computedHealth,
    maxHealth: computedMaxHealth,
    mana:
      parseNumeric(character.mana) ??
      (character.class?.toLowerCase?.().includes("mage") ? 100 : undefined),
    maxMana:
      parseNumeric(character.maxMana) ??
      (character.class?.toLowerCase?.().includes("mage") ? 100 : undefined),
    level: parseNumeric(character.level) ?? 1,
    stats: stats ?? undefined,
    inventory,
  };
};

export default function GamePage() {
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 상태 관리 ---
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState("시나리오 생성 중...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [activeOptions, setActiveOptions] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiServerOnline, setAiServerOnline] = useState(true);
  const socketRef = useRef<AiWebSocketClient | null>(null);
  const activeCharacterId = players[0]?.id;
  const storageKeyId = gameId || (params?.id ? String(params.id) : null);

  const persistCharacterSnapshot = useCallback(
    (player: Player, gameKey?: string | null) => {
      const key = gameKey ?? storageKeyId;
      if (!key || typeof window === "undefined") return;
      const snapshot = {
        id: player.id,
        name: player.name,
        class: player.role,
        level: player.level,
        avatar: player.avatar,
        stats: player.stats,
        inventory: player.inventory,
        health: player.health,
        maxHealth: player.maxHealth,
      };
      try {
        localStorage.setItem(`lastCharacter:${key}`, JSON.stringify(snapshot));
      } catch (error) {
        console.warn("캐릭터 스냅샷 저장 실패:", error);
      }
    },
    [storageKeyId],
  );

  const applyPlayerState = useCallback(
    (player: Player, gameKey?: string | null) => {
      setPlayers([player]);
      setSelectedPlayer((prev) => (prev && prev.id === player.id ? player : prev));
      persistCharacterSnapshot(player, gameKey);
    },
    [persistCharacterSnapshot],
  );

  const fetchLatestCharacter = useCallback(
    async (targetGameId?: string | null, reason: string = "manual") => {
      const resolvedId = targetGameId ?? storageKeyId;
      if (!resolvedId) return;
      try {
        console.log("[GamePage] 최신 캐릭터 조회 요청", { resolvedId, reason });
        const res = await axios.get(`${CHAR_API_URL}/game/${resolvedId}`);
        const rows = res.data?.data || res.data || [];
        if (Array.isArray(rows) && rows.length > 0) {
          const primary = rows[0];
          const player = convertCharacterToPlayer({
            ...primary,
            id: primary.character_id ?? primary.id,
          });
          if (player) {
            applyPlayerState(player, resolvedId);
            console.log("[GamePage] 서버 캐릭터 정보 적용", { player, reason });
          }
        }
      } catch (err) {
        console.warn("[GamePage] 최신 캐릭터 정보 불러오기 실패:", err);
      }
    },
    [applyPlayerState, storageKeyId],
  );

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const buildTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const updateCharacterFromAiPayload = useCallback(
    async (payload: AiServerResponse, source: string = "unknown") => {
      const updates = collectPlayerUpdateEntries(payload);
      if (updates.length === 0) {
        return;
      }

      console.log(`[GamePage] 캐릭터 업데이트 감지 (${source}):`, updates);

      let latestSnapshot: Player | null = null;
      let pendingUpdate:
        | {
            snapshot: Player;
            changes: Record<string, unknown>;
          }
        | null = null;
      setPlayers((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const updatedPlayers = prev.map((player, index) => {
          const matched = updates.find((candidate) => {
            const rawId =
              (candidate.character_id as unknown) ??
              (candidate.characterId as unknown) ??
              (candidate.player_id as unknown) ??
              (candidate.playerId as unknown) ??
              (candidate.id as unknown);
            if (rawId == null) return false;
            return String(rawId) === String(player.id);
          });
          const updateSource = matched || (index === 0 ? updates[0] : undefined);
          if (!updateSource) return player;

          const parsedStats = parseStatsPayload(
            updateSource.stats ??
              updateSource.character_stats ??
              updateSource.attributes ??
              updateSource.attributes_map,
          );
          const statsChanged =
            parsedStats !== undefined && !areNumberRecordsEqual(parsedStats, player.stats);
          const nextStats = statsChanged && parsedStats ? parsedStats : player.stats;

          const inventorySource =
            updateSource.inventory ??
            updateSource.items ??
            updateSource.character_inventory ??
            updateSource.bag;
          const normalizedInventory =
            inventorySource !== undefined ? normalizeInventory(inventorySource) : undefined;
          const inventoryChanged =
            inventorySource !== undefined &&
            !areInventoriesEqual(normalizedInventory, player.inventory);
          const nextInventory =
            inventoryChanged && normalizedInventory ? normalizedInventory : player.inventory;

          const levelValue =
            typeof updateSource.level === "number"
              ? updateSource.level
              : typeof updateSource.level === "string" && !Number.isNaN(Number(updateSource.level))
                ? Number(updateSource.level)
                : player.level;

          const healthValue =
            typeof updateSource.health === "number"
              ? updateSource.health
              : typeof updateSource.currentHealth === "number"
                ? updateSource.currentHealth
                : undefined;

          const maxHealthValue =
            typeof updateSource.maxHealth === "number"
              ? updateSource.maxHealth
              : typeof updateSource.max_health === "number"
                ? updateSource.max_health
                : undefined;

          let nextMaxHealth = player.maxHealth;
          if (maxHealthValue !== undefined) {
            nextMaxHealth = maxHealthValue;
          }

          let nextHealth = player.health;
          if (healthValue !== undefined) {
            nextHealth = healthValue;
          }

          const healthChanged = nextHealth !== player.health;
          const maxHealthChanged = nextMaxHealth !== player.maxHealth;
          const levelChanged = levelValue !== player.level;

          if (
            !statsChanged &&
            !inventoryChanged &&
            !healthChanged &&
            !maxHealthChanged &&
            !levelChanged
          ) {
            return player;
          }

          const changes: Record<string, unknown> = {};
          if (statsChanged && nextStats) {
            changes.stats = nextStats;
          }
          if (inventoryChanged && nextInventory) {
            changes.inventory = nextInventory;
          }
          if (levelChanged) {
            changes.level = levelValue;
          }
          if (healthChanged || maxHealthChanged) {
            changes.health = nextHealth;
          }
          if (updateSource.name !== undefined && updateSource.name !== player.name) {
            changes.name = updateSource.name;
          }
          if (updateSource.class !== undefined && updateSource.class !== player.role) {
            changes.class = updateSource.class;
          }
          if (updateSource.avatar !== undefined && updateSource.avatar !== player.avatar) {
            changes.avatar = updateSource.avatar;
          }

          const nextPlayer: Player = {
            ...player,
            stats: nextStats,
            inventory: nextInventory,
            health: nextHealth,
            maxHealth: nextMaxHealth,
            level: levelValue,
          };

          changed = true;
          latestSnapshot = nextPlayer;
          if (!pendingUpdate && Object.keys(changes).length > 0) {
            pendingUpdate = { snapshot: nextPlayer, changes };
          }
          return nextPlayer;
        });

        return changed ? updatedPlayers : prev;
      });

      if (latestSnapshot) {
        const snapshot = latestSnapshot;
        setSelectedPlayer((prev) => (prev && prev.id === snapshot.id ? snapshot : prev));
        persistCharacterSnapshot(snapshot);
      }

      if (pendingUpdate && gameId) {
        try {
          const payloadForServer: Record<string, unknown> = { ...pendingUpdate.changes };
          if (payloadForServer.inventory && Array.isArray(payloadForServer.inventory)) {
            payloadForServer.inventory = payloadForServer.inventory;
          }
          if (payloadForServer.stats && typeof payloadForServer.stats === "object") {
            payloadForServer.stats = payloadForServer.stats;
          }
          if (payloadForServer.health === undefined) {
            payloadForServer.health = pendingUpdate.snapshot.health;
          }
          const response = await axios.patch(
            `${CHAR_API_URL}/game/${gameId}`,
            payloadForServer,
          );
          const updatedData = response?.data?.data || response?.data;
          const updatedPlayer = convertCharacterToPlayer(updatedData);
          if (updatedPlayer) {
            console.log("[GamePage] AI 캐릭터 업데이트 서버 반영 성공:", updatedPlayer);
            setPlayers((prev) =>
              prev.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)),
            );
            setSelectedPlayer((prev) =>
              prev && prev.id === updatedPlayer.id ? updatedPlayer : prev,
            );
            persistCharacterSnapshot(updatedPlayer);
          }
          await fetchLatestCharacter(gameId);
        } catch (err) {
          console.error("[GamePage] 캐릭터 상태 동기화 실패:", err);
        }
      }
    },
    [persistCharacterSnapshot, gameId, fetchLatestCharacter],
  );

  const extractTextFromPayload = (payload: AiServerResponse): string => {
    const candidates = [
      (payload as any).content,
      payload.response,
      payload.message,
      payload.aiResponse,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return "";
  };

  const normalizeImagesFromPayload = (payload: AiServerResponse): MessageImage[] => {
    const explicitUrls = Array.isArray((payload as any).image_urls)
      ? (payload as any).image_urls
      : (payload as any).image_url
        ? [(payload as any).image_url]
        : [];

    if (explicitUrls.length > 0) {
      return explicitUrls
        .map((url: unknown, index: number) => {
          if (typeof url !== "string" || url.trim().length === 0) return null;
          const resolved = resolveStaticUrl(url.trim());
          if (!resolved) return null;
          return {
            id: `image-url-${Date.now()}-${index}`,
            dataUrl: resolved,
            mime: "image/png",
            url: resolved,
          } as MessageImage;
        })
        .filter((img): img is MessageImage => img !== null);
    }

    if (!Array.isArray(payload.images)) return [];
    return payload.images
      .map((img, index) => {
        if (!img || typeof img !== "object") return null;
        const { data, mime, filename, url } = img as {
          data?: string;
          mime?: string;
          filename?: string;
          url?: string;
        };
        if (typeof url === "string" && url.trim().length > 0) {
          const resolved = resolveStaticUrl(url.trim());
          if (!resolved) return null;
          return {
            id: filename || `image-${Date.now()}-${index}`,
            dataUrl: resolved,
            mime: mime || "image/png",
            filename,
            url: resolved,
          };
        }
        if (typeof data !== "string" || data.trim().length === 0) return null;
        const safeMime = typeof mime === "string" && mime.trim().length > 0 ? mime : "image/png";
        const cleanBase64 = data.replace(/\s+/g, "");
        if (cleanBase64.length === 0) return null;
        return {
          id: filename || `image-${Date.now()}-${index}`,
          dataUrl: `data:${safeMime};base64,${cleanBase64}`,
          mime: safeMime,
          filename,
        };
      })
      .filter((img): img is MessageImage => img !== null);
  };

  const normalizeOptionsFromPayload = (payload: AiServerResponse): string[] => {
    if (!Array.isArray(payload.options)) return [];
    return payload.options
      .map((opt) => {
        if (typeof opt === "string") {
          const trimmed = opt.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
        if (opt && typeof opt === "object") {
          const maybe =
            (typeof opt.value === "string" && opt.value.trim().length > 0 && opt.value.trim()) ||
            (typeof opt.label === "string" && opt.label.trim().length > 0 && opt.label.trim()) ||
            (typeof opt.text === "string" && opt.text.trim().length > 0 && opt.text.trim());
          return maybe || null;
        }
        return null;
      })
      .filter((opt): opt is string => opt !== null);
  };

  // 플레이어 설정 전용 useEffect (쿼리 캐릭터 > 로컬 저장 > 서버 캐릭터 순으로 복원, 이후 서버 재조회)
  useEffect(() => {
    const routeGameId = params?.id ? String(params.id) : null;
    const characterParam = searchParams.get("character");

    let shouldFetchFromServer = true;

    // 1) 쿼리로 온 캐릭터가 있으면 우선 적용
    if (characterParam) {
      try {
        const character = JSON.parse(decodeURIComponent(characterParam));
        const newPlayer = convertCharacterToPlayer(character);
        if (newPlayer) {
          applyPlayerState(newPlayer, routeGameId);
          shouldFetchFromServer = true;
        }
      } catch (error) {
        console.error("캐릭터 정보 파싱 실패:", error);
      }
    }

    // 2) 로컬 저장된 마지막 캐릭터를 즉시 적용
    if (routeGameId && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`lastCharacter:${routeGameId}`);
      if (saved) {
        try {
          const newPlayer = convertCharacterToPlayer(JSON.parse(saved));
          if (newPlayer) {
            applyPlayerState(newPlayer, routeGameId);
            shouldFetchFromServer = true;
          }
        } catch {}
      }
    }

    // 3) 항상 서버에서 최신 캐릭터 정보를 가져와 동기화
    if (routeGameId && shouldFetchFromServer) {
      void fetchLatestCharacter(routeGameId, "initial");
    }
  }, [searchParams, params, applyPlayerState, fetchLatestCharacter]);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const loadHistory = async () => {
      console.log("[History] 대화 기록 요청 시작", { gameId, aiServerOnline });
      try {
        setHistoryLoading(true);
        console.log("[History] GET", `${FLASK_AI_SERVICE_URL}/api/history/${gameId}`);
        const res = await fetch(`${FLASK_AI_SERVICE_URL}/api/history/${gameId}`);
        console.log("[History] 응답 상태", res.status);
        if (!res.ok) {
          if (res.status !== 404) {
            throw new Error(`Failed to load history: ${res.status}`);
          }
          if (!cancelled) {
            setMessages([]);
          }
          setAiServerOnline(false);
          console.warn("[History] 기록 없음 또는 AI 서버 다운", { status: res.status });
          return;
        }
        const json = await res.json();
        console.log("[History] API 응답", json);
        const entries = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.history)
            ? json.history
            : Array.isArray(json?.content)
              ? json.content
              : Array.isArray(json)
                ? json
                : [];
        setAiServerOnline(true);
        if (cancelled) return;
        const mapped: Message[] = entries
          .sort((a: any, b: any) => (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0))
          .map((entry: any, index: number) => {
            const seq = typeof entry?.sequence_number === "number" ? entry.sequence_number : index;
            const role = typeof entry?.role === "string" ? entry.role : "assistant";
            const sender = role === "assistant" ? "AI" : role === "user" ? "플레이어" : role;
            const imageUrl = resolveStaticUrl(entry?.image_url);
            return {
              id: seq,
              sender,
              content: typeof entry?.content === "string" ? entry.content : "",
              timestamp: typeof entry?.timestamp === "string" ? entry.timestamp : buildTimestamp(),
              type: "chat",
              images: imageUrl
                ? [
                    {
                      id: `history-image-${seq}`,
                      dataUrl: imageUrl,
                      mime: "image/png",
                      url: imageUrl,
                    },
                  ]
                : undefined,
            } as Message;
          });
        setMessages(mapped);
        console.log("[History] 대화 기록 불러오기 완료", { count: mapped.length });
        setActiveOptions([]);
      } catch (error) {
        if (!cancelled) {
          console.error("대화 기록 불러오기 실패:", error);
          setAiServerOnline(false);
          setMessages([
            {
              id: Date.now(),
              sender: "시스템",
              content: "대화 기록을 불러올 수 없습니다. AI 서버 상태를 확인해주세요.",
              timestamp: buildTimestamp(),
              type: "system",
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
          console.log("[History] 로딩 종료");
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [gameId, aiServerOnline]);

  // AI 세션 시작 + 시나리오 로딩
  useEffect(() => {
    const startSessionAndFetchScenario = async () => {
      if (!aiServerOnline) {
        console.warn("[Session] AI 서버 오프라인 상태, 세션 생성을 건너뜁니다.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const templateTitle = searchParams.get("title") || "기본 던전";
        console.log("[Session] 세션 초기화 시작", { templateTitle });

        // 1) 세션 시작 (게임/유저/캐릭터 ID 전달)
        const routeGameId = params?.id ? String(params.id) : null;
        const resolvedGameId =
          routeGameId || searchParams.get("gameId") || searchParams.get("id") || "";
        setGameId(resolvedGameId || null);
        if (!resolvedGameId) {
          throw new Error("game_id를 찾을 수 없습니다.");
        }
        const userId =
          (typeof window !== "undefined" && localStorage.getItem("userId")) || "guest";
        const characterParam = searchParams.get("character");
        const character = characterParam ? JSON.parse(decodeURIComponent(characterParam)) : null;

        // --- 변경: 로컬에 저장된 sessionId가 있으면 사용, 없으면 새로 생성해서 바로 상태에 저장 ---
        let initialSessionId: string | null = null;
        if (typeof window !== "undefined") {
          initialSessionId = localStorage.getItem("sessionId");
          if (!initialSessionId) {
            initialSessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `s-${Date.now()}`;
          }
        }

        console.log("[Request] game_id:", resolvedGameId);
        console.log("[Request] session_id:", initialSessionId);
        
        const startRes = await fetch("http://192.168.26.165:5001/api/session/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ game_id: resolvedGameId, session_id: initialSessionId }),
        });

        const startData = await startRes.json();
        if (!startRes.ok) throw new Error(startData?.error || "세션 시작 실패");
        const newSessionId: string = startData.sessionId || startData.id || String(Date.now());
        if (typeof window !== "undefined") {
          localStorage.setItem("sessionId", newSessionId);
        }
        setSessionId(newSessionId);
        setAiServerOnline(true);
        console.log("[Session] 세션 생성 성공", { sessionId: newSessionId });

        // 2) 초기 시나리오 요청 (AI 서버 HTTP)
        // const url = `${FLASK_AI_SERVICE_URL}/api/ai/generate-scenario?timestamp=${Date.now()}`;
        // const response = await axios.post(url, { templateTitle, sessionId: newSessionId });
        
        // if (response.data) {
        //   setGameTitle(response.data.gameTitle);
        //   setMessages([
        //     {
        //       id: Date.now(), sender: "시스템", content: response.data.initialMessage,
        //       timestamp: buildTimestamp(),
        //       type: "system",
        //     },
        //   ]);
        // } else { 
        //   console.error("response data 확인:", response.data);
        //   throw new Error("서버 응답 데이터 형식이 잘못되었습니다."); }
      } catch (error) {
        console.error("초기 시나리오 생성 실패:", error);
        setGameTitle("오류 발생");
        setMessages([
          {
            id: Date.now(), sender: "시스템",
            content: "시나리오를 불러오는 데 실패했습니다. 서버 상태를 확인해주세요.",
            timestamp: buildTimestamp(),
            type: "system",
          },
        ]);
        setSessionId(null);
        setIsAwaitingResponse(false);
        setAiServerOnline(false);
      } finally {
        setIsLoading(false);
      }
    };
    startSessionAndFetchScenario();
  }, [searchParams, aiServerOnline]);

  // WebSocket 연결 관리
  useEffect(() => {
    if (!sessionId || !gameId) return;
    const client = new AiWebSocketClient({
      gameId,
      sessionId,
      onEvent: (evt) => {
        if (evt.type !== "message") return;
        const m = evt.data;
        if (m.kind === "ai_response") {
          const origin = (m as typeof m & { source?: string }).source ?? "ws:ai_response";
          const payload: AiServerResponse = m.payload || {};
          console.log("[GamePage] AI 응답 수신:", { origin, payload });

          if (payload && typeof payload === "object") {
            void updateCharacterFromAiPayload(payload, origin);
          }
          console.log("[GamePage] 최신 캐릭터 정보 재요청", { origin, gameId });
          void fetchLatestCharacter(gameId, origin);

          const timestamp = typeof (payload as any).timestamp === "string"
            ? (payload as any).timestamp
            : buildTimestamp();
          const text = extractTextFromPayload(payload);
          const images = normalizeImagesFromPayload(payload);
          const options = normalizeOptionsFromPayload(payload);

          const promptSummary =
            typeof (payload as any).prompt === "string" && (payload as any).prompt.trim().length > 0
              ? `[생성된 이미지]\n프롬프트: ${(payload as any).prompt.trim()}`
              : "";

          const messageContent =
            text.length > 0
              ? text
              : promptSummary.length > 0
                ? promptSummary
                : images.length > 0
                  ? "이미지가 도착했습니다."
                  : "";

          const newMessage: Message = {
            id: Date.now(),
            sender: "AI",
            content: messageContent,
            timestamp,
            type: "chat",
          };

          if (images.length > 0) {
            newMessage.images = images;
          }

          if (options.length > 0) {
            newMessage.options = options;
            setActiveOptions(options);
          } else {
            setActiveOptions([]);
          }

          setMessages((prev) => [...prev, newMessage]);
          setIsAwaitingResponse(false);
          return;
        }

        if (m.kind === "chat") {
          console.log("[GamePage] chat 이벤트 수신:", m);
          if (m.role === "assistant") {
            setIsAwaitingResponse(false);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: m.role === "assistant" ? "AI" : "플레이어",
              content: m.content,
              timestamp: buildTimestamp(),
              type: m.role === "assistant" ? "chat" : "system",
            },
          ]);
        } else if (m.kind === "image") {
          console.log("[GamePage] image 이벤트 수신:", m);
          setIsAwaitingResponse(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "AI",
              content: `이미지 생성됨 (${m.mime})`,
              timestamp: buildTimestamp(),
              type: "system",
            },
          ]);
        } else if (m.kind === "info") {
          console.log("[GamePage] WebSocket info:", m.message);
        }
      },
    });
    client.connect();
    socketRef.current = client;
    return () => {
      client.close();
      if (socketRef.current === client) {
        socketRef.current = null;
      }
    };
  }, [sessionId, gameId, updateCharacterFromAiPayload, fetchLatestCharacter]);


  // 채팅 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSendDisabled = isAwaitingResponse || message.trim().length === 0;

  const sendChatMessage = (content: string) => {
    if (isAwaitingResponse) {
      console.warn("[GamePage] AI 응답 대기 중이라 메시지를 전송할 수 없습니다.");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    const userTimestamp = buildTimestamp();
    const userMessage: Message = {
      id: Date.now(),
      sender: "플레이어",
      content: trimmed,
      timestamp: userTimestamp,
      type: "chat",
    };

    console.log("[GamePage] 플레이어 메시지 전송:", trimmed);
    setMessages((prev) => {
      const cleaned = prev.map((msg) =>
        msg.options && msg.options.length > 0 ? { ...msg, options: undefined } : msg,
      );
      return [...cleaned, userMessage];
    });
    setActiveOptions([]);
    setMessage("");
    setIsAwaitingResponse(true);

    const client = socketRef.current;
    if (!client) {
      console.error("[GamePage] WebSocket 클라이언트가 초기화되지 않았습니다.");
      setIsAwaitingResponse(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "시스템",
          content: "AI 서버에 연결되어 있지 않습니다.",
          timestamp: buildTimestamp(),
          type: "system",
        },
      ]);
      return;
    }

    const sent = client.sendUserMessage(trimmed);
    if (!sent) {
      console.error("[GamePage] 소켓 전송에 실패했습니다. 연결 상태를 확인해주세요.");
      setIsAwaitingResponse(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "시스템",
          content: "메시지를 전송하지 못했습니다. 연결 상태를 확인하세요.",
          timestamp: buildTimestamp(),
          type: "system",
        },
      ]);
    }
  };

  const handleSendMessage = () => {
    const content = message.trim();
    if (!content) return;
    sendChatMessage(content);
  };

  const handleOptionClick = (option: string) => {
    if (isAwaitingResponse) {
      console.warn("[GamePage] 응답 대기 중에는 옵션을 선택할 수 없습니다.");
      return;
    }
    console.log("[GamePage] 옵션 선택:", option);
    sendChatMessage(option);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <aside className="w-60 border-r bg-card p-4">
          <h2 className="text-lg font-semibold mb-4">플레이어</h2>
          <div className="space-y-4">{players.map((player) => (<Card key={player.id}><CardContent className="p-4"><div className="flex items-center space-x-3 mb-3"><Avatar><AvatarImage src={player.avatar} alt={player.name} /><AvatarFallback>{player.name[0]}</AvatarFallback></Avatar><div><h3 className="font-semibold">{player.name}</h3><p className="text-sm text-muted-foreground">{player.role}</p></div></div></CardContent></Card>))}</div>
        </aside>
        <main className="flex-1 flex flex-col justify-center items-center">
          <p className="text-lg font-semibold">✨ 모험을 준비 중입니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-60 border-r bg-card p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">플레이어</h2>
        <div className="space-y-4">
          {players.map((player) => (
            <Card
              key={player.id}
              className="cursor-pointer transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlayer(player)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedPlayer(player);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar>
                    <AvatarImage src={player.avatar} alt={player.name} />
                    <AvatarFallback>{player.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>체력</span>
                      <span>
                        {player.health}/{player.maxHealth}
                      </span>
                    </div>
                    <Progress value={(player.health / player.maxHealth) * 100} className="h-2" />
                  </div>
                  {player.mana != null && (
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>마나</span>
                        <span>
                          {player.mana}/{player.maxMana}
                        </span>
                      </div>
                      <Progress
                        value={(player.mana / (player.maxMana || 100)) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 제목 영역 */}
        <div className="shrink-0 border-b bg-black/10 p-4">
          <h3 className="text-2xl font-bold text-foreground">{gameTitle}</h3>
          {historyLoading && (
            <p className="text-xs text-muted-foreground mt-1">기록을 불러오는 중...</p>
          )}
        </div>

        {/* 하단 채팅 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {messages.map((msg) => {
              const isPlayer = msg.sender === "플레이어";
              const bubbleClass = cn(
                "rounded-lg p-3 w-full max-w-xl",
                isPlayer ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              );
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[85%]",
                    isPlayer ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        isPlayer
                          ? players.find((p) => p.name === msg.sender)?.avatar
                          : undefined
                      }
                    />
                    <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div className={bubbleClass}>
                    <p className="text-sm font-medium mb-1">{msg.sender}</p>
                    {msg.content && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                    {msg.prompt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        프롬프트: {msg.prompt}
                      </p>
                    )}
                    {msg.status === "image-generating" && (
                      <div className="mt-3 flex h-32 w-full max-w-xs items-center justify-center rounded-md border border-dashed border-muted-foreground/60 bg-muted text-sm text-muted-foreground">
                        이미지 생성 중입니다...
                      </div>
                    )}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mt-3 grid gap-3">
                        {msg.images.map((image) => (
                          <div
                            key={image.id}
                            className="overflow-hidden rounded-md border bg-background"
                          >
                            <img
                              src={image.dataUrl}
                              alt={image.filename || "생성된 이미지"}
                              className="block h-auto max-w-full"
                            />
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              {image.filename || image.mime}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {activeOptions.length > 0 && (
            <div className="max-h-32 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {activeOptions.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOptionClick(option)}
                    disabled={isAwaitingResponse}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 border-t pt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isAwaitingResponse ? "AI 응답을 기다리는 중입니다..." : "메시지를 입력하세요..."}
              className="flex-1 resize-none"
              disabled={isAwaitingResponse}
              onKeyDown={(e) => {
                if (isAwaitingResponse) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} className="h-auto" disabled={isSendDisabled}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
      <Dialog
        open={selectedPlayer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      >
        {selectedPlayer && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedPlayer.name}</DialogTitle>
              <DialogDescription>
                {selectedPlayer.role} · 레벨 {selectedPlayer.level}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedPlayer.avatar} alt={selectedPlayer.name} />
                <AvatarFallback>{selectedPlayer.name[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-sm">
                <p>
                  체력:{" "}
                  <span className="font-semibold">
                    {selectedPlayer.health}/{selectedPlayer.maxHealth}
                  </span>
                </p>
                {selectedPlayer.mana != null && (
                  <p>
                    마나:{" "}
                    <span className="font-semibold">
                      {selectedPlayer.mana}/{selectedPlayer.maxMana}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {selectedPlayer.stats && Object.keys(selectedPlayer.stats).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">능력치</h4>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{formatStatLabel(key)}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold">인벤토리</h4>
              {selectedPlayer.inventory && selectedPlayer.inventory.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {selectedPlayer.inventory.map((item, index) => {
                    if (item && typeof item === "object") {
                      const { name, ...rest } = item as Record<string, any>;
                      const displayName =
                        typeof name === "string" && name.trim().length > 0
                          ? name
                          : `아이템 ${index + 1}`;
                      const detailEntries = Object.entries(rest).filter(
                        ([, value]) => value !== undefined && value !== null && value !== ""
                      );
                      return (
                        <li key={index} className="rounded-md border p-3 text-sm">
                          <div className="font-medium">{displayName}</div>
                          {detailEntries.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {detailEntries.map(([k, v]) => `${k}: ${v}`).join(" / ")}
                            </div>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={index} className="rounded-md border p-3 text-sm">
                        {typeof item === "string" ? item : JSON.stringify(item)}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">보유 아이템이 없습니다.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlayer(null)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
