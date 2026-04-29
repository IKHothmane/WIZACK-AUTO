"use client";
import { CalendarCheck, Disc3, Droplet, Lightbulb, ScanLine, ShieldCheck, Wrench, X, Zap } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type ServiceItem = { id: string; label: string; desc: string; icon: ReactNode };

export function AtelierServices() {
  const services = useMemo<ServiceItem[]>(
    () => [
      { id: "mecanique", label: "Service Mécanique", desc: "Réparation & entretien", icon: <Wrench size={18} /> },
      { id: "electricite", label: "Électricité Auto", desc: "Démarrage, charge, faisceau", icon: <Zap size={18} /> },
      { id: "vidange", label: "Vidange", desc: "Huile & filtres", icon: <Droplet size={18} /> },
      { id: "freinage", label: "Freinage", desc: "Changement plaquettes & disques", icon: <Disc3 size={18} /> },
      { id: "diagnostic", label: "Diagnostic", desc: "Valise & contrôle complet", icon: <ScanLine size={18} /> },
      { id: "eclairage", label: "Éclairage", desc: "Feux, ampoules, réglage", icon: <Lightbulb size={18} /> },
    ],
    [],
  );

  const [isRdvOpen, setIsRdvOpen] = useState(false);
  const [rdvService, setRdvService] = useState<string>("Atelier");
  const [rdvName, setRdvName] = useState("");
  const [rdvPhone, setRdvPhone] = useState("");
  const [rdvVehicle, setRdvVehicle] = useState("");
  const [rdvDate, setRdvDate] = useState("");
  const [rdvTime, setRdvTime] = useState("");
  const [rdvMsg, setRdvMsg] = useState("");

  const openRdv = (serviceLabel: string) => {
    setRdvService(serviceLabel);
    setIsRdvOpen(true);
  };

  const buildRdvText = () => {
    const lines = [
      `Demande rendez-vous - ${rdvService}`,
      rdvName ? `Nom: ${rdvName}` : null,
      rdvPhone ? `Téléphone: ${rdvPhone}` : null,
      rdvVehicle ? `Véhicule: ${rdvVehicle}` : null,
      rdvDate ? `Date: ${rdvDate}` : null,
      rdvTime ? `Heure: ${rdvTime}` : null,
      rdvMsg ? `Détails: ${rdvMsg}` : null,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  };

  const copyRdv = async () => {
    const text = buildRdvText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(201,168,76,0.12)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(184,134,11,0.08))",
                  border: "1px solid rgba(201,168,76,0.18)",
                  color: "#C9A84C",
                }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {s.label}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {s.desc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openRdv(s.label)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                color: "#0A0A0A",
                boxShadow: "0 10px 35px rgba(201,168,76,0.25)",
              }}
            >
              <CalendarCheck size={18} />
              Prendre rendez-vous
            </button>
          </div>
        ))}
      </div>

      {isRdvOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            aria-label="Fermer"
            onClick={() => setIsRdvOpen(false)}
          />
          <div
            className="relative w-full sm:w-[560px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(201,168,76,0.16)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.50)",
            }}
          >
            <div className="p-5 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--color-primary)" }}>
                  Rendez-vous
                </p>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {rdvService}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRdvOpen(false)}
                className="transition-colors hover:text-primary"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 gap-3">
              <input
                value={rdvName}
                onChange={(e) => setRdvName(e.target.value)}
                placeholder="Nom"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
              />
              <input
                value={rdvPhone}
                onChange={(e) => setRdvPhone(e.target.value)}
                placeholder="Téléphone (WhatsApp)"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
              />
              <input
                value={rdvVehicle}
                onChange={(e) => setRdvVehicle(e.target.value)}
                placeholder="Véhicule (ex: BMW Série 3 2018)"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={rdvDate}
                  onChange={(e) => setRdvDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
                />
                <input
                  type="time"
                  value={rdvTime}
                  onChange={(e) => setRdvTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
                />
              </div>

              <textarea
                value={rdvMsg}
                onChange={(e) => setRdvMsg(e.target.value)}
                placeholder="Détails (ex: bruit au freinage, date souhaitée...)"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none min-h-[96px]"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={copyRdv}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "rgba(201,168,76,0.10)",
                    border: "1px solid rgba(201,168,76,0.18)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <ShieldCheck size={18} />
                  Copier la demande
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void copyRdv();
                    setIsRdvOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                    color: "#0A0A0A",
                    boxShadow: "0 10px 35px rgba(201,168,76,0.25)",
                  }}
                >
                  <CalendarCheck size={18} />
                  Prendre RDV
                </button>
              </div>

              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Après avoir cliqué “Prendre RDV”, la demande est copiée : collez-la dans WhatsApp / SMS pour nous contacter.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
