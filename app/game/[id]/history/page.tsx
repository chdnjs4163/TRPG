// app/game/[id]/history/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AI_SERVER_HTTP_URL, API_BASE_URL } from "@/app/config";

interface HistoryMessage {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  role: string;
  imageUrl?: string;
}

const GM_AVATAR_PATH = "/images/gamemaster.png";
const DEFAULT_PLAYER_AVATAR = "/placeholder-user.jpg";
const FLASK_AI_SERVICE_URL = AI_SERVER_HTTP_URL;

const resolveStaticUrl = (url?: string | null): string | undefined => {
  if (!url || typeof url !== "string" || url.length === 0) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL.replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatTimestamp = (value: string): string => {
  if (Number.isNaN(Date.parse(value))) return value;
  return new Date(value).toLocaleString();
};

export default function GameHistoryPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameId = useMemo(() => (params?.id ? String(params.id) : null), [params]);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${FLASK_AI_SERVICE_URL}/api/history/${gameId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setMessages([]);
            return;
          }
          throw new Error(`기록을 불러오지 못했습니다. (HTTP ${res.status})`);
        }
        const json = await res.json();
        const entries = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.history)
            ? json.history
            : Array.isArray(json?.content)
              ? json.content
              : Array.isArray(json)
                ? json
                : [];
        if (cancelled) return;
        const mapped: HistoryMessage[] = entries
          .sort((a: any, b: any) => (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0))
          .map((entry: any, index: number) => {
            const seq = typeof entry?.sequence_number === "number" ? entry.sequence_number : index;
            const role = typeof entry?.role === "string" ? entry.role : "assistant";
            const sender =
              typeof entry?.sender === "string" && entry.sender.trim().length > 0
                ? entry.sender
                : role === "assistant"
                  ? "GM"
                  : role === "user"
                    ? entry?.character_name ??
                      entry?.characterName ??
                      entry?.player_name ??
                      entry?.playerName ??
                      "플레이어"
                    : role;
            const content =
              typeof entry?.content === "string"
                ? entry.content
                : Array.isArray(entry?.content)
                  ? entry.content.join("\n")
                  : "";
            const timestamp =
              typeof entry?.timestamp === "string" && entry.timestamp.length > 0
                ? entry.timestamp
                : new Date().toISOString();
            const imageUrl = resolveStaticUrl(entry?.image_url);
            return {
              id: seq,
              sender,
              content,
              timestamp,
              role,
              imageUrl,
            };
          });
        setMessages(mapped);
      } catch (err) {
        if (cancelled) return;
        console.error("[HistoryPage] 기록 로딩 실패", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (!gameId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground">
        <p>잘못된 게임 주소입니다.</p>
        <Button className="mt-4" asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">게임 채팅 기록</h1>
          <p className="text-sm text-muted-foreground mt-1">
            게임 ID: {gameId} (읽기 전용)
          </p>
          <p className="text-xs text-muted-foreground">
            캐릭터 사망 이후에는 이 페이지에서 기록만 확인할 수 있습니다.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/game/${gameId}`}>게임으로 돌아가기</Link>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            기록을 불러오는 중입니다...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            저장된 채팅 기록이 없습니다.
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isGm = msg.role === "assistant" || msg.sender === "GM";
              const avatarSrc = isGm ? GM_AVATAR_PATH : DEFAULT_PLAYER_AVATAR;
              const initials =
                typeof msg.sender === "string" && msg.sender.trim().length > 0
                  ? msg.sender.trim().slice(0, 2).toUpperCase()
                  : isGm
                    ? "GM"
                    : "PL";
              return (
                <Card key={`history-${msg.id}`}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={avatarSrc} alt={msg.sender} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold leading-tight">{msg.sender}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content || "..."}</p>
                    {msg.imageUrl && (
                      <div className="rounded-md border bg-muted/40 p-2 text-sm text-muted-foreground">
                        이미지:{" "}
                        <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="underline">
                          {msg.imageUrl}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
