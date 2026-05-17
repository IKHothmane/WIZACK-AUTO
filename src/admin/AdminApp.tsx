import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Reorder } from "framer-motion";
import { GripVertical, Activity, BarChart3, ChevronRight, CreditCard, Download, FileText, History, LayoutGrid, List, Lock, Medal, Package, Plus, Search, Settings, ShoppingBag, Trash2, TrendingUp, Upload, Users, Wrench } from "lucide-react";
import { useAdminStore } from "../store";
import { deleteAtelierService, deleteBrand, deleteCategory, deleteProduct, deleteSubcategory, fetchAtelierServices, fetchBrands, fetchCategories, fetchSubcategories, fetchSubcategoriesForCategory, isSupabaseConfigured, slugifyCategory, uploadPublicImage, upsertAtelierService, upsertAtelierServices, upsertBrand, upsertBrands, upsertCategory, upsertProduct, upsertSubcategory, type AtelierService, type Brand, type Category, type Subcategory } from "../lib/supabase";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price_cents: number;
  currency: "MAD";
  stock: number;
  image?: string;
};

const authStorageKey = "wizack-auth-role";

const formatPrice = (priceCents: number, currency: string) => {
  const value = priceCents / 100;
  const formatted = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
  if (currency === "MAD") return `${formatted} DH`;
  return `${formatted} ${currency}`;
};

const makeId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const makeUuid = () => {
  const g = globalThis as any;
  const v = g?.crypto?.randomUUID?.();
  if (typeof v === "string" && v) return v;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
};

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

const AdminSalesChartLazy = lazy(async () => {
  const mod = await import("../components/AdminSalesChart");
  return { default: mod.AdminSalesChart };
});

const AdminAnalyticsChartsLazy = lazy(async () => {
  const mod = await import("../components/AdminAnalyticsCharts");
  return { default: mod.AdminAnalyticsCharts };
});

