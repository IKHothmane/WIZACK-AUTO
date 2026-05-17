import { memo, useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PageShell } from "../components/PageShell";
import { 
  type Product, 
  type Category as DbCategory, 
  type Subcategory as DbSubcategory,
  isSupabaseConfigured,
  fetchSubcategoriesForCategory
} from "../lib/supabase";

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 animate-fade-in-up">
      <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>{label}</p>
      <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

const CategoryCard = memo(({ 
  category, 
  index, 
  subs, 
  loading, 
  ensureSubcategoriesLoaded,
  navigate 
}: { 
  category: DbCategory; 
  index: number;
  subs: DbSubcategory[];
  loading: boolean;
  ensureSubcategoriesLoaded: (cat: DbCategory) => Promise<void>;
  navigate: any;
}) => {
  const [hoverOpen, setHoverOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [cycleIndex, setCycleIndex] = useState(0);

  const prefersHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const isOpen = prefersHover && hoverOpen;

  useEffect(() => {
    if (!isOpen || !subs.length) {
      setCycleIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % Math.min(subs.length, 6));
    }, 1500);
    return () => clearInterval(interval);
  }, [isOpen, subs.length]);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openForHover = () => {
    cancelCloseTimer();
    setHoverOpen(true);
    void ensureSubcategoriesLoaded(category);
  };

  const scheduleCloseForHover = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setHoverOpen(false);
    }, 140);
  };

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!wrapperRef.current || !cardRef.current || !panelRef.current) return;

    const ctx = gsap.context(() => {
      const card = cardRef.current!;
      const panel = panelRef.current!;
      const title = card.querySelector("[data-category-title]");
      const _items = panel.querySelectorAll("[data-sub-card-hand]");

      gsap.set(panel, { opacity: 0, display: "none" });
      if (glowRef.current) gsap.set(glowRef.current, { opacity: 0, scale: 0.85 });

      const tl = gsap.timeline({ paused: true });
      tl.to(card, { y: -20, rotateX: 10, scaleX: 1.12, scaleY: 1.02, boxShadow: "0 35px 70px rgba(201,169,97,0.30)", duration: 0.5, ease: "power3.out" }, 0);
      if (glowRef.current) tl.to(glowRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0);
      if (imageRef.current) tl.to(imageRef.current, { scale: 1.15, rotate: 5, duration: 0.4 }, 0);
      if (title) tl.to(title, { color: "#C9A961", duration: 0.3 }, 0);
      tl.set(panel, { display: "block" }, 0.1);
      tl.to(panel, { opacity: 1, duration: 0.25, ease: "power2.out" }, 0.05);
      
      tlRef.current = tl;
    }, wrapperRef);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [subs.length]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const items = panel.querySelectorAll("[data-sub-card-hand]");
    if (!items.length) return;

    const total = items.length;
    items.forEach((item, i) => {
      const offset = (i - cycleIndex + total) % total;
      const isActive = offset === 0;
      
      gsap.to(item, {
        opacity: isOpen ? 1 : 0,
        scale: isOpen ? (isActive ? 1.2 : 0.85) : 0,
        z: isOpen ? (isActive ? 100 : -100 * offset) : -400,
        rotationY: isOpen ? 0 : 90,
        rotationZ: isOpen ? -15 + offset * 8 : -30,
        x: isOpen ? -60 + offset * 35 : -50,
        y: isOpen ? Math.abs(offset - 2.5) * 8 : 0,
        zIndex: total - offset,
        duration: 0.8,
        ease: "back.out(1.2)",
        overwrite: true
      });
    });
  }, [cycleIndex, isOpen]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (isOpen) tl.play();
    else tl.reverse();
  }, [isOpen]);

  return (
    <div
      ref={wrapperRef}
      className="category-3d-wrapper h-full"
      style={{ animationDelay: `${index * 0.08}s` }}
      onMouseEnter={() => {
        if (!prefersHover) return;
        openForHover();
      }}
      onMouseLeave={() => {
        if (!prefersHover) return;
        scheduleCloseForHover();
      }}
    >
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => {
          navigate(`/categories/${encodeURIComponent(category.slug)}`);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/categories/${encodeURIComponent(category.slug)}`);
          }
        }}
        className={`category-card-fx category-card-3d h-full p-0 group animate-fade-in-up cursor-pointer select-none ${isOpen ? "is-open" : ""}`}
      >
        <div ref={glowRef} className="category-card-fx-glow" />
        <div className="category-card-fx-content h-full">
          <div className="flex items-stretch h-full">
            <div className="w-16 sm:w-20 shrink-0 self-stretch overflow-hidden" style={{ background: "var(--color-item-bg)" }}>
              {category.image_url ? (
                <img ref={imageRef} src={category.image_url} alt={category.name} className="block w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base font-black" style={{ color: "#C9A961" }}>
                  {category.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex items-center min-w-0 flex-1 p-4 sm:p-6">
              <div className="min-w-0 flex-1 text-right">
                <p data-category-title className="text-sm sm:text-base font-bold line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                  {category.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={panelRef}
        className="sub-deck-3d"
        onMouseEnter={() => {
          if (!prefersHover) return;
          openForHover();
        }}
        onMouseLeave={() => {
          if (!prefersHover) return;
          scheduleCloseForHover();
        }}
      >
        {loading ? (
          <div className="sub-deck-3d-empty" style={{ color: "var(--color-text-secondary)" }}>...</div>
        ) : subs.length ? (
          subs.slice(0, 6).map((s) => {
            const img = s.image_url || category.image_url || "";
            return (
              <button
                key={s.id}
                type="button"
                data-sub-card-hand
                className="sub-card-hand"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/catalogue?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(s.name)}`);
                }}
                onMouseEnter={() => {
                  if (!prefersHover) return;
                  openForHover();
                }}
              >
                <div className="sub-card-hand-inner">
                  <div className="sub-card-hand-img">
                    {img ? (
                      <img src={img} alt={s.name} className="sub-img-hand object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base font-black" style={{ color: "#C9A84C" }}>
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="sub-name-hand">{s.name}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="sub-deck-3d-empty" style={{ color: "var(--color-text-secondary)" }}>—</div>
        )}
      </div>
    </div>
  );
});

