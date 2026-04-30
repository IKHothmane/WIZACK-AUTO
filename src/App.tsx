import { Suspense, lazy, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Hero3D } from "./components/Hero3D";
import { VehicleSelector } from "./components/VehicleSelector";
import { AtelierServices } from "./components/AtelierServices";
import { ShieldCheck, Truck, Headphones, Award, Star, ChevronRight, Package, TrendingUp, Users, User, Settings, ShoppingBag, FileText, Lock, History, Activity, BarChart3, CreditCard, BadgeCheck, Rocket, Wrench, Medal, Search, Plus, LayoutGrid, List, Download, Upload } from "lucide-react";
import { useCartStore, useAdminStore, type AtelierService, type BrandConfig } from "./store";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price_cents: number;
  currency: "MAD";
  stock: number;
  image?: string;
};

const productsStorageKey = "wizack-products";

const ChatbotWidgetLazy = lazy(async () => {
  const mod = await import("./components/ChatbotWidget");
  return { default: mod.ChatbotWidget };
});

const AdminAnalyticsChartsLazy = lazy(async () => {
  const mod = await import("./components/AdminAnalyticsCharts");
  return { default: mod.AdminAnalyticsCharts };
});

const AdminSalesChartLazy = lazy(async () => {
  const mod = await import("./components/AdminSalesChart");
  return { default: mod.AdminSalesChart };
});

const defaultProducts: Product[] = [
  {
    id: "p-plaquettes-bmw-e90",
    slug: "plaquettes-frein-bmw-e90",
    name: "Plaquettes de frein avant BMW Série 3 (E90)",
    brand: "BMW",
    category: "Freinage",
    price_cents: 49000,
    currency: "MAD",
    stock: 12,
  },
  {
    id: "p-filtre-huile-merc",
    slug: "filtre-huile-mercedes-om651",
    name: "Filtre à huile Mercedes OM651",
    brand: "Mercedes",
    category: "Moteur",
    price_cents: 12000,
    currency: "MAD",
    stock: 30,
  },
  {
    id: "p-amortisseur-renault",
    slug: "amortisseur-renault-clio-4",
    name: "Amortisseur avant Renault Clio 4",
    brand: "Renault",
    category: "Suspension",
    price_cents: 65000,
    currency: "MAD",
    stock: 8,
  },
  {
    id: "p-batterie-vw",
    slug: "batterie-vw-60ah",
    name: "Batterie 60Ah Volkswagen",
    brand: "Volkswagen",
    category: "Électricité",
    price_cents: 98000,
    currency: "MAD",
    stock: 6,
  },
];

const makeId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const slugify = (value: string) => {
  const v = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return v || "produit";
};

const loadProducts = (): Product[] => {
  if (typeof window === "undefined") return defaultProducts;
  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    if (!raw) return defaultProducts;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultProducts;
    const items = parsed.filter((p) => p && typeof p === "object") as Product[];
    return items.length ? items : defaultProducts;
  } catch {
    return defaultProducts;
  }
};

const saveProducts = (items: Product[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productsStorageKey, JSON.stringify(items));
};

const formatPrice = (priceCents: number, currency: string) => {
  const value = priceCents / 100;
  const formatted = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
  if (currency === "MAD") return `${formatted} DH`;
  return `${formatted} ${currency}`;
};

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-20 flex-1">{children}</div>
      <Footer />
      <LazyChatbot />
    </div>
  );
}

function LazyChatbot() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const start = () => setEnabled(true);
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <ChatbotWidgetLazy />
    </Suspense>
  );
}

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 animate-fade-in-up">
      <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>{label}</p>
      <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

