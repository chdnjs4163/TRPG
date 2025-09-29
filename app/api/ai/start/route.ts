import { NextRequest } from "next/server";
import { AI_SERVER_HTTP_URL } from "@/app/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { gameId, userId, characterId } = body || {};

    if (!gameId || !userId || !characterId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: gameId, userId, characterId" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const url = `${AI_SERVER_HTTP_URL.replace(/\/$/, "")}/api/session/start`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gameId, userId, characterId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.error || "AI server error", status: res.status }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}