CategoryCard.displayName = "CategoryCard";

export function CategoriesPage({ products, categories }: { products: Product[]; categories: DbCategory[] }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [subBySlug, setSubBySlug] = useState<Record<string, DbSubcategory[]>>({});
  const [subLoadingBySlug, setSubLoadingBySlug] = useState<Record<string, boolean>>({});

  const ensureSubcategoriesLoaded = useCallback(async (category: DbCategory) => {
    const slug = String(category.slug || "").trim();
    if (!slug) return;
    if (Object.prototype.hasOwnProperty.call(subBySlug, slug)) return;
    if (subLoadingBySlug[slug]) return;

    setSubLoadingBySlug((prev) => ({ ...prev, [slug]: true }));
    try {
      if (!isSupabaseConfigured()) {
        setSubBySlug((prev) => ({ ...prev, [slug]: [] }));
        return;
      }
      const next = await fetchSubcategoriesForCategory({ slug, name: category.name });
      setSubBySlug((prev) => ({ ...prev, [slug]: next.filter((s) => s.is_active) }));
    } catch {
      setSubBySlug((prev) => ({ ...prev, [slug]: [] }));
    } finally {
      setSubLoadingBySlug((prev) => ({ ...prev, [slug]: false }));
    }
  }, [subBySlug, subLoadingBySlug]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    categories.forEach((c) => {
      if (c.slug === "pneus-et-produits-associes") void ensureSubcategoriesLoaded(c);
    });
  }, [categories, ensureSubcategoriesLoaded]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    
    const ctx = gsap.context(() => {
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 50,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [categories]);

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Explorer" title="Catégories" subtitle="Choisis une catégorie pour ouvrir le catalogue filtré." />
          <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 auto-rows-fr">
            {categories.map((c, i) => (
              <CategoryCard 
                key={c.id} 
                category={c} 
                index={i}
                subs={subBySlug[c.slug] || []}
                loading={Boolean(subLoadingBySlug[c.slug])}
                ensureSubcategoriesLoaded={ensureSubcategoriesLoaded}
                navigate={navigate}
              />
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
