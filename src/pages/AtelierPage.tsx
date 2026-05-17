import { useMemo, useState } from "react";
import { ChevronRight, Clock, MessageCircle } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { type AtelierService as DbAtelierService } from "../lib/supabase";

export function AtelierPage({ services }: { services: DbAtelierService[] }) {
  const visibleServices = useMemo(() => services.filter((s) => s.isVisible).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), [services]);

  const normalizeImg = (src?: string | null) => {
    const s = (src || "").trim();
    if (!s) return "";
    let out = s.replace(/ /g, "%20");
    if (out.startsWith("http://")) out = `https://${out.slice("http://".length)}`;
    if (!/^https?:\/\//i.test(out) && !out.startsWith("/")) out = `/${out}`;
    return out;
  };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("Matinée (08:30 - 12:00)");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      "Demande rendez-vous Atelier",
      name ? `Nom: ${name}` : null,
      phone ? `Téléphone: ${phone}` : null,
      vehicle ? `Véhicule: ${vehicle}` : null,
      date ? `Date: ${date}` : null,
      time ? `Créneau: ${time}` : null,
      msg ? `Détails: ${msg}` : null,
    ].filter(Boolean);
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/212600000000?text=${text}`, "_blank");
  };

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[614px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaVFx4HHt2XSI5Ka7vTpU_7sc06n_w7WxUIN4Fg4wDYoqO_qG59-dzPqjNeJWK--ZhaRN5uzw7ncov7Io6mzLLrQRi-9Gbbqx43M0uJwr-WvhccvBbAJGgUCqHHL9i0h0z_d89d1dEpvSVihMXilSY9VkG9GubVubBGOcv74ko6S7ED5jUPLpC2Vpw8zdQq0VJ0Elm_GmRPwYvozh5aSrTv-tL38HSoxEnsLC1w6AVtxgERUFoDnNffu0j7cUlbX0UDs-iYIGWdhjM" alt="Atelier Hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-[var(--bg)]/50"></div>
        </div>
        <div className="relative z-10 px-4 md:px-20 max-w-[1440px] mx-auto w-full pt-10">
          <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black uppercase mb-4 max-w-3xl font-heading leading-tight" style={{ color: "var(--color-text-primary)" }}>
            L'EXCELLENCE <span style={{ color: "var(--color-primary)" }}>MÉCANIQUE</span>
          </h1>
          <p className="text-base md:text-lg max-w-xl font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Entretien de précision pour véhicules de prestige. Nos experts certifiés redéfinissent les standards du service après-vente automobile.
          </p>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-4 md:px-20 pb-20">
        {/* Services Bento Grid */}
        <section className="mt-20">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-[0.2em] font-bold" style={{ color: "var(--color-primary)" }}>Nos Services</span>
            <h2 className="text-3xl md:text-4xl font-black font-heading mt-2" style={{ color: "var(--color-text-primary)" }}>Atelier de Haute Précision</h2>
          </div>
          
          {visibleServices.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleServices.map((s) => (
                <div key={s.id} className="card-premium p-4 sm:p-6 group flex flex-col h-full min-h-[400px]">
                  <div className="h-48 sm:h-64 overflow-hidden rounded-xl mb-6 bg-black/20 shrink-0">
                    <img
                      src={normalizeImg(s.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBiZO7qura0_TtO3IDAV6-aI0pPl7cvv7UKm70X8WXs4ZzKsD73lUFmmcD6pHnfJtRqNyfyEroYe6p2bDWKcq0ED1oYB983KhIeZJ-2QLzx_S0dE7X7i1HWv3P6Z6njWKnEGEaEUKpMJGoHWEjB5m_5gEgmNyw1g1hqRrDt44nvQU41H5y9u2RQS94A7Erhk0v2HHrF0v372WB2Rqywd7XRl0UZAVWuNADPytWw_OJmE6zZ7gkW5w8EA1jABnqojD_ILc5zC8MBx-Pb")}
                      alt={s.name}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallback === "1") return;
                        img.dataset.fallback = "1";
                        img.src = "/logo-96.jpg";
                      }}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>{s.name}</h3>
                    <p className="text-sm md:text-base flex-1 line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
                    <div className="mt-6 flex items-center justify-between font-bold">
                      {s.price > 0 ? (
                        <span className="text-lg" style={{ color: "var(--color-text-primary)" }}>
                          {s.price} <span className="text-xs opacity-60">MAD</span>
                        </span>
                      ) : (
                        <span />
                      )}
                      <a href="#booking" onClick={() => setMsg(`Demande pour: ${s.name}`)} className="flex items-center gap-2 transition-colors hover:opacity-80" style={{ color: "var(--color-primary)" }}>
                        <span className="text-xs tracking-widest uppercase">EN SAVOIR PLUS</span>
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-premium p-12 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Aucun service atelier.</p>
            </div>
          )}
        </section>

        {/* Booking Section */}
        <section id="booking" className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold" style={{ color: "var(--color-primary)" }}>Prendre RDV</span>
            <h2 className="text-3xl md:text-4xl font-black font-heading mt-2 mb-6" style={{ color: "var(--color-text-primary)" }}>Réservez votre intervention</h2>
            <p className="text-base md:text-lg mb-10" style={{ color: "var(--color-text-secondary)" }}>
              Planifiez votre visite en quelques clics. Notre équipe vous contactera sous 2 heures pour confirmer le créneau et les détails techniques.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--color-item-bg)", color: "var(--color-primary)" }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Horaires d'ouverture</h4>
                  <p className="mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>Lun - Ven: 08:30 - 18:30<br/>Sam: 09:00 - 13:00</p>
                </div>
              </div>
              <a href="https://wa.me/212600000000?text=Bonjour%20Wizack%20Auto,%20je%20souhaite%20prendre%20rendez-vous%20pour%20un%20entretien." target="_blank" rel="noopener noreferrer" className="card-premium inline-flex items-center justify-center gap-3 px-8 py-4 font-bold hover:text-white" style={{ color: "var(--color-primary)" }}>
                <MessageCircle size={20} />
                Prendre rendez-vous par WhatsApp
              </a>
            </div>
          </div>
          
          <div className="card-premium p-8 md:p-12 relative overflow-hidden section-glow">
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Nom Complet</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Jean Dupont" className="input-premium" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Téléphone</label>
                  <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+212 6..." className="input-premium" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Véhicule (Marque & Modèle)</label>
                <input required value={vehicle} onChange={e => setVehicle(e.target.value)} type="text" placeholder="Ex: Audi RS6" className="input-premium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Date Souhaitée</label>
                  <input required value={date} onChange={e => setDate(e.target.value)} type="date" className="input-premium [color-scheme:dark]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Créneau</label>
                  <select value={time} onChange={e => setTime(e.target.value)} className="input-premium appearance-none">
                    <option value="Matinée (08:30 - 12:00)" style={{ background: "var(--bg)", color: "var(--color-text-primary)" }}>Matinée (08:30 - 12:00)</option>
                    <option value="Après-midi (14:00 - 18:30)" style={{ background: "var(--bg)", color: "var(--color-text-primary)" }}>Après-midi (14:00 - 18:30)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Nature du problème / Service</label>
                <textarea required value={msg} onChange={e => setMsg(e.target.value)} placeholder="Décrivez votre besoin..." rows={3} className="input-premium resize-none" />
              </div>
              <button type="submit" className="btn-gold w-full py-4 uppercase tracking-[0.2em] mt-6">
                Confirmer la demande
              </button>
            </form>
          </div>
        </section>

        {/* Workshop Stats */}
        <section className="mt-32 py-16 md:py-20 border-y border-[var(--border)]" style={{ background: "var(--color-item-bg)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black mb-3 font-heading" style={{ color: "var(--color-primary)" }}>15+</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>Années d'Expérience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-3 font-heading" style={{ color: "var(--color-primary)" }}>2500+</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>Véhicules Entretenus</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-3 font-heading" style={{ color: "var(--color-primary)" }}>12</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>Postes de Travail</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-3 font-heading" style={{ color: "var(--color-primary)" }}>100%</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>Satisfaction Client</div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
