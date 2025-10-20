import { AI_SERVER_WS_URL } from "@/app/config";
import { io, Socket } from "socket.io-client";

export type AiSocketEvent =
  | { type: "open" }
  | { type: "close"; code: number; reason: string }
  | { type: "error"; error: Event }
  | { type: "message"; data: AiSocketMessage };

export type AiServerImage = {
  filename?: string;
  data: string;
  mime?: string;
};

export type AiServerOption =
  | string
  | {
      id?: string;
      label?: string;
      value?: string;
      text?: string;
    };

export type AiServerResponse = {
  success?: boolean;
  game_id?: string;
  prompt?: string;
  response?: string;
  message?: string;
  aiResponse?: string;
  images?: AiServerImage[];
  options?: AiServerOption[];
  need_image?: boolean;
  image_info?: { should_generate?: boolean; [key: string]: unknown };
  [key: string]: unknown;
};

export type AiSocketMessage =
  | { kind: "chat"; id?: string; role: "assistant" | "system" | "user"; content: string; timestamp?: string }
  | { kind: "image"; id?: string; mime: string; data: string; alt?: string; timestamp?: string }
  | { kind: "info"; message: string }
  | { kind: "ai_response"; payload: AiServerResponse; source?: string };

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
    this.lastUrl = `${baseUrl}/game/${this.options.gameId}`;
    console.log("[AiWebSocketClient] connecting to:", this.lastUrl);

    // 클라이언트는 네임스페이스 전체 URL로 직접 연결해야 함
    this.socket = io(this.lastUrl, {
      path: "/socket.io", // 서버에서 커스텀 path를 사용한다면 맞춰주세요
      transports: ["websocket"],
      auth: { token: this.options.token },
      query: { sessionId: this.options.sessionId, gameId: this.options.gameId },
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
      console.log("[AiWebSocketClient] game_response 수신:", data);
      const payload: AiServerResponse = (typeof data === "object" && data !== null) ? (data as AiServerResponse) : { message: String(data) };
      this.emit({ type: "message", data: { kind: "ai_response", payload, source: "game_response" } });
    });
    this.socket.on("game_image", (data) => {
      console.log("[AiWebSocketClient] game_image 수신:", data);
      const payload: AiServerResponse =
        typeof data === "object" && data !== null ? (data as AiServerResponse) : { message: String(data) };
      this.emit({ type: "message", data: { kind: "ai_response", payload, source: "game_image" } });
    });
    this.socket.on("message", (data) => {
      const content = typeof data === "string" ? data : JSON.stringify(data);
      this.emit({ type: "message", data: { kind: "info", message: content } });
    });
  }

  getConnectionUrl(): string | null {
    return this.lastUrl;
  }

  sendUserMessage(content: string): boolean {
    if (!this.socket) {
      console.warn("[AiWebSocketClient] 소켓 인스턴스가 없어 메시지를 전송할 수 없습니다.");
      return false;
    }
    if (!this.socket.connected) {
      console.warn("[AiWebSocketClient] 소켓이 아직 연결되지 않았습니다.");
      return false;
    }
    this.socket.emit("message", { message: content });
    return true;
  }

  requestImage(prompt: string): boolean {
    if (!this.socket) return false;
    if (!this.socket.connected) return false;
    this.socket.emit("image", { prompt });
    return true;
  }

  close(): void {
    this.socket?.disconnect();
  }

  private emit(evt: AiSocketEvent) {
    this.options.onEvent?.(evt);
  }
}
