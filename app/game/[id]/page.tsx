// app/game/[id]/page.tsx

"use client";
import React from "react";
import axios from "axios";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AiWebSocketClient, type AiServerResponse } from "@/lib/ws";
import { AI_SERVER_HTTP_URL, API_BASE_URL } from "@/app/config";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
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

const DEFAULT_PLAYER_AVATAR = "/placeholder-user.jpg";
const GM_AVATAR_PATH = "/images/gamemaster.png";
const AVATAR_UPDATED_EVENT = "trpg-avatar-updated";

const getStoredProfileAvatar = (): string | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("avatarUrl");
  if (!stored) return null;
  const trimmed = stored.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolvePlayerAvatar = (candidate?: unknown): string => {
  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return getStoredProfileAvatar() ?? DEFAULT_PLAYER_AVATAR;
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

const clampPercentage = (value: number): number => Math.min(100, Math.max(0, value));

const computePercent = (value: number | undefined, max: number | undefined): number => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || !max || max <= 0) return 0;
  return clampPercentage((value / max) * 100);
};

const coerceNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;
    if (/^\d+\s*\/\s*\d+$/.test(trimmed)) {
      const [currentPart] = trimmed.split("/");
      const currentNum = Number(currentPart.trim());
      return Number.isFinite(currentNum) ? currentNum : undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const extractHealthValues = (source: Record<string, unknown>): { health?: number; maxHealth?: number } => {
  let health: number | undefined;
  let maxHealth: number | undefined;

  const candidatePairs: Array<[string, string]> = [
    ["health", "maxHealth"],
    ["health", "max_health"],
    ["currentHealth", "maxHealth"],
    ["current_health", "max_health"],
    ["hp", "maxHp"],
    ["hp", "max_hp"],
    ["hp_current", "hp_max"],
    ["current", "max"],
  ];

  candidatePairs.forEach(([currentKey, maxKey]) => {
    if (health === undefined && currentKey in source) {
      health = coerceNumber(source[currentKey]);
    }
    if (maxHealth === undefined && maxKey in source) {
      maxHealth = coerceNumber(source[maxKey]);
    }
  });

  if (health === undefined) {
    const nestedCandidate = source.health ?? source.hp ?? source.currentHealth;
    if (isRecord(nestedCandidate)) {
      health =
        coerceNumber(
          nestedCandidate.current ??
          nestedCandidate.value ??
          nestedCandidate.hp ??
          nestedCandidate.health ??
          nestedCandidate.amount,
        ) ?? health;
      maxHealth =
        maxHealth ??
        coerceNumber(
          nestedCandidate.max ??
          nestedCandidate.maximum ??
          nestedCandidate.maxValue ??
          nestedCandidate.total,
        );
    }
  }

  if (maxHealth === undefined) {
    const nestedMax = source.maxHealth ?? source.max_health ?? source.maxHp ?? source.hp_max;
    if (isRecord(nestedMax)) {
      maxHealth =
        coerceNumber(
          nestedMax.value ?? nestedMax.max ?? nestedMax.total ?? nestedMax.maximum ?? nestedMax.amount,
        ) ?? maxHealth;
    }
  }

  return { health, maxHealth };
};

const hasHealthLikeData = (source: Record<string, unknown>): boolean => {
  const primaryKeys = ["health", "currentHealth", "current_health", "hp", "hp_current"];
  if (primaryKeys.some((key) => source[key] !== undefined)) {
    return true;
  }
  const maxKeys = ["maxHealth", "max_health", "maxHp", "hp_max"];
  if (maxKeys.some((key) => source[key] !== undefined)) {
    return true;
  }
  const nested = source.health ?? source.hp ?? source.currentHealth;
  if (isRecord(nested)) {
    const nestedKeys = ["current", "value", "hp", "health", "amount", "now"];
    if (nestedKeys.some((key) => nested[key] !== undefined)) {
      return true;
    }
  }
  return false;
};

const resolveCandidateId = (source: Record<string, unknown>): string | undefined => {
  const idCandidate =
    source.character_id ??
    source.characterId ??
    source.player_id ??
    source.playerId ??
    source.id;
  return idCandidate != null ? String(idCandidate) : undefined;
};

// --- 인터페이스 정의 ---
interface MessageImage {
  id: string;
  dataUrl: string;
  mime: string;
  filename?: string;
  url?: string;
}

interface MessageMeta {
  prompt?: string;
  origin?: string;
  hasImageLater?: boolean;
  mergedPrompt?: boolean;
  [key: string]: unknown;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type?: "system" | "chat" | "dice" | "combat" | "status";
  images?: MessageImage[];
  status?: "image-generating";
  options?: string[];
  meta?: MessageMeta;
}

interface HistoryChunk {
  id: string;
  label: string;
  messages: Message[];
  expanded: boolean;
}

const RECENT_HISTORY_VISIBLE_COUNT = 10;
const HISTORY_CHUNK_SIZE = 80;

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
  const parseNumeric = (value: unknown): number | undefined => coerceNumber(value);
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
  const healthInfo = typeof character === "object" && character !== null
    ? extractHealthValues(character as Record<string, unknown>)
    : { health: undefined, maxHealth: undefined };
  const fallbackHealth = calculateHealthFromStats(stats);
  const computedMaxHealthRaw =
    healthInfo.maxHealth ??
    parseNumeric(character.maxHealth) ??
    parseNumeric(character.max_health);
  const computedHealthRaw =
    healthInfo.health ??
    parseNumeric(character.health) ??
    parseNumeric(character.currentHealth);

  const provisionalMax =
    computedMaxHealthRaw ??
    (computedHealthRaw !== undefined ? computedHealthRaw : undefined) ??
    fallbackHealth;

  const safeMaxHealth = Number.isFinite(provisionalMax) && provisionalMax > 0 ? provisionalMax : fallbackHealth;
  const safeHealthCandidate =
    computedHealthRaw !== undefined ? computedHealthRaw : fallbackHealth;
  const safeHealth =
    Number.isFinite(safeHealthCandidate) && safeHealthCandidate >= 0
      ? Math.min(safeHealthCandidate, safeMaxHealth)
      : fallbackHealth;

  return {
    id: resolvedId,
    name: character.name ?? "이름 없음",
    role: character.class ?? character.role ?? "모험가",
    avatar: resolvePlayerAvatar(character.avatar),
    health: safeHealth,
    maxHealth: safeMaxHealth,
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
  const summaryRequestedRef = useRef(false);

  // --- 상태 관리 ---
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState("시나리오 생성 중...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [activeOptions, setActiveOptionsState] = useState<string[]>([]);
  const [showImagePrompt, setShowImagePrompt] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [historyChunks, setHistoryChunks] = useState<HistoryChunk[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [aiServerOnline, setAiServerOnline] = useState(true);
  const [authState, setAuthState] = useState<"pending" | "authorized" | "unauthorized" | "forbidden">("pending");
  const socketRef = useRef<AiWebSocketClient | null>(null);
  const lastAiMessageRef = useRef<number | null>(null);
  const playerNameRef = useRef<string>("캐릭터");
  const hasExistingHistoryRef = useRef(false);
  const activeCharacterId = players[0]?.id;
  const routeParamGameId = params?.id ? String(params.id) : null;
  const storageKeyId = gameId || routeParamGameId;
  const requestedGamePath = routeParamGameId ? `/game/${routeParamGameId}` : "/game";
  const gmAvatarSrc = useMemo(
    () => resolveStaticUrl(GM_AVATAR_PATH) ?? GM_AVATAR_PATH,
    [],
  );

  const activePlayer = useMemo(() => {
    if (players.length === 0) return null;
    if (selectedPlayerId) {
      const found = players.find((player) => player.id === selectedPlayerId);
      if (found) return found;
    }
    return players[0];
  }, [players, selectedPlayerId]);
  const activePlayerId = selectedPlayerId ?? activePlayer?.id;
  const isPlayerDead = useMemo(() => {
    const health = activePlayer?.health;
    if (typeof health !== "number") return false;
    return health <= 0;
  }, [activePlayer]);

  useEffect(() => {
    summaryRequestedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    const verifyAccess = async () => {
      if (typeof window === "undefined") return;
      if (!routeParamGameId) {
        if (!cancelled) {
          setAuthState("forbidden");
        }
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) {
          setAuthState("unauthorized");
        }
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/games/${routeParamGameId}/access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (cancelled) return;
        if (res.status === 200) {
          setAuthState("authorized");
          return;
        }
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setAuthState("unauthorized");
          return;
        }
        if (res.status === 403 || res.status === 404) {
          setAuthState("forbidden");
          return;
        }
        setAuthState("forbidden");
      } catch (err) {
        if (!cancelled) {
          console.error("[GamePage] 접근 검증 실패:", err);
          setAuthState("forbidden");
        }
      }
    };
    void verifyAccess();
    return () => {
      cancelled = true;
    };
  }, [routeParamGameId]);

  useEffect(() => {
    const fallbackName = players[0]?.name ?? "캐릭터";
    if (selectedPlayerId) {
      const selected = players.find((player) => player.id === selectedPlayerId);
      if (selected?.name) {
        playerNameRef.current = selected.name;
        return;
      }
    }
    playerNameRef.current = fallbackName;
  }, [players, selectedPlayerId]);

  const displayMessages = useMemo(() => {
    if (messages.length <= RECENT_HISTORY_VISIBLE_COUNT) {
      return [...messages].sort((a, b) => a.id - b.id);
    }
    const sorted = [...messages].sort((a, b) => a.id - b.id);
    return sorted.slice(-RECENT_HISTORY_VISIBLE_COUNT);
  }, [messages]);

  const toggleHistoryChunk = useCallback((chunkId: string) => {
    setHistoryChunks((prev) =>
      prev.map((chunk) =>
        chunk.id === chunkId ? { ...chunk, expanded: !chunk.expanded } : chunk
      )
    );
  }, []);

  const renderMessage = useCallback(
    (msg: Message) => {
      const matchingPlayer = players.find((player) => player.name === msg.sender);
      const isPlayer = Boolean(matchingPlayer);
      const bubbleClass = cn(
        "rounded-lg p-3 w-full max-w-xl",
        isPlayer ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      );
      const promptRaw = msg.meta ? (msg.meta as Record<string, unknown>)?.prompt : undefined;
      const promptText =
        typeof promptRaw === "string" && promptRaw.trim().length > 0 ? promptRaw : undefined;
      const baseContent = msg.content ?? "";
      const placeholderText = "이미지 생성 프롬프트를 수신했습니다.";
      const displayContent = (() => {
        if (promptText && showImagePrompt && baseContent === placeholderText) {
          return "";
        }
        if (baseContent && baseContent.trim().length > 0) {
          return baseContent;
        }
        if (!showImagePrompt && promptText) {
          return placeholderText;
        }
        return baseContent;
      })();
      const avatarSrc = isPlayer
        ? matchingPlayer?.avatar ?? resolvePlayerAvatar()
        : gmAvatarSrc;
      const avatarInitial =
        typeof msg.sender === "string" && msg.sender.length > 0
          ? msg.sender[0]
          : matchingPlayer?.name?.[0] ?? "G";

      return (
        <div
          key={`msg-${msg.id}`}
          className={cn(
            "flex items-start gap-3 max-w-[85%]",
            isPlayer ? "ml-auto flex-row-reverse" : "mr-auto"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>{avatarInitial}</AvatarFallback>
          </Avatar>
          <div className={bubbleClass}>
            <p className="text-sm font-medium mb-1">{msg.sender}</p>
            {displayContent && displayContent.trim().length > 0 && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{displayContent}</p>
            )}
            {showImagePrompt && !isPlayer && promptText && (
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                [이미지 프롬프트]
                <br />
                {promptText}
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
                  <div key={image.id} className="overflow-hidden rounded-md border bg-background">
                    <img
                      src={image.dataUrl}
                      alt={image.filename || "생성된 이미지"}
                      className="block h-auto max-w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    },
    [gmAvatarSrc, players, showImagePrompt]
  );

  const persistCharacterSnapshot = useCallback(
    (player: Player, gameKey?: string | null) => {
      const key = gameKey ?? storageKeyId;
      if (!key || typeof window === "undefined") return;
      const snapshot = {
        id: player.id,
        name: player.name,
        class: player.role,
        level: player.level,
        avatar: resolvePlayerAvatar(player.avatar),
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail ?? "";
      const trimmed = typeof detail === "string" ? detail.trim() : "";
      const nextAvatar = trimmed.length > 0 ? trimmed : resolvePlayerAvatar();
      setPlayers((prev) => {
        if (prev.length === 0) return prev;
        const targetId = selectedPlayerId;
        let updatedSnapshot: Player | null = null;
        let changed = false;
        const updated = prev.map((player, index) => {
          const shouldUpdate = targetId ? player.id === targetId : index === 0;
          if (!shouldUpdate) return player;
          if (player.avatar === nextAvatar) return player;
          const enriched = { ...player, avatar: nextAvatar };
          updatedSnapshot = enriched;
          changed = true;
          return enriched;
        });
        if (changed && updatedSnapshot) {
          persistCharacterSnapshot(updatedSnapshot, storageKeyId);
        }
        return changed ? updated : prev;
      });
    };
    window.addEventListener(AVATAR_UPDATED_EVENT, handleAvatarUpdated as EventListener);
    return () =>
      window.removeEventListener(AVATAR_UPDATED_EVENT, handleAvatarUpdated as EventListener);
  }, [persistCharacterSnapshot, selectedPlayerId, storageKeyId]);

  const applyPlayerState = useCallback(
    (player: Player, gameKey?: string | null) => {
      const normalizedPlayer = { ...player, avatar: resolvePlayerAvatar(player.avatar) };
      setPlayers([normalizedPlayer]);
      setSelectedPlayerId((prev) => {
        if (!prev) return normalizedPlayer.id;
        return prev;
      });
      persistCharacterSnapshot(normalizedPlayer, gameKey);
      if (typeof window !== "undefined") {
        const key = gameKey ?? storageKeyId;
        if (key) {
          const deathKey = `deadGame:${key}`;
          if (typeof normalizedPlayer.health === "number" && normalizedPlayer.health <= 0) {
            localStorage.setItem(deathKey, "true");
          } else {
            localStorage.removeItem(deathKey);
          }
        }
      }
    },
    [persistCharacterSnapshot, storageKeyId],
  );

  const persistActiveOptions = useCallback(
    (options: string[], gameKey?: string | null) => {
      const key = gameKey ?? storageKeyId;
      if (!key || typeof window === "undefined") return;
      const storageKey = `activeOptions:${key}`;
      if (options.length > 0) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(options));
        } catch (error) {
          console.warn("옵션 저장 실패:", error);
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    },
    [storageKeyId],
  );

  const updateActiveOptions = useCallback(
    (options: string[], gameKey?: string | null) => {
      setActiveOptionsState(options);
      persistActiveOptions(options, gameKey);
    },
    [persistActiveOptions],
  );

  useEffect(() => {
    if (players.length === 0) return;
    setSelectedPlayerId((prev) => {
      if (prev && players.some((player) => player.id === prev)) {
        return prev;
      }
      return players[0].id;
    });
  }, [players]);

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
        const updatedPlayers = prev.map((player) => {
          const matched = updates.find((candidate) => {
            if (!isRecord(candidate)) return false;
            const candidateId = resolveCandidateId(candidate);
            if (candidateId == null) return false;
            return candidateId === String(player.id);
          });

          let updateSource: Record<string, unknown> | undefined;
          if (matched && isRecord(matched)) {
            updateSource = matched;
          } else if (prev.length === 1) {
            const fallback = updates.find((candidate) => {
              if (!isRecord(candidate)) return false;
              const candidateId = resolveCandidateId(candidate);
              if (candidateId != null && candidateId !== String(player.id)) {
                return false;
              }
              return hasHealthLikeData(candidate);
            });
            if (fallback && isRecord(fallback)) {
              updateSource = fallback;
            }
          }

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

          const updateRecord = isRecord(updateSource) ? updateSource : {};
          const { health: extractedHealth, maxHealth: extractedMax } = extractHealthValues(updateRecord);

          const levelValue = coerceNumber(updateRecord.level) ?? player.level;

          const healthValue =
            extractedHealth ??
            coerceNumber(updateRecord.currentHealth ?? updateRecord.health ?? updateRecord.hp);

          const maxHealthValue =
            extractedMax ??
            coerceNumber(
              updateRecord.maxHealth ??
              updateRecord.max_health ??
              updateRecord.maxHp ??
              updateRecord.hp_max,
            );

          let nextMaxHealth = player.maxHealth;
          if (maxHealthValue !== undefined) {
            nextMaxHealth = maxHealthValue;
          }

          let nextHealth = player.health;
          if (healthValue !== undefined) {
            nextHealth = healthValue;
          }

          if (!Number.isFinite(nextMaxHealth) || nextMaxHealth <= 0) {
            nextMaxHealth = player.maxHealth > 0 ? player.maxHealth : 100;
          }

          if (!Number.isFinite(nextHealth)) {
            nextHealth = player.health;
          }

          if (nextHealth > nextMaxHealth && nextMaxHealth > 0) {
            nextHealth = nextMaxHealth;
          }

          if (nextHealth < 0) {
            nextHealth = 0;
          }

          const healthChanged = nextHealth !== player.health;
          const maxHealthChanged = nextMaxHealth !== player.maxHealth;
          const levelChanged = levelValue !== player.level;

          const incomingAvatar =
            updateSource.avatar !== undefined ? updateSource.avatar : player.avatar;
          const resolvedAvatar = resolvePlayerAvatar(incomingAvatar);
          const avatarChanged = resolvedAvatar !== player.avatar;

          if (
            !statsChanged &&
            !inventoryChanged &&
            !healthChanged &&
            !maxHealthChanged &&
            !levelChanged &&
            !avatarChanged
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
            changes.maxHealth = nextMaxHealth;
          }
          if (updateSource.name !== undefined && updateSource.name !== player.name) {
            changes.name = updateSource.name;
          }
          if (updateSource.class !== undefined && updateSource.class !== player.role) {
            changes.class = updateSource.class;
          }
          if (avatarChanged) {
            changes.avatar = resolvedAvatar;
          }

          const nextPlayer: Player = {
            ...player,
            stats: nextStats,
            inventory: nextInventory,
            health: nextHealth,
            maxHealth: nextMaxHealth,
            level: levelValue,
            avatar: resolvedAvatar,
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
        setSelectedPlayerId((prev) => prev ?? snapshot.id);
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
          setSelectedPlayerId((prev) => prev ?? updatedPlayer.id);
          persistCharacterSnapshot(updatedPlayer);
        }
          await fetchLatestCharacter(gameId);
        } catch (err) {
          console.error("[GamePage] 캐릭터 상태 동기화 실패:", err);
        }
      }
    },
    [persistCharacterSnapshot, gameId, fetchLatestCharacter, updateActiveOptions],
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
    if (authState !== "authorized") return;
    const routeGameId = routeParamGameId;
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
  }, [authState, searchParams, routeParamGameId, applyPlayerState, fetchLatestCharacter]);

  useEffect(() => {
    if (authState !== "authorized") return;
    if (!gameId) {
      hasExistingHistoryRef.current = false;
      setHistoryReady(false);
      return;
    }
    let cancelled = false;

    const loadHistory = async () => {
      console.log("[History] 대화 기록 요청 시작", { gameId, aiServerOnline });
      try {
        setHistoryLoading(true);
        setHistoryReady(false);
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
          hasExistingHistoryRef.current = false;
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
            const characterName =
              (typeof entry?.character_name === "string" && entry.character_name.trim().length > 0
                ? entry.character_name
                : typeof entry?.characterName === "string" && entry.characterName.trim().length > 0
                  ? entry.characterName
                  : typeof entry?.player_name === "string" && entry.player_name.trim().length > 0
                    ? entry.player_name
                    : typeof entry?.playerName === "string" && entry.playerName.trim().length > 0
                      ? entry.playerName
                      : undefined) ?? playerNameRef.current;
            const resolvedSender =
              role === "assistant"
                ? "GM"
                : role === "user"
                  ? characterName ?? playerNameRef.current
                  : typeof entry?.sender === "string" && entry.sender.trim().length > 0
                    ? entry.sender
                    : role;
            const imageUrl = resolveStaticUrl(entry?.image_url);
            return {
              id: seq,
              sender: resolvedSender,
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

        const totalMessages = mapped.length;
        const visibleCount = Math.min(totalMessages, RECENT_HISTORY_VISIBLE_COUNT);
        const cutoffIndex = Math.max(totalMessages - visibleCount, 0);
        const olderMessages = mapped.slice(0, cutoffIndex);
        const chunkList: HistoryChunk[] = [];
        for (let idx = 0; idx < olderMessages.length; idx += HISTORY_CHUNK_SIZE) {
          const chunkMessages = olderMessages.slice(idx, idx + HISTORY_CHUNK_SIZE);
          if (chunkMessages.length === 0) continue;
          const first = chunkMessages[0];
          const last = chunkMessages[chunkMessages.length - 1];
          const label = `${first.timestamp} ~ ${last.timestamp}`;
          chunkList.push({
            id: `chunk-${first.id}-${idx}`,
            label,
            messages: chunkMessages,
            expanded: false,
          });
        }
        setHistoryChunks(chunkList.reverse());
        setMessages(mapped);
        console.log("[History] 대화 기록 불러오기 완료", { count: mapped.length });
        const hasHistory = mapped.length > 0;
        hasExistingHistoryRef.current = hasHistory;
        if (hasHistory && typeof window !== "undefined") {
          const summaryFlagKey =
            storageKeyId != null ? `game:${storageKeyId}:initial-summary-sent` : null;
          if (summaryFlagKey) {
            localStorage.setItem(summaryFlagKey, "true");
          }
        }
        if (typeof window !== "undefined" && gameId) {
          const stored = localStorage.getItem(`activeOptions:${gameId}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              updateActiveOptions(Array.isArray(parsed) ? parsed : [], gameId);
            } catch {
              updateActiveOptions([], gameId);
            }
          } else {
            updateActiveOptions([], gameId);
          }
        } else {
          updateActiveOptions([], gameId);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("대화 기록 불러오기 실패:", error);
          setAiServerOnline(false);
          setMessages([
            {
              id: Date.now(),
              sender: "시스템",
              content: "대화 기록을 불러올 수 없습니다. GM 서버 상태를 확인해주세요.",
              timestamp: buildTimestamp(),
              type: "system",
            },
          ]);
          hasExistingHistoryRef.current = false;
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
          setHistoryReady(true);
          console.log("[History] 로딩 종료");
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [authState, gameId, aiServerOnline, storageKeyId, updateActiveOptions]);

  // AI 세션 시작 + 시나리오 로딩
  useEffect(() => {
    setHistoryChunks((prevChunks) => {
      const sortedMessages = [...messages].sort((a, b) => a.id - b.id);
      const total = sortedMessages.length;
      const visibleCount = Math.min(total, RECENT_HISTORY_VISIBLE_COUNT);
      const cutoff = Math.max(total - visibleCount, 0);
      const olderMessages = sortedMessages.slice(0, cutoff);
      if (olderMessages.length === 0) {
        return [];
      }
      const previousState = new Map(prevChunks.map((chunk) => [chunk.id, chunk.expanded]));
      const chunkList: HistoryChunk[] = [];
      for (let idx = 0; idx < olderMessages.length; idx += HISTORY_CHUNK_SIZE) {
        const chunkMessages = olderMessages.slice(idx, idx + HISTORY_CHUNK_SIZE);
        if (chunkMessages.length === 0) continue;
        const first = chunkMessages[0];
        const last = chunkMessages[chunkMessages.length - 1];
        const id = `chunk-${first.id}-${idx}`;
        const label = `${first.timestamp} ~ ${last.timestamp}`;
        chunkList.push({
          id,
          label,
          messages: chunkMessages,
          expanded: previousState.get(id) ?? false,
        });
      }
      return chunkList.reverse();
    });
  }, [messages]);

  useEffect(() => {
    if (authState !== "authorized") return;
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
        const routeGameId = routeParamGameId;
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
        setGameTitle((prev) => (prev === "시나리오 생성 중..." ? "" : prev));
      }
    };
    startSessionAndFetchScenario();
  }, [authState, searchParams, aiServerOnline, routeParamGameId]);

  // WebSocket 연결 관리
  useEffect(() => {
    if (authState !== "authorized") return;
    if (!sessionId || !gameId || !historyReady) return;
    const client = new AiWebSocketClient({
      gameId,
      sessionId,
      onEvent: (evt) => {
        if (evt.type === "open") {
          if (!summaryRequestedRef.current) {
            const summaryFlagKey =
              storageKeyId != null ? `game:${storageKeyId}:initial-summary-sent` : null;
            const isBrowser = typeof window !== "undefined";
            const alreadySent =
              summaryFlagKey && isBrowser
                ? localStorage.getItem(summaryFlagKey) === "true"
                : false;
            const hasHistory = hasExistingHistoryRef.current;

            if (alreadySent || hasHistory) {
              summaryRequestedRef.current = true;
              if (!alreadySent && hasHistory && summaryFlagKey && isBrowser) {
                localStorage.setItem(summaryFlagKey, "true");
              }
              console.log("[GamePage] 초기 상황 요약 요청을 건너뜁니다.", {
                summaryFlagKey,
                alreadySent,
                hasHistory,
              });
              return;
            }

            const sent = client.sendUserMessage("현재 게임 상황을 한국어로 요약해 주세요.");
            if (sent) {
              summaryRequestedRef.current = true;
              if (summaryFlagKey && isBrowser) {
                localStorage.setItem(summaryFlagKey, "true");
              }
              console.log("[GamePage] 초기 상황 요약 요청 메시지를 전송했습니다.");
            } else {
              console.warn("[GamePage] 초기 상황 요약 요청 전송 실패 - 소켓 연결 상태를 확인하세요.");
            }
          }
          return;
        }

        if (evt.type === "close") {
          summaryRequestedRef.current = false;
          return;
        }

        if (evt.type !== "message") return;
        const m = evt.data;
        if (m.kind === "ai_response") {
          const origin = (m as typeof m & { source?: string }).source ?? "ws:ai_response";
          const payload: AiServerResponse = m.payload || {};
          console.log("[GamePage] GM 응답 수신:", { origin, payload });

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

          const rawPrompt =
            typeof (payload as any).prompt === "string" ? (payload as any).prompt.trim() : "";
          const promptValue = rawPrompt.length > 0 ? rawPrompt : undefined;

          let messageContent = text;
          if (!messageContent || messageContent.trim().length === 0) {
            if (images.length > 0) {
              messageContent = "이미지가 도착했습니다.";
            } else if (promptValue) {
              messageContent = "이미지 생성 프롬프트를 수신했습니다.";
            } else {
              messageContent = "";
            }
          }

          const shouldMergeWithRecent =
            lastAiMessageRef.current !== null &&
            text.length === 0 &&
            promptValue !== undefined;

          if (shouldMergeWithRecent) {
            setMessages((prev) => {
              const idx = prev.findIndex((msg) => msg.id === lastAiMessageRef.current);
              if (idx === -1) return prev;
              const updated = [...prev];
              const target = updated[idx];
              const mergedImages = images.length > 0
                ? (target.images ? [...target.images, ...images] : [...images])
                : target.images;
              updated[idx] = {
                ...target,
                images: mergedImages,
                meta: { ...target.meta, prompt: promptValue, origin },
              };
              return updated;
            });
            if (options.length > 0) {
              updateActiveOptions(options, gameId);
            } else {
              updateActiveOptions([], gameId);
            }
          } else {
            const messageMeta: Record<string, unknown> = {
              origin,
              prompt: promptValue,
              hasImageLater: images.length === 0,
            };

            const newMessage: Message = {
              id: Date.now(),
              sender: "GM",
              content: messageContent,
              timestamp,
              type: "chat",
              meta: messageMeta,
            };

            if (images.length > 0) {
              newMessage.images = images;
            }

            if (options.length > 0) {
              newMessage.options = options;
              updateActiveOptions(options, gameId);
            }

            setMessages((prev) => [...prev, newMessage]);
            lastAiMessageRef.current = newMessage.id;
          }

          if (!shouldMergeWithRecent && options.length === 0) {
            updateActiveOptions([], gameId);
          }

          setIsAwaitingResponse(false);
          return;

        }


        if (m.kind === "chat") {
          console.log("[GamePage] chat 이벤트 수신:", m);
          if (m.role === "assistant") {
            setIsAwaitingResponse(false);
          }
          const msgId = Date.now();
          const incomingPlayerName =
            (typeof (m as any).characterName === "string" && (m as any).characterName.trim().length > 0
              ? (m as any).characterName
              : typeof (m as any).playerName === "string" && (m as any).playerName.trim().length > 0
                ? (m as any).playerName
                : typeof (m as any).sender === "string" && (m as any).sender.trim().length > 0
                  ? (m as any).sender
                  : undefined) ?? playerNameRef.current;
          setMessages((prev) => [
            ...prev,
            {
              id: msgId,
              sender: m.role === "assistant" ? "GM" : incomingPlayerName,
              content: m.content,
              timestamp: buildTimestamp(),
              type: "chat",
            },
          ]);
          if (m.role === "assistant") {
            lastAiMessageRef.current = msgId;
          }
        } else if (m.kind === "image") {
          console.log("[GamePage] image 이벤트 수신:", m);
          setIsAwaitingResponse(false);
          const newImage: MessageImage = {
            id: m.id || `inline-image-${Date.now()}`,
            dataUrl: `data:${m.mime};base64,${m.data}`,
            mime: m.mime,
          };
          setMessages((prev) => {
            if (lastAiMessageRef.current) {
              const idx = prev.findIndex((msg) => msg.id === lastAiMessageRef.current);
              if (idx !== -1) {
                const updated = [...prev];
                const target = updated[idx];
                const mergedImages = target.images ? [...target.images, newImage] : [newImage];
                updated[idx] = {
                  ...target,
                  images: mergedImages,
                  meta: { ...target.meta, hasImageLater: false },
                };
                return updated;
              }
            }
            return [
              ...prev,
              {
                id: Date.now(),
                sender: "GM",
                content: `이미지 생성됨 (${m.mime})`,
                timestamp: buildTimestamp(),
                type: "system",
                images: [newImage],
              },
            ];
          });
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
  }, [
    sessionId,
    gameId,
    historyReady,
    storageKeyId,
    authState,
    updateCharacterFromAiPayload,
    fetchLatestCharacter,
    updateActiveOptions,
  ]);


  // 채팅 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSendDisabled =
    isAwaitingResponse || message.trim().length === 0 || isPlayerDead;

  const sendChatMessage = (content: string) => {
    if (authState !== "authorized") {
      console.warn("[GamePage] 인증되지 않은 상태로 메시지를 전송할 수 없습니다.");
      return;
    }
    if (isPlayerDead) {
      console.warn("[GamePage] 캐릭터 사망 상태에서는 메시지를 전송할 수 없습니다.");
      return;
    }
    if (isAwaitingResponse) {
      console.warn("[GamePage] GM 응답 대기 중이라 메시지를 전송할 수 없습니다.");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    const userTimestamp = buildTimestamp();
    const currentPlayerName = playerNameRef.current || activePlayer?.name || "캐릭터";
    const userMessage: Message = {
      id: Date.now(),
      sender: currentPlayerName,
      content: trimmed,
      timestamp: userTimestamp,
      type: "chat",
    };

    console.log("[GamePage] 캐릭터 메시지 전송:", trimmed);
    setMessages((prev) => {
      const cleaned = prev.map((msg) =>
        msg.options && msg.options.length > 0 ? { ...msg, options: undefined } : msg,
      );
      return [...cleaned, userMessage];
    });
    updateActiveOptions([], gameId);
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
          content: "GM 서버에 연결되어 있지 않습니다.",
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
    if (authState !== "authorized") {
      console.warn("[GamePage] 인증되지 않은 상태에서는 메시지를 보낼 수 없습니다.");
      return;
    }
    if (isPlayerDead) {
      console.warn("[GamePage] 사망 상태에서는 직접 메시지를 보낼 수 없습니다.");
      return;
    }
    if (!content) return;
    sendChatMessage(content);
  };

  const handleOptionClick = (option: string) => {
    if (authState !== "authorized") {
      console.warn("[GamePage] 인증되지 않은 상태에서는 옵션을 선택할 수 없습니다.");
      return;
    }
    if (isPlayerDead) {
      console.warn("[GamePage] 사망 상태에서는 옵션을 선택할 수 없습니다.");
      return;
    }
    if (isAwaitingResponse) {
      console.warn("[GamePage] 응답 대기 중에는 옵션을 선택할 수 없습니다.");
      return;
    }
    console.log("[GamePage] 옵션 선택:", option);
    sendChatMessage(option);
  };

  if (authState === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        접근 권한을 확인하는 중입니다...
      </div>
    );
  }

  if (authState === "unauthorized") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h2 className="text-xl font-semibold">로그인이 필요합니다.</h2>
        <p className="text-sm text-muted-foreground">게임에 참여하려면 먼저 로그인해주세요.</p>
        <Button asChild>
          <Link href={`/login?redirect=${encodeURIComponent(requestedGamePath)}`}>로그인 페이지로 이동</Link>
        </Button>
      </div>
    );
  }

  if (authState === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h2 className="text-xl font-semibold">접근 권한이 없습니다.</h2>
        <p className="text-sm text-muted-foreground">
          요청한 게임에 대한 권한이 없거나 존재하지 않는 게임입니다.
        </p>
        <Button asChild variant="outline">
          <Link href="/recent">내 게임 목록으로 이동</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <aside className="w-60 border-r bg-card p-4">
          <h2 className="text-lg font-semibold mb-4">캐릭터 이름</h2>
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
      <aside className="w-72 border-r bg-card p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">캐릭터 이름</h2>
        <div className="space-y-4">
          {players.map((player) => (
            <Card
              key={player.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                player.id === activePlayerId ? "ring-2 ring-primary" : ""
              )}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlayerId(player.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedPlayerId(player.id);
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
                {player.id === activePlayerId && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <div>
                        {(() => {
                          const current = Number.isFinite(player.health) ? player.health : 0;
                          const max =
                            Number.isFinite(player.maxHealth) && player.maxHealth > 0 ? player.maxHealth : 100;
                          const percent = computePercent(current, max);
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>체력</span>
                                <span>
                                  {Math.round(current)}/{Math.round(max)}
                                </span>
                              </div>
                              <Progress value={percent} className="h-2" />
                            </>
                          );
                        })()}
                      </div>
                      {player.mana != null && (
                        <div>
                          {(() => {
                            const current =
                              typeof player.mana === "number" && Number.isFinite(player.mana) ? player.mana : 0;
                            const max =
                              typeof player.maxMana === "number" &&
                              Number.isFinite(player.maxMana) &&
                              player.maxMana > 0
                                ? player.maxMana
                                : 100;
                            const percent = computePercent(current, max);
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>마나</span>
                                  <span>
                                    {Math.round(current)}/{Math.round(max)}
                                  </span>
                                </div>
                                <Progress value={percent} className="h-2" />
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <p>
                        레벨: <span className="font-semibold">{player.level}</span>
                      </p>
                    </div>

                    {player.stats && Object.keys(player.stats).length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground">능력치</h4>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {Object.entries(player.stats).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                            >
                              <span className="text-muted-foreground">{formatStatLabel(key)}</span>
                              <span className="font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground">인벤토리</h4>
                      {player.inventory && player.inventory.length > 0 ? (
                        <ul className="mt-2 space-y-2 text-xs">
                          {player.inventory.map((item, index) => {
                            if (item && typeof item === "object") {
                              const { name, ...rest } = item as Record<string, any>;
                              const displayName =
                                typeof name === "string" && name.trim().length > 0 ? name : `아이템 ${index + 1}`;
                              const detailEntries = Object.entries(rest).filter(
                                ([, value]) => value !== undefined && value !== null && value !== "",
                              );
                              return (
                                <li key={`${displayName}-${index}`} className="rounded-md border px-3 py-2">
                                  <p className="font-semibold">{displayName}</p>
                                  {detailEntries.length > 0 && (
                                    <ul className="mt-1 space-y-1 text-muted-foreground">
                                      {detailEntries.map(([label, value]) => (
                                        <li key={label} className="flex justify-between gap-2">
                                          <span>{formatStatLabel(label)}</span>
                                          <span className="font-medium">{String(value)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            }
                            return (
                              <li key={`item-${index}`} className="rounded-md border px-3 py-2 font-semibold">
                                {String(item)}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">등록된 아이템이 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}
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
            {historyChunks.map((chunk) => (
              <div key={chunk.id} className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  onClick={() => toggleHistoryChunk(chunk.id)}
                >
                  {chunk.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {chunk.label} ({chunk.messages.length}개 대화)
                </Button>
                {chunk.expanded && (
                  <div className="space-y-4">
                    {chunk.messages.map((msg) => renderMessage(msg))}
                  </div>
                )}
              </div>
            ))}
            {displayMessages.map((msg) => renderMessage(msg))}
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
                    disabled={isAwaitingResponse || isPlayerDead}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {isPlayerDead && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3">
              <p className="font-semibold">사망하였습니다.</p>
              <p className="text-sm text-destructive/80 mt-1">
                캐릭터가 사망해 채팅 입력이 비활성화되었습니다. 아래 버튼을 통해 기록만 확인할 수 있습니다.
              </p>
              {storageKeyId && (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="border-destructive text-destructive">
                    <Link href={`/game/${storageKeyId}/history`}>채팅 기록 보기</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 border-t pt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isPlayerDead
                  ? "캐릭터가 사망하여 메시지를 보낼 수 없습니다."
                  : isAwaitingResponse
                    ? "GM 응답을 기다리는 중입니다..."
                    : "메시지를 입력하세요..."
              }
              className="flex-1 resize-none"
              disabled={isAwaitingResponse || isPlayerDead}
              onKeyDown={(e) => {
                if (isAwaitingResponse || isPlayerDead) return;
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
          <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>이미지 프롬프트</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImagePrompt((prev) => !prev)}
            >
              {showImagePrompt ? "숨기기" : "보기"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
