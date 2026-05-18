import { memo, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { Bot, ChevronRight, Package, Clock, MessageCircle } from "lucide-react";
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
      <div className="bg-[var(--bg)] text-[var(--text)] font-sans overflow-x-hidden min-h-screen">
        
        {/* 1. HERO SECTION */}
        <section className="relative w-full h-screen min-h-[700px] flex flex-col items-center justify-center overflow-hidden">
          {/* Light mode grid background */}
          <div className="absolute inset-0 z-0 bg-[#FAFAF8] opacity-100 dark:opacity-0 transition-opacity duration-500" style={{ backgroundImage: "linear-gradient(rgba(201,168,76,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          
          {/* Image mode clair */}
          <img src="/unnamed.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-100 dark:opacity-0 transition-opacity duration-500" />
          
          {/* Image mode sombre */}
          <img src="/unnamed (1).jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-0 dark:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute inset-0 bg-[var(--bg)]/40 dark:bg-[#0A0A0A]/40 z-0 pointer-events-none" />

          <div className="relative z-10 container mx-auto px-4 text-center h-full flex flex-col py-24 md:py-32">
            
            {/* Titre et description en haut */}
            <div className="mt-4 md:mt-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-[0.1em] text-[#FFD700] mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] uppercase">
                Wizack Auto
              </h1>
              <p className="max-w-2xl mx-auto text-sm md:text-base text-[var(--text)] opacity-90 font-medium drop-shadow-md">
                Votre plateforme dédiée à la vente de pièces automobiles de qualité supérieure et à la réservation de services d'atelier professionnels.
              </p>
            </div>
            
            {/* Stats et boutons en bas */}
            <div className="mt-auto mb-8">
              <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
                {[
                  { number: "15 000+", label: "Pièces Auto" },
                  { number: "50+", label: "Marques Premium" },
                  { number: "100%", label: "Services Garantis" },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center bg-[var(--card)]/30 backdrop-blur-md border border-[var(--border)] rounded-xl p-4 min-w-[140px] shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                    <span className="text-xl md:text-3xl font-black text-[#D4AF37] mb-1 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{stat.number}</span>
                    <span className="text-[10px] tracking-[0.15em] uppercase opacity-80 font-bold">{stat.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/catalogue" className="px-6 py-3 bg-[#D4AF37] hover:bg-[#FFD700] text-black font-black uppercase tracking-widest text-[10px] rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                  Parcourir le catalogue
                </Link>
                <Link to="/atelier" className="px-6 py-3 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-black uppercase tracking-widest text-[10px] rounded-full transition-all duration-300">
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
          
          {/* Filtre blanc pour le mode clair */}
          <div className="absolute inset-0 z-0 bg-white/50 dark:bg-black/20 transition-colors duration-500" />
          
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[var(--bg)]/80 via-transparent to-[var(--bg)]/80" />
          <div className="absolute inset-0 z-0" style={{background:"radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.1) 0%, transparent 50%)"}} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            {/* Layout: Left card | Center engine | Right cards */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-center">

              {/* LEFT: Engine Card */}
              <Link to={engineCategorySlug ? `/categories/${encodeURIComponent(engineCategorySlug)}` : "/categories"} className="relative group block">
                {/* Background Stack Cards */}
                <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform -translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:-translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform -translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:-translate-x-12 group-hover:translate-y-6 opacity-30">
                  <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                  <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                </div>
                
                <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  {/* Gold Corners */}
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

              {/* CENTER: Engine Image on Pedestal */}
              <div className="flex items-center justify-center relative min-h-[420px] lg:min-h-[560px] lg:w-[560px]">
                {/* Moteur Image */}
                <Link to={engineCategorySlug ? `/categories/${encodeURIComponent(engineCategorySlug)}` : "/categories"} className="block">
                  <img src="/moteur.png" alt="Moteur" className="relative z-10 -translate-y-4 lg:-translate-y-6 w-80 h-80 lg:w-[26rem] lg:h-[26rem] object-contain drop-shadow-[0_0_70px_rgba(212,175,55,0.7)] animate-float" />
                </Link>
              </div>

              {/* RIGHT: Brake + Suspension Cards */}
              <div className="flex flex-col gap-6">
                {/* Brake System */}
                <Link to={brakeCategorySlug ? `/categories/${encodeURIComponent(brakeCategorySlug)}` : "/categories"} className="relative group block">
                  {/* Background Stack Cards */}
                  <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                    <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                    <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                  </div>
                  <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:translate-x-12 group-hover:translate-y-6 opacity-30">
                    <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                    <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                  </div>
                  
                  <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    {/* Gold Corners */}
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

                {/* Suspension */}
                <Link to={suspensionCategorySlug ? `/categories/${encodeURIComponent(suspensionCategorySlug)}` : "/categories"} className="relative group block">
                  {/* Background Stack Cards */}
                  <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-md border border-[var(--border)] rounded-[20px] transform translate-x-4 translate-y-2 scale-[0.96] z-0 transition-all duration-500 group-hover:translate-x-6 group-hover:translate-y-3 opacity-60 shadow-lg">
                    <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                    <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                  </div>
                  <div className="absolute inset-0 bg-[var(--card)]/40 backdrop-blur-sm border border-[var(--border)] rounded-[20px] transform translate-x-8 translate-y-4 scale-[0.92] z-0 transition-all duration-500 group-hover:translate-x-12 group-hover:translate-y-6 opacity-30">
                    <div className="absolute -top-[6px] -left-[6px] w-10 h-10 border-t-[3px] border-l-[3px] border-[#D4AF37] rounded-tl-[26px] pointer-events-none" />
                    <div className="absolute -bottom-[6px] -right-[6px] w-10 h-10 border-b-[3px] border-r-[3px] border-[#D4AF37] rounded-br-[26px] pointer-events-none" />
                  </div>

                  <div className="relative z-10 bg-[var(--card)]/90 backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    {/* Gold Corners */}
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
           {/* Angled Lasers Background */}
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

        {/* 4. SERVICE BAY OPERATIONS */}
        <section className="relative w-full py-32 px-4 overflow-hidden min-h-[700px]">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
            @keyframes glowPulse {
              0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            }
            .font-orbitron { font-family: 'Orbitron', sans-serif; }
          `}</style>
          <img src="/screen3.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 z-0 bg-white/50 dark:bg-black/20 transition-colors duration-500" />

          <div className="relative z-10 w-full max-w-6xl mx-auto">
              <div className="w-full flex flex-col items-center justify-center mb-10 md:mb-16 mt-4 relative z-30">
                <h2 className="font-orbitron font-black tracking-[0.4em] text-white uppercase text-center text-3xl md:text-5xl lg:text-6xl mb-4" style={{ 
                  textShadow: `
                    0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa,
                    0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3),
                    0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2),
                    0 20px 20px rgba(0,0,0,.15), 0 0 30px rgba(212,175,55,0.8)
                  `
                }}>
                  WIZACK AUTO
                </h2>
                <p className="font-orbitron font-bold tracking-[0.3em] text-[#D4AF37] uppercase text-center text-sm md:text-lg lg:text-xl" style={{ 
                  textShadow: "0 0 10px rgba(212,175,55,0.5)"
                }}>
                  PÔLE INDUSTRIEL HAUTE TECHNOLOGIE
                </p>
              </div>

              {homeAtelierServices.length ? (
                <div className="grid grid-cols-1 gap-12 md:hidden px-4 py-8" style={{ perspective: "1000px" }}>
                  {homeAtelierServices.map((s) => {
                    const words = s.name.split(" ");
                    const l1 = words[0] || "";
                    const l2 = words.slice(1).join(" ") || "";
                    return (
                      <Link key={s.id} to="/atelier" className="relative w-full text-center block" style={{ transformStyle: "preserve-3d" }}>
                        <div
                          className="relative inline-block font-black tracking-[0.15em] text-white uppercase font-orbitron"
                          style={{
                            transform: "translateZ(30px)",
                            textShadow: `
                              1px 1px 0 #B8941F, 2px 2px 0 #A67F1A, 3px 3px 0 #946B15,
                              4px 4px 0 #7D5910, 5px 5px 0 #66470B, 6px 6px 0 #4F3506,
                              0 0 10px rgba(212,175,55,1), 0 0 20px rgba(212,175,55,0.8)
                            `,
                          }}
                        >
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "120%",
                              height: "120%",
                              background: "radial-gradient(ellipse, rgba(212,175,55,0.4), transparent 70%)",
                              filter: "blur(20px)",
                              zIndex: -1,
                              animation: "glowPulse 2s ease-in-out infinite",
                            }}
                          />
                          <span className="block text-[0.7rem] mb-[0.12rem]">{l1}</span>
                          <span className="block text-[0.92rem]">{l2}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="md:hidden px-4 py-10 text-center">
                  <p className="font-orbitron font-bold tracking-[0.25em] text-white/80 uppercase text-xs">
                    Services bientôt disponibles
                  </p>
                </div>
              )}

              {homeAtelierServices.length ? (
                <div className="hidden md:block relative w-full min-h-[520px]" style={{ perspective: "1200px" }}>
                  {homeAtelierServices.map((s, idx) => {
                  const slot = [
                    { side: "left", top: "30%", offset: "5%", rotY: 20, rotX: -10, rotZ: -15 },
                    { side: "left", top: "62%", offset: "5%", rotY: 20, rotX: -10, rotZ: -15 },
                    { side: "right", top: "30%", offset: "5%", rotY: -20, rotX: -10, rotZ: 15 },
                    { side: "right", top: "62%", offset: "5%", rotY: -20, rotX: -10, rotZ: 15 },
                  ][idx] || { side: "left", top: "30%", offset: "5%", rotY: 20, rotX: -10, rotZ: -15 };

                  const posStyle: React.CSSProperties =
                    slot.side === "left"
                      ? { left: slot.offset as any, top: slot.top as any }
                      : { right: slot.offset as any, top: slot.top as any };

                  const words = s.name.split(" ");
                  const l1 = words[0] || "";
                  const l2 = words.slice(1).join(" ") || "";

                    return (
                    <Link
                      key={s.id}
                      to="/atelier"
                      className="absolute transform-style-3d cursor-pointer"
                      style={{
                        ...posStyle,
                        transform: `rotateY(${slot.rotY}deg) rotateX(${slot.rotX}deg) rotateZ(${slot.rotZ}deg)`,
                        transformStyle: "preserve-3d",
                        zIndex: 20
                      }}
                    >
                      <div 
                        className="relative inline-block font-black tracking-[0.15em] text-white uppercase text-center font-orbitron transition-all duration-300"
                        style={{
                          transform: "translateZ(50px)",
                          textShadow: `
                            1px 1px 0 #B8941F,
                            2px 2px 0 #A67F1A,
                            3px 3px 0 #946B15,
                            4px 4px 0 #7D5910,
                            5px 5px 0 #66470B,
                            6px 6px 0 #4F3506,
                            7px 7px 0 #382301,
                            8px 8px 0 #211100,
                            0 0 10px rgba(212,175,55,1),
                            0 0 20px rgba(212,175,55,0.8),
                            0 0 40px rgba(212,175,55,0.6),
                            0 10px 20px rgba(0,0,0,0.8)
                          `
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateZ(80px) scale(1.1)";
                          e.currentTarget.style.textShadow = `
                            1px 1px 0 #B8941F, 2px 2px 0 #A67F1A, 3px 3px 0 #946B15, 4px 4px 0 #7D5910,
                            5px 5px 0 #66470B, 6px 6px 0 #4F3506, 7px 7px 0 #382301, 8px 8px 0 #211100,
                            9px 9px 0 #1A0D00, 10px 10px 0 #130900,
                            0 0 20px rgba(255,215,0,1), 0 0 40px rgba(212,175,55,1),
                            0 0 60px rgba(212,175,55,0.8), 0 15px 30px rgba(0,0,0,0.9)
                          `;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateZ(50px) scale(1)";
                          e.currentTarget.style.textShadow = `
                            1px 1px 0 #B8941F, 2px 2px 0 #A67F1A, 3px 3px 0 #946B15, 4px 4px 0 #7D5910,
                            5px 5px 0 #66470B, 6px 6px 0 #4F3506, 7px 7px 0 #382301, 8px 8px 0 #211100,
                            0 0 10px rgba(212,175,55,1), 0 0 20px rgba(212,175,55,0.8),
                            0 0 40px rgba(212,175,55,0.6), 0 10px 20px rgba(0,0,0,0.8)
                          `;
                        }}
                      >
                        {/* glowPulse pseudo-element */}
                        <div 
                          className="absolute pointer-events-none"
                          style={{
                            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: "120%", height: "120%",
                            background: "radial-gradient(ellipse, rgba(212,175,55,0.4), transparent 70%)",
                            filter: "blur(30px)",
                            zIndex: -1,
                            animation: "glowPulse 2s ease-in-out infinite"
                          }}
                        />
                        <span className="block text-[0.85rem] md:text-[0.85rem] mb-[0.2rem]">{l1}</span>
                        <span className="block text-[1.05rem] md:text-[1.25rem] leading-none">{l2}</span>
                      </div>
                    </Link>
                  );
                  })}
                </div>
              ) : (
                <div className="hidden md:flex items-center justify-center min-h-[520px]">
                  <p className="font-orbitron font-bold tracking-[0.25em] text-white/80 uppercase text-sm">
                    Services bientôt disponibles
                  </p>
                </div>
              )}
            </div>
        </section>

      </div>
    </PageShell>
  );
}
