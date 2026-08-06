import { memo, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { 
  MAIN_CATEGORIES, 
  fetchCategories, 
  fetchProducts, 
  isSupabaseConfigured, 
  slugifyCategory, 
  type Product as DbProduct,
  type Category as DbCategory,
  type AtelierService as DbAtelierService 
} from "../lib/supabase";

type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
};

const shuffle = <T,>(items: T[]) => {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getLocalFallbackImageForCategory = (categorySlugOrName: string) => {
  const v = String(categorySlugOrName || "").toLowerCase();
  if (v.includes("pneu")) return "/garage/zone-02-pneus.webp";
  if (v.includes("frein")) return "/pneu_taille-removebg-preview.png";
  if (v.includes("moteur") || v.includes("huile") || v.includes("vidange") || v.includes("refroid")) return "/garage/zone-03-vidange.webp";
  if (v.includes("eclair") || v.includes("electr")) return "/garage/zone-04-eclairage.webp";
  if (v.includes("carros")) return "/garage/zone-05-carrosserie.webp";
  return "/moteur.png";
};

const getLocalFallbackImageForService = (serviceName: string) => {
  const v = String(serviceName || "").toLowerCase();
  if (v.includes("vidange") || v.includes("huile")) return "/garage/zone-03-vidange.webp";
  if (v.includes("pneu")) return "/garage/zone-02-pneus.webp";
  if (v.includes("frein")) return "/pneu_taille-removebg-preview.png";
  if (v.includes("diagnostic") || v.includes("diag")) return "/garage/zone-04-eclairage.webp";
  if (v.includes("carrosserie") || v.includes("peint")) return "/garage/zone-05-carrosserie.webp";
  if (v.includes("clim") || v.includes("climat")) return "/garage/zone-04-eclairage.webp";
  if (v.includes("suspension") || v.includes("amorti")) return "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400&q=80";
  if (v.includes("eclairage") || v.includes("ampoule")) return "/garage/zone-04-eclairage.webp";
  return "/moteur.png";
};

export function HomePage({
  services,
  products = [],
  categories = [],
}: {
  services: DbAtelierService[];
  products?: DbProduct[];
  categories?: DbCategory[];
}) {
  const [carouselCategories, setCarouselCategories] = useState<HomeCategoryCard[]>([]);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [carouselBaseRotateZ, setCarouselBaseRotateZ] = useState(-10);
  const [carouselTiltX, setCarouselTiltX] = useState(0);
  const [carouselTiltY, setCarouselTiltY] = useState(0);
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartProgressRef = useRef(0);
  const dragLastXRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragLastTRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const didDragRef = useRef(false);
  const inertiaRafRef = useRef<number | null>(null);
  const isInertiaRef = useRef(false);
  const autoDirectionRef = useRef<1 | -1>(1);
  const [brakeImageUrl, setBrakeImageUrl] = useState<string>(getLocalFallbackImageForCategory("freinage"));
  const [brakeCategorySlug, setBrakeCategorySlug] = useState<string>("");
  const [suspensionTitle, setSuspensionTitle] = useState<string>("Amortisseurs");
  const [suspensionImageUrl, setSuspensionImageUrl] = useState<string>("https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400&q=80");
  const [suspensionCategorySlug, setSuspensionCategorySlug] = useState<string>("");
  const [engineTitle, setEngineTitle] = useState<string>("Moteur");
  const [engineImageUrl, setEngineImageUrl] = useState<string>("/moteur.png");
  const [engineCategorySlug, setEngineCategorySlug] = useState<string>("");
  const [engineProductsCount, setEngineProductsCount] = useState<number>(0);
  const [engineStockTotal, setEngineStockTotal] = useState<number>(0);

  const homeAtelierServices = useMemo(() => {
    const visible = services.filter((s) => s.isVisible).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return visible.slice(0, 4);
  }, [services]);
  void homeAtelierServices;

  type GridItem = {
    id: string;
    kind: "category" | "service";
    name: string;
    imageUrl: string;
    to: string;
  };

  const combinedGridItems = useMemo<GridItem[]>(() => {
    const catItems: GridItem[] = (Array.isArray(categories) ? categories : [])
      .filter((c) => c.is_active)
      .map((c) => ({
        id: `cat-${c.id}`,
        kind: "category",
        name: c.name,
        imageUrl: c.image_url || getLocalFallbackImageForCategory(c.slug || c.name),
        to: c.slug ? `/categories/${encodeURIComponent(c.slug)}` : "/categories",
      }));

    const srvItems: GridItem[] = (Array.isArray(services) ? services : [])
      .filter((s) => s.isVisible)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((s) => ({
        id: `srv-${s.id}`,
        kind: "service",
        name: s.name,
        imageUrl: (s as any).imageUrl || (s as any).image_url || getLocalFallbackImageForService(s.name),
        to: "/atelier",
      }));

    const combined: GridItem[] = [];
    const maxLen = Math.max(catItems.length, srvItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < catItems.length) combined.push(catItems[i]);
      if (i < srvItems.length) combined.push(srvItems[i]);
    }
    return combined.slice(0, 9);
  }, [categories, services]);

  useEffect(() => {
    let cancelled = false;

    const makeFallbackCarousel = (): HomeCategoryCard[] => {
      const base = MAIN_CATEGORIES.slice(0, 14).map((name, i) => {
        const slug = slugifyCategory(name);
        return { id: `fallback-cat-${slug}-${i}`, name, slug, imageUrl: getLocalFallbackImageForCategory(slug) };
      });
      return shuffle(base);
    };

    const load = async () => {
      try {
        const categoriesFromProps = (Array.isArray(categories) ? categories : []).filter((c) => c.is_active);
        const productsFromProps = Array.isArray(products) ? products : [];

        if (categoriesFromProps.length) {
          const seen = new Set<string>();
          const uniq = categoriesFromProps.filter((c) => {
            if (!c.slug) return false;
            if (seen.has(c.slug)) return false;
            seen.add(c.slug);
            return true;
          });

          const normalizeKey = (value: string) => String(value || "").trim().toLowerCase();
          const moteurCat =
            uniq.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Moteur"))) ||
            uniq.find((c) => normalizeKey(c.name) === normalizeKey("Moteur"));
          const engineFallback = moteurCat?.image_url || "/moteur.png";
          if (!cancelled) setEngineCategorySlug(moteurCat?.slug || "");
          if (!cancelled) setEngineImageUrl(engineFallback);
          const freinageCat =
            uniq.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Freinage"))) ||
            uniq.find((c) => normalizeKey(c.name) === normalizeKey("Freinage"));
          const brakeFallback = freinageCat?.image_url || getLocalFallbackImageForCategory("freinage");
          if (!cancelled) setBrakeCategorySlug(freinageCat?.slug || "");
          if (!cancelled) setBrakeImageUrl(brakeFallback);

          const suspensionCat =
            uniq.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Suspension et bras"))) ||
            uniq.find((c) => normalizeKey(c.name) === normalizeKey("Suspension et bras")) ||
            uniq.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Amortissement"))) ||
            uniq.find((c) => normalizeKey(c.name) === normalizeKey("Amortissement"));
          const suspensionFallback = suspensionCat?.image_url || "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400&q=80";
          if (!cancelled) setSuspensionCategorySlug(suspensionCat?.slug || "");
          if (!cancelled) setSuspensionImageUrl(suspensionFallback);

          if (productsFromProps.length) {
            const moteurKey = normalizeKey(moteurCat?.name || "Moteur");
            const moteurProducts = productsFromProps.filter((p) => {
              const c = normalizeKey(p.category);
              return c === moteurKey || c === normalizeKey("Moteur");
            });
            const moteurStock = moteurProducts.reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0), 0);
            if (!cancelled) {
              setEngineProductsCount(moteurProducts.length);
              setEngineStockTotal(moteurStock);
            }

            const engineDesired = ["Filtre", "Filtres", "Bougies", "Injection", "Courroies", "Refroidissement", "Vidange"].map(normalizeKey);
            let pickedEngine: { title: string; image?: string } | null = null;
            for (const sub of engineDesired) {
              const m = moteurProducts.filter((p) => normalizeKey(p.subcategory || "") === sub);
              if (m.length) {
                const mImg = m.filter((p) => Boolean(p.image));
                const from = mImg.length ? mImg : m;
                const p = from[Math.floor(Math.random() * from.length)];
                pickedEngine = { title: String(p.subcategory || "").trim() || "Moteur", image: p.image || undefined };
                break;
              }
            }
            if (!pickedEngine && moteurProducts.length) {
              const withImage = moteurProducts.filter((p) => Boolean(p.image));
              const from = withImage.length ? withImage : moteurProducts;
              const p = from[Math.floor(Math.random() * from.length)];
              pickedEngine = { title: String(p.subcategory || "").trim() || "Moteur", image: p.image || undefined };
            }
            if (pickedEngine) {
              if (!cancelled) {
                setEngineTitle(pickedEngine.title);
                setEngineImageUrl(pickedEngine.image || engineFallback);
              }
            } else {
              if (!cancelled) {
                setEngineTitle("Moteur");
                setEngineImageUrl(engineFallback);
              }
            }

            const target = normalizeKey("Disques de frein");
            const matches = productsFromProps.filter((p) => normalizeKey(p.category) === normalizeKey("Freinage") && normalizeKey(p.subcategory || "") === target);
            const withImage = matches.filter((p) => Boolean(p.image));
            const pickFrom = withImage.length ? withImage : matches;
            if (pickFrom.length) {
              const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];
              const url = picked.image || brakeFallback;
              if (!cancelled) setBrakeImageUrl(url);
            }

            const suspensionCats = new Set([normalizeKey("Suspension et bras"), normalizeKey("Amortissement"), normalizeKey("Suspension")]);
            const desired = ["Amortisseurs", "Bras de suspension", "Ressort", "Coupelle d'amortisseur", "Kit de suspension"].map(normalizeKey);
            let pickedSusp: { title: string; image?: string } | null = null;
            for (const sub of desired) {
              const m = productsFromProps.filter((p) => suspensionCats.has(normalizeKey(p.category)) && normalizeKey(p.subcategory || "") === sub);
              if (m.length) {
                const mImg = m.filter((p) => Boolean(p.image));
                const from = mImg.length ? mImg : m;
                const p = from[Math.floor(Math.random() * from.length)];
                pickedSusp = { title: String(p.subcategory || "").trim() || "Suspension", image: p.image || undefined };
                break;
              }
            }
            if (pickedSusp) {
              if (!cancelled) {
                setSuspensionTitle(pickedSusp.title);
                setSuspensionImageUrl(pickedSusp.image || suspensionFallback);
              }
            } else {
              if (!cancelled) setSuspensionTitle("Suspension");
            }
          } else {
            if (!cancelled) {
              setEngineProductsCount(0);
              setEngineStockTotal(0);
            }
          }

          const list = shuffle(uniq).map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            imageUrl: c.image_url || getLocalFallbackImageForCategory(c.slug || c.name),
          }));
          if (!cancelled) {
            setCarouselCategories(list.length ? list : makeFallbackCarousel());
            setCarouselProgress(0);
          }
          return;
        }

        if (!isSupabaseConfigured()) {
          if (!cancelled) {
            setCarouselCategories(makeFallbackCarousel());
            setCarouselProgress(0);
            setBrakeImageUrl(getLocalFallbackImageForCategory("freinage"));
            setEngineTitle("Moteur");
            setEngineImageUrl("/moteur.png");
            setEngineProductsCount(0);
            setEngineStockTotal(0);
          }
          return;
        }

        const categoriesRaw = (await fetchCategories()).filter((c) => c.is_active);
        const seen = new Set<string>();
        const dbCategories = categoriesRaw.filter((c) => {
          if (!c.slug) return false;
          if (seen.has(c.slug)) return false;
          seen.add(c.slug);
          return true;
        });

        if (!dbCategories.length) {
          if (!cancelled) {
            setCarouselCategories(makeFallbackCarousel());
            setCarouselProgress(0);
            setBrakeImageUrl(getLocalFallbackImageForCategory("freinage"));
            setEngineTitle("Moteur");
            setEngineImageUrl("/moteur.png");
            setEngineProductsCount(0);
            setEngineStockTotal(0);
          }
          return;
        }

        const normalizeKey = (value: string) => String(value || "").trim().toLowerCase();
        const moteurCat =
          dbCategories.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Moteur"))) ||
          dbCategories.find((c) => normalizeKey(c.name) === normalizeKey("Moteur"));
        const engineFallback = moteurCat?.image_url || "/moteur.png";
        if (!cancelled) setEngineCategorySlug(moteurCat?.slug || "");
        if (!cancelled) setEngineImageUrl(engineFallback);
        const freinageCat =
          dbCategories.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Freinage"))) ||
          dbCategories.find((c) => normalizeKey(c.name) === normalizeKey("Freinage"));
        const brakeFallback = freinageCat?.image_url || getLocalFallbackImageForCategory("freinage");
        if (!cancelled) setBrakeCategorySlug(freinageCat?.slug || "");
        if (!cancelled) setBrakeImageUrl(brakeFallback);

        const suspensionCat =
          dbCategories.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Suspension et bras"))) ||
          dbCategories.find((c) => normalizeKey(c.name) === normalizeKey("Suspension et bras")) ||
          dbCategories.find((c) => normalizeKey(c.slug) === normalizeKey(slugifyCategory("Amortissement"))) ||
          dbCategories.find((c) => normalizeKey(c.name) === normalizeKey("Amortissement"));
        const suspensionFallback = suspensionCat?.image_url || "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400&q=80";
        if (!cancelled) setSuspensionCategorySlug(suspensionCat?.slug || "");
        if (!cancelled) setSuspensionImageUrl(suspensionFallback);

        try {
          const products = await fetchProducts();
          const moteurKey = normalizeKey(moteurCat?.name || "Moteur");
          const moteurProducts = products.filter((p) => {
            const c = normalizeKey(p.category);
            return c === moteurKey || c === normalizeKey("Moteur");
          });
          const moteurStock = moteurProducts.reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0), 0);
          if (!cancelled) {
            setEngineProductsCount(moteurProducts.length);
            setEngineStockTotal(moteurStock);
          }

          const engineDesired = ["Filtre", "Filtres", "Bougies", "Injection", "Courroies", "Refroidissement", "Vidange"].map(normalizeKey);
          let pickedEngine: { title: string; image?: string } | null = null;
          for (const sub of engineDesired) {
            const m = moteurProducts.filter((p) => normalizeKey(p.subcategory || "") === sub);
            if (m.length) {
              const mImg = m.filter((p) => Boolean(p.image));
              const from = mImg.length ? mImg : m;
              const p = from[Math.floor(Math.random() * from.length)];
              pickedEngine = { title: String(p.subcategory || "").trim() || "Moteur", image: p.image || undefined };
              break;
            }
          }
          if (!pickedEngine && moteurProducts.length) {
            const withImage = moteurProducts.filter((p) => Boolean(p.image));
            const from = withImage.length ? withImage : moteurProducts;
            const p = from[Math.floor(Math.random() * from.length)];
            pickedEngine = { title: String(p.subcategory || "").trim() || "Moteur", image: p.image || undefined };
          }
          if (pickedEngine) {
            if (!cancelled) {
              setEngineTitle(pickedEngine.title);
              setEngineImageUrl(pickedEngine.image || engineFallback);
            }
          } else {
            if (!cancelled) {
              setEngineTitle("Moteur");
              setEngineImageUrl(engineFallback);
            }
          }

          const target = normalizeKey("Disques de frein");
          const matches = products.filter((p) => normalizeKey(p.category) === normalizeKey("Freinage") && normalizeKey(p.subcategory || "") === target);
          const withImage = matches.filter((p) => Boolean(p.image));
          const pickFrom = withImage.length ? withImage : matches;
          if (pickFrom.length) {
            const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];
            const url = picked.image || brakeFallback;
            if (!cancelled) setBrakeImageUrl(url);
          }

          const suspensionCats = new Set([normalizeKey("Suspension et bras"), normalizeKey("Amortissement"), normalizeKey("Suspension")]);
          const desired = ["Amortisseurs", "Bras de suspension", "Ressort", "Coupelle d'amortisseur", "Kit de suspension"].map(normalizeKey);
          let pickedSusp: { title: string; image?: string } | null = null;
          for (const sub of desired) {
            const m = products.filter((p) => suspensionCats.has(normalizeKey(p.category)) && normalizeKey(p.subcategory || "") === sub);
            if (m.length) {
              const mImg = m.filter((p) => Boolean(p.image));
              const from = mImg.length ? mImg : m;
              const p = from[Math.floor(Math.random() * from.length)];
              pickedSusp = { title: String(p.subcategory || "").trim() || "Suspension", image: p.image || undefined };
              break;
            }
          }
          if (pickedSusp) {
            if (!cancelled) {
              setSuspensionTitle(pickedSusp.title);
              setSuspensionImageUrl(pickedSusp.image || suspensionFallback);
            }
          } else {
            if (!cancelled) setSuspensionTitle("Suspension");
          }
        } catch {
          void 0;
        }

        const list = shuffle(dbCategories).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image_url || getLocalFallbackImageForCategory(c.slug || c.name),
        }));
        if (!cancelled) {
          setCarouselCategories(list.length ? list : makeFallbackCarousel());
          setCarouselProgress(0);
        }
      } catch {
        if (!cancelled) {
          setCarouselCategories(makeFallbackCarousel());
          setCarouselProgress(0);
          setBrakeImageUrl(getLocalFallbackImageForCategory("freinage"));
          setEngineTitle("Moteur");
          setEngineImageUrl("/moteur.png");
          setEngineProductsCount(0);
          setEngineStockTotal(0);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (carouselCategories.length < 2) return;
    let raf = 0;
    let last = performance.now();
    const speed = 0.32;
    const tick = (now: number) => {
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      if (!isCarouselDragging && !isInertiaRef.current) {
        const dir = autoDirectionRef.current;
        setCarouselProgress((p) => (p + dt * speed * dir + carouselCategories.length) % carouselCategories.length);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [carouselCategories.length, isCarouselDragging]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setCarouselBaseRotateZ(mql.matches ? -8 : -10);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const safeMod = (value: number, mod: number) => ((value % mod) + mod) % mod;
  const len = carouselCategories.length;
  const normalizedProgress = len ? safeMod(carouselProgress, len) : 0;
  const baseIndex = Math.floor(normalizedProgress);
  const frac = normalizedProgress - baseIndex;
  const getCarouselCat = (offset: number) => (len ? carouselCategories[safeMod(baseIndex + offset, len)] : undefined);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const getPose = (posRaw: number) => {
    const pos = clamp(posRaw, -4, 4);
    const frames: Record<number, { x: number; rotY: number; scale: number; opacity: number; blur: number }> = {
      [-4]: { x: -680, rotY: 78, scale: 0.58, opacity: 0, blur: 1.6 },
      [-3]: { x: -560, rotY: 70, scale: 0.66, opacity: 0.08, blur: 1.0 },
      [-2]: { x: -430, rotY: 55, scale: 0.78, opacity: 0.25, blur: 0.4 },
      [-1]: { x: -260, rotY: 35, scale: 0.88, opacity: 0.55, blur: 0 },
      [0]: { x: 0, rotY: 0, scale: 1, opacity: 1, blur: 0 },
      [1]: { x: 260, rotY: -35, scale: 0.88, opacity: 0.55, blur: 0 },
      [2]: { x: 430, rotY: -55, scale: 0.78, opacity: 0.25, blur: 0.4 },
      [3]: { x: 560, rotY: -70, scale: 0.66, opacity: 0.08, blur: 1.0 },
      [4]: { x: 680, rotY: -78, scale: 0.58, opacity: 0, blur: 1.6 },
    };
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) {
      return frames[lo];
    }
    const t = pos - lo;
    const a = frames[lo];
    const b = frames[hi];
    return {
      x: lerp(a.x, b.x, t),
      rotY: lerp(a.rotY, b.rotY, t),
      scale: lerp(a.scale, b.scale, t),
      opacity: lerp(a.opacity, b.opacity, t),
      blur: lerp(a.blur, b.blur, t),
    };
  };


  return (
    <PageShell noPadding>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="bg-[var(--bg)] text-[var(--text)] font-sans overflow-x-hidden min-h-screen">
        
        {/* 1. HERO SECTION - MOBILE = WEB (FULLY RESPONSIVE) */}
        <section className="relative w-full h-auto min-h-[100svh] md:min-h-[720px] lg:min-h-[820px] flex flex-col items-center justify-between overflow-hidden bg-[#FDFAF1] dark:bg-gradient-to-b dark:from-black dark:via-[#0a0810] dark:to-black">
          <picture className="absolute inset-0 w-full h-full z-0 block">
            <source media="(min-width: 768px)" srcSet="/heroweb.webp" />
            <img
              src="/hero mobile.webp"
              alt="Wizack Auto — Showroom Bugatti Chiron doré, Casablanca"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] md:object-[50%_40%] lg:object-center"
              width={1920}
              height={1080}
              sizes="100vw"
            />
          </picture>
          <picture className="absolute inset-0 w-full h-full z-0 hidden dark:block">
            <source media="(min-width: 768px)" srcSet="/heroweb.webp" />
            <img
              src="/hero mobile.webp"
              alt="Wizack Auto — Showroom Bugatti Chiron doré, Casablanca"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] md:object-[50%_40%] lg:object-center"
              width={1920}
              height={1080}
              sizes="100vw"
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-black/50 dark:from-black/60 dark:via-black/30 dark:to-black/85 z-[1]" />
          <div className="absolute inset-0 z-0 opacity-20 sm:opacity-25 dark:opacity-30" style={{ backgroundImage: "linear-gradient(rgba(201,168,76,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative z-10 w-full container mx-auto px-3 sm:px-4 md:px-6 text-center flex flex-col justify-between flex-1 py-5 sm:py-8 md:py-24">
            <div className="mt-16 sm:mt-14 md:mt-12">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.12em] text-[#FFD700] mb-3 sm:mb-4 md:mb-6 drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)] uppercase leading-tight">
                Wizack Auto
              </h1>
              <p className="max-w-xl sm:max-w-2xl mx-auto text-[13px] sm:text-sm md:text-base lg:text-lg text-white font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] px-1 sm:px-2 md:px-0">
                Votre plateforme dédiée à la vente de pièces automobiles de qualité supérieure et à la réservation de services d'atelier professionnels.
              </p>
            </div>

            <div className="mb-5 sm:mb-8 md:mb-10 mt-6 sm:mt-0">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-8 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2 md:px-0 max-w-4xl mx-auto">
                {[
                  { number: "15 000+", label: "Pièces Auto" },
                  { number: "50+", label: "Marques Premium" },
                  { number: "100%", label: "Services Garantis" },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center bg-black/55 dark:bg-black/55 backdrop-blur-sm sm:backdrop-blur-md border border-[#D4AF37]/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 min-w-[100px] sm:min-w-[150px] md:min-w-[180px] lg:min-w-[200px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex-1 max-w-[180px] sm:max-w-[220px] md:max-w-[280px]">
                    <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#FFD700] mb-0.5 sm:mb-1 drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]">{stat.number}</span>
                    <span className="text-[9px] sm:text-xs md:text-sm lg:text-base tracking-[0.14em] sm:tracking-[0.16em] uppercase font-bold text-white text-center opacity-95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] leading-tight">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-0 max-w-xl sm:max-w-2xl mx-auto w-full">
                <Link to="/catalogue" className="w-full sm:w-auto sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 lg:py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[11px] sm:text-xs lg:text-sm rounded-full text-center shadow-[0_6px_24px_rgba(255,215,0,0.35)] hover:brightness-110 transition-all">
                  Parcourir le catalogue
                </Link>
                <Link to="/atelier" className="w-full sm:w-auto sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 lg:py-4 bg-black/45 backdrop-blur-sm sm:backdrop-blur border-2 border-[#FFD700] text-[#FFD700] font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[11px] sm:text-xs lg:text-sm rounded-full text-center hover:bg-[#FFD700]/10 transition-all shadow-[0_6px_22px_rgba(0,0,0,0.45)]">
                  Prendre Rendez-vous
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* GLOWING DIVIDER */}
        <div className="w-full h-px relative flex justify-center items-center my-12 z-20">
          <div className="absolute w-full h-[1px] bg-[#D4AF37]/20" />
          <div className="absolute w-1/2 h-[2px] bg-[#FFD700] shadow-[0_0_20px_#FFD700]" />
        </div>

        <section className="relative w-full py-24 lg:py-32 overflow-hidden">
          <img src="/screen.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-opacity duration-500" style={{ filter: "brightness(0.7) contrast(1.08) saturate(1.05)" }} />
          
          <div className="absolute inset-0 z-0 bg-white/50 dark:bg-black/20 transition-colors duration-500" />
          
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[var(--bg)]/80 via-transparent to-[var(--bg)]/80" />
          <div className="absolute inset-0 z-0" style={{background:"radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.1) 0%, transparent 50%)"}} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-[auto_auto] gap-6 lg:gap-8 items-stretch">

              <Link to={engineCategorySlug ? `/categories/${encodeURIComponent(engineCategorySlug)}` : "/categories"} className="relative group block lg:col-start-1 lg:row-span-2">
                <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform -translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:-translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform -translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:-translate-x-12 group-hover:translate-y-6 opacity-30">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                
                <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 h-full">
                  <div className="absolute -top-[6px] -left-[6px] w-12 h-12 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-12 h-12 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <h3 className="text-xl font-bold tracking-[0.15em] text-[var(--text)] uppercase">Moteur</h3>
                  </div>
                  <div className="w-full aspect-[4/3] border border-[var(--border)] rounded-xl mb-5 relative flex items-center justify-center bg-[var(--item-bg)]/50 overflow-hidden transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/5 to-transparent z-10 pointer-events-none" />
                    <img src={engineImageUrl} alt={engineTitle} className="w-full h-full object-contain p-4 opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-700" />
                    <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-20" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--text)] tracking-widest">{String(engineTitle || "Moteur").toUpperCase()}</p>
                    <div className="flex items-center gap-3 text-[var(--text)]/70">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-[var(--text)]">{engineProductsCount > 0 ? engineProductsCount : 1200}</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Produits</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-[var(--text)]">{engineStockTotal > 0 ? engineStockTotal : 25000}</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Stock</span>
                      </div>
                    </div>
                    <div className="h-px bg-[var(--border)]" />
                    <div className="flex items-end gap-1 h-10 opacity-70">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const seed = (engineProductsCount > 0 ? engineProductsCount : 1200) * 31 + (engineStockTotal > 0 ? engineStockTotal : 25000) * 7;
                        const h = 35 + ((seed + i * 17) % 66);
                        return (
                        <div key={i} className="flex-1 bg-[#D4AF37]/30 rounded-t-sm transition-all group-hover:bg-[#D4AF37]/60" style={{ height: `${h}%` }} />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[var(--text)]/40 uppercase">Qualité Catalogue</p>
                  </div>
                </div>
              </Link>
              

              <div className="flex lg:col-start-2 lg:row-span-2 items-center justify-center relative min-h-[320px] lg:min-h-[560px] lg:w-[560px]">
                <Link to={engineCategorySlug ? `/categories/${encodeURIComponent(engineCategorySlug)}` : "/categories"} className="block">
                  <img src="/moteur.png" alt="Moteur" className="relative z-10 -translate-y-4 w-80 h-80 lg:w-[26rem] lg:h-[26rem] object-contain drop-shadow-[0_0_70px_rgba(212,175,55,0.7)] animate-float" />
                </Link>
              </div>

              <Link to={brakeCategorySlug ? `/categories/${encodeURIComponent(brakeCategorySlug)}` : "/categories"} className="relative group block lg:col-start-3 lg:row-start-1">
                <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:translate-x-12 group-hover:translate-y-6 opacity-30">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                
                <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    <h3 className="text-lg font-bold tracking-[0.15em] text-[var(--text)] uppercase">Freinage</h3>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 border border-[var(--border)] rounded-xl overflow-hidden relative shrink-0 bg-[var(--item-bg)]/50 p-2 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 to-transparent z-10 pointer-events-none" />
                      <img src={brakeImageUrl} alt="Disques de frein" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-medium text-[var(--text)] tracking-widest">DISQUES DE FREIN</p>
                      <p className="text-[10px] text-[var(--text)]/60">FREINAGE</p>
                      <div className="h-1.5 bg-[var(--border)] rounded"><div className="h-full bg-[#D4AF37]/60 w-4/5 rounded" /></div>
                      <div className="h-1.5 bg-[var(--border)] rounded"><div className="h-full bg-[#D4AF37]/60 w-3/5 rounded" /></div>
                      <p className="text-[10px] text-[var(--text)]/40">L580+ UNITS</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to={suspensionCategorySlug ? `/categories/${encodeURIComponent(suspensionCategorySlug)}` : "/categories"} className="relative group block lg:col-start-3 lg:row-start-2">
                <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:translate-x-12 group-hover:translate-y-6 opacity-30">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>

                <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    <h3 className="text-lg font-bold tracking-[0.15em] text-[var(--text)] uppercase">Suspension</h3>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 border border-[var(--border)] rounded-xl overflow-hidden relative shrink-0 bg-[var(--item-bg)]/50 p-2 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 to-transparent z-10 pointer-events-none" />
                      <img src={suspensionImageUrl} alt={suspensionTitle} className="w-full h-full object-contain opacity-80 mix-blend-luminosity group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-medium text-[var(--text)] tracking-widest">{String(suspensionTitle || "Suspension").toUpperCase()}</p>
                      <p className="text-[10px] text-[var(--text)]/60">SUSPENSION</p>
                      <p className="text-[10px] text-[var(--text)]/40">L20+ UNITS</p>
                      <div className="h-1.5 bg-[var(--border)] rounded mt-2"><div className="h-full bg-[#D4AF37]/60 w-[85%] rounded" /></div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        </section>

        {/* GLOWING DIVIDER */}
        <div className="w-full h-px relative flex justify-center items-center my-12 z-20">
          <div className="absolute w-full h-[1px] bg-[#D4AF37]/20" />
          <div className="absolute w-1/3 h-[2px] bg-[#FFD700] shadow-[0_0_20px_#FFD700]" />
        </div>

        {/* 3. PERFORMANCE CAROUSEL */}
        <section className="relative w-full py-40 overflow-hidden">
           <img src="/screen2.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-opacity duration-500" />
           <div className="absolute inset-0 z-0 bg-white/50 dark:bg-black/20 transition-colors duration-500" />
           <div className="absolute w-[150vw] h-px top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent rotate-[-8deg] shadow-[0_0_10px_#D4AF37]" />
           <div className="absolute w-[150vw] h-px top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent rotate-[8deg] shadow-[0_0_10px_#D4AF37]" />
           
           <div className="relative z-10 max-w-[1600px] mx-auto px-4">
             {carouselCategories.length ? (
               <div className="sm:hidden grid grid-cols-2 gap-4">
                 {carouselCategories.slice(0, 6).map((cat) => (
                   <Link
                     key={`carousel-mobile-${cat.id}`}
                     to={cat.slug ? `/categories/${encodeURIComponent(cat.slug)}` : "/categories"}
                     className="bg-[var(--card)]/85 backdrop-blur-md border border-[var(--border)] rounded-2xl p-4 flex flex-col"
                   >
                     <p className="text-[10px] font-bold tracking-[0.15em] uppercase line-clamp-2 text-[var(--text)]">
                       {cat.name}
                     </p>
                     <div className="mt-3 aspect-[4/3] border border-[var(--border)] rounded-xl bg-[var(--item-bg)]/50 overflow-hidden relative flex items-center justify-center">
                       <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/70 via-transparent to-transparent z-10" />
                       <img src={(cat.imageUrl || "/moteur.png").replace(/ /g, "%20")} alt={cat.name} className="w-full h-full object-contain p-2 opacity-90" />
                     </div>
                   </Link>
                 ))}
               </div>
             ) : (
               <div className="sm:hidden px-4 py-10 text-center">
                 <p className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text)]/70">Chargement...</p>
               </div>
             )}

             <div className="hidden sm:flex relative mx-auto w-full max-w-[1200px] h-[440px] md:h-[500px] items-center justify-center" style={{ perspective: 1200 }}>
               <div
                 className={`relative w-full h-full origin-center touch-none ${isCarouselDragging ? "cursor-grabbing" : "cursor-grab"}`}
                 style={{
                   transform: `translate3d(0px, 24px, 0px) rotateZ(${carouselBaseRotateZ}deg) rotateX(${carouselTiltX}deg) rotateY(${carouselTiltY}deg)`,
                   transformStyle: "preserve-3d",
                 }}
                 onPointerDown={(e) => {
                   if (e.pointerType === "mouse" && e.button !== 0) return;
                   e.currentTarget.setPointerCapture(e.pointerId);
                   if (inertiaRafRef.current) window.cancelAnimationFrame(inertiaRafRef.current);
                   inertiaRafRef.current = null;
                   isInertiaRef.current = false;
                   setIsCarouselDragging(true);
                   didDragRef.current = false;
                   dragStartXRef.current = e.clientX;
                   dragStartYRef.current = e.clientY;
                   dragStartProgressRef.current = carouselProgress;
                   dragLastXRef.current = e.clientX;
                   dragLastYRef.current = e.clientY;
                   dragLastTRef.current = performance.now();
                   dragVelocityRef.current = 0;
                 }}
                 onPointerMove={(e) => {
                   const el = e.currentTarget;
                   const rect = el.getBoundingClientRect();
                   const x = rect.width ? (e.clientX - rect.left) / rect.width : 0.5;
                   const y = rect.height ? (e.clientY - rect.top) / rect.height : 0.5;
                   const nx = clamp(x * 2 - 1, -1, 1);
                   const ny = clamp(y * 2 - 1, -1, 1);

                   if (isCarouselDragging) {
                     const deltaX = e.clientX - dragStartXRef.current;
                     const deltaY = e.clientY - dragStartYRef.current;
                     const theta = (carouselBaseRotateZ * Math.PI) / 180;
                     const axisDelta = deltaX * Math.cos(theta) + deltaY * Math.sin(theta);
                    const dragThreshold = e.pointerType === "touch" ? 12 : 6;
                    if (Math.abs(axisDelta) > dragThreshold) didDragRef.current = true;
                     const sensitivityPx = 180;
                     const nextProgress = dragStartProgressRef.current - axisDelta / sensitivityPx;
                     setCarouselProgress(nextProgress);

                     const now = performance.now();
                     const dt = Math.max(0.001, (now - dragLastTRef.current) / 1000);
                     const dx = e.clientX - dragLastXRef.current;
                     const dy = e.clientY - dragLastYRef.current;
                     const axisDx = dx * Math.cos(theta) + dy * Math.sin(theta);
                     dragVelocityRef.current = (-axisDx / sensitivityPx) / dt;
                     dragLastXRef.current = e.clientX;
                     dragLastYRef.current = e.clientY;
                     dragLastTRef.current = now;
                     return;
                   }

                   setCarouselTiltY(nx * 10);
                   setCarouselTiltX(-ny * 6);
                 }}
                 onPointerUp={(e) => {
                   try {
                     e.currentTarget.releasePointerCapture(e.pointerId);
                   } catch {
                     void 0;
                   }
                   setIsCarouselDragging(false);
                   if (carouselCategories.length >= 2) {
                     const startVelocity = dragVelocityRef.current;
                     const deltaX = e.clientX - dragStartXRef.current;
                     const deltaY = e.clientY - dragStartYRef.current;
                     const theta = (carouselBaseRotateZ * Math.PI) / 180;
                     const axisDelta = deltaX * Math.cos(theta) + deltaY * Math.sin(theta);
                     if (Math.abs(startVelocity) > 0.001) {
                       autoDirectionRef.current = startVelocity >= 0 ? 1 : -1;
                     } else if (didDragRef.current && Math.abs(axisDelta) > 2) {
                       autoDirectionRef.current = -axisDelta >= 0 ? 1 : -1;
                     }
                     if (Math.abs(startVelocity) > 0.01) {
                       isInertiaRef.current = true;
                       let last = performance.now();
                       const step = (now: number) => {
                         const dt = Math.max(0.001, (now - last) / 1000);
                         last = now;
                         dragVelocityRef.current *= Math.exp(-3.2 * dt);
                         setCarouselProgress((p) => (p + dragVelocityRef.current * dt + carouselCategories.length) % carouselCategories.length);
                         if (Math.abs(dragVelocityRef.current) < 0.02) {
                           isInertiaRef.current = false;
                           inertiaRafRef.current = null;
                           return;
                         }
                         inertiaRafRef.current = window.requestAnimationFrame(step);
                       };
                       inertiaRafRef.current = window.requestAnimationFrame(step);
                     }
                   }
                 }}
                 onPointerCancel={() => {
                   setIsCarouselDragging(false);
                 }}
                 onPointerLeave={() => {
                   setCarouselTiltX(0);
                   setCarouselTiltY(0);
                 }}
               >
                 {[
                   { offset: -3, minClass: "hidden md:flex", w: "w-[210px]", h: "h-[290px]", title: "text-[10px]" },
                   { offset: -2, minClass: "hidden md:flex", w: "w-[230px]", h: "h-[320px]", title: "text-xs" },
                   { offset: -1, minClass: "hidden sm:flex", w: "w-[240px]", h: "h-[330px]", title: "text-sm" },
                   { offset: 0, minClass: "flex", w: "w-[300px] md:w-[360px]", h: "h-[420px]", title: "text-xl md:text-2xl" },
                   { offset: 1, minClass: "hidden sm:flex", w: "w-[240px]", h: "h-[330px]", title: "text-sm" },
                   { offset: 2, minClass: "hidden md:flex", w: "w-[230px]", h: "h-[320px]", title: "text-xs" },
                   { offset: 3, minClass: "hidden md:flex", w: "w-[210px]", h: "h-[290px]", title: "text-[10px]" },
                 ].map((cfg) => {
                   const cat = getCarouselCat(cfg.offset);
                   const pos = cfg.offset - frac;
                   const pose = getPose(pos);
                   const z = Math.round(100 - Math.abs(pos) * 12);
                   const clickable = pose.opacity > 0.12;
                   const rotateZ = clamp(pos, -3, 3) * 1.2;
                   const isCenter = cfg.offset === 0;
                   const isNear = Math.abs(cfg.offset) === 1;
                   const isFar = Math.abs(cfg.offset) >= 2;
                   return (
                     <Link
                       key={`carousel-${cfg.offset}-${cat?.id || "empty"}`}
                       to={cat ? `/categories/${encodeURIComponent(cat.slug)}` : "/categories"}
                       className={`${cfg.minClass} absolute top-1/2 left-1/2 ${cfg.w} ${cfg.h} ${isCenter ? "bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] flex flex-col p-6 shadow-2xl" : isNear ? "bg-[var(--card)]/70 backdrop-blur-md border border-[var(--border)] rounded-2xl flex flex-col p-5" : "bg-[var(--card)]/50 backdrop-blur-md border border-[var(--border)] rounded-2xl flex flex-col p-5"} select-none`}
                       style={{
                         transform: `translate(-50%,-50%) translate3d(${pose.x}px, 0px, 0px) rotateY(${pose.rotY}deg) rotateZ(${rotateZ}deg) scale(${pose.scale})`,
                         opacity: pose.opacity,
                         filter: `blur(${pose.blur}px)`,
                         zIndex: z,
                         pointerEvents: clickable ? "auto" : "none",
                       }}
                       onClick={(ev) => {
                         if (didDragRef.current) {
                           ev.preventDefault();
                           ev.stopPropagation();
                         }
                       }}
                     >
                       {isCenter && (
                         <>
                           <div className="absolute -top-[6px] -left-[6px] w-12 h-12 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                           <div className="absolute -bottom-[6px] -right-[6px] w-12 h-12 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                         </>
                       )}
                       <h3 className={`${cfg.title} ${isCenter ? "font-bold" : "font-medium"} text-[var(--text)] tracking-[0.15em] uppercase line-clamp-2 ${isCenter ? "mb-6" : ""}`}>
                         {cat?.name || "Catégorie"}
                       </h3>
                       <div className={`flex-1 ${isCenter ? "border border-[var(--border)] rounded-xl bg-[var(--item-bg)]/50" : isFar ? "border border-transparent rounded-xl bg-[var(--item-bg)]" : "border border-[var(--border)]/50 rounded-xl bg-[var(--item-bg)]"} overflow-hidden relative ${isCenter ? "group" : ""} ${isCenter ? "flex items-center justify-center" : ""} ${isCenter ? "" : "mt-4"}`}>
                         <div className={`absolute inset-0 ${isCenter ? "bg-gradient-to-t from-[var(--bg)]/80 via-transparent to-transparent" : "bg-gradient-to-t from-[var(--bg)]/70 via-transparent to-transparent"} z-10`} />
                         <img
                           src={cat?.imageUrl || "/moteur.png"}
                           alt={cat?.name || "Catégorie"}
                           className={`w-full h-full object-contain ${isCenter ? "opacity-90 p-3" : isNear ? "opacity-85 p-2" : "opacity-75 p-2"}`}
                         />
                         {isCenter && <div className="absolute w-56 h-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />}
                       </div>
                     </Link>
                   );
                 })}
               </div>
             </div>
           </div>
        </section>

        {/* GLOWING DIVIDER */}
        <div className="w-full h-px relative flex justify-center items-center my-12 z-20">
          <div className="absolute w-full h-[1px] bg-[#D4AF37]/20" />
          <div className="absolute w-1/4 h-[2px] bg-[#FFD700] shadow-[0_0_20px_#FFD700]" />
        </div>

        {/* 4. SERVICES & CATÉGORIES GRID */}
        <section className="relative w-full py-24 overflow-hidden">
           <img src="/screen2.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-opacity duration-500" />
           <div className="absolute inset-0 z-0 bg-white/50 dark:bg-black/20 transition-colors duration-500" />
           
           <div className="relative z-10 max-w-7xl mx-auto px-4">
             <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
               <div>
                 <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>Catalogue</p>
                 <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--text)" }}>Services & Catégories</h2>
               </div>
               <div className="mt-4 md:mt-0 flex items-center gap-3">
                 <div className="w-20 h-px" style={{ background: "linear-gradient(to right, transparent, #D4AF37)" }} />
                 <p className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: "var(--text)", opacity: 0.7 }}>
                   {combinedGridItems.length} disponibles
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
               {combinedGridItems.length ? (
                 combinedGridItems.map((item) => (
                   <Link
                     key={item.id}
                     to={item.to}
                     className="group relative block bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border)] rounded-xl md:rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                   >
                     <div className="absolute -top-[5px] -left-[5px] w-8 md:w-10 h-8 md:h-10 border-t-[2.5px] border-l-[2.5px] border-[#D4AF37] rounded-tl-[22px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <div className="absolute -bottom-[5px] -right-[5px] w-8 md:w-10 h-8 md:h-10 border-b-[2.5px] border-r-[2.5px] border-[#D4AF37] rounded-br-[22px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <div className="p-3 md:p-5 lg:p-6">
                       <div className="aspect-[4/3] w-full rounded-lg md:rounded-xl bg-[var(--item-bg)]/60 border border-[var(--border)] overflow-hidden flex items-center justify-center relative mb-0">
                         <img
                           src={item.imageUrl.replace(/ /g, "%20")}
                           alt={item.name}
                           className="w-full h-full object-contain p-2 md:p-3 opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                         />
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-20 pointer-events-none" />
                         <div className="absolute bottom-0 left-0 right-0 z-30 p-2 md:p-4 lg:p-5 space-y-0.5 md:space-y-1">
                           <p className="text-[8px] md:text-[10px] tracking-[0.16em] md:tracking-[0.2em] uppercase font-semibold" style={{ color: "#D4AF37", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                             {item.kind === "category" ? "Catégorie" : "Service"}
                           </p>
                           <p className="text-xs md:text-base lg:text-lg font-heading font-bold text-white leading-tight line-clamp-2" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
                             {item.name}
                           </p>
                           <p className="text-[10px] md:text-xs font-semibold flex items-center gap-1 mt-1 md:mt-2 text-white/90" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                             Explorer
                             <span style={{ color: "#D4AF37" }}>→</span>
                           </p>
                         </div>
                       </div>
                     </div>
                   </Link>
                 ))
               ) : (
                 <>
                   {Array.from({ length: 9 }).map((_, i) => (
                     <div
                       key={`skeleton-${i}`}
                       className="bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-xl md:rounded-2xl p-3 md:p-5 lg:p-6 animate-pulse"
                     >
                       <div className="aspect-[4/3] w-full rounded-lg md:rounded-xl bg-[var(--item-bg)]/50 border border-[var(--border)] mb-3 md:mb-4" />
                       <div className="space-y-1.5 md:space-y-2">
                         <div className="h-2 md:h-2.5 w-1/3 rounded bg-[var(--item-bg)]/70" />
                         <div className="h-3 md:h-4 w-3/4 rounded bg-[var(--item-bg)]/70" />
                       </div>
                     </div>
                   ))}
                 </>
               )}
             </div>
           </div>
        </section>

        {/* 5. NOUS TROUVER À CASABLANCA */}
        <section id="localisation" className="bg-[#FDFCF8] dark:bg-[#111012] py-20 border-t border-[#EADFC8]/40 dark:border-white/10 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs tracking-[0.22em] font-bold text-[#C9A86A] bg-white dark:bg-white/5 border border-[#EADFC8]/60 dark:border-white/10 rounded-full px-3 py-1">LOCALISATION</span>
              <span className="h-px w-10 bg-[#EADFC8] dark:bg-white/10"></span>
              <span className="text-xs tracking-[0.18em] text-[#8A7E6B] dark:text-white/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A86A]"></span> 20 Rue du Dr Roux
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-heading font-extrabold text-3xl md:text-4xl leading-[0.95] tracking-[-0.02em] text-[#1A1A1A] dark:text-white">
                  Nous trouver à <span className="text-[#C9A86A] dark:text-[#FFD700]">Casablanca</span>
                </h2>
                <p className="mt-3 text-sm text-[#6B6B6B] dark:text-white/70">
                  <b className="text-[#1A1A1A] dark:text-white">20 Rue du Dr Roux, Casablanca 20290</b> — Pôle Industriel Haute Technologie
                </p>
              </div>
              <div className="text-sm text-[#8A7E6B] dark:text-white/50">33.6018405°N 7.5823491°W</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
              <div className="relative rounded-2xl border border-[#EADFC8] dark:border-white/10 overflow-hidden bg-white dark:bg-[#1A191C] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] h-[420px] md:h-[520px]">
                <iframe
                  src="https://www.google.com/maps?q=Wizack%20Auto%2C%2020%20Rue%20du%20Dr%20Roux%2C%20Casablanca%2020290%2C%20Maroc&output=embed&ll=33.6018405%2C-7.5823491&z=16"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Wizack Auto — Casablanca"
                />
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#1A191C] border border-[#EADFC8]/70 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-7 flex flex-col transition-colors duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#EADFC8]/60 dark:border-white/10 bg-white dark:bg-black flex items-center justify-center">
                    <img src="/logo.jpg" alt="Wizack Auto" className="w-full h-full object-cover dark:hidden" />
                    <img src="/logodark.jpg" alt="Wizack Auto" className="w-full h-full object-cover hidden dark:block" />
                  </div>
                  <div>
                    <div className="font-extrabold text-base md:text-lg tracking-[0.12em] text-[#1A1A1A] dark:text-white">WIZACK AUTO</div>
                    <div className="text-[11px] md:text-xs tracking-[0.2em] text-[#8A7E6B] dark:text-white/50">20 RUE DU DR ROUX</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#FFFBF0] dark:bg-white/5 border border-[#EADFC8]/60 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#C9A86A] dark:text-[#FFD700]">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="text-xs md:text-[13px] tracking-[0.22em] uppercase text-[#C9A86A] dark:text-white/50 font-bold mb-1">Adresse</div>
                      <div className="font-extrabold text-lg md:text-xl text-[#1A1A1A] dark:text-white leading-tight">Casablanca, Maroc</div>
                      <div className="text-sm text-[#8A7E6B] dark:text-white/60 mt-1">20 Rue du Dr Roux — Pôle Industriel<br/>Haute Technologie, Casablanca 20290</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#FFFBF0] dark:bg-white/5 border border-[#EADFC8]/60 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#C9A86A] dark:text-[#FFD700]">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-[13px] tracking-[0.22em] uppercase text-[#C9A86A] dark:text-white/50 font-bold mb-1">Téléphone</div>
                      <div className="font-extrabold text-lg md:text-xl text-[#1A1A1A] dark:text-white leading-tight">+212 631-636475</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#FFFBF0] dark:bg-white/5 border border-[#EADFC8]/60 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#C9A86A] dark:text-[#FFD700]">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-[13px] tracking-[0.22em] uppercase text-[#C9A86A] dark:text-white/50 font-bold mb-1">Email</div>
                      <div className="font-extrabold text-lg md:text-xl text-[#1A1A1A] dark:text-white leading-tight break-all">contact@wizackauto.ma</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#FFFBF0] dark:bg-white/5 border border-[#EADFC8]/60 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#C9A86A] dark:text-[#FFD700]">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="text-xs md:text-[13px] tracking-[0.22em] uppercase text-[#C9A86A] dark:text-white/50 font-bold mb-1">Horaires</div>
                      <div className="font-bold text-base md:text-lg text-[#1A1A1A] dark:text-white leading-tight">Lun-Ven: 08:30 - 18:30</div>
                      <div className="font-bold text-base md:text-lg text-[#1A1A1A] dark:text-white leading-tight mt-1">Sam: 09:00 - 13:00</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-3">
                  <a
                    href="https://www.google.com/maps/place/Wizack+Auto/@33.6018449,-7.5849294,860m/data=!3m1!1e3!4m14!1m7!3m6!1s0xda7cd00558bd2e1:0x43086bb077e03724!2sWizack+Auto!8m2!3d33.6018405!4d-7.5823491!16s%2Fg%2F11y_j_qg_r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#C9A86A] dark:bg-gradient-to-r dark:from-[#D4AF37] dark:to-[#FFD700] text-white dark:text-black rounded-full px-5 py-3.5 text-xs tracking-[0.16em] font-semibold text-center hover:brightness-110 transition shadow-[0_6px_20px_rgba(201,168,106,0.3)] dark:shadow-[0_6px_20px_rgba(255,215,0,0.25)]"
                  >
                    Ouvrir dans Google Maps
                  </a>
                  <a
                    href="https://waze.com/ul?q=20%20Rue%20du%20Dr%20Roux%20Casablanca%2020290&ll=33.6018405,-7.5823491&navigate=yes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white dark:bg-white/5 border border-[#EADFC8] dark:border-white/15 text-[#1A1A1A] dark:text-white rounded-full px-5 py-3.5 text-xs tracking-[0.16em] font-semibold text-center transition hover:bg-[#FFFEF8] dark:hover:bg-white/10"
                  >
                    Ouvrir dans Waze
                  </a>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=33.6018405,-7.5823491"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#FFFEF8] dark:bg-transparent border border-dashed border-[#EADFC8] dark:border-white/20 text-[#1A1A1A] dark:text-white rounded-full px-5 py-3.5 text-xs tracking-[0.16em] font-semibold text-center transition hover:bg-white dark:hover:bg-white/5"
                  >
                    Itinéraire direct
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-[#EADFC8]/40 dark:border-white/10 text-xs text-[#6B6B6B] dark:text-white/60 leading-[1.6]">
                  Retrait express en magasin • Atelier sur RDV • Livraison partout au Maroc
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PageShell>
  );
}
