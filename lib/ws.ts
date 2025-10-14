import { AI_SERVER_WS_URL } from "@/app/config";
import { io, Socket } from "socket.io-client";

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
  private socket: Socket | null = null;
  private options: AiSocketOptions;
  private lastUrl: string | null = null;

  constructor(options: AiSocketOptions) {
    this.options = options;
  }

  connect(): void {
    const baseUrl = (AI_SERVER_WS_URL || "http://192.168.26.165:5001").replace(/\/$/, "");
    const namespace = `/game/${this.options.gameId}`;
    // 실제로 연결할 전체 네임스페이스 URL
    this.lastUrl = `${baseUrl}${namespace}`;
    console.log("[AiWebSocketClient] connecting to:", this.lastUrl);

    // 클라이언트는 네임스페이스 전체 URL로 직접 연결해야 함
    this.socket = io(this.lastUrl, {
      path: "/socket.io", // 서버에서 커스텀 path를 사용한다면 맞춰주세요
      transports: ["websocket"],
      auth: { token: this.options.token },
      query: { sessionId: this.options.sessionId },
    });

    this.socket.on("connect", () => {
      console.log("[AiWebSocketClient] connected:", this.lastUrl);
      this.emit({ type: "message", data: { kind: "info", message: `ws_connected:${this.lastUrl}` } });
      this.emit({ type: "open" });
    });

    this.socket.on("disconnect", (reason: string) => {
      this.emit({ type: "message", data: { kind: "info", message: `ws_closed:${this.lastUrl} reason=${reason}` } });
      this.emit({ type: "close", code: 1000, reason });
    });

    this.socket.on("connect_error", (err) => {
      this.emit({ type: "error", error: err as any });
    });

    // 서버에서 보내는 이벤트 매핑
    this.socket.on("status", (data) => {
      this.emit({ type: "message", data: { kind: "info", message: String(data?.message ?? "status") } });
    });
    this.socket.on("game_response", (data) => {
      const content = typeof data?.response === "string" ? data.response : JSON.stringify(data);
      this.emit({ type: "message", data: { kind: "chat", role: "assistant", content } });
    });
    this.socket.on("message", (data) => {
      const content = typeof data === "string" ? data : JSON.stringify(data);
      this.emit({ type: "message", data: { kind: "info", message: content } });
    });
  }

  getConnectionUrl(): string | null {
    return this.lastUrl;
  }

  sendUserMessage(content: string): void {
    if (!this.socket) return;
    this.socket.emit("message", { message: content });
  }

  requestImage(prompt: string): void {
    if (!this.socket) return;
    this.socket.emit("image", { prompt });
  }

  close(): void {
    this.socket?.disconnect();
  }

  private emit(evt: AiSocketEvent) {
    this.options.onEvent?.(evt);
  }
}
