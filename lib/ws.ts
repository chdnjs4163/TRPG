import { AI_SERVER_WS_URL } from "@/app/config";

export type AiSocketEvent =
  | { type: "open" }
  | { type: "close"; code: number; reason: string }
  | { type: "error"; error: Event }
  | { type: "message"; data: AiSocketMessage };

export type AiSocketMessage =
  | { kind: "chat"; id?: string; role: "assistant" | "system" | "user"; content: string; timestamp?: string }
  | { kind: "image"; id?: string; mime: string; data: string; alt?: string; timestamp?: string }
  | { kind: "info"; message: string };

export interface AiSocketOptions {
  gameId: string;       // ✅ 추가: 네임스페이스에 필요
  sessionId: string;
  token?: string;
  onEvent?: (evt: AiSocketEvent) => void;
}

export class AiWebSocketClient {
  private socket: WebSocket | null = null;
  private options: AiSocketOptions;
  private lastUrl: string | null = null;

  constructor(options: AiSocketOptions) {
    this.options = options;
  }

  connect(): void {
    const baseUrl = (AI_SERVER_WS_URL || "ws://localhost:1024").replace(/\/$/, "");
    const namespace = `/game/${this.options.gameId}`;  // ✅ 네임스페이스 적용
    const url = new URL(baseUrl + namespace);

    // 쿼리 파라미터 추가
    url.searchParams.set("sessionId", this.options.sessionId);
    if (this.options.token) url.searchParams.set("token", this.options.token);

    this.lastUrl = url.toString();
    console.log("[AiWebSocketClient] connecting to:", this.lastUrl);

    this.socket = new WebSocket(this.lastUrl);

    this.socket.onopen = () => {
      this.emit({ type: "message", data: { kind: "info", message: `ws_connected:${this.lastUrl}` } });
      this.emit({ type: "open" });
    };

    this.socket.onclose = (e) => {
      this.emit({ type: "message", data: { kind: "info", message: `ws_closed:${this.lastUrl} code=${e.code}` } });
      this.emit({ type: "close", code: e.code, reason: e.reason });
    };

    this.socket.onerror = (e) => this.emit({ type: "error", error: e });

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as AiSocketMessage;
        this.emit({ type: "message", data });
      } catch {
        this.emit({ type: "message", data: { kind: "info", message: String(e.data) } });
      }
    };
  }

  getConnectionUrl(): string | null {
    return this.lastUrl;
  }

  sendUserMessage(content: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ action: "user_message", content }));
  }

  requestImage(prompt: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ action: "image", prompt }));
  }

  close(): void {
    this.socket?.close();
  }

  private emit(evt: AiSocketEvent) {
    this.options.onEvent?.(evt);
  }
}
