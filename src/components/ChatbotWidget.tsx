import { Bot, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestions?: { label: string; href: string }[];
};

type DifyStreamEvent =
  | { event: "message"; answer?: string; conversation_id?: string; message_id?: string }
  | { event: "message_end"; conversation_id?: string; message_id?: string }
  | { event: string; [k: string]: unknown };

const storageUserKey = "wizack-dify-user-chat";
const storageConversationKey = "wizack-dify-conversation-chat";
const storageMessagesKey = "wizack-dify-messages-chat";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const automotiveKeywords = [
  "voiture",
  "auto",
  "moteur",
  "diesel",
  "essence",
  "hybride",
  "frein",
  "freinage",
  "plaquette",
  "disque",
  "etrier",
  "abs",
  "obd",
  "obd2",
  "ecu",
  "capteur",
  "injecteur",
  "turbo",
  "alternateur",
  "batterie",
  "embrayage",
  "boite",
  "boîte",
  "pneu",
  "suspension",
  "direction",
  "vidange",
  "huile",
  "filtre",
  "radiateur",
  "clim",
  "climatisation",
  "fap",
  "catalyseur",
  "courroie",
  "distribution",
  "bougie",
  "diagnostic",
  "panne",
  "bruit",
  "fumee",
  "fumée",
  "voyant",
  "demarrage",
  "démarrage",
  "marque",
  "modele",
  "modèle",
  "annee",
  "année",
  "bmw",
  "audi",
  "mercedes",
  "renault",
  "peugeot",
  "toyota",
  "volkswagen",
  "honda",
].map(normalizeText);

const isLikelyAutomotive = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (automotiveKeywords.some((k) => normalized.includes(k))) return true;

  const tokens = normalized.split(/\s+/).filter((t) => t.length >= 4);
  if (!tokens.length) return false;

  const editDistanceWithin = (a: string, b: string, maxDist: number) => {
    if (a === b) return true;
    const lenA = a.length;
    const lenB = b.length;
    if (Math.abs(lenA - lenB) > maxDist) return false;
    if (lenA === 0 || lenB === 0) return Math.max(lenA, lenB) <= maxDist;

    let prev = new Array(lenB + 1);
    let curr = new Array(lenB + 1);
    for (let j = 0; j <= lenB; j++) prev[j] = j;

    for (let i = 1; i <= lenA; i++) {
      curr[0] = i;
      let rowMin = curr[0];
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lenB; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        const del = prev[j] + 1;
        const ins = curr[j - 1] + 1;
        const sub = prev[j - 1] + cost;
        const v = Math.min(del, ins, sub);
        curr[j] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > maxDist) return false;
      const tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[lenB] <= maxDist;
  };

  for (const token of tokens) {
    const maxDist = token.length >= 9 ? 2 : token.length >= 6 ? 2 : 1;
    for (const keyword of automotiveKeywords) {
      if (keyword.length < 4) continue;
      if (editDistanceWithin(token, keyword, maxDist)) return true;
    }
  }

  return false;
};