function HomePage({ products }: { products: Product[] }) {
  const features = [
    { icon: <BadgeCheck size={22} />, title: "Qualité Certifiée", desc: "Pièces d'origine et homologuées" },
    { icon: <Rocket size={22} />, title: "Livraison Rapide", desc: "Expédition sous 24-48h" },
    { icon: <Wrench size={22} />, title: "Support Expert", desc: "Assistance technique dédiée" },
    { icon: <Medal size={22} />, title: "Garantie", desc: "Toutes pièces garanties" },
  ];
  return (
    <PageShell>
      <Hero3D />

      {/* Vehicle Selector */}
      <section className="container mx-auto px-4 py-16 section-glow">
        <SectionTitle label="Identification" title="Trouvez vos pièces" subtitle="Sélectionnez votre véhicule pour voir les pièces compatibles." />
        <VehicleSelector />
      </section>

      {/* Popular Products */}
      <section className="container mx-auto px-4 py-8">
        <SectionTitle label="Nouveautés" title="Produits Populaires" subtitle="Découvrez nos meilleures pièces du moment." />
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((p, i) => (
            <div key={p.id} className="card-premium p-5 flex flex-col group animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-square rounded-2xl mb-5 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.05]" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.05), rgba(0,0,0,0.2))", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Package size={48} style={{ color: "var(--color-text-secondary)", opacity: 0.2 }} />
              </div>
              <div className="flex-1 flex flex-col">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-text-secondary)" }}>{p.brand} • {p.category}</p>
                <h3 className="text-sm font-bold leading-snug mb-3 flex-1" style={{ color: "var(--color-text-primary)" }}>{p.name}</h3>
                <div className="h-px w-full my-3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
                <div className="flex items-end justify-between gap-2 mt-auto">
                  <span className="text-lg font-black" style={{ color: "var(--color-primary)" }}>{formatPrice(p.price_cents, p.currency)}</span>
                  <Link
                    to={`/produit/${p.slug}`}
                    aria-label={`Voir ${p.name}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[#C9A84C] group-hover:text-black"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-primary)" }}
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/catalogue" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--color-text-primary)" }}>
            Voir tout le catalogue <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <SectionTitle label="Pourquoi nous choisir" title="L'excellence automobile" />
        <div className="max-w-5xl mx-auto flex overflow-x-auto pb-4 gap-3 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card-premium p-4 text-center animate-fade-in-up min-w-[140px] flex-shrink-0 sm:min-w-0"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(184,134,11,0.05))", border: "1px solid rgba(201,168,76,0.15)", color: "#C9A84C" }}>
                {f.icon}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-primary)" }}>{f.title}</p>
              <p className="text-[10px] mt-1 opacity-70" style={{ color: "var(--color-text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(184,134,11,0.04) 100%)", border: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
          <h3 className="text-2xl md:text-3xl font-heading font-black mb-3" style={{ color: "var(--color-text-primary)" }}>Besoin d'un service atelier ?</h3>
          <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--color-text-secondary)" }}>Nos techniciens qualifiés prennent en charge votre véhicule pour tous types de réparations.</p>
          <Link to="/atelier" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 30px rgba(201,168,76,0.3)" }}>
            Découvrir l'atelier <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </PageShell>
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

function CataloguePage({ products }: { products: Product[] }) {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim().toLowerCase();
  const brand = (params.get("brand") || "").trim();
  const category = (params.get("category") || "").trim();

  const visible = useMemo(() => {
    return products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (category && p.category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [brand, category, q]);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <PageCard title="Catalogue" subtitle="Filtrer et parcourir les pièces disponibles.">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                  Filtres
                </p>
                <div className="mt-3 grid gap-3">
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
                      {brands.map((b) => (
                        <Link
                          key={b}
                          to={`/catalogue?brand=${encodeURIComponent(b)}`}
                          className="rounded-full px-3 py-1.5 text-xs font-bold"
                          style={{
                            background: brand === b ? "rgba(201,168,76,0.22)" : "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(201,168,76,0.18)",
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
                      {categories.map((c) => (
                        <Link
                          key={c}
                          to={`/catalogue?category=${encodeURIComponent(c)}`}
                          className="rounded-full px-3 py-1.5 text-xs font-bold"
                          style={{
                            background: category === c ? "rgba(201,168,76,0.22)" : "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(201,168,76,0.18)",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {c}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {visible.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                    {visible.map((p, i) => (
                      <Link
                        key={p.id}
                        to={`/produit/${p.slug}`}
                        className="card-premium p-3 sm:p-5 block group animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div>
                            <p className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-60" style={{ color: "var(--color-text-secondary)" }}>
                              {p.brand}
                            </p>
                            <p className="mt-0.5 text-[11px] sm:text-sm font-extrabold leading-tight line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                              {p.name}
                            </p>
                          </div>
                          <span
                            className="text-[8px] sm:text-[10px] font-extrabold rounded-full px-2 py-0.5 w-fit"
                            style={{
                              background: p.stock > 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                              border: `1px solid ${p.stock > 0 ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
                              color: p.stock > 0 ? "rgb(34,197,94)" : "rgb(239,68,68)",
                            }}
                          >
                            {p.stock > 0 ? "En stock" : "Sur commande"}
                          </span>
                        </div>
                        <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                          <span className="text-sm sm:text-base font-black" style={{ color: "var(--color-primary)" }}>
                            {formatPrice(p.price_cents, p.currency)}
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold transition-all duration-200 group-hover:gap-2" style={{ color: "var(--color-text-secondary)" }}>
                            Voir <ChevronRight size={13} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card-premium p-8 text-center">
                    <Package size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-secondary)", opacity: 0.4 }} />
                    <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                      Aucun produit trouvé.
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Change les filtres ou réinitialise la recherche.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function AtelierPage() {
  const { services } = useAdminStore();
  const visibleServices = services.filter(s => s.isVisible);

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <SectionTitle
          label="Nos services"
          title="Atelier Mécanique"
          subtitle="Expertise et précision pour l'entretien de votre véhicule."
        />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {visibleServices.map((s) => (
            <div key={s.id} className="card-premium p-4 sm:p-8 group hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                <Wrench size={20} className="sm:size-[24px]" />
              </div>
              <h3 className="text-xs sm:text-xl font-black mb-1 sm:mb-3 line-clamp-1" style={{ color: "var(--color-text-primary)" }}>{s.name}</h3>
              <p className="text-[10px] sm:text-sm mb-4 sm:mb-6 leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto pt-3 sm:pt-6 border-t border-[var(--border)] gap-2">
                <span className="text-sm sm:text-2xl font-black" style={{ color: "var(--color-primary)" }}>{s.price} <span className="text-[8px] sm:text-xs">MAD</span></span>
                <button className="rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-5 sm:py-2.5 text-[9px] sm:text-xs font-bold transition-all duration-300 hover:scale-[1.05]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>Réserver</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}

function CategoriesPage({ products }: { products: Product[] }) {
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [products]);
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Explorer" title="Catégories" subtitle="Choisis une catégorie pour ouvrir le catalogue filtré." />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {categories.map((c, i) => (
              <Link
                key={c}
                to={`/catalogue?category=${encodeURIComponent(c)}`}
                className="card-premium p-4 sm:p-6 group animate-fade-in-up text-center"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{c}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{catCounts[c] || 0} produit{(catCounts[c] || 0) > 1 ? "s" : ""}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.15)" }}>
                    <ChevronRight size={18} style={{ color: "#C9A84C" }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function MarquesPage({ products }: { products: Product[] }) {
  const { brands: brandsConfig } = useAdminStore();
  const visibleBrands = brandsConfig.filter(b => b.isVisible);
  
  const brandCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.brand] = (m[p.brand] || 0) + 1; });
    return m;
  }, [products]);

  const getBrandLogo = (brandName: string) => {
    const b = brandName.toLowerCase();
    const logos: Record<string, string> = {
      "alfa romeo": "https://upload.wikimedia.org/wikipedia/fr/2/24/Alfa_Romeo.svg",
      "aston martin": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Aston_Martin_Logo.svg",
      "audi": "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
      "bentley": "https://upload.wikimedia.org/wikipedia/en/c/c5/Bentley_logo.svg",
      "bmw": "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
      "bugatti": "https://upload.wikimedia.org/wikipedia/commons/6/60/Bugatti_logo.svg",
      "chevrolet": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png",
      "citroën": "https://upload.wikimedia.org/wikipedia/commons/1/10/Citroen_2021_Logo.svg",
      "citroen": "https://upload.wikimedia.org/wikipedia/commons/1/10/Citroen_2021_Logo.svg",
      "dacia": "https://upload.wikimedia.org/wikipedia/commons/7/77/Dacia_logo_2021.svg",
      "ferrari": "https://upload.wikimedia.org/wikipedia/fr/e/e0/Ferrari_logo.svg",
      "fiat": "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg",
      "ford": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg",
      "honda": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg",
      "hyundai": "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
      "jaguar": "https://upload.wikimedia.org/wikipedia/en/4/49/Jaguar_Cars_logo.svg",
      "jeep": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Jeep_logo.svg",
      "kia": "https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg",
      "land rover": "https://upload.wikimedia.org/wikipedia/en/c/cd/Land_Rover_logo.svg",
      "lexus": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Lexus_logo.svg",
      "maserati": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Maserati_logo.svg",
      "mazda": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Mazda_Logo.svg",
      "mercedes": "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
      "mini": "https://upload.wikimedia.org/wikipedia/commons/f/f6/MINI_logo.svg",
      "mitsubishi": "https://upload.wikimedia.org/wikipedia/commons/b/b7/Mitsubishi-logo.png",
      "nissan": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png",
      "peugeot": "https://upload.wikimedia.org/wikipedia/fr/4/46/Peugeot_2021_logo.svg",
      "porsche": "https://upload.wikimedia.org/wikipedia/fr/b/bd/Porsche_logo.svg",
      "renault": "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Logo.svg",
      "seat": "https://upload.wikimedia.org/wikipedia/commons/f/f7/SEAT_Logo_from_2017.svg",
      "skoda": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Skoda_Auto_logo_%282011%29.svg",
      "subaru": "https://upload.wikimedia.org/wikipedia/commons/9/90/Subaru_Logo.png",
      "suzuki": "https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg",
      "tesla": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg",
      "toyota": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
      "volkswagen": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Volkswagen_Logo_till_1995.svg",
      "vw": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Volkswagen_Logo_till_1995.svg",
      "volvo": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Volvo_logo.svg",
      "brembo": "https://upload.wikimedia.org/wikipedia/commons/4/40/Brembo_logo.svg",
      "bosch": "https://upload.wikimedia.org/wikipedia/commons/1/16/Bosch-Logo.svg",
      "valeo": "https://upload.wikimedia.org/wikipedia/commons/6/66/Valeo_Logo.svg",
      "michelin": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Michelin_logo.svg",
    };
    for (const [key, url] of Object.entries(logos)) {
      if (b.includes(key)) return url;
    }
    return null;
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Nos partenaires" title="Toutes les Marques" subtitle="Choisissez une marque pour découvrir notre catalogue filtré." />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {visibleBrands.map((brand, i) => {
              const b = brand.name;
              const logo = getBrandLogo(b);
              return (
                <Link
                  key={b}
                  to={`/catalogue?brand=${encodeURIComponent(b)}`}
                  className="card-premium p-4 sm:p-6 flex flex-col items-center justify-center text-center group animate-fade-in-up transition-all hover:-translate-y-2"
                  style={{ animationDelay: `${i * 0.05}s`, minHeight: "140px" }}
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 flex items-center justify-center bg-white rounded-full p-2" style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                    {logo ? (
                      <img
                        src={logo}
                        alt={b}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <ShieldCheck size={24} className="sm:size-[32px]" style={{ color: "#C9A84C" }} />
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-extrabold uppercase tracking-wide group-hover:text-[#C9A84C] transition-colors" style={{ color: "var(--color-text-primary)" }}>{b}</p>
                  <p className="text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-medium rounded-full px-2 sm:px-3 py-0.5 sm:py-1" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>
                    {brandCounts[b] || 0} pièce{(brandCounts[b] || 0) > 1 ? "s" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </PageShell>
  );
}



function SearchPage({ products }: { products: Product[] }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const brand = params.get("brand") || "";
  const model = params.get("model") || "";
  const year = params.get("year") || "";
  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const visible = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const bLower = brand.trim().toLowerCase();
    const mLower = model.trim().toLowerCase();

    return products.filter((p) => {
      // Filtrage par texte libre
      if (qLower) {
        const matchQ = `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(qLower);
        if (!matchQ) return false;
      }
      // Filtrage par marque (depuis VehicleSelector)
      if (bLower && p.brand.toLowerCase() !== bLower) {
        return false;
      }
      // Filtrage par modèle (approximatif pour le moment)
      if (mLower && !p.name.toLowerCase().includes(mLower)) {
        // Optionnel: si le nom contient le modèle
      }
      return true;
    });
  }, [products, q, brand, model]);

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <PageCard 
            title={brand ? `Résultats pour ${brand}` : "Recherche"} 
            subtitle={brand ? `Pièces compatibles avec votre véhicule.` : "Résultats basés sur le catalogue local."}
          >
            <form
              className="mt-5 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const next = new URLSearchParams(params);
                const value = searchText.trim();
                if (value) next.set("q", value);
                else next.delete("q");
                navigate(`/search${next.toString() ? `?${next.toString()}` : ""}`);
              }}
            >
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                aria-label="Rechercher une pièce"
                placeholder="Rechercher une pièce (nom, marque, catégorie)..."
                className="input-premium flex-1"
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                  color: "#0A0A0A",
                  boxShadow: "0 6px 24px rgba(201,168,76,0.35)",
                }}
              >
                Rechercher
              </button>
            </form>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((p) => (
                <Link
                  key={p.id}
                  to={`/produit/${p.slug}`}
                  className="rounded-2xl p-5 block transition-all hover:scale-[1.01]"
                  style={{ background: "var(--card)", border: "1px solid rgba(201,168,76,0.12)" }}
                >
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>
                    {p.brand} • {p.category}
                  </p>
                  <p className="mt-1 text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    {p.name}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-black" style={{ color: "var(--color-primary)" }}>
                      {formatPrice(p.price_cents, p.currency)}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
                      Voir
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {visible.length === 0 ? (
              <div
                className="mt-6 rounded-2xl p-5"
                style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Aucun résultat.
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Change le mot-clé ou retire les filtres (marque/modèle).
                </p>
              </div>
            ) : null}
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

const authStorageKey = "wizack-auth-role";

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("123123");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (identifier === "admin" && password === "123123") {
      window.localStorage.setItem(authStorageKey, "ADMIN");
      navigate("/admin");
      return;
    }
    setError("Identifiants invalides.");
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-16 section-glow">
        <div className="max-w-md mx-auto animate-fade-in-up">
          <div className="rounded-3xl p-8 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(184,134,11,0.05))", border: "1px solid rgba(201,168,76,0.15)" }}>
              <Lock size={24} style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="text-2xl font-heading font-black text-center" style={{ color: "var(--color-text-primary)" }}>Connexion</h1>
            <p className="mt-2 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Accédez à votre espace personnel.</p>

            <form className="mt-8 grid gap-4" onSubmit={submit}>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} aria-label="Email ou identifiant" placeholder="Email ou identifiant" className="input-premium" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Mot de passe" placeholder="Mot de passe" type="password" className="input-premium" />
              {error && <div className="text-sm font-semibold rounded-xl px-4 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>{error}</div>}
              <button type="submit" className="rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 24px rgba(201,168,76,0.35)" }}>Se connecter</button>
            </form>
            <p className="mt-5 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>Pas de compte ? <Link to="/register" className="font-bold" style={{ color: "#C9A84C" }}>S'inscrire</Link></p>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function VehicleSelectorPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14 section-glow">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Identification" title="Identification Véhicule" subtitle="Sélectionnez votre marque, modèle et année pour trouver les pièces compatibles." />
          <VehicleSelector />
        </div>
      </main>
    </PageShell>
  );
}

function AiSearchPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <PageCard
            title="Recherche IA"
            subtitle="En React “pur”, le chat IA nécessite une API séparée. Le widget reste disponible pour le design."
          >
            <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Utilise le bouton de chat en bas à droite.
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <PageCard title="Panier" subtitle="Votre panier d'achat.">
            {items.length === 0 ? (
              <div className="card-premium p-8 text-center animate-fade-in-up">
                <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.3 }} />
                <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Votre panier est vide</p>
                <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--color-text-secondary)" }}>Parcourez le catalogue pour découvrir nos pièces et ajouter des produits.</p>
                <div className="mt-6">
                  <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 30px rgba(201,168,76,0.3)" }}>
                    Explorer le catalogue <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="card-premium p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <Package size={24} style={{ color: "var(--color-text-secondary)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{item.name}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: "var(--color-primary)" }}>{formatPrice(item.price_cents, item.currency)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          aria-label={`Quantité pour ${item.name}`}
                          className="w-16 input-premium text-center !p-2"
                        />
                        <button onClick={() => removeItem(item.id)} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-2">Retirer</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card-premium p-6 self-start">
                  <p className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Résumé de la commande</p>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Sous-total</span>
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{formatPrice(getTotalPrice(), "MAD")}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Livraison</span>
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>Calculée à l'étape suivante</span>
                  </div>
                  <div className="h-px w-full my-4" style={{ background: "var(--border)" }} />
                  <div className="flex justify-between mb-6">
                    <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Total</span>
                    <span className="text-lg font-black" style={{ color: "var(--color-primary)" }}>{formatPrice(getTotalPrice(), "MAD")}</span>
                  </div>
                  <Link to="/checkout" className="w-full inline-flex justify-center items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 24px rgba(201,168,76,0.25)" }}>
                    Valider la commande <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else {
      clearCart();
      alert("Commande passée avec succès ! (Simulation)");
      navigate("/profile");
    }
  };

  if (items.length === 0) return <Navigate to="/cart" replace />;

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <PageCard title="Paiement" subtitle="Finalisez votre commande.">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="card-premium p-6 space-y-4">
                  {step === 1 ? (
                    <>
                      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>1. Informations de livraison</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <input required aria-label="Prénom" placeholder="Prénom" className="input-premium" />
                        <input required aria-label="Nom" placeholder="Nom" className="input-premium" />
                      </div>
                      <input required aria-label="Adresse complète" placeholder="Adresse complète" className="input-premium" />
                      <input required aria-label="Ville" placeholder="Ville" className="input-premium" />
                      <input required aria-label="Téléphone" placeholder="Téléphone" type="tel" className="input-premium" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>2. Paiement</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ border: "1px solid var(--color-primary)", background: "rgba(201,168,76,0.05)" }}>
                          <input type="radio" name="payment" defaultChecked className="accent-[#C9A84C]" />
                          <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Paiement à la livraison</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", opacity: 0.5 }}>
                          <input type="radio" name="payment" disabled />
                          <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Carte Bancaire (Bientôt)</span>
                        </label>
                      </div>
                    </>
                  )}
                  <button type="submit" className="w-full mt-4 rounded-xl px-4 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
                    {step === 1 ? "Continuer vers le paiement" : "Confirmer la commande"}
                  </button>
                </form>
              </div>
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function ProfilePage() {
  const role = window.localStorage.getItem(authStorageKey);
  if (!role) return <Navigate to="/login" replace />;

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <PageCard title="Mon Espace" subtitle="Bienvenue dans votre espace client personnel.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              <div className="card-premium p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}><User size={24} /></div>
                <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Mes Informations</h3>
                <p className="text-xs mt-1 mb-4" style={{ color: "var(--color-text-secondary)" }}>Client Wizack</p>
                <button onClick={() => { window.localStorage.removeItem(authStorageKey); window.location.assign("/"); }} className="text-xs font-bold text-red-500">Se déconnecter</button>
              </div>
              <div className="card-premium p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}><ShoppingBag size={24} /></div>
                <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Mes Commandes</h3>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Historique de vos achats et réparations.</p>
                <div className="mt-4 text-xs italic" style={{ color: "var(--color-text-secondary)" }}>Aucune commande récente.</div>
              </div>
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Remplis email et mot de passe.");
      return;
    }
    window.localStorage.setItem("wizack-register-email", email.trim());
    navigate("/login");
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-16 section-glow">
        <div className="max-w-md mx-auto animate-fade-in-up">
          <div className="rounded-3xl p-8 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(184,134,11,0.05))", border: "1px solid rgba(201,168,76,0.15)" }}>
              <Star size={24} style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="text-2xl font-heading font-black text-center" style={{ color: "var(--color-text-primary)" }}>Inscription</h1>
            <p className="mt-2 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>Créez votre compte Wizack Auto.</p>
            <form className="mt-8 grid gap-4" onSubmit={submit}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" placeholder="Email" className="input-premium" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Mot de passe" placeholder="Mot de passe" type="password" className="input-premium" />
              {error && <div className="text-sm font-semibold rounded-xl px-4 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>{error}</div>}
              <button type="submit" className="rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 24px rgba(201,168,76,0.35)" }}>Créer un compte</button>
            </form>
            <p className="mt-5 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>Déjà un compte ? <Link to="/login" className="font-bold" style={{ color: "#C9A84C" }}>Se connecter</Link></p>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <PageCard title="Conditions" subtitle="Conditions d’utilisation (texte à adapter).">
            <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              <p>
                Ce site est une application React (SPA). Les contenus affichés peuvent être des exemples tant qu’une API n’est pas connectée.
              </p>
              <p className="mt-3">Pour une version production, ajoute une API dédiée et une politique de confidentialité complète.</p>
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <PageCard title="Confidentialité" subtitle="Politique de confidentialité (texte à adapter).">
            <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              <p>
                En mode React "pur", aucune donnée n'est envoyée à un serveur par défaut. Les formulaires actuels peuvent stocker des infos localement
                (localStorage).
              </p>
              <p className="mt-3">Lorsque tu ajoutes une API, adapte cette page selon les traitements réels.</p>
            </div>
          </PageCard>
        </div>
      </main>
    </PageShell>
  );
}

function ProductPage({ products }: { products: Product[] }) {
  const { slug } = useParams();
  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const navigate = useNavigate();

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          {product ? (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--color-text-secondary)" }}>
                <Link to="/catalogue" className="hover:text-[#C9A84C] transition-colors">Catalogue</Link>
                <ChevronRight size={12} />
                <span>{product.brand}</span>
                <ChevronRight size={12} />
                <span style={{ color: "var(--color-text-primary)" }}>{product.name}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2 card-premium p-8 flex items-center justify-center min-h-[280px]">
                  <div className="text-center">
                    <Package size={64} className="mx-auto mb-3" style={{ color: "var(--color-text-secondary)", opacity: 0.2 }} />
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Image produit</p>
                  </div>
                </div>
                <div className="md:col-span-3 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#C9A84C" }}>{product.brand} • {product.category}</p>
                    <h1 className="mt-2 text-2xl md:text-3xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{product.name}</h1>
                  </div>
                  <div className="card-premium p-5">
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black" style={{ color: "var(--color-primary)" }}>{formatPrice(product.price_cents, product.currency)}</span>
                      <span className="text-[10px] font-bold rounded-full px-3 py-1 mb-1" style={{ background: product.stock > 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${product.stock > 0 ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`, color: product.stock > 0 ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                        {product.stock > 0 ? `En stock (${product.stock})` : "Sur commande"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>Référence: {product.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/checkout" onClick={(e) => { e.preventDefault(); useCartStore.getState().addItem({ id: product.id, name: product.name, price_cents: product.price_cents, currency: product.currency, quantity: 1, image: product.image }); navigate("/cart"); }} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 30px rgba(201,168,76,0.3)" }}>
                      <ShoppingBag size={16} /> Ajouter au panier
                    </Link>
                    <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
                      Retour catalogue
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PageCard title="Produit introuvable" subtitle="Ce produit n'existe pas dans le catalogue.">
              <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
                Retour catalogue
              </Link>
            </PageCard>
          )}
        </div>
      </main>
    </PageShell>
  );
}

function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = window.localStorage.getItem(authStorageKey);

  if (role !== "ADMIN") return <Navigate to="/login" replace />;

  const nav = [
    { to: "/admin", label: "Dashboard", icon: <Activity size={18} /> },
    { to: "/admin/produits", label: "Produits", icon: <Package size={18} /> },
    { to: "/admin/commandes", label: "Commandes", icon: <ShoppingBag size={18} /> },
    { to: "/admin/atelier", label: "Atelier", icon: <Wrench size={18} /> },
    { to: "/admin/marques", label: "Marques", icon: <Medal size={18} /> },
    { to: "/admin/transactions", label: "Historique", icon: <History size={18} /> },
    { to: "/admin/analytique", label: "Analytique", icon: <BarChart3 size={18} /> },
    { to: "/admin/utilisateurs", label: "Utilisateurs", icon: <Users size={18} /> },
    { to: "/admin/settings", label: "Paramètres", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "rgba(201, 168, 76, 0.15)" }}>
        <div className="w-full max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold text-xl tracking-wider flex items-center gap-3 group">
            <div className="w-10 h-10 flex-shrink-0">
              <img src="/logo.jpg" alt="WIZACK AUTO" className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 block dark:hidden" />
              <img src="/logodark.jpg" alt="WIZACK AUTO" className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 hidden dark:block" />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="text-gold-gradient text-base font-extrabold tracking-[0.12em]">WIZACK AUTO</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>Administration</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "rgb(34,197,94)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Admin connect\u00e9
            </span>
            <Link to="/" className="rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>Retour site</Link>
            <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }} onClick={() => { window.localStorage.removeItem(authStorageKey); navigate("/"); }}>D\u00e9connexion</button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1440px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="rounded-2xl p-2 sm:p-4 sticky top-[80px] self-start" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="hidden lg:block text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-3" style={{ color: "var(--color-primary)" }}>Menu</p>
            <div className="flex lg:grid overflow-x-auto lg:overflow-visible gap-1 no-scrollbar pb-2 lg:pb-0">
              {nav.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} className="rounded-xl px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 sm:gap-3 shrink-0 lg:shrink" style={{ background: active ? "rgba(201,168,76,0.12)" : "transparent", color: active ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                    <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                    <span className="whitespace-nowrap">{item.label}</span>
                    {active && <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#C9A84C" }} />}
                  </Link>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
              <div className="mt-2 h-px w-16" style={{ background: "linear-gradient(90deg, #C9A84C, transparent)" }} />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardPage({ products }: { products: Product[] }) {
  const stats = [
    { icon: <Package size={20} />, label: "Produits en catalogue", value: products.length, to: "/admin/produits", btn: "Gérer produits", primary: true },
    { icon: <ShoppingBag size={20} />, label: "Commandes du mois", value: 124, to: "/admin/commandes", btn: "Voir commandes", primary: false },
    { icon: <CreditCard size={20} />, label: "Revenus (MAD)", value: "84,500", to: "/admin/transactions", btn: "Voir historique", primary: false },
    { icon: <Users size={20} />, label: "Nouveaux clients", value: 38, to: "/admin/utilisateurs", btn: "Voir utilisateurs", primary: false },
  ];

  const salesData = [
    { name: "Jan", ventes: 4000 },
    { name: "Fév", ventes: 3000 },
    { name: "Mar", ventes: 5000 },
    { name: "Avr", ventes: 4500 },
    { name: "Mai", ventes: 6000 },
    { name: "Juin", ventes: 8000 },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
        {stats.map((s, i) => (
          <div key={s.label} className="card-premium p-4 sm:p-6 animate-fade-in-up flex flex-col" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.15)", color: "#C9A84C" }}>
                {s.icon}
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.1em] uppercase leading-tight" style={{ color: "var(--color-text-secondary)" }}>{s.label}</p>
            </div>
            <p className="text-xl sm:text-3xl font-black mb-auto" style={{ color: "var(--color-primary)" }}>{s.value}</p>
            <Link to={s.to} className="mt-4 sm:mt-5 inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 text-[9px] sm:text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={s.primary ? { background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 24px rgba(201,168,76,0.25)" } : { background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
              {s.btn} <ChevronRight size={12} className="sm:size-[14px]" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Aperçu des ventes</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Évolution du chiffre d'affaires (MAD)</p>
            </div>
            <Activity size={20} style={{ color: "#C9A84C" }} />
          </div>
          <Suspense fallback={<div className="h-[300px] w-full" />}>
            <AdminSalesChartLazy salesData={salesData} />
          </Suspense>
        </div>

        <div className="card-premium p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Dernières activités</p>
          </div>
          <div className="flex-1 overflow-auto pr-2 grid gap-4">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-[var(--border)] last:border-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.1)", color: "rgb(34,197,94)" }}>
                  <ShoppingBag size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>Nouvelle commande #CMD-{1000 + i}</p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>Il y a {i * 15 + 5} minutes • 4,500 MAD</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/commandes" className="mt-4 text-center text-xs font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>Voir toutes les activités →</Link>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminProductsPage({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: (next: Product[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchFilter, setSearchFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleFilterEnabled, setVehicleFilterEnabled] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [priceDh, setPriceDh] = useState("");
  const [stock, setStock] = useState("0");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("wizack-selected-vehicle");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { brand?: string; model?: string; year?: string };
      if (typeof parsed.brand === "string" && parsed.brand) setVehicleBrand(parsed.brand);
      if (typeof parsed.model === "string" && parsed.model) setVehicleModel(parsed.model);
      if (typeof parsed.year === "string" && parsed.year) setVehicleYear(parsed.year);
      if (parsed.brand || parsed.model || parsed.year) setVehicleFilterEnabled(true);
    } catch {
      // ignore
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const b = vehicleBrand.trim().toLowerCase();
    const m = vehicleModel.trim().toLowerCase();

    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const brand = p.brand.toLowerCase();
      const category = p.category.toLowerCase();

      if (q) {
        const matches =
          name.includes(q) ||
          brand.includes(q) ||
          category.includes(q);
        if (!matches) return false;
      }

      if (vehicleFilterEnabled) {
        if (b && brand !== b) return false;
        if (m && !name.includes(m)) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchFilter, vehicleBrand, vehicleModel, vehicleFilterEnabled]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setPriceDh((p.price_cents / 100).toString());
    setStock(p.stock.toString());
    setImage(p.image || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setBrand("");
    setCategory("");
    setPriceDh("");
    setStock("0");
    setImage("");
    setError(null);
    setShowForm(false);
  };

  const addOrUpdate = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    const b = brand.trim();
    const c = category.trim();
    const price = Number(priceDh.replace(",", "."));
    const st = Number(stock);
    const imgStr = image.trim();

    if (!n || !b || !c || !Number.isFinite(price) || price <= 0 || !Number.isFinite(st) || st < 0) {
      setError("Remplissez nom, marque, catégorie, prix (>0) et stock (>=0).");
      return;
    }

    const slug = slugify(n);
    if (editingId) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: n,
                brand: b,
                category: c,
                price_cents: Math.round(price * 100),
                stock: Math.round(st),
                image: imgStr || undefined,
              }
            : p
        )
      );
      cancelEdit();
    } else {
      const next: Product = {
        id: makeId(),
        slug: products.some((p) => p.slug === slug) ? `${slug}-${Date.now().toString(36)}` : slug,
        name: n,
        brand: b,
        category: c,
        price_cents: Math.round(price * 100),
        currency: "MAD",
        stock: Math.round(st),
        image: imgStr || undefined,
      };
      setProducts([next, ...products]);
      cancelEdit();
    }
  };

  const remove = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AdminShell title="Gestion des Produits">
      <div className="animate-fade-in-up">
        {!showForm ? (
          <div className="card-premium p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <div className="flex-1 max-w-md w-full relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
                <input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Rechercher (nom, marque, catégorie)..."
                  className="w-full input-premium !pl-12"
                />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setVehicleFilterEnabled((v) => !v)}
                    className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all"
                    style={{
                      background: vehicleFilterEnabled ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {vehicleFilterEnabled ? "Filtre véhicule: ON" : "Filtre véhicule: OFF"}
                  </button>
                </div>
                <div className="flex items-center p-1 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]" : "text-[var(--color-text-secondary)] hover:text-white"}`} title="Vue Table">
                    <List size={18} />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]" : "text-[var(--color-text-secondary)] hover:text-white"}`} title="Vue Grille">
                    <LayoutGrid size={18} />
                  </button>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                    color: "#0A0A0A",
                    boxShadow: "0 8px 24px rgba(201,168,76,0.25)",
                  }}
                >
                  <Plus size={18} /> <span className="hidden sm:inline">Ajouter Produit</span><span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>

            {vehicleFilterEnabled ? (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <input
                  value={vehicleBrand}
                  onChange={(e) => setVehicleBrand(e.target.value)}
                  placeholder="Marque (ex: BMW)"
                  className="input-premium"
                />
                <input
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Modèle (ex: Série 1)"
                  className="input-premium"
                />
                <input
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="Année (optionnel)"
                  className="input-premium"
                />
              </div>
            ) : null}

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="card-premium flex flex-col h-full overflow-hidden group">
                    <div className="h-40 relative flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Package size={48} style={{ color: "var(--color-text-secondary)", opacity: 0.2 }} />
                      )}
                      <div className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                        {p.stock} en stock
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-secondary)" }}>{p.brand} • {p.category}</p>
                      <p className="text-sm font-bold line-clamp-2 flex-1" style={{ color: "var(--color-text-primary)" }}>{p.name}</p>
                      <p className="mt-3 text-lg font-black" style={{ color: "var(--color-primary)" }}>{formatPrice(p.price_cents, p.currency)}</p>
                      
                      <div className="mt-5 grid grid-cols-2 gap-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <button type="button" onClick={() => startEdit(p)} className="rounded-lg py-2 text-xs font-bold transition-all hover:bg-[rgba(201,168,76,0.1)]" style={{ border: "1px solid rgba(201,168,76,0.20)", color: "#C9A84C" }}>Modifier</button>
                        <button type="button" onClick={() => remove(p.id)} className="rounded-lg py-2 text-xs font-bold transition-all hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucun produit ne correspond à votre recherche.
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[var(--border)]" style={{ background: "rgba(255,255,255,0.02)", color: "var(--color-text-secondary)" }}>
                      <th className="px-4 py-3 font-semibold">Produit</th>
                      <th className="px-4 py-3 font-semibold">Catégorie</th>
                      <th className="px-4 py-3 font-semibold">Prix</th>
                      <th className="px-4 py-3 font-semibold">Stock</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package size={18} style={{ color: "var(--color-text-secondary)" }} />}
                            </div>
                            <div>
                              <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>{p.name}</p>
                              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{p.category}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: "var(--color-primary)" }}>{formatPrice(p.price_cents, p.currency)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: p.stock > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.stock > 0 ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                            {p.stock > 0 ? `${p.stock} en stock` : "Rupture"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => startEdit(p)} className="rounded-lg px-2 py-1.5 text-xs font-bold transition-all hover:bg-[rgba(201,168,76,0.1)]" style={{ color: "#C9A84C" }}>Éditer</button>
                            <button type="button" onClick={() => remove(p.id)} className="rounded-lg px-2 py-1.5 text-xs font-bold transition-all hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgb(239,68,68)" }}>Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>Aucun produit ne correspond à votre recherche.</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto card-premium p-8">
            <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}><Package size={20} /></div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>Remplissez les informations ci-dessous.</p>
                </div>
              </div>
              <button type="button" onClick={cancelEdit} className="text-sm font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>Fermer</button>
            </div>
            
            <form className="space-y-5" onSubmit={addOrUpdate}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Nom du produit</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plaquettes de frein avant..." className="input-premium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Marque</label>
                  <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: BMW" className="input-premium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Catégorie</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Freinage" className="input-premium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Prix unitaire (MAD)</label>
                  <input value={priceDh} onChange={(e) => setPriceDh(e.target.value)} placeholder="0.00" type="number" step="0.01" className="input-premium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Stock disponible</label>
                  <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" type="number" className="input-premium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>Image du produit</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--color-primary)]" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
                    <Upload size={20} className="mb-2" style={{ color: "var(--color-text-secondary)" }} />
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Cliquez pour choisir une image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                  {image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
                      <img src={image} alt="Aperçu" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="text-sm font-semibold rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>{error}</div>}
              
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={cancelEdit} className="rounded-xl px-5 py-3 text-sm font-bold transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ color: "var(--color-text-primary)" }}>Annuler</button>
                <button type="submit" className="rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 20px rgba(201,168,76,0.3)" }}>
                  {editingId ? "Sauvegarder" : "Ajouter le produit"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([
    { id: "CMD-1045", client: "Karim B.", date: "29 Avr 2026", amount: 4500, status: "En attente" },
    { id: "CMD-1044", client: "Youssef A.", date: "28 Avr 2026", amount: 1200, status: "En cours" },
  ]);

  const updateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <AdminShell title="Commandes en cours">
      <div className="card-premium p-6 animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border)]" style={{ color: "var(--color-text-secondary)" }}>
                <th className="pb-3 font-semibold">ID Commande</th>
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Montant</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-4 font-mono text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>#{o.id}</td>
                  <td className="py-4" style={{ color: "var(--color-text-primary)" }}>{o.client}</td>
                  <td className="py-4" style={{ color: "var(--color-text-secondary)" }}>{o.date}</td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-primary)" }}>{o.amount.toLocaleString()} MAD</td>
                  <td className="py-4">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="input-premium !py-1 !px-2 text-xs font-bold" style={{ width: "auto" }}>
                      <option value="En attente">En attente</option>
                      <option value="En cours">En cours</option>
                      <option value="Expédiée">Expédiée</option>
                    </select>
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => alert("Génération de la facture PDF en cours...")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[rgba(201,168,76,0.1)]" style={{ color: "#C9A84C" }}>
                      <FileText size={14} /> Facture
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminTransactionsPage() {
  return (
    <AdminShell title="Historique des transactions">
      <div className="card-premium p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Dernières transactions</p>
          <div className="flex gap-2">
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>Tous</button>
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "transparent", color: "var(--color-text-secondary)" }}>Achevés</button>
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "transparent", color: "var(--color-text-secondary)" }}>Remboursés</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border)]" style={{ color: "var(--color-text-secondary)" }}>
                <th className="pb-3 font-semibold">ID Transaction</th>
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Montant</th>
                <th className="pb-3 font-semibold text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-4 font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>#TRX-88{i}4{i}</td>
                  <td className="py-4" style={{ color: "var(--color-text-primary)" }}>Client {i}</td>
                  <td className="py-4" style={{ color: "var(--color-text-secondary)" }}>{i} Mai 2026</td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-primary)" }}>{(i * 1250).toLocaleString()} MAD</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "rgb(34,197,94)" }}>Payé</span>
                      <button onClick={() => alert("Génération de la facture en cours...")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[rgba(255,255,255,0.05)]" style={{ color: "var(--color-text-primary)" }}>
                        <Download size={14} /> Facture
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminAnalyticsPage() {
  const kpiData = [
    { title: "Chiffre d'Affaires", value: "124,500 MAD", trend: "+12.5%", isPositive: true, icon: <TrendingUp size={20} /> },
    { title: "Commandes du mois", value: "342", trend: "+5.2%", isPositive: true, icon: <ShoppingBag size={20} /> },
    { title: "Nouveaux Clients", value: "89", trend: "-2.4%", isPositive: false, icon: <Users size={20} /> },
    { title: "Panier Moyen", value: "3,250 MAD", trend: "+8.1%", isPositive: true, icon: <CreditCard size={20} /> }
  ];

  const salesData = [
    { name: "Lun", val: 4000 },
    { name: "Mar", val: 3000 },
    { name: "Mer", val: 2000 },
    { name: "Jeu", val: 2780 },
    { name: "Ven", val: 1890 },
    { name: "Sam", val: 2390 },
    { name: "Dim", val: 3490 },
  ];

  const catData = [
    { name: "Freinage", val: 40 },
    { name: "Moteur", val: 30 },
    { name: "Suspension", val: 20 },
    { name: "Électricité", val: 10 },
  ];

  return (
    <AdminShell title="Analytique & KPIs">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
        {kpiData.map((kpi, i) => (
          <div key={i} className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                {kpi.icon}
              </div>
              <span className={`text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${kpi.isPositive ? 'bg-[rgba(34,197,94,0.1)] text-green-500' : 'bg-[rgba(239,68,68,0.1)] text-red-500'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[10px] sm:text-sm font-bold mb-0.5 sm:mb-1" style={{ color: "var(--color-text-secondary)" }}>{kpi.title}</p>
            <p className="text-lg sm:text-2xl font-black" style={{ color: "var(--color-primary)" }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card-premium p-6" style={{ minHeight: "320px" }} />
            <div className="card-premium p-6" style={{ minHeight: "320px" }} />
          </div>
        }
      >
        <AdminAnalyticsChartsLazy salesData={salesData} catData={catData} />
      </Suspense>

      <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <p className="text-sm font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>Top Produits de la Semaine</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.03)]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: i === 1 ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)", color: i === 1 ? "#C9A84C" : "var(--color-text-secondary)" }}>{i}</div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Produit Modèle {i}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{(120 / i).toFixed(0)} ventes</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function AdminAtelierPage() {
  const { services, addService, updateService, removeService } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AtelierService | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      price: parseInt(fd.get("price") as string),
      description: fd.get("description") as string,
      isVisible: true,
    };

    if (editing) {
      updateService(editing.id, data);
    } else {
      addService({ id: Date.now().toString(), ...data });
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <AdminShell title="Gestion Atelier">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>Gérez les services et tarifs de votre atelier mécanique.</p>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
          <Plus size={18} /> Ajouter Service
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-6 mb-8 animate-fade-in-up border-[#C9A84C]">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>{editing ? "Modifier" : "Ajouter"} un Service</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Nom du service</label>
              <input name="name" defaultValue={editing?.name} required className="input-premium w-full" placeholder="Ex: Vidange Premium" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Prix (MAD)</label>
              <input name="price" type="number" defaultValue={editing?.price} required className="input-premium w-full" placeholder="650" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Description</label>
              <textarea name="description" defaultValue={editing?.description} required className="input-premium w-full h-24" placeholder="Détails du service..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>Annuler</button>
              <button type="submit" className="rounded-xl px-8 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>{editing ? "Mettre à jour" : "Enregistrer"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {services.map((s) => (
          <div key={s.id} className="card-premium p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-[rgba(201,168,76,0.1)] text-[#C9A84C]">
                <Wrench size={18} className="sm:size-[20px]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                <p className="text-[10px] sm:text-xs" style={{ color: "var(--color-text-secondary)" }}>{s.price} MAD • <span className="line-clamp-1">{s.description.substring(0, 60)}...</span></p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => updateService(s.id, { isVisible: !s.isVisible })}
                className="p-2 rounded-lg transition-colors bg-[rgba(255,255,255,0.03)]"
                style={{ background: s.isVisible ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: s.isVisible ? "rgb(34,197,94)" : "rgb(239,68,68)" }}
                title={s.isVisible ? "Masquer du site" : "Afficher sur le site"}
              >
                {s.isVisible ? <Activity size={16} /> : <Lock size={16} />}
              </button>
              <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:text-[#C9A84C] transition-colors">
                <Settings size={16} />
              </button>
              <button onClick={() => removeService(s.id)} className="p-2 rounded-lg bg-[rgba(239,68,68,0.05)] hover:text-red-500 transition-colors">
                <ShoppingBag size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function AdminBrandsPage() {
  const { brands, updateBrand } = useAdminStore();
  const [filter, setFilter] = useState("");

  const filtered = brands.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AdminShell title="Gestion Marques">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Contrôlez la visibilité des marques sur la page publique.</p>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
          <input 
            className="input-premium w-full pl-10" 
            placeholder="Rechercher marque..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((b) => (
          <div 
            key={b.id} 
            onClick={() => updateBrand(b.id, { isVisible: !b.isVisible })}
            className={`card-premium p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${!b.isVisible ? "grayscale opacity-50 border-transparent" : "border-[#C9A84C]"}`}
          >
            <div className="w-12 h-12 mb-3 flex items-center justify-center bg-white rounded-full p-2 shadow-sm">
              <Medal size={24} style={{ color: b.isVisible ? "#C9A84C" : "#999" }} />
            </div>
            <p className="text-xs font-bold uppercase text-center" style={{ color: b.isVisible ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{b.name}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${b.isVisible ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-[10px] font-bold uppercase">{b.isVisible ? "Actif" : "Masqué"}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function AdminSettingsPage({ products, setProducts }: { products: Product[]; setProducts: (next: Product[]) => void; }) {
  return (
    <AdminShell title="Paramètres">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}><Package size={18} /></div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Catalogue</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{products.length} produits</p>
            </div>
          </div>
          <button type="button" onClick={() => setProducts(defaultProducts)} className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>Réinitialiser le catalogue</button>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.10)", color: "rgb(239,68,68)" }}><Lock size={18} /></div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Session</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Admin connecté</p>
            </div>
          </div>
          <button type="button" onClick={() => { window.localStorage.removeItem(authStorageKey); window.location.assign("/"); }} className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgb(239,68,68)" }}>Supprimer session admin</button>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}><FileText size={18} /></div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Version</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>v1.0.0 SPA</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>Application React (Vite) en mode SPA. Connectez une API pour activer toutes les fonctionnalités.</p>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminUsersPage() {
  return (
    <AdminShell title="Utilisateurs">
      <div className="card-premium p-10 text-center">
        <Users size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.25 }} />
        <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Aucun utilisateur</p>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>Les utilisateurs apparaîtront ici lorsqu'une API sera connectée au système.</p>
      </div>
    </AdminShell>
  );
}

export function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  return (
    <Routes>
      <Route path="/" element={<HomePage products={products} />} />
      <Route path="/catalogue" element={<CataloguePage products={products} />} />
      <Route path="/atelier" element={<AtelierPage />} />
      <Route path="/categories" element={<CategoriesPage products={products} />} />
      <Route path="/marques" element={<MarquesPage products={products} />} />
      <Route path="/vehicle-selector" element={<VehicleSelectorPage />} />
      <Route path="/ai-search" element={<AiSearchPage />} />
      <Route path="/search" element={<SearchPage products={products} />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/produit/:slug" element={<ProductPage products={products} />} />
      <Route path="/admin" element={<AdminDashboardPage products={products} />} />
      <Route path="/admin/produits" element={<AdminProductsPage products={products} setProducts={setProducts} />} />
      <Route path="/admin/commandes" element={<AdminOrdersPage />} />
      <Route path="/admin/atelier" element={<AdminAtelierPage />} />
      <Route path="/admin/marques" element={<AdminBrandsPage />} />
      <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
      <Route path="/admin/analytique" element={<AdminAnalyticsPage />} />
      <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage products={products} setProducts={setProducts} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
