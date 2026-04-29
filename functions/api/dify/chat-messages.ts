export interface Env {
  DIFY_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = (env.DIFY_API_KEY || "").trim();
  if (!apiKey) {
    return new Response("Missing DIFY_API_KEY", { status: 500 });
  }

  const upstream = await fetch("https://api.dify.ai/v1/chat-messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: request.headers.get("Accept") || "text/event-stream, application/json",
    },
    body: request.body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
};