function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = window.localStorage.getItem(authStorageKey);

  if (role !== "ADMIN") return <Navigate to="/login" replace />;

  const nav = [
    { to: "/admin", label: "Dashboard", icon: <Activity size={18} /> },
    { to: "/admin/produits", label: "Produits", icon: <Package size={18} /> },
    { to: "/admin/categories", label: "Catégories", icon: <FileText size={18} /> },
    { to: "/admin/sous-categories", label: "Sous-catégories", icon: <List size={18} /> },
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
              <img
                src="/logo-96.jpg"
                srcSet="/logo-96.jpg 1x, /logo-192.jpg 2x"
                sizes="40px"
                alt="WIZACK AUTO"
                className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 dark:invert dark:brightness-110"
                width={40}
                height={40}
                decoding="async"
              />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="text-gold-gradient text-base font-extrabold tracking-[0.12em]">WIZACK AUTO</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>
                Administration
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.20)",
                color: "rgb(34,197,94)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Admin connecté
            </span>
            <Link
              to="/"
              className="rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.18)",
                color: "var(--color-text-primary)",
              }}
            >
              Retour site
            </Link>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.20)",
                color: "rgb(239,68,68)",
              }}
              onClick={() => {
                window.localStorage.removeItem(authStorageKey);
                navigate("/");
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1440px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="rounded-2xl p-2 sm:p-4 sticky top-[80px] self-start" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="hidden lg:block text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-3" style={{ color: "var(--color-primary)" }}>
              Menu
            </p>
            <div className="flex lg:grid overflow-x-auto lg:overflow-visible gap-1 no-scrollbar pb-2 lg:pb-0">
              {nav.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-xl px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 sm:gap-3 shrink-0 lg:shrink"
                    style={{
                      background: active ? "rgba(201,168,76,0.12)" : "transparent",
                      color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >
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
              <h1 className="text-2xl md:text-3xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>
                {title}
              </h1>
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
              <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.1em] uppercase leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                {s.label}
              </p>
            </div>
            <p className="text-xl sm:text-3xl font-black mb-auto" style={{ color: "var(--color-primary)" }}>
              {s.value}
            </p>
            <Link
              to={s.to}
              className="mt-4 sm:mt-5 inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 text-[9px] sm:text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={
                s.primary
                  ? { background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 24px rgba(201,168,76,0.25)" }
                  : { background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }
              }
            >
              {s.btn} <ChevronRight size={12} className="sm:size-[14px]" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                Aperçu des ventes
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Évolution du chiffre d'affaires (MAD)
              </p>
            </div>
            <Activity size={20} style={{ color: "#C9A84C" }} />
          </div>
          <Suspense fallback={<div className="h-[300px] w-full" />}>
            <AdminSalesChartLazy salesData={salesData} />
          </Suspense>
        </div>

        <div className="card-premium p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              Dernières activités
            </p>
          </div>
          <div className="flex-1 overflow-auto pr-2 grid gap-4">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-[var(--border)] last:border-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.1)", color: "rgb(34,197,94)" }}>
                  <ShoppingBag size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Nouvelle commande #CMD-{1000 + i}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                    Il y a {i * 15 + 5} minutes • 4,500 MAD
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/commandes" className="mt-4 text-center text-xs font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>
            Voir toutes les activités →
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminProductsPage({ products, setProducts }: { products: Product[]; setProducts: (next: Product[]) => void }) {
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
  const [subcategory, setSubcategory] = useState("");
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
      return;
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const b = vehicleBrand.trim().toLowerCase();
    const m = vehicleModel.trim().toLowerCase();

    return products.filter((p) => {
      const name = String(p.name ?? "").toLowerCase();
      const brand = String(p.brand ?? "").toLowerCase();
      const category = String(p.category ?? "").toLowerCase();
      const subcategory = String(p.subcategory ?? "").toLowerCase();

      if (q) {
        const matches = name.includes(q) || brand.includes(q) || category.includes(q) || subcategory.includes(q);
        if (!matches) return false;
      }

      if (vehicleFilterEnabled) {
        if (b && brand !== b) return false;
        if (m && !name.includes(m)) return false;
      }

      return true;
    });
  }, [products, searchFilter, vehicleBrand, vehicleModel, vehicleFilterEnabled]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setSubcategory(p.subcategory || "");
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
    setSubcategory("");
    setPriceDh("");
    setStock("0");
    setImage("");
    setError(null);
    setShowForm(false);
  };

  const addOrUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    const b = brand.trim();
    const c = category.trim();
    const sc = subcategory.trim();
    const price = Number(priceDh.replace(",", "."));
    const st = Number(stock);
    const imgStr = image.trim();

    if (!n || !b || !c || !Number.isFinite(price) || price <= 0 || !Number.isFinite(st) || st < 0) {
      setError("Remplissez nom, marque, catégorie, prix (>0) et stock (>=0).");
      return;
    }

    const slug = slugify(n);
    if (editingId) {
      const nextItems = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: n,
              brand: b,
              category: c,
              subcategory: sc || undefined,
              price_cents: Math.round(price * 100),
              stock: Math.round(st),
              image: imgStr || undefined,
            }
          : p,
      );
      const updated = nextItems.find((p) => p.id === editingId);
      if (updated && isSupabaseConfigured()) {
        try {
          await upsertProduct(updated as any);
        } catch (err: any) {
          setError(`Sauvegarde Supabase échouée: ${String(err?.message || err)}`);
        }
      }
      setProducts(nextItems);
      cancelEdit();
    } else {
      const next: Product = {
        id: makeId(),
        slug: products.some((p) => p.slug === slug) ? `${slug}-${Date.now().toString(36)}` : slug,
        name: n,
        brand: b,
        category: c,
        subcategory: sc || undefined,
        price_cents: Math.round(price * 100),
        currency: "MAD",
        stock: Math.round(st),
        image: imgStr || undefined,
      };
      if (isSupabaseConfigured()) {
        try {
          await upsertProduct(next as any);
        } catch (err: any) {
          setError(`Sauvegarde Supabase échouée: ${String(err?.message || err)}`);
        }
      }
      setProducts([next, ...products]);
      cancelEdit();
    }
  };

  const remove = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        setError(`Suppression Supabase échouée: ${String(err?.message || err)}`);
      }
    }
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
                <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Rechercher (nom, marque, catégorie, sous-catégorie)..." className="w-full input-premium !pl-12" />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setVehicleFilterEnabled((v) => !v)}
                    className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all"
                    style={{
                      background: vehicleFilterEnabled ? "rgba(201,168,76,0.14)" : "var(--color-item-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {vehicleFilterEnabled ? "Filtre véhicule: ON" : "Filtre véhicule: OFF"}
                  </button>
                </div>
                <div className="flex items-center p-1 rounded-xl shrink-0" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)" }}>
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
                  <Plus size={18} /> <span className="hidden sm:inline">Ajouter Produit</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>

            {vehicleFilterEnabled ? (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="Marque (ex: BMW)" className="input-premium" />
                <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Modèle (ex: Série 1)" className="input-premium" />
                <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="Année (optionnel)" className="input-premium" />
              </div>
            ) : null}

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="card-premium flex flex-col h-full overflow-hidden group">
                    <div className="h-40 relative flex items-center justify-center" style={{ background: "var(--color-item-bg)" }}>
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
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: "var(--color-text-secondary)" }}>
                        {p.brand} • {p.category}
                      </p>
                      <p className="text-sm font-bold line-clamp-2 flex-1" style={{ color: "var(--color-text-primary)" }}>
                        {p.name}
                      </p>
                      <p className="mt-3 text-lg font-black" style={{ color: "var(--color-primary)" }}>
                        {formatPrice(p.price_cents, p.currency)}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <button type="button" onClick={() => startEdit(p)} className="rounded-lg py-2 text-xs font-bold transition-all hover:bg-[rgba(201,168,76,0.1)]" style={{ border: "1px solid rgba(201,168,76,0.20)", color: "#C9A84C" }}>
                          Modifier
                        </button>
                        <button type="button" onClick={() => remove(p.id)} className="rounded-lg py-2 text-xs font-bold transition-all hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
                          Supprimer
                        </button>
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
                    <tr className="border-b border-[var(--border)]" style={{ background: "var(--color-item-bg)", color: "var(--color-text-secondary)" }}>
                      <th className="px-4 py-3 font-semibold">Produit</th>
                      <th className="px-4 py-3 font-semibold">Catégorie</th>
                      <th className="px-4 py-3 font-semibold">Prix</th>
                      <th className="px-4 py-3 font-semibold">Stock</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--color-item-bg)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--color-item-bg)" }}>
                              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package size={18} style={{ color: "var(--color-text-secondary)" }} />}
                            </div>
                            <div>
                              <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
                                {p.name}
                              </p>
                              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                                {p.brand}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                          {p.category}
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: "var(--color-primary)" }}>
                          {formatPrice(p.price_cents, p.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: p.stock > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.stock > 0 ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                            {p.stock > 0 ? `${p.stock} en stock` : "Rupture"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => startEdit(p)} className="rounded-lg px-2 py-1.5 text-xs font-bold transition-all hover:bg-[rgba(201,168,76,0.1)]" style={{ color: "#C9A84C" }}>
                              Éditer
                            </button>
                            <button type="button" onClick={() => remove(p.id)} className="rounded-lg px-2 py-1.5 text-xs font-bold transition-all hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgb(239,68,68)" }}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>Aucun produit ne correspond à votre recherche.</div>}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto card-premium p-8">
            <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {editingId ? "Modifier le produit" : "Nouveau produit"}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    Remplissez les informations ci-dessous.
                  </p>
                </div>
              </div>
              <button type="button" onClick={cancelEdit} className="text-sm font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>
                Fermer
              </button>
            </div>

            <form className="space-y-5" onSubmit={addOrUpdate}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Nom du produit
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plaquettes de frein avant..." className="input-premium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                    Marque
                  </label>
                  <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: BMW" className="input-premium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                    Catégorie
                  </label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Freinage" className="input-premium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Sous-catégorie (optionnel)
                </label>
                <input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Ex: Pneus" className="input-premium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                    Prix unitaire (MAD)
                  </label>
                  <input value={priceDh} onChange={(e) => setPriceDh(e.target.value)} placeholder="0.00" type="number" step="0.01" className="input-premium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                    Stock disponible
                  </label>
                  <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" type="number" className="input-premium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Image du produit
                </label>
                <div className="flex items-center gap-4">
                  <label
                    className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--color-primary)]"
                    style={{ borderColor: "var(--border)", background: "var(--color-item-bg)" }}
                  >
                    <Upload size={20} className="mb-2" style={{ color: "var(--color-text-secondary)" }} />
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Cliquez pour choisir une image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => setImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
                      <img src={image} alt="Aperçu" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm font-semibold rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>
                  {error}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={cancelEdit} className="rounded-xl px-5 py-3 text-sm font-bold transition-all hover:bg-[var(--color-item-bg)]" style={{ color: "var(--color-text-primary)" }}>
                  Annuler
                </button>
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

