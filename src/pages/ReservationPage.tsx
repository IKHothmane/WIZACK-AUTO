import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, CalendarCheck } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { type AtelierService as DbAtelierService } from "../lib/supabase";

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 animate-fade-in-up">
      <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>{label}</p>
      <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

export function ReservationPage({ services }: { services: DbAtelierService[] }) {
  const [params] = useSearchParams();
  const serviceId = (params.get("service") || "").trim();
  const [selectedId, setSelectedId] = useState(serviceId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedId(serviceId);
  }, [serviceId]);

  const visible = useMemo(() => services.filter((s) => s.isVisible).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), [services]);
  const selected = useMemo(() => visible.find((s) => s.id === selectedId) || null, [visible, selectedId]);

  const buildText = () => {
    const lines = [
      `Demande rendez-vous - ${selected?.name || "Atelier"}`,
      name.trim() ? `Nom: ${name.trim()}` : null,
      phone.trim() ? `Téléphone: ${phone.trim()}` : null,
      vehicle.trim() ? `Véhicule: ${vehicle.trim()}` : null,
      date ? `Date: ${date}` : null,
      time ? `Heure: ${time}` : null,
      details.trim() ? `Détails: ${details.trim()}` : null,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  };

  const copyRequest = async () => {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <SectionTitle label="Rendez-vous" title="Réservation Atelier" subtitle="Remplis le formulaire puis copie la demande et envoie-la sur WhatsApp / SMS." />

          <div className="card-premium p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="md:col-span-2">
                <div className="w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--color-item-bg)" }}>
                  <img src={(selected?.imageUrl || "/logo-96.jpg").replace(/ /g, "%20")} alt={selected?.name || "Atelier"} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: "var(--color-primary)" }}>
                  Service
                </p>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--color-text-primary)" }}>
                  {selected?.name || "Atelier"}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {selected?.description || "Réservation pour un service atelier."}
                </p>
                {selected && selected.price > 0 ? (
                  <p className="mt-3 text-2xl font-black" style={{ color: "var(--color-primary)" }}>
                    {selected.price} MAD
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Choisir un service
                </label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="input-premium w-full">
                  <option value="">Atelier (général)</option>
                  {visible.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Nom
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Téléphone
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-premium w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Véhicule (marque / modèle)
                </label>
                <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Date
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Heure
                </label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-premium w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Détails
                </label>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="input-premium w-full h-28" placeholder="Ex: bruit au freinage, date souhaitée..." />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void copyRequest()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "rgba(201,168,76,0.10)",
                    border: "1px solid rgba(201,168,76,0.18)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <ShieldCheck size={18} />
                  {copied ? "Copié" : "Copier la demande"}
                </button>
                <Link
                  to="/atelier"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                    color: "#0A0A0A",
                    boxShadow: "0 10px 35px rgba(201,168,76,0.25)",
                  }}
                >
                  <CalendarCheck size={18} />
                  Retour atelier
                </Link>
              </div>

              <p className="md:col-span-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Après “Copier la demande”, colle-la dans WhatsApp / SMS pour nous contacter.
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
