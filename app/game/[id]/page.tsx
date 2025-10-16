// app/game/[id]/page.tsx

"use client";
import React from "react";
import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { Send, Save, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAT_LABELS: Record<string, string> = {
  strength: "힘 (STR)",
  dexterity: "민첩 (DEX)",
  constitution: "체력 (CON)",
  intelligence: "지능 (INT)",
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

// --- 인터페이스 정의 ---
interface MessageImage {
  id: string;
  dataUrl: string;
  mime: string;
  filename?: string;
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
  id: number;
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
const IMAGE_WAIT_TIMEOUT_MS = 90000;

export default function GamePage() {
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const socketRef = useRef<AiWebSocketClient | null>(null);
  const imageWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingImagePromptRef = useRef<string | null>(null);
  const hydratingFromServerRef = useRef(false);
  const conversationReadyRef = useRef(false);
  const messageCount = messages.length;
  const activeCharacterId = players[0]?.id;
  const isDirtyRef = useRef(isDirty);

  const clearImageWait = () => {
    if (imageWaitRef.current) {
      clearTimeout(imageWaitRef.current);
      imageWaitRef.current = null;
    }
    pendingImagePromptRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearImageWait();
    };
  }, []);

  useEffect(() => {
    if (hydratingFromServerRef.current) {
      hydratingFromServerRef.current = false;
      conversationReadyRef.current = true;
      return;
    }
    if (!conversationReadyRef.current) {
      conversationReadyRef.current = true;
      if (messages.length === 0) {
        return;
      }
    }
    setIsDirty(true);
  }, [messages]);

  const buildTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const extractTextFromPayload = (payload: AiServerResponse): string => {
    const candidates = [payload.response, payload.message, payload.aiResponse];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return "";
  };

  const normalizeImagesFromPayload = (payload: AiServerResponse): MessageImage[] => {
    if (!Array.isArray(payload.images)) return [];
    return payload.images
      .map((img, index) => {
        if (!img || typeof img !== "object") return null;
        const { data, mime, filename } = img as { data: string; mime?: string; filename?: string };
        if (typeof data !== "string" || data.trim().length === 0) return null;
        const safeMime = typeof mime === "string" && mime.trim().length > 0 ? mime : "image/png";
        const cleanBase64 = data.replace(/\s+/g, "");
        if (cleanBase64.length === 0) return null;
        console.log(
          "[GamePage] 이미지 데이터 정리:",
          filename || `image-${index}`,
          "원본 길이:",
          data.length,
          "정리 후 길이:",
          cleanBase64.length,
        );
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

  const saveConversation = useCallback(
    async (options?: { useBeacon?: boolean }) => {
      if (!gameId || !activeCharacterId) return false;

      const payload = {
        game_id: gameId,
        character_id: activeCharacterId,
        session_id: sessionId,
        title: gameTitle,
        messages: messages.map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          type: msg.type,
          status: msg.status,
          images: msg.images,
          options: msg.options,
        })),
      };

      if (options?.useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        try {
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          const ok = navigator.sendBeacon(`${API_BASE_URL}/api/conversations`, blob);
          if (ok) {
            setIsDirty(false);
            isDirtyRef.current = false;
          }
          return ok;
        } catch (error) {
          console.error("대화 저장 실패(sendBeacon):", error);
          return false;
        }
      }

      try {
        setIsSaving(true);
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`Failed to save conversation: ${res.status}`);
        }
        setIsDirty(false);
        isDirtyRef.current = false;
        return true;
      } catch (error) {
        console.error("대화 저장 실패:", error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [gameId, activeCharacterId, sessionId, gameTitle, messages]
  );

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const saveConversationRef = useRef(saveConversation);
  useEffect(() => {
    saveConversationRef.current = saveConversation;
  }, [saveConversation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      saveConversationRef.current?.({ useBeacon: true });
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = async () => {
      if (!isDirtyRef.current) return;
      const shouldSave = window.confirm("대화 내용을 저장하고 나가시겠습니까?");
      if (shouldSave) {
        const saver = saveConversationRef.current;
        if (saver) {
          const ok = await saver();
          if (!ok) {
            window.alert("대화 저장에 실패했습니다. 다시 시도해 주세요.");
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 플레이어 설정 전용 useEffect (쿼리 캐릭터 > 로컬 저장 > 서버 캐릭터 순으로 복원)
  useEffect(() => {
    const routeGameId = params?.id ? String(params.id) : null;
    const characterParam = searchParams.get("character");

    const applyCharacter = (character: any) => {
      if (!character) return;
      const newPlayer: Player = {
        id: character.id || Date.now(),
        name: character.name,
        role: character.class,
        avatar: character.avatar || "/placeholder-user.jpg",
        health: 100, maxHealth: 100,
        mana: character.class?.toLowerCase?.().includes("mage") ? 100 : undefined,
        maxMana: character.class?.toLowerCase?.().includes("mage") ? 100 : undefined,
        level: character.level || 1,
        stats: character.stats ? { ...character.stats } : undefined,
        inventory: normalizeInventory(character.inventory),
      };
      setPlayers([newPlayer]);
      setConversationLoaded(false);
      conversationReadyRef.current = false;
      setIsDirty(false);
      isDirtyRef.current = false;
      if (routeGameId && typeof window !== 'undefined') {
        localStorage.setItem(`lastCharacter:${routeGameId}`, JSON.stringify(character));
      }
    };

    // 1) 쿼리로 온 캐릭터가 있으면 그걸 사용
    if (characterParam) {
      try {
        const character = JSON.parse(decodeURIComponent(characterParam));
        applyCharacter(character);
        return;
      } catch (error) {
        console.error("캐릭터 정보 파싱 실패:", error);
      }
    }

    // 2) 로컬 저장된 마지막 캐릭터 사용
    if (routeGameId && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`lastCharacter:${routeGameId}`);
      if (saved) {
        try {
          applyCharacter(JSON.parse(saved));
          return;
        } catch {}
      }
    }

    // 3) 서버에서 해당 게임의 캐릭터 목록을 가져와 첫 캐릭터 사용
    (async () => {
      if (!routeGameId) return;
      try {
        const res = await axios.get(`http://192.168.26.165:1024/api/characters/game/${routeGameId}`);
        const rows = res.data?.data || res.data || [];
        if (Array.isArray(rows) && rows.length > 0) {
          const c = rows[0];
          applyCharacter({
            id: c.character_id,
            name: c.name,
            class: c.class,
            level: c.level ?? 1,
            avatar: c.avatar || "/placeholder-user.jpg",
            stats: c.stats,
            inventory: c.inventory,
          });
        }
      } catch (e) {
        console.warn("캐릭터 자동 복원 실패", e);
      }
    })();
  }, [searchParams, params]);

  useEffect(() => {
    if (!gameId || !activeCharacterId || conversationLoaded) return;
    if (messageCount > 0) {
      setConversationLoaded(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/conversations/game/${gameId}?character_id=${encodeURIComponent(activeCharacterId)}`
        );
        if (!res.ok) {
          if (res.status !== 404) {
            throw new Error(`Failed to load conversation: ${res.status}`);
          }
          setConversationLoaded(true);
          return;
        }
        const data = await res.json();
        if (data && Array.isArray(data?.messages) && data.messages.length > 0) {
          hydratingFromServerRef.current = true;
          setMessages(
            data.messages.map((msg: any, index: number): Message => ({
              id:
                typeof msg.id === "number"
                  ? msg.id
                  : typeof msg.id === "string"
                    ? Number(msg.id) || Date.now() + index
                    : Date.now() + index,
              sender: typeof msg.sender === "string" ? msg.sender : "시스템",
              content: typeof msg.content === "string" ? msg.content : "",
              timestamp: typeof msg.timestamp === "string" ? msg.timestamp : buildTimestamp(),
              type: msg.type === "system" || msg.type === "dice" || msg.type === "combat" ? msg.type : "chat",
              images: Array.isArray(msg.images) ? msg.images : undefined,
              status: typeof msg.status === "string" ? msg.status : undefined,
              options: Array.isArray(msg.options) ? msg.options : undefined,
            }))
          );
          setIsDirty(false);
          isDirtyRef.current = false;
        }
      } catch (error) {
        console.error("대화 기록 불러오기 실패:", error);
      } finally {
        setConversationLoaded(true);
      }
    })();
  }, [gameId, activeCharacterId, conversationLoaded, messageCount]);

  // AI 세션 시작 + 시나리오 로딩
  useEffect(() => {
    const startSessionAndFetchScenario = async () => {
      setIsLoading(true);
      try {
        const templateTitle = searchParams.get("title") || "기본 던전";

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
            // 최신 브라우저: crypto.randomUUID(), 없으면 Date.now() 등으로 대체
            initialSessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `s-${Date.now()}`;
            localStorage.setItem("sessionId", initialSessionId);
            console.log("새 세션 ID 생성:", initialSessionId);
          }
          setSessionId(initialSessionId);
          console.log("[Session] 기존 세션 ID 사용:", initialSessionId);
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
        setSessionId(newSessionId);

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
      } finally {
        setIsLoading(false);
      }
    };
    startSessionAndFetchScenario();
  }, [searchParams]);

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
          const payload: AiServerResponse = m.payload || {};
          console.log("[GamePage] AI 응답 수신:", payload);

          const timestamp = buildTimestamp();
          const text = extractTextFromPayload(payload);
          const images = normalizeImagesFromPayload(payload);
          const options = normalizeOptionsFromPayload(payload);
          const hasOptions = options.length > 0;
          if (hasOptions) {
            console.log("[GamePage] 옵션 정리 결과:", options);
          }

          const incomingPrompt =
            typeof payload.prompt === "string" && payload.prompt.trim().length > 0
              ? payload.prompt.trim()
              : undefined;
          const shouldShowImagePlaceholder =
            payload.need_image === true &&
            !!payload.image_info &&
            typeof payload.image_info === "object" &&
            (payload.image_info as { should_generate?: boolean }).should_generate === true &&
            images.length === 0;

          let promptKey: string | null = incomingPrompt ?? pendingImagePromptRef.current ?? null;
          const pendingBefore = pendingImagePromptRef.current;
          let keepAwaiting = false;

          if (images.length > 0) {
            console.log("[GamePage] 이미지 응답 도착, 대기 해제");
            clearImageWait();
            if (!promptKey && pendingBefore) {
              promptKey = pendingBefore;
            }
            keepAwaiting = false;
          } else if (shouldShowImagePlaceholder) {
            const key = incomingPrompt || `__pending_${Date.now()}`;
            pendingImagePromptRef.current = key;
            promptKey = key;
            keepAwaiting = true;
            if (imageWaitRef.current) {
              clearTimeout(imageWaitRef.current);
            }
            imageWaitRef.current = setTimeout(() => {
              console.warn("[GamePage] 이미지 응답 대기 타임아웃이 발생했습니다.");
              imageWaitRef.current = null;
              pendingImagePromptRef.current = null;
              setIsAwaitingResponse(false);
            }, IMAGE_WAIT_TIMEOUT_MS);
          } else {
            clearImageWait();
            if (!promptKey && pendingBefore) {
              promptKey = pendingBefore;
            }
            keepAwaiting = false;
          }

          setMessages((prev) => {
            const next = [...prev];
            const baseId = Date.now();
            let offset = 0;
            const nextId = () => baseId + offset++;

            const findTargetIndex = () => {
              for (let i = next.length - 1; i >= 0; i--) {
                const candidate = next[i];
                if (candidate.sender !== "시스템") continue;
                if (promptKey) {
                  if (candidate.prompt === promptKey) return i;
                } else {
                  return i;
                }
              }
              return -1;
            };

            const messagePrompt = promptKey ?? incomingPrompt;
            let targetIndex = findTargetIndex();

            if (targetIndex === -1) {
              const initialContent =
                text.length > 0
                  ? text
                  : shouldShowImagePlaceholder
                    ? "이미지 생성 중입니다."
                    : images.length > 0
                      ? "생성된 이미지가 도착했습니다."
                      : "";
              const newMessage: Message = {
                id: nextId(),
                sender: "시스템",
                content: initialContent,
                timestamp,
                type: "chat",
              };
              if (messagePrompt) newMessage.prompt = messagePrompt;
              if (shouldShowImagePlaceholder) newMessage.status = "image-generating";
              if (images.length > 0) {
                newMessage.images = [...images];
                console.log(
                  "[GamePage] 새 메시지에 이미지 추가:",
                  images.map((img) => img.filename || img.id),
                );
              }
              if (hasOptions) newMessage.options = options;
              next.push(newMessage);
              console.log("[GamePage] 새 시스템 메시지 생성:", newMessage);
            } else {
              const original = next[targetIndex];
              const updated: Message = {
                ...original,
                timestamp,
                sender: "시스템",
                type: "chat",
              };
              if (messagePrompt && !updated.prompt) {
                updated.prompt = messagePrompt;
              }
              if (text.length > 0) {
                const existing = (updated.content ?? "").trim();
                updated.content = existing.length > 0 ? `${existing}\n\n${text}` : text;
              } else if (
                (!updated.content || updated.content.trim().length === 0) &&
                shouldShowImagePlaceholder
              ) {
                updated.content = "이미지 생성 중입니다.";
              }

              if (shouldShowImagePlaceholder) {
                updated.status = "image-generating";
              } else if (images.length > 0) {
                delete updated.status;
              }

              if (images.length > 0) {
                const mergedImages = [...(updated.images ?? [])];
                for (const image of images) {
                  mergedImages.push(image);
                  console.log("[GamePage] 이미지 추가:", image.filename || image.id);
                }
                updated.images = mergedImages;
                updated.status = undefined;
                updated.content = updated.content?.replace("이미지 생성 중입니다.", "").trim() || "";
              }

              if (hasOptions) {
                updated.options = options;
              } else if (updated.options) {
                delete updated.options;
              }

              next[targetIndex] = updated;
              console.log("[GamePage] 시스템 메시지 업데이트:", updated);
            }

            return next;
          });

          setActiveOptions(hasOptions ? options : []);
          setIsAwaitingResponse(keepAwaiting);
          return;
        }

        if (m.kind === "chat") {
          if (m.role === "assistant") {
            setIsAwaitingResponse(false);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: m.role === "assistant" ? "시스템" : "플레이어",
              content: m.content,
              timestamp: buildTimestamp(),
              type: m.role === "system" ? "system" : "chat",
            },
          ]);
        } else if (m.kind === "image") {
          setIsAwaitingResponse(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "시스템",
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
    return () => client.close();
  }, [sessionId, gameId, params]);  // ✅ params도 의존성 배열에 추가


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
    clearImageWait();

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

  const handleRequestExit = useCallback(async () => {
    if (isDirty) {
      const shouldSave = window.confirm("대화 내용을 저장하시겠습니까?");
      if (shouldSave) {
        const ok = await saveConversation();
        if (!ok) {
          window.alert("대화 저장에 실패했습니다. 다시 시도해 주세요.");
          return;
        }
      } else {
        setIsDirty(false);
        isDirtyRef.current = false;
      }
    }
    router.back();
  }, [isDirty, saveConversation, router]);

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
        <div className="shrink-0 border-b bg-black/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{gameTitle}</h3>
            {isDirty && (
              <p className="text-xs text-muted-foreground mt-1">저장되지 않은 대화가 있습니다.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving || !isDirty || players.length === 0}
              onClick={async () => {
                const ok = await saveConversation();
                if (!ok) {
                  window.alert("대화 저장에 실패했습니다. 다시 시도해 주세요.");
                }
              }}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              대화 저장
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                void handleRequestExit();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> 나가기
            </Button>
          </div>
        </div>

        {/* 하단 채팅 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {messages.map((msg) => {
              const isSystem = msg.sender === "시스템";
              const bubbleClass = cn(
                "rounded-lg p-3 w-full max-w-xl",
                isSystem ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
              );
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[85%]",
                    isSystem ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        isSystem
                          ? undefined
                          : players.find((p) => p.name === msg.sender)?.avatar
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
