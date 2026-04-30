import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Hero3D } from "./components/Hero3D";
import { VehicleSelector } from "./components/VehicleSelector";
import { AtelierServices } from "./components/AtelierServices";
import { Bot, ShieldCheck, Truck, Headphones, Award, Star, ChevronRight, Package, TrendingUp, Users, User, Settings, ShoppingBag, FileText, Lock, History, Activity, BarChart3, CreditCard, BadgeCheck, Rocket, Wrench, Medal, Search, Plus, LayoutGrid, List, Download, Upload } from "lucide-react";
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

type AdminAppProps = {
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  defaultProducts: Product[];
};

const AdminAppLazy = lazy(async (): Promise<{ default: ComponentType<AdminAppProps> }> => {
  const mod = await import("./admin/AdminApp");
  return { default: mod.AdminApp };
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
      <ChatbotLauncher />
    </div>
  );
}

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
        <Bot size={26} color="#0A0A0A" />
      </button>
    );
  }

  return (
    <Suspense fallback={null}>
      <ChatbotWidgetLazy initialOpen />
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
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminAppLazy products={products} setProducts={setProducts} defaultProducts={defaultProducts} />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
