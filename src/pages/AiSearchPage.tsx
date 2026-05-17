import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, MessageCircle, Send, Sparkles, ChevronRight, User } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { type Product } from "../lib/supabase";

export function AiSearchPage({ products }: { products: Product[] }) {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Bonjour ! Je suis l'assistant Wizack AI. Comment puis-je vous aider à trouver la pièce idéale ?" },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || loading) return;

    const userMsg = msg.trim();
    setMsg("");
    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      setChat((prev) => [...prev, { role: "ai", text: "Je recherche les meilleures options pour votre demande..." }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10 h-[calc(100vh-160px)]">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C]">
              <Bot size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest">Wizack AI</h1>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Expert Technique Automobile</p>
            </div>
          </div>

          <div className="flex-1 card-premium p-0 flex flex-col overflow-hidden mb-6">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chat.map((c, i) => (
                <div key={i} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[80%] flex gap-4 ${c.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.role === "user" ? "bg-[var(--border)]" : "bg-[#C9A84C] text-[#0A0A0A]"}`}>
                      {c.role === "user" ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${c.role === "user" ? "bg-[var(--color-item-bg)] border border-[var(--border)]" : "bg-[rgba(201,168,76,0.1)] border border-[#C9A84C]/20"}`}>
                      {c.text}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-[rgba(201,168,76,0.1)] border border-[#C9A84C]/20 p-4 rounded-2xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--bg)]/50 backdrop-blur-xl">
              <div className="relative">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Posez votre question technique..."
                  className="input-premium w-full pr-14 py-4"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-[#C9A84C] hover:scale-110 transition-transform">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {["Quels pneus pour BMW Série 3 ?", "Prix kit distribution Golf 7", "Quelle huile pour Mercedes Classe C ?"].map(q => (
              <button key={q} onClick={() => setMsg(q)} className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--color-item-bg)] text-[10px] font-bold uppercase tracking-widest hover:border-[#C9A84C] transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
