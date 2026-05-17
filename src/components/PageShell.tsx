import { type ReactNode, useState, Suspense, lazy } from "react";
import { Footer } from "./Footer";

const ChatbotWidgetLazy = lazy(async () => {
  const mod = await import("./ChatbotWidget");
  return { default: mod.ChatbotWidget };
});

function ChatbotLauncher() {
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setEnabled(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 z-50"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
          boxShadow: "0 0 24px var(--color-primary-glow), 0 4px 16px rgba(0,0,0,0.25)",
        }}
        aria-label="Ouvrir WIZACK AI"
      >
        <img src="/unnamed%20(1).png" alt="WIZACK AI" className="w-7 h-7 object-contain" />
      </button>
    );
  }

  return (
    <Suspense fallback={null}>
      <ChatbotWidgetLazy initialOpen />
    </Suspense>
  );
}

export function PageShell({ children, noFooter, noPadding }: { children: ReactNode; noFooter?: boolean; noPadding?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className={`flex-1 ${noPadding ? "" : "pt-20"}`}>{children}</div>
      {!noFooter && <Footer />}
      <ChatbotLauncher />
    </div>
  );
}
