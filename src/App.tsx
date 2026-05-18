import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { 
  fetchProducts, 
  fetchCategories,
  fetchAtelierServices,
  fetchBrands,
  fetchTireWidths,
  fetchTireHeights,
  fetchTireDiameters,
  isSupabaseConfigured,
  isSupabaseMissingTableError,
  slugifyCategory,
  MAIN_CATEGORIES,
  type Product,
  type Category as DbCategory,
  type AtelierService as DbAtelierService,
  type Brand as DbBrand
} from "./lib/supabase";
import { Navbar } from "./components/Navbar";

// Lazy-loaded components
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const CataloguePage = lazy(() => import("./pages/CataloguePage").then(m => ({ default: m.CataloguePage })));
const AtelierPage = lazy(() => import("./pages/AtelierPage").then(m => ({ default: m.AtelierPage })));
const ProductPage = lazy(() => import("./pages/ProductPage").then(m => ({ default: m.ProductPage })));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then(m => ({ default: m.CategoriesPage })));
const CategorySubPage = lazy(() => import("./pages/CategorySubPage").then(m => ({ default: m.CategorySubPage })));
const MarquesPage = lazy(() => import("./pages/MarquesPage").then(m => ({ default: m.MarquesPage })));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const AiSearchPage = lazy(() => import("./pages/AiSearchPage").then(m => ({ default: m.AiSearchPage })));
const VehicleSelectorPage = lazy(() => import("./pages/VehicleSelectorPage").then(m => ({ default: m.VehicleSelectorPage })));
const ReservationPage = lazy(() => import("./pages/ReservationPage").then(m => ({ default: m.ReservationPage })));
const LoginPage = lazy(() => import("./pages/AuthPages").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/AuthPages").then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import("./pages/AuthPages").then(m => ({ default: m.ProfilePage })));
const TermsPage = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.PrivacyPage })));
const ContactPage = lazy(() => import("./pages/LegalPages").then(m => ({ default: m.ContactPage })));
const AdminApp = lazy(() => import("./admin/AdminApp").then(m => ({ default: m.AdminApp })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#C9A84C]/20 border-t-[#C9A84C] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A84C] animate-pulse">Wizack Auto</p>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [services, setServices] = useState<DbAtelierService[]>([]);
  const [brands, setBrands] = useState<DbBrand[]>([]);
  const [tireWidths, setTireWidths] = useState<string[]>([]);
  const [tireHeights, setTireHeights] = useState<string[]>([]);
  const [tireDiameters, setTireDiameters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const deriveCategoriesFromProducts = (rows: Product[]): DbCategory[] => {
    const seen = new Map<string, { name: string; slug: string }>();
    for (const p of rows) {
      const name = String(p?.category || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.set(key, { name, slug: slugifyCategory(name) });
    }
    const list = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    return list.map((c, i) => ({
      id: `cat-${c.slug || i}`,
      name: c.name,
      slug: c.slug,
      position: i,
      is_active: true,
      image_url: undefined,
    }));
  };

  const deriveFallbackCategories = (): DbCategory[] => {
    const seen = new Set<string>();
    const list = MAIN_CATEGORIES.filter((name) => {
      const n = String(name || "").trim();
      if (!n) return false;
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return list.map((name, i) => ({
      id: `cat-${slugifyCategory(name) || i}`,
      name,
      slug: slugifyCategory(name),
      position: i,
      is_active: true,
      image_url: undefined,
    }));
  };

  const deriveBrandsFromProducts = (rows: Product[]): DbBrand[] => {
    const seen = new Map<string, string>();
    for (const p of rows) {
      const name = String(p?.brand || "").trim();
      if (!name || name === "—") continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.set(key, name);
    }
    const list = Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    return list.map((name, i) => ({
      id: `brand-${slugifyCategory(name) || i}`,
      name,
      logo_url: undefined,
      is_visible: true,
      position: i,
    }));
  };

  const searchItems = useMemo(() => {
    const items: Array<{ label: string; kind: "category" | "subcategory"; category?: string }> = [];

    const categorySet = new Set<string>();
    for (const c of categories) {
      const name = String(c?.name || "").trim();
      if (name) categorySet.add(name);
    }
    for (const p of products) {
      const cat = String(p?.category || "").trim();
      if (cat) categorySet.add(cat);
    }

    const subToCategories = new Map<string, Set<string>>();
    for (const p of products) {
      const sc = String(p?.subcategory || "").trim();
      if (!sc) continue;
      const cat = String(p?.category || "").trim();
      if (!subToCategories.has(sc)) subToCategories.set(sc, new Set());
      if (cat) subToCategories.get(sc)!.add(cat);
    }

    const categoriesList = Array.from(categorySet).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    for (const label of categoriesList) items.push({ label, kind: "category" });

    const subcategoriesList = Array.from(subToCategories.keys()).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    for (const label of subcategoriesList) {
      const cats = Array.from(subToCategories.get(label) || []);
      const category = cats.length === 1 ? cats[0] : undefined;
      items.push({ label, kind: "subcategory", category });
    }

    return items;
  }, [categories, products]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setCategories(deriveFallbackCategories());
          setLoading(false);
          return;
        }

        const timeoutMs = 8000;
        const withTimeout = <T,>(promise: Promise<T>) =>
          Promise.race<T>([
            promise,
            new Promise<T>((_, reject) => {
              setTimeout(() => reject(new Error("timeout")), timeoutMs);
            }),
          ]);

        const [pRes, cRes, sRes, bRes, wRes, hRes, dRes] = await Promise.allSettled([
          withTimeout(fetchProducts()),
          withTimeout(fetchCategories()),
          withTimeout(fetchAtelierServices()),
          withTimeout(fetchBrands()),
          withTimeout(fetchTireWidths()),
          withTimeout(fetchTireHeights()),
          withTimeout(fetchTireDiameters()),
        ]);

        const nextProducts = pRes.status === "fulfilled" ? pRes.value : [];
        if (nextProducts.length) setProducts(nextProducts);

        const categoriesOk = cRes.status === "fulfilled" ? cRes.value.filter((cat) => cat.is_active) : [];
        if (categoriesOk.length) setCategories(categoriesOk);
        else if (nextProducts.length) setCategories(deriveCategoriesFromProducts(nextProducts));
        else setCategories(deriveFallbackCategories());

        const brandsOk = bRes.status === "fulfilled" ? bRes.value.filter((br) => br.is_visible) : [];
        if (brandsOk.length) setBrands(brandsOk);
        else if (nextProducts.length) setBrands(deriveBrandsFromProducts(nextProducts));
        else setBrands([]);

        if (sRes.status === "fulfilled") setServices(sRes.value);
        else setServices([]);

        if (wRes.status === "fulfilled") setTireWidths(wRes.value);
        else setTireWidths([]);

        if (hRes.status === "fulfilled") setTireHeights(hRes.value);
        else setTireHeights([]);

        if (dRes.status === "fulfilled") setTireDiameters(dRes.value);
        else setTireDiameters([]);
      } catch (err) {
        if (isSupabaseMissingTableError(err)) {
          setCategories(deriveFallbackCategories());
        }
        setCategories(deriveFallbackCategories());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <LoadingFallback />;

  return (
    <>
      <ScrollToTop />
      <Navbar searchItems={searchItems} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage services={services} products={products} categories={categories} />} />
          <Route path="/catalogue" element={<CataloguePage products={products} categories={categories} dbTireWidths={tireWidths} dbTireHeights={tireHeights} dbTireDiameters={tireDiameters} />} />
          <Route path="/atelier" element={<AtelierPage services={services} />} />
          <Route path="/reservation" element={<ReservationPage services={services} />} />
          <Route path="/categories" element={<CategoriesPage products={products} categories={categories} />} />
          <Route path="/categories/:slug" element={<CategorySubPage categories={categories} products={products} />} />
          <Route path="/marques" element={<MarquesPage products={products} brands={brands} />} />
          <Route path="/produit/:slug" element={<ProductPage products={products} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/panier" element={<Navigate to="/cart" replace />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/ai-search" element={<AiSearchPage products={products} />} />
          <Route path="/recherche-vehicule" element={<VehicleSelectorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/conditions" element={<TermsPage />} />
          <Route path="/confidentialite" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin/*" element={<AdminApp products={products} setProducts={(next) => setProducts(next)} defaultProducts={[]} />} />
        </Routes>
      </Suspense>
    </>
  );
}
