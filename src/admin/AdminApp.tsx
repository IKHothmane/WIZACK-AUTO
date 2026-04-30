import { Suspense, lazy, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Activity, BarChart3, ChevronRight, CreditCard, Download, FileText, History, LayoutGrid, List, Lock, Medal, Package, Plus, Search, Settings, ShoppingBag, TrendingUp, Upload, Users, Wrench } from "lucide-react";
import { useAdminStore, type AtelierService } from "../store";

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

const authStorageKey = "wizack-auth-role";

const formatPrice = (priceCents: number, currency: string) => {
  const value = priceCents / 100;
  const formatted = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
  if (currency === "MAD") return `${formatted} DH`;
  return `${formatted} ${currency}`;
};

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
    } catch {}
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const b = vehicleBrand.trim().toLowerCase();
    const m = vehicleModel.trim().toLowerCase();

    return products.filter((p) => {
      const name = String(p.name ?? "").toLowerCase();
      const brand = String(p.brand ?? "").toLowerCase();
      const category = String(p.category ?? "").toLowerCase();

      if (q) {
        const matches = name.includes(q) || brand.includes(q) || category.includes(q);
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
            : p,
        ),
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
                <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Rechercher (nom, marque, catégorie)..." className="w-full input-premium !pl-12" />
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
                    style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}
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
                <button type="button" onClick={cancelEdit} className="rounded-xl px-5 py-3 text-sm font-bold transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ color: "var(--color-text-primary)" }}>
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
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
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
                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
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
            <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.03)]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: i === 1 ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)", color: i === 1 ? "#C9A84C" : "var(--color-text-secondary)" }}>
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

    if (editing) updateService(editing.id, data);
    else addService({ id: Date.now().toString(), ...data });

    setShowForm(false);
    setEditing(null);
  };

  return (
    <AdminShell title="Gestion Atelier">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Gérez les services et tarifs de votre atelier mécanique.
        </p>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
          <Plus size={18} /> Ajouter Service
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-6 mb-8 animate-fade-in-up border-[#C9A84C]">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-primary)" }}>
            {editing ? "Modifier" : "Ajouter"} un Service
          </h2>
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
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                Annuler
              </button>
              <button type="submit" className="rounded-xl px-8 py-2.5 text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)", color: "#0A0A0A" }}>
                {editing ? "Mettre à jour" : "Enregistrer"}
              </button>
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
                <p className="text-sm sm:text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {s.name}
                </p>
                <p className="text-[10px] sm:text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {s.price} MAD • <span className="line-clamp-1">{s.description.substring(0, 60)}...</span>
                </p>
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

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AdminShell title="Gestion Marques">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Contrôlez la visibilité des marques sur la page publique.
        </p>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
          <input className="input-premium w-full pl-10" placeholder="Rechercher marque..." value={filter} onChange={(e) => setFilter(e.target.value)} />
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
            <p className="text-xs font-bold uppercase text-center" style={{ color: b.isVisible ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
              {b.name}
            </p>
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
      <div className="card-premium p-10 text-center">
        <Users size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.25 }} />
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

