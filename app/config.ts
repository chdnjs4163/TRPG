// Centralized runtime configuration for client/server

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// AI server base URL. Prefer NEXT_PUBLIC for client use; fallback to server-only var for API routes
export const AI_SERVER_HTTP_URL = process.env.NEXT_PUBLIC_AI_SERVER || process.env.AI_SERVER_URL || "http://localhost:5000";
export const AI_SERVER_WS_URL = (process.env.NEXT_PUBLIC_AI_SERVER_WS || "").trim() || AI_SERVER_HTTP_URL.replace(/^http/, "ws");


