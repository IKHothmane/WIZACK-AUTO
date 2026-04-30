export interface Env {
  DIFY_API_KEY: string;
}

type PagesContext<E> = { request: Request; env: E };

export const onRequest = async ({ request, env }: PagesContext<Env>) => {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin =
    origin === "https://wizackauto.com" ||
    origin === "https://www.wizackauto.com" ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
      ? origin
      : "";

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowOrigin) corsHeaders["Access-Control-Allow-Origin"] = allowOrigin;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const apiKey = (env.DIFY_API_KEY || "").trim();
  if (!apiKey) {
    return new Response("Missing DIFY_API_KEY (Cloudflare Pages → Environment variables)", { status: 500, headers: corsHeaders });
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        Accept: request.headers.get("Accept") || "text/event-stream, application/json",
      },
      body: request.body,
    });
  } catch (e: any) {
    return new Response(`Upstream fetch failed: ${String(e?.message || e)}`, { status: 502, headers: corsHeaders });
  }

  const headers = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, { status: upstream.status, headers });
};
