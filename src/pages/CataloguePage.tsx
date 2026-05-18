import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Package, Search, Wrench } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { type Category, type Product } from "../lib/supabase";
import { formatPrice } from "../lib/formatters";

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 animate-fade-in-up">
      <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>{label}</p>
      <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

function PageCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="card-premium p-8 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

const TireSelector = ({ 
  dimensions 
}: { 
  dimensions: { widths: string[], heights: string[], diameters: string[] } 
}) => {
  const [season, setSeason] = useState("all");
  
  const widths = dimensions.widths;
  const heights = dimensions.heights;
  const diameters = dimensions.diameters;

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [diameter, setDiameter] = useState("");

  useMemo(() => {
    if (widths.length && !width) setWidth(widths.includes("205") ? "205" : widths[0]);
    if (heights.length && !height) setHeight(heights.includes("55") ? "55" : heights[0]);
    if (diameters.length && !diameter) setDiameter(diameters.includes("16") ? "16" : diameters[0]);
  }, [widths, heights, diameters]);

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="card-premium p-0 overflow-hidden">
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="relative group hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/20 to-transparent blur-3xl rounded-full" />
            <div className="relative">
              <img 
                src="/pneu_taille-removebg-preview.png" 
                alt="Tire Visual" 
                className="relative z-10 w-full max-w-sm mx-auto object-contain transition-transform group-hover:scale-105 duration-700"
              />
              <div className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none">
                <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
                  <defs>
                    <path id="tireCurve" d="M 40,150 A 160,70 0 0,1 360,150" />
                  </defs>
                  <text className="fill-white font-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" style={{ fontSize: "64px", letterSpacing: "1px" }}>
                    <textPath xlinkHref="#tireCurve" startOffset="50%" textAnchor="middle">
                      {width} / {height} R{diameter}
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-[var(--color-text-primary)]">Sélectionnez les pneus</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Largeur</label>
                <select value={width} onChange={(e) => setWidth(e.target.value)} className="input-premium py-3">
                  {widths.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Hauteur</label>
                <select value={height} onChange={(e) => setHeight(e.target.value)} className="input-premium py-3">
                  {heights.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Diamètre</label>
                <select value={diameter} onChange={(e) => setDiameter(e.target.value)} className="input-premium py-3">
                  {diameters.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase">Saison</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "all", label: "Toute saison", icon: "⛅" },
                  { id: "summer", label: "Été", icon: "☀️" },
                  { id: "winter", label: "Hiver", icon: "❄️" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeason(s.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      season === s.id
                      ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] shadow-[0_0_15px_rgba(201,168,76,0.2)]"
                      : "border-[var(--border)] bg-[var(--color-item-bg)] hover:border-[#C9A84C]/50"
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full btn-gold py-4 text-sm tracking-widest uppercase">
              Rechercher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PartRequestForm = ({ subcategory, imageUrl }: { subcategory: string, imageUrl?: string }) => {
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marque || !modele) return;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="card-premium p-6 sm:p-8 animate-fade-in-up overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[rgba(201,168,76,0.05)] rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-8 items-center relative z-10">
        {imageUrl && (
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-4">
            <img src={imageUrl} alt={subcategory} className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)]">
            <Wrench size={14} style={{ color: "#C9A84C" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>Demande Spéciale</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--color-text-primary)]">
            Besoin d'un article en {subcategory} ?
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Si vous ne trouvez pas la pièce exacte pour votre véhicule, envoyez-nous une demande rapide et nos experts vous répondront avec un devis gratuit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full md:w-[400px] grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Marque</label>
            <input 
              type="text" 
              value={marque} 
              onChange={(e) => setMarque(e.target.value)}
              placeholder="ex: BMW" 
              className="input-premium py-2.5 text-sm"
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Modèle</label>
            <input 
              type="text" 
              value={modele} 
              onChange={(e) => setModele(e.target.value)}
              placeholder="ex: Série 3" 
              className="input-premium py-2.5 text-sm"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-[var(--color-text-secondary)] uppercase mb-2">Année / Motorisation</label>
            <input 
              type="text" 
              value={annee} 
              onChange={(e) => setAnnee(e.target.value)}
              placeholder="ex: 2018 - 320d" 
              className="input-premium py-2.5 text-sm"
            />
          </div>
          <button 
            type="submit" 
            className="col-span-2 btn-gold py-3 text-xs tracking-widest uppercase flex items-center justify-center gap-2"
            disabled={sent}
          >
            {sent ? (
              <>✅ Demande Envoyée</>
            ) : (
              <>Envoyer la demande <ChevronRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export function CataloguePage({ 
  products, 
  categories = [],
  dbTireWidths = [], 
  dbTireHeights = [], 
  dbTireDiameters = [] 
}: { 
  products: Product[],
  categories?: Category[],
  dbTireWidths?: string[],
  dbTireHeights?: string[],
  dbTireDiameters?: string[]
}) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qRaw = (params.get("q") || "").trim();
  const q = qRaw.toLowerCase();
  const brand = (params.get("brand") || "").trim();
  const category = (params.get("category") || "").trim();
  const subcategory = (params.get("subcategory") || "").trim();
  const [searchInput, setSearchInput] = useState(() => qRaw);

  const normalizeText = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    setSearchInput(qRaw);
  }, [qRaw]);

  const subNorm = normalizeText(subcategory);
  const catNorm = normalizeText(category);
  const isTireCategory = /\bpneu/.test(catNorm);
  const isTireSubcategory = /\bpneus?\b/.test(subNorm) || /\bpneumatiques?\b/.test(subNorm);
  const isPneusSearch = isTireSubcategory && (!category || isTireCategory);

  const normalizeBrand = (s: string) => {
    const b = normalizeText(s).replace(/[^a-z0-9 ]/g, "");
    if (!b) return "";
    if (b === "renaut") return "renault";
    if (b === "vw") return "volkswagen";
    if (b === "mercedes benz") return "mercedes";
    if (b === "mercedesbenz") return "mercedes";
    return b;
  };

  const tireDimensions = useMemo(() => {
    if (!isPneusSearch) return { widths: [], heights: [], diameters: [] };
    
    const w = new Set<string>();
    const h = new Set<string>();
    const d = new Set<string>();
    
    const tireRegex = /(\d{3})[/\s](\d{2})\s?R?[/\s]?(\d{2})/i;
    
    products.forEach(p => {
      const pSub = normalizeText(p.subcategory || "");
      const pCat = normalizeText(p.category || "");
      const pIsTireSub = /\bpneus?\b/.test(pSub) || /\bpneumatiques?\b/.test(pSub);
      const pIsTireCat = /\bpneu/.test(pCat);
      if (pIsTireSub && pIsTireCat) {
        const match = p.name.match(tireRegex);
        if (match) {
          w.add(match[1]);
          h.add(match[2]);
          d.add(match[3]);
        }
      }
    });
    
    return {
      widths: dbTireWidths.length ? dbTireWidths : Array.from(w).sort(),
      heights: dbTireHeights.length ? dbTireHeights : Array.from(h).sort(),
      diameters: dbTireDiameters.length ? dbTireDiameters : Array.from(d).sort()
    };
  }, [isPneusSearch, products, dbTireWidths, dbTireHeights, dbTireDiameters]);

  const visible = useMemo(() => {
    const bFilter = normalizeBrand(brand);
    return products.filter((p) => {
      if (bFilter) {
        const pb = normalizeBrand(p.brand);
        if (pb !== bFilter && !pb.includes(bFilter) && !bFilter.includes(pb)) return false;
      }
      if (category && p.category !== category) return false;
      if (subcategory && p.subcategory !== subcategory) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.subcategory || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [brand, category, q, subcategory, products]);

  const subcategoryCards = useMemo(() => {
    if (isPneusSearch) return [];
    const bFilter = normalizeBrand(brand);
    const base = products.filter((p) => {
      if (bFilter) {
        const pb = normalizeBrand(p.brand);
        if (pb !== bFilter && !pb.includes(bFilter) && !bFilter.includes(pb)) return false;
      }
      if (category && p.category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.subcategory || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const map = new Map<
      string,
      { name: string; count: number; image?: string; category: string }
    >();

    for (const p of base) {
      const sc = String(p.subcategory || "").trim();
      if (!sc) continue;
      const existing = map.get(sc);
      if (!existing) {
        map.set(sc, { name: sc, count: 1, image: p.image || undefined, category: p.category || "" });
      } else {
        existing.count += 1;
        if (!existing.image && p.image) existing.image = p.image;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [brand, category, isPneusSearch, normalizeBrand, products, q]);

  const brandsList = useMemo(
    () =>
      Array.from(new Set(products.map((p) => String(p.brand || "").trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr", { sensitivity: "base" })
      ),
    [products]
  );
  const categoriesList = useMemo(
    () =>
      products.length
        ? Array.from(new Set(products.map((p) => String(p.category || "").trim()).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b, "fr", { sensitivity: "base" })
          )
        : Array.from(
            new Set((categories || []).filter((c) => c.is_active).map((c) => String(c.name || "").trim()).filter(Boolean))
          ).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    [products, categories]
  );
  const subcategoriesList = useMemo(() => {
    if (!category) return [];
    const list = products
      .filter((p) => p.category === category)
      .map((p) => p.subcategory)
      .filter((v): v is string => typeof v === "string" && Boolean(v?.trim()));
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [products, category]);

  const buildHref = (next: { brand?: string; category?: string; subcategory?: string; q?: string } = {}) => {
    const sp = new URLSearchParams(params);
    const entries: Array<[keyof typeof next, string | undefined]> = [
      ["q", next.q],
      ["brand", next.brand],
      ["category", next.category],
      ["subcategory", next.subcategory],
    ];
    entries.forEach(([k, v]) => {
      if (typeof v !== "string") return;
      const trimmed = v.trim();
      if (!trimmed) sp.delete(k);
      else sp.set(k, trimmed);
    });
    const qs = sp.toString();
    return qs ? `/catalogue?${qs}` : "/catalogue";
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {isPneusSearch ? (
            <div className="space-y-10">
               <SectionTitle label="Catalogue" title="Pneumatiques" subtitle="Recherche spécialisée par dimensions." />
               <TireSelector dimensions={tireDimensions} />
            </div>
          ) : (
            <PageCard title="Catalogue" subtitle="Filtrer et parcourir les pièces disponibles.">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl p-4" style={{ background: "var(--card)" }}>
                  <p className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    Filtres
                  </p>
                  <div className="mt-3 grid gap-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        navigate(buildHref({ q: searchInput }));
                      }}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 flex items-center gap-2"
                      style={{ background: "var(--color-item-bg)" }}
                    >
                      <Search size={16} style={{ color: "var(--color-primary)" }} />
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Rechercher..."
                        className="bg-transparent outline-none text-sm font-bold w-full"
                        style={{ color: "var(--color-text-primary)" }}
                      />
                    </form>
                    <Link
                      to="/catalogue"
                      className="rounded-xl px-4 py-2 text-sm font-bold text-center"
                      style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}
                    >
                      Réinitialiser
                    </Link>

                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        Marques
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {brandsList.map((b) => (
                          <Link
                            key={b}
                            to={buildHref({ brand: b })}
                            className="rounded-full px-3 py-1.5 text-xs font-bold"
                            style={{
                              background: brand === b ? "rgba(201,168,76,0.22)" : "var(--color-item-bg)",
                              border: "1px solid var(--border)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {b}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        Catégories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categoriesList.map((c) => (
                          <Link
                            key={c}
                            to={buildHref({ category: c, subcategory: "" })}
                            className="rounded-full px-3 py-1.5 text-xs font-bold"
                            style={{
                              background: category === c ? "rgba(201,168,76,0.22)" : "var(--color-item-bg)",
                              border: "1px solid var(--border)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {c}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        Sous-catégories
                      </p>
                      {category ? (
                        subcategoriesList.length ? (
                          <div className="flex flex-wrap gap-2">
                            {subcategoriesList.map((sc) => (
                              <Link
                                key={sc}
                                to={buildHref({ subcategory: sc })}
                                className="rounded-full px-3 py-1.5 text-xs font-bold"
                                style={{
                                  background: subcategory === sc ? "rgba(201,168,76,0.22)" : "var(--color-item-bg)",
                                  border: "1px solid var(--border)",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {sc}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            —
                          </div>
                        )
                      ) : (
                        <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          Choisis une catégorie
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  {!subcategory && subcategoryCards.length ? (
                    <div className="card-premium p-6 sm:p-8">
                      <p className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                        {category ? "Sous-catégories" : "Toutes les catégories et services"}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {category ? "Choisis une sous-catégorie pour afficher les produits ou faire une demande." : "Parcourez nos sous-catégories ou utilisez la recherche."}
                      </p>
                      <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                        {subcategoryCards.map((sc) => (
                          <Link
                            key={sc.name}
                            to={buildHref({ category: sc.category, subcategory: sc.name })}
                            className="card-premium p-3 sm:p-5 block group animate-fade-in-up"
                          >
                            <div className="flex flex-col gap-2">
                              <p className="text-[11px] sm:text-sm font-extrabold leading-tight line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                                {sc.name}
                              </p>
                              <p className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-60" style={{ color: "var(--color-text-secondary)" }}>
                                {sc.count} produits
                              </p>
                              <div className="mt-2 aspect-[4/3] rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--color-item-bg)" }}>
                                {sc.image ? (
                                  <img src={sc.image} alt={sc.name} className="w-full h-full object-contain p-3 opacity-90 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold opacity-60" style={{ color: "var(--color-text-secondary)" }}>
                                    —
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                                <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
                                  Voir
                                </span>
                                <ChevronRight size={14} style={{ color: "var(--color-text-secondary)" }} className="transition-transform duration-200 group-hover:translate-x-1" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {subcategory && !isPneusSearch && (
                    <PartRequestForm 
                      subcategory={subcategory} 
                      imageUrl={products.find(p => p.subcategory === subcategory && p.image)?.image} 
                    />
                  )}
                  {subcategoryCards.length === 0 && !subcategory && (
                    <div className="card-premium p-8 text-center">
                      <Package size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-secondary)", opacity: 0.4 }} />
                      <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                        Aucun résultat.
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Change les filtres ou réinitialise la recherche.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PageCard>
          )}
        </div>
      </main>
    </PageShell>
  );
}