const ensureUserId = () => {
  const existing = window.localStorage.getItem(storageUserKey);
  if (existing) return existing;
  const id = `u-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  window.localStorage.setItem(storageUserKey, id);
  return id;
};

const loadMessages = (): ChatMessage[] | null => {
  try {
    const raw = window.localStorage.getItem(storageMessagesKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const cleaned = parsed
      .filter((m) => m && typeof m === "object")
      .map((m) => {
        const msg = m as Partial<ChatMessage>;
        if (!msg.id || (msg.role !== "user" && msg.role !== "assistant")) return null;
        const suggestions = Array.isArray(msg.suggestions)
          ? msg.suggestions
              .filter((s) => s && typeof s === "object")
              .map((s) => ({
                label: String((s as any).label ?? ""),
                href: String((s as any).href ?? ""),
              }))
              .filter((s) => s.label && s.href)
          : undefined;

        return {
          id: String(msg.id),
          role: msg.role,
          content: String(msg.content ?? ""),
          suggestions: suggestions?.length ? suggestions : undefined,
        } satisfies ChatMessage;
      })
      .filter(Boolean) as ChatMessage[];
    return cleaned.length ? cleaned : null;
  } catch {
    return null;
  }
};

const readSse = async (
  response: Response,
  onData: (payload: string) => void,
) => {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming non supporté par le navigateur.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const lines = part.split("\n").map((l) => l.trim());
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        onData(data);
      }
    }
  }
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => window.localStorage.getItem(storageConversationKey) || "");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: "m-0",
        role: "assistant",
        content: "Bonjour ! Je suis WIZACK AI. Pose ta question sur les pièces auto, diagnostic, OBD, mécanique.",
        suggestions: [
          { label: "Catalogue", href: "/catalogue" },
          { label: "Atelier", href: "/atelier" },
        ],
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    const restored = loadMessages();
    if (restored) setMessages(restored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageMessagesKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [isOpen, messages.length]);

  const send = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    const isAutomotive = isLikelyAutomotive(content);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsSending(true);

    const user = ensureUserId();

    try {
      if (!isAutomotive) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: "Je suis spécialisé uniquement en mécanique automobile." } : m)),
        );
        return;
      }

      const query =
        `Tu es WIZACK AI (garage professionnel). Réponds uniquement à la question posée.\n` +
        `Interdit: générer une fiche technique complète (pas de sections type "FICHE TECHNIQUE", "IDENTIFICATION VEHICULE", "HUILES", "PIECES D'ENTRETIEN").\n` +
        `Donne une réponse courte et utile: causes probables, contrôles à faire, actions recommandées.\n` +
        `Si une info manque (marque/modèle/année/motorisation/km/codes défaut), pose 1-3 questions ciblées.\n\n` +
        `Question: ${content}`;
      const res = await fetch("/api/dify/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: { mode: "chat_garage" },
          query,
          response_mode: "streaming",
          user,
          conversation_id: conversationId || "",
          auto_generate_name: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 || res.status === 403) {
          throw new Error("API Key Dify manquante ou invalide (DIFY_API_KEY).");
        }
        throw new Error(`${res.status} ${text.slice(0, 180)}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const text = await res.text();
        throw new Error(`Réponse inattendue: ${text.slice(0, 180)}`);
      }

      let nextText = "";
      await readSse(res, (payload) => {
        let evt: DifyStreamEvent | null = null;
        try {
          evt = JSON.parse(payload) as DifyStreamEvent;
        } catch {
          return;
        }

        if (evt.event === "message") {
          if (typeof evt.conversation_id === "string" && evt.conversation_id) {
            setConversationId(evt.conversation_id);
            window.localStorage.setItem(storageConversationKey, evt.conversation_id);
          }
          if (typeof evt.answer === "string") {
            nextText += evt.answer;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: nextText } : m)),
            );
          }
        }
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                suggestions: [
                  { label: "Catalogue", href: "/catalogue" },
                  { label: "Prendre RDV", href: "/atelier" },
                ],
              }
            : m,
        ),
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Erreur IA: ${String(e?.message || e)}` } : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 z-50 ${isOpen ? "hidden" : ""}`}
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
          boxShadow: "0 0 24px var(--color-primary-glow), 0 4px 16px rgba(0,0,0,0.25)",
        }}
        aria-label="Ouvrir WIZACK AI"
      >
        <Bot size={26} color="#0A0A0A" />
      </button>

      <div
        className={`fixed bottom-0 right-0 w-full h-[70svh] max-h-[100svh] pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6 sm:w-96 sm:h-[70vh] sm:max-h-[calc(100vh-48px)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 pointer-events-none translate-y-10"
        }`}
        style={{
          background: "var(--surface)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(201,168,76,0.08)",
        }}
      >
        <div
          className="p-4 flex justify-between items-center"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(184,134,11,0.08) 100%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
            >
              <Bot size={18} color="#0A0A0A" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
                WIZACK AI
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto flex flex-col gap-3" style={{ background: "var(--bg)" }}>
          {messages.map((m) => {
            const isAssistant = m.role === "assistant";
            return (
              <div
                key={m.id}
                className={`${isAssistant ? "self-start" : "self-end"} max-w-[88%] p-3 rounded-2xl text-sm`}
                style={{
                  background: isAssistant ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.08)",
                  border: isAssistant ? "1px solid rgba(201,168,76,0.15)" : "1px solid rgba(255,255,255,0.12)",
                  color: "var(--color-text-primary)",
                  lineHeight: "1.55",
                  borderTopLeftRadius: isAssistant ? 6 : 16,
                  borderTopRightRadius: isAssistant ? 16 : 6,
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content || (isAssistant && isSending ? "..." : "")}</div>
                {isAssistant && m.suggestions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.suggestions.map((s) => (
                      <Link
                        key={`${m.id}-${s.href}-${s.label}`}
                        to={s.href}
                        className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                        style={{
                          background: "rgba(201,168,76,0.12)",
                          border: "1px solid rgba(201,168,76,0.25)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="p-3 flex gap-2" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
          <input
            type="text"
            aria-label="Message pour WIZACK AI"
            placeholder="Décrivez votre besoin..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isSending}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
              boxShadow: "0 2px 10px rgba(201,168,76,0.3)",
              opacity: isSending ? 0.7 : 1,
            }}
            aria-label="Envoyer"
          >
            <Send size={15} color="#0A0A0A" />
          </button>
        </div>
      </div>
    </>
  );
}