function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [position, setPosition] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const refresh = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchCategories();
      setItems(next);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setImageUrl("");
    setPosition("0");
    setIsActive(true);
    setShowForm(true);
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setImageUrl(c.image_url || "");
    setPosition(String(c.position));
    setIsActive(c.is_active);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const n = name.trim();
    const s = (slug.trim() || slugifyCategory(n)).trim();
    const image_url = imageUrl.trim() || undefined;
    const pos = editing ? editing.position : items.length;
    if (!n || !s) {
      setError("Remplissez nom et slug.");
      return;
    }
    const next: Category = {
      id: editing?.id || makeUuid(),
      name: n,
      slug: s,
      position: Math.round(pos),
      is_active: isActive,
      image_url,
    };
    try {
      await upsertCategory(next);
      await refresh();
      cancel();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  const toggleActive = async (c: Category) => {
    if (!isSupabaseConfigured()) return;
    try {
      await upsertCategory({ ...c, is_active: !c.is_active });
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  const reorder = async (newList: Category[]) => {
    setItems(newList);
    if (!isSupabaseConfigured()) return;
    try {
      // Update positions in background
      await Promise.all(
        newList.map((item, index) => 
          upsertCategory({ ...item, position: index })
        )
      );
    } catch (err: any) {
      setError("Erreur lors de la mise à jour de l'ordre: " + String(err?.message || err));
    }
  };

  const remove = async (c: Category) => {
    if (!isSupabaseConfigured()) return;
    try {
      await deleteCategory(c.id);
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  return (
    <AdminShell title="Catégories">
      <div className="card-premium p-6 animate-fade-in-up">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              Liste des catégories
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Gère l'affichage et l'ordre.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 24px rgba(201,168,76,0.25)" }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Supabase non configuré.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
            {error}
          </div>
        ) : null}

        {showForm ? (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </p>
              </div>
              <button type="button" onClick={cancel} className="text-xs font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>
                Fermer
              </button>
            </div>
            <form className="grid grid-cols-1 lg:grid-cols-4 gap-4" onSubmit={submit}>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Nom
                </label>
                <input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugifyCategory(e.target.value)); }} className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Slug
                </label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input-premium" />
              </div>

              <div className="space-y-1.5 lg:col-span-4">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Image (URL)
                </label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input-premium" />
              </div>
              <div className="lg:col-span-4">
                <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`} style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                  <Upload size={16} />
                  {uploadingImage ? "Téléversement..." : "Téléverser une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isSupabaseConfigured()) {
                        setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
                        return;
                      }
                      const n = name.trim();
                      const s = (slug.trim() || slugifyCategory(n || file.name)).trim();
                      const extRaw = file.name.split(".").pop() || "png";
                      const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
                      const path = `categories/${s}-${Date.now()}.${ext}`;
                      setUploadingImage(true);
                      setError(null);
                      try {
                        const url = await uploadPublicImage(path, file);
                        setImageUrl(url);
                      } catch (err: any) {
                        setError(`Upload image échoué: ${String(err?.message || err)}`);
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>
              {imageUrl.trim() ? (
                <div className="lg:col-span-4">
                  <div className="w-full overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                    <img src={imageUrl.trim()} alt={name || "Aperçu"} className="w-full h-44 object-cover" />
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3 lg:col-span-4">
                <button type="button" onClick={() => setIsActive((v) => !v)} className="rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: isActive ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: "1px solid var(--border)", color: isActive ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                  {isActive ? "Actif" : "Masqué"}
                </button>
                <button type="submit" className="ml-auto rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 20px rgba(201,168,76,0.3)" }}>
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border)]" style={{ color: "var(--color-text-secondary)" }}>
                <th className="pb-3 w-8"></th>
                <th className="pb-3 font-semibold">Nom</th>
                <th className="pb-3 font-semibold">Image</th>
                <th className="pb-3 font-semibold">Slug</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <Reorder.Group as="tbody" axis="y" values={items} onReorder={reorder}>
              {(loading ? [] : items).map((c) => (
                <Reorder.Item key={c.id} value={c} as="tr" className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--color-item-bg)] transition-colors cursor-default">
                  <td className="py-4">
                    <div className="cursor-grab active:cursor-grabbing p-1" style={{ color: "var(--color-text-secondary)" }}>
                      <GripVertical size={18} />
                    </div>
                  </td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-text-primary)" }}>{c.name}</td>
                  <td className="py-4">
                    {c.image_url ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>—</span>
                    )}
                  </td>
                  <td className="py-4 font-mono text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.slug}</td>
                  <td className="py-4">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: c.is_active ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", color: c.is_active ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                      {c.is_active ? "Actif" : "Masqué"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" onClick={() => toggleActive(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                        {c.is_active ? "Masquer" : "Activer"}
                      </button>
                      <button type="button" onClick={() => startEdit(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "#C9A84C" }}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => remove(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)", color: "rgb(239,68,68)" }}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </Reorder.Item>
              ))}
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Chargement...
                  </td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucune catégorie.
                  </td>
                </tr>
              ) : null}
            </Reorder.Group>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentSlug, setParentSlug] = useState("");
  const [items, setItems] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [position, setPosition] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const refreshCategories = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const next = await fetchCategories();
      const active = next.filter((c) => c.is_active);
      setCategories(active);
      if (!parentSlug && active.length) setParentSlug(active[0].slug);
    } catch {
      return;
    }
  };

  const refresh = async (slugValue: string) => {
    if (!isSupabaseConfigured()) return;
    if (!slugValue) return;
    setLoading(true);
    setError(null);
    try {
      const cat = categories.find((c) => c.slug === slugValue);
      if (cat) {
        const next = await fetchSubcategoriesForCategory({ slug: cat.slug, name: cat.name });
        setItems(next);
      } else {
        const next = await fetchSubcategories(slugValue);
        setItems(next);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCategories();
  }, []);

  useEffect(() => {
    void refresh(parentSlug);
  }, [parentSlug]);

  const startCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setImageUrl("");
    setPosition("0");
    setIsActive(true);
    setShowForm(true);
  };

  const startEdit = (c: Subcategory) => {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setImageUrl(c.image_url || "");
    setPosition(String(c.position));
    setIsActive(c.is_active);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const n = name.trim();
    const s = (slug.trim() || slugifyCategory(n)).trim();
    const image_url = imageUrl.trim() || undefined;
    const pos = editing ? editing.position : items.length;
    if (!parentSlug || !n || !s) {
      setError("Choisissez une catégorie, puis remplissez nom et slug.");
      return;
    }
    const next: Subcategory = {
      id: editing?.id || makeUuid(),
      parent_slug: parentSlug,
      name: n,
      slug: s,
      position: Math.round(pos),
      is_active: isActive,
      image_url,
    };
    try {
      await upsertSubcategory(next);
      await refresh(parentSlug);
      cancel();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  const toggleActive = async (c: Subcategory) => {
    if (!isSupabaseConfigured()) return;
    try {
      await upsertSubcategory({ ...c, is_active: !c.is_active });
      await refresh(parentSlug);
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  const reorder = async (newList: Subcategory[]) => {
    setItems(newList);
    if (!isSupabaseConfigured()) return;
    try {
      await Promise.all(
        newList.map((item, index) => 
          upsertSubcategory({ ...item, position: index })
        )
      );
    } catch (err: any) {
      setError("Erreur lors de la mise à jour de l'ordre: " + String(err?.message || err));
    }
  };

  const remove = async (c: Subcategory) => {
    if (!isSupabaseConfigured()) return;
    try {
      await deleteSubcategory(c.id);
      await refresh(parentSlug);
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  };

  const parentLabel = useMemo(() => categories.find((c) => c.slug === parentSlug)?.name || "", [categories, parentSlug]);

  return (
    <AdminShell title="Sous-catégories">
      <div className="card-premium p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              Sous-catégories
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Catégorie: {parentLabel || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={parentSlug} onChange={(e) => setParentSlug(e.target.value)} className="input-premium !py-2.5 !px-3 text-sm">
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 8px 24px rgba(201,168,76,0.25)" }}
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </div>

        <div className="mb-4">
          <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: "var(--color-item-bg)", border: "1px solid rgba(255,255,255,0.10)", color: "var(--color-text-secondary)" }}>
            Source: Supabase • {items.length} sous-catégorie{items.length > 1 ? "s" : ""}
          </span>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Supabase non configuré.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
            {error}
          </div>
        ) : null}

        {showForm ? (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {editing ? "Modifier la sous-catégorie" : "Nouvelle sous-catégorie"}
                </p>
              </div>
              <button type="button" onClick={cancel} className="text-xs font-bold transition-colors hover:text-[#C9A84C]" style={{ color: "var(--color-text-secondary)" }}>
                Fermer
              </button>
            </div>
            <form className="grid grid-cols-1 lg:grid-cols-4 gap-4" onSubmit={submit}>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Nom
                </label>
                <input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugifyCategory(e.target.value)); }} className="input-premium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Slug
                </label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input-premium" />
              </div>

              <div className="space-y-1.5 lg:col-span-4">
                <label className="text-xs font-bold pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  Image (URL)
                </label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input-premium" />
              </div>
              <div className="lg:col-span-4">
                <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`} style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                  <Upload size={16} />
                  {uploadingImage ? "Téléversement..." : "Téléverser une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isSupabaseConfigured()) {
                        setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
                        return;
                      }
                      if (!parentSlug) {
                        setError("Choisissez d'abord une catégorie.");
                        return;
                      }
                      const n = name.trim();
                      const s = (slug.trim() || slugifyCategory(n || file.name)).trim();
                      const extRaw = file.name.split(".").pop() || "png";
                      const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
                      const path = `subcategories/${parentSlug}/${s}-${Date.now()}.${ext}`;
                      setUploadingImage(true);
                      setError(null);
                      try {
                        const url = await uploadPublicImage(path, file);
                        setImageUrl(url);
                      } catch (err: any) {
                        setError(`Upload image échoué: ${String(err?.message || err)}`);
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>
              {imageUrl.trim() ? (
                <div className="lg:col-span-4">
                  <div className="w-full overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                    <img src={imageUrl.trim()} alt={name || "Aperçu"} className="w-full h-44 object-cover" />
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3 lg:col-span-4">
                <button type="button" onClick={() => setIsActive((v) => !v)} className="rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: isActive ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: "1px solid var(--border)", color: isActive ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                  {isActive ? "Actif" : "Masqué"}
                </button>
                <button type="submit" className="ml-auto rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A", boxShadow: "0 6px 20px rgba(201,168,76,0.3)" }}>
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border)]" style={{ color: "var(--color-text-secondary)" }}>
                <th className="pb-3 w-8"></th>
                <th className="pb-3 font-semibold">Nom</th>
                <th className="pb-3 font-semibold">Image</th>
                <th className="pb-3 font-semibold">Slug</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <Reorder.Group as="tbody" axis="y" values={items} onReorder={reorder}>
              {(loading ? [] : items).map((c) => (
                <Reorder.Item key={c.id} value={c} as="tr" className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--color-item-bg)] transition-colors cursor-default">
                  <td className="py-4">
                    <div className="cursor-grab active:cursor-grabbing p-1" style={{ color: "var(--color-text-secondary)" }}>
                      <GripVertical size={18} />
                    </div>
                  </td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-text-primary)" }}>{c.name}</td>
                  <td className="py-4">
                    {c.image_url ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>—</span>
                    )}
                  </td>
                  <td className="py-4 font-mono text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.slug}</td>
                  <td className="py-4">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: c.is_active ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", color: c.is_active ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                      {c.is_active ? "Actif" : "Masqué"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" onClick={() => toggleActive(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                        {c.is_active ? "Masquer" : "Activer"}
                      </button>
                      <button type="button" onClick={() => startEdit(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "#C9A84C" }}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => remove(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)", color: "rgb(239,68,68)" }}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </Reorder.Item>
              ))}
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Chargement...
                  </td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Aucune sous-catégorie.
                  </td>
                </tr>
              ) : null}
            </Reorder.Group>
          </table>
        </div>
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
    setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
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
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--color-item-bg)] transition-colors">
                  <td className="py-4 font-mono text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                    #{o.id}
                  </td>
                  <td className="py-4" style={{ color: "var(--color-text-primary)" }}>
                    {o.client}
                  </td>
                  <td className="py-4" style={{ color: "var(--color-text-secondary)" }}>
                    {o.date}
                  </td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-primary)" }}>
                    {o.amount.toLocaleString()} MAD
                  </td>
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
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            Dernières transactions
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>
              Tous
            </button>
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "transparent", color: "var(--color-text-secondary)" }}>
              Achevés
            </button>
            <button className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "transparent", color: "var(--color-text-secondary)" }}>
              Remboursés
            </button>
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
                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--color-item-bg)] transition-colors">
                  <td className="py-4 font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>
                    #TRX-88{i}4{i}
                  </td>
                  <td className="py-4" style={{ color: "var(--color-text-primary)" }}>
                    Client {i}
                  </td>
                  <td className="py-4" style={{ color: "var(--color-text-secondary)" }}>
                    {i} Mai 2026
                  </td>
                  <td className="py-4 font-bold" style={{ color: "var(--color-primary)" }}>
                    {(i * 1250).toLocaleString()} MAD
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "rgb(34,197,94)" }}>
                        Payé
                      </span>
                      <button onClick={() => alert("Génération de la facture en cours...")} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[var(--color-item-bg)]" style={{ color: "var(--color-text-primary)" }}>
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
    { title: "Panier Moyen", value: "3,250 MAD", trend: "+8.1%", isPositive: true, icon: <CreditCard size={20} /> },
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
              <span className={`text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${kpi.isPositive ? "bg-[rgba(34,197,94,0.1)] text-green-500" : "bg-[rgba(239,68,68,0.1)] text-red-500"}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[10px] sm:text-sm font-bold mb-0.5 sm:mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {kpi.title}
            </p>
            <p className="text-lg sm:text-2xl font-black" style={{ color: "var(--color-primary)" }}>
              {kpi.value}
            </p>
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
        <p className="text-sm font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
          Top Produits de la Semaine
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[var(--color-item-bg)]" style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: i === 1 ? "rgba(201,168,76,0.2)" : "var(--color-item-bg)", color: i === 1 ? "#C9A84C" : "var(--color-text-secondary)" }}>
                  {i}
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Produit Modèle {i}
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                {(120 / i).toFixed(0)} ventes
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function AdminAtelierPage() {
  const [items, setItems] = useState<AtelierService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AtelierService | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const reorderTimerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAtelierServices();
      setItems(next);
    } catch (err: any) {
      setError(`Chargement atelier échoué: ${String(err?.message || err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (reorderTimerRef.current) window.clearTimeout(reorderTimerRef.current);
    };
  }, []);

  const openNew = () => {
    setEditing(null);
    setName("");
    setPrice("0");
    setDescription("");
    setIsVisible(true);
    setImageUrl("");
    setShowForm(true);
  };

  const openEdit = (s: AtelierService) => {
    setEditing(s);
    setName(s.name);
    setPrice(String(s.price ?? 0));
    setDescription(s.description ?? "");
    setIsVisible(Boolean(s.isVisible));
    setImageUrl(s.imageUrl ?? "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }

    const n = name.trim();
    const d = description.trim();
    const p = Math.max(0, Math.round(Number(price || 0)));
    if (!n) return;

    const next: AtelierService = {
      id: editing?.id || `svc-${slugify(n)}-${Date.now().toString(36)}`,
      name: n,
      description: d,
      price: Number.isFinite(p) ? p : 0,
      isVisible,
      position: editing?.position ?? items.length,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : undefined,
    };

    setError(null);
    try {
      await upsertAtelierService(next);
      await refresh();
      closeForm();
    } catch (err: any) {
      setError(`Sauvegarde atelier échouée: ${String(err?.message || err)}`);
    }
  };

  const remove = async (service: AtelierService) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const ok = window.confirm(`Supprimer le service "${service.name}" ?`);
    if (!ok) return;
    setError(null);
    setDeletingId(service.id);
    try {
      await deleteAtelierService(service.id);
      setItems((prev) => prev.filter((s) => s.id !== service.id));
    } catch (err: any) {
      setError(`Suppression atelier échouée: ${String(err?.message || err)}`);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleVisibility = async (s: AtelierService) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const next = { ...s, isVisible: !s.isVisible };
    setItems((prev) => prev.map((it) => (it.id === s.id ? next : it)));
    try {
      await upsertAtelierService(next);
    } catch (err: any) {
      setError(`Mise à jour échouée: ${String(err?.message || err)}`);
      setItems((prev) => prev.map((it) => (it.id === s.id ? s : it)));
    }
  };

  const commitOrder = useCallback(async (next: AtelierService[]) => {
    if (!isSupabaseConfigured()) return;
    try {
      await upsertAtelierServices(next);
    } catch (err: any) {
      setError(`Sauvegarde ordre échouée: ${String(err?.message || err)}`);
    }
  }, []);

  const onReorder = (next: AtelierService[]) => {
    const normalized = next.map((s, idx) => ({ ...s, position: idx }));
    setItems(normalized);
    if (reorderTimerRef.current) window.clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = window.setTimeout(() => {
      void commitOrder(normalized);
    }, 500);
  };

  return (
    <AdminShell title="Gestion Atelier">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Gérez les services et tarifs de votre atelier mécanique.
        </p>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
          <Plus size={18} /> Ajouter Service
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl p-4 text-sm font-bold" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
          {error}
        </div>
      ) : null}

      {showForm && (
        <div className="card-premium p-6 mb-8 animate-fade-in-up border-[#C9A84C]">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            {editing ? "Modifier" : "Ajouter"} un Service
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Nom du service</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input-premium w-full" placeholder="Ex: Vidange + filtre huile" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Prix (MAD)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} required className="input-premium w-full" placeholder="650" />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => setIsVisible((v) => !v)} className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all" style={{ background: isVisible ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: "1px solid var(--border)", color: isVisible ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                {isVisible ? "Actif" : "Masqué"}
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="input-premium w-full h-24" placeholder="Détails du service..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Image (URL)</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-premium w-full" placeholder="https://... ou /pneu%20taille.png" />
            </div>
            <div className="md:col-span-2">
              <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`} style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                <Upload size={16} />
                {uploadingImage ? "Téléversement..." : "Téléverser une image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!isSupabaseConfigured()) {
                      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
                      return;
                    }
                    const base = slugify(name.trim() || file.name);
                    const extRaw = file.name.split(".").pop() || "png";
                    const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
                    const path = `atelier/${base}-${Date.now()}.${ext}`;
                    setUploadingImage(true);
                    setError(null);
                    try {
                      const url = await uploadPublicImage(path, file);
                      setImageUrl(url);
                    } catch (err: any) {
                      setError(`Upload image échoué: ${String(err?.message || err)}`);
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
              </label>
            </div>
            {imageUrl.trim() ? (
              <div className="md:col-span-2">
                <div className="w-full overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                  <img src={imageUrl.trim().replace(/ /g, "%20")} alt={name || "Aperçu"} className="w-full h-44 object-cover" />
                </div>
              </div>
            ) : null}
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={closeForm} className="px-5 py-2.5 text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                Annuler
              </button>
              <button type="submit" className="rounded-xl px-8 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
                {editing ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {loading ? (
          <div className="card-premium p-6" />
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={onReorder} className="grid gap-3">
            {items.map((s) => (
              <Reorder.Item key={s.id} value={s} className="card-premium p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing p-1" style={{ color: "var(--color-text-secondary)" }}>
                    <GripVertical size={18} />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ border: "1px solid var(--border)", background: "var(--color-item-bg)" }}>
                    <img src={(s.imageUrl || "/logo-96.jpg").replace(/ /g, "%20")} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {s.name}
                    </p>
                    <p className="text-[10px] sm:text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {s.price} MAD • <span className="line-clamp-1">{(s.description || "").substring(0, 60)}...</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => void toggleVisibility(s)}
                    className="p-2 rounded-lg transition-colors bg-[var(--color-item-bg)]"
                    style={{ background: s.isVisible ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: s.isVisible ? "rgb(34,197,94)" : "rgb(239,68,68)" }}
                    title={s.isVisible ? "Masquer du site" : "Afficher sur le site"}
                  >
                    {s.isVisible ? <Activity size={16} /> : <Lock size={16} />}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-[var(--color-item-bg)] hover:text-[#C9A84C] transition-colors">
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => void remove(s)}
                    disabled={deletingId === s.id}
                    className="p-2 rounded-lg bg-[rgba(239,68,68,0.05)] hover:text-red-500 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </AdminShell>
  );
}

function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await fetchBrands();
      setItems(next);
    } catch (err: any) {
      setError(`Chargement marques échoué: ${String(err?.message || err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setLogoUrl("");
    setIsVisible(true);
    setShowForm(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setName(b.name);
    setLogoUrl(b.logo_url ?? "");
    setIsVisible(b.is_visible);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const n = name.trim();
    if (!n) return;
    const next: Brand = {
      id: editing?.id || `brand-${slugify(n)}-${Date.now().toString(36)}`,
      name: n,
      logo_url: logoUrl.trim() ? logoUrl.trim() : undefined,
      is_visible: isVisible,
      position: editing?.position ?? items.length,
    };
    setError(null);
    try {
      await upsertBrand(next);
      await refresh();
      close();
    } catch (err: any) {
      setError(`Sauvegarde marque échouée: ${String(err?.message || err)}`);
    }
  };

  const toggle = async (b: Brand) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const next = { ...b, is_visible: !b.is_visible };
    setItems((prev) => prev.map((x) => (x.id === b.id ? next : x)));
    try {
      await upsertBrand(next);
    } catch (err: any) {
      setError(`Mise à jour échouée: ${String(err?.message || err)}`);
      setItems((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    }
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    setError(null);
    try {
      await deleteBrand(id);
      setItems((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(`Suppression marque échouée: ${String(err?.message || err)}`);
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = items.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q));
  }, [items, filter]);

  return (
    <AdminShell title="Gestion Marques">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Gérez les marques, logos et visibilité sur la page publique.
        </p>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            <input className="input-premium w-full pl-10" placeholder="Rechercher marque..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <button type="button" onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl p-4 text-sm font-bold" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
          {error}
        </div>
      ) : null}

      {showForm ? (
        <div className="card-premium p-6 mb-8 animate-fade-in-up border-[#C9A84C]">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            {editing ? "Modifier" : "Ajouter"} une marque
          </h2>
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Nom</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input-premium w-full" placeholder="Ex: BMW" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase opacity-60">Logo (URL)</label>
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="input-premium w-full" placeholder="https://... ou /logo.png" />
            </div>
            <div className="md:col-span-2">
              <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${uploadingLogo ? "opacity-60 pointer-events-none" : ""}`} style={{ background: "var(--color-item-bg)", border: "1px solid var(--border)", color: "var(--color-text-primary)" }}>
                <Upload size={16} />
                {uploadingLogo ? "Téléversement..." : "Téléverser un logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!isSupabaseConfigured()) {
                      setError("Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
                      return;
                    }
                    const base = slugify(name.trim() || file.name);
                    const extRaw = file.name.split(".").pop() || "png";
                    const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
                    const path = `brands/${base}-${Date.now()}.${ext}`;
                    setUploadingLogo(true);
                    setError(null);
                    try {
                      const url = await uploadPublicImage(path, file);
                      setLogoUrl(url);
                    } catch (err: any) {
                      setError(`Upload logo échoué: ${String(err?.message || err)}`);
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => setIsVisible((v) => !v)} className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all" style={{ background: isVisible ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: "1px solid var(--border)", color: isVisible ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                {isVisible ? "Actif" : "Masqué"}
              </button>
            </div>
            {logoUrl.trim() ? (
              <div className="md:col-span-2">
                <div className="w-full overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                  <img
                    src={logoUrl.trim().replace(/ /g, "%20")}
                    alt={name || "Aperçu"}
                    className="w-full h-28 object-contain bg-white"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallback === "1") return;
                      img.dataset.fallback = "1";
                      img.src = "/logo-96.jpg";
                    }}
                  />
                </div>
              </div>
            ) : null}
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                Annuler
              </button>
              <button type="submit" className="rounded-xl px-8 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          <div className="card-premium p-6" />
        ) : (
          filtered.map((b) => (
            <div key={b.id} className={`card-premium p-4 flex flex-col items-center justify-center transition-all duration-300 ${!b.is_visible ? "grayscale opacity-50 border-transparent" : "border-[#C9A84C]"}`}>
              <button type="button" onClick={() => void toggle(b)} className="w-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center bg-white rounded-full p-2 shadow-sm overflow-hidden">
                  {b.logo_url ? (
                    <img
                      src={b.logo_url.replace(/ /g, "%20")}
                      alt={b.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallback === "1") return;
                        img.dataset.fallback = "1";
                        img.src = "/logo-96.jpg";
                      }}
                    />
                  ) : (
                    <Medal size={24} style={{ color: b.is_visible ? "#C9A84C" : "#999" }} />
                  )}
                </div>
                <p className="text-xs font-bold uppercase text-center w-full px-1" style={{ color: b.is_visible ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                  {b.name}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${b.is_visible ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-[10px] font-bold uppercase">{b.is_visible ? "Actif" : "Masqué"}</span>
                </div>
              </button>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => openEdit(b)} className="p-2 rounded-lg bg-[var(--color-item-bg)] hover:text-[#C9A84C] transition-colors" title="Modifier">
                  <Settings size={16} />
                </button>
                <button type="button" onClick={() => void remove(b.id)} className="p-2 rounded-lg bg-[rgba(239,68,68,0.05)] hover:text-red-500 transition-colors" title="Supprimer">
                  <ShoppingBag size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}

function AdminSettingsPage({
  products,
  setProducts,
  defaultProducts,
}: {
  products: Product[];
  setProducts: (next: Product[]) => void;
  defaultProducts: Product[];
}) {
  return (
    <AdminShell title="Paramètres">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
              <Package size={18} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                Catalogue
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {products.length} produits
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setProducts(defaultProducts)} className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
            Réinitialiser le catalogue
          </button>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.10)", color: "rgb(239,68,68)" }}>
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                Session
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Admin connecté
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(authStorageKey);
              window.location.assign("/");
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgb(239,68,68)" }}
          >
            Supprimer session admin
          </button>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
              <FileText size={18} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                Version
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                v1.0.0 SPA
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Application React (Vite) en mode SPA. Connectez une API pour activer toutes les fonctionnalités.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminUsersPage() {
  return (
    <AdminShell title="Utilisateurs">
      <div className="card-premium p-10 text-left">
        <Users size={48} className="mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.25 }} />
        <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          Aucun utilisateur
        </p>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
          Les utilisateurs apparaîtront ici lorsqu'une API sera connectée au système.
        </p>
      </div>
    </AdminShell>
  );
}

export function AdminApp({
  products,
  setProducts,
  defaultProducts,
}: {
  products: Product[];
  setProducts: (next: Product[]) => void;
  defaultProducts: Product[];
}) {
  return (
    <Routes>
      <Route index element={<AdminDashboardPage products={products} />} />
      <Route path="produits" element={<AdminProductsPage products={products} setProducts={setProducts} />} />
      <Route path="categories" element={<AdminCategoriesPage />} />
      <Route path="sous-categories" element={<AdminSubcategoriesPage />} />
      <Route path="commandes" element={<AdminOrdersPage />} />
      <Route path="atelier" element={<AdminAtelierPage />} />
      <Route path="marques" element={<AdminBrandsPage />} />
      <Route path="transactions" element={<AdminTransactionsPage />} />
      <Route path="analytique" element={<AdminAnalyticsPage />} />
      <Route path="utilisateurs" element={<AdminUsersPage />} />
      <Route path="settings" element={<AdminSettingsPage products={products} setProducts={setProducts} defaultProducts={defaultProducts} />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
