import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Car, Search } from "lucide-react";
import { PageShell } from "../components/PageShell";

export function VehicleSelectorPage() {
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");

  const steps = [
    { label: "Marque", active: !marque },
    { label: "Modèle", active: marque && !modele },
    { label: "Année", active: marque && modele && !annee },
    { label: "Résultats", active: marque && modele && annee },
  ];

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] mb-4">Trouver par véhicule</h1>
            <p className="text-[var(--color-text-secondary)]">Identifiez votre véhicule pour voir uniquement les pièces compatibles.</p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.active ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-[var(--border)] opacity-40"}`}>
                  {s.label}
                </div>
                {i < steps.length - 1 && <ChevronRight size={14} className="opacity-20" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-premium p-8 text-center space-y-6 group hover:-translate-y-2 transition-transform">
              <div className="w-20 h-20 rounded-full bg-[var(--color-item-bg)] border border-[var(--border)] flex items-center justify-center mx-auto group-hover:border-[#C9A84C] transition-colors">
                <Car size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest">Choisir Manuellement</h3>
              <div className="space-y-4">
                <select value={marque} onChange={e => setMarque(e.target.value)} className="input-premium w-full">
                  <option value="">Choisir Marque</option>
                  <option>BMW</option>
                  <option>Audi</option>
                  <option>Mercedes</option>
                  <option>Volkswagen</option>
                </select>
                <select disabled={!marque} value={modele} onChange={e => setModele(e.target.value)} className="input-premium w-full">
                  <option value="">Choisir Modèle</option>
                </select>
                <select disabled={!modele} value={annee} onChange={e => setAnnee(e.target.value)} className="input-premium w-full">
                  <option value="">Choisir Année</option>
                </select>
              </div>
            </div>

            <div className="card-premium p-8 text-center space-y-6 group hover:-translate-y-2 transition-transform border-[#C9A84C]/30 bg-[#C9A84C]/5">
              <div className="w-20 h-20 rounded-full bg-[#C9A84C] text-[#0A0A0A] flex items-center justify-center mx-auto">
                <span className="font-black text-xl">MA</span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest">Par Immatriculation</h3>
              <p className="text-xs font-bold opacity-60">Indiquez votre plaque d'immatriculation pour une compatibilité garantie.</p>
              <div className="flex gap-2">
                <input placeholder="12345" className="input-premium w-full text-center font-black tracking-widest" />
                <div className="w-px h-10 bg-[var(--border)]" />
                <input placeholder="A" className="input-premium w-16 text-center font-black" />
                <div className="w-px h-10 bg-[var(--border)]" />
                <input placeholder="6" className="input-premium w-12 text-center font-black" />
              </div>
              <button className="btn-gold w-full py-4 text-xs tracking-widest uppercase">Valider</button>
            </div>

            <div className="card-premium p-8 text-center space-y-6 group hover:-translate-y-2 transition-transform">
              <div className="w-20 h-20 rounded-full bg-[var(--color-item-bg)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest">Recherche VIN</h3>
              <p className="text-xs font-bold opacity-60">Saisissez le numéro de châssis (17 caractères) présent sur la carte grise.</p>
              <input placeholder="WBA123..." className="input-premium w-full text-center uppercase font-mono tracking-widest" />
              <button className="w-full py-4 rounded-xl border border-[var(--border)] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--color-item-bg)]">Rechercher</button>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
