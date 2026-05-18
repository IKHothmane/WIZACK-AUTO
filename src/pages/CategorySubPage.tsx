import { useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { 
  type Product,
  type Category as DbCategory, 
  type Subcategory as DbSubcategory,
  slugifyCategory,
  PNEUS_SUBCATEGORIES
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

export function CategorySubPage({ categories, products }: { categories: DbCategory[]; products: Product[] }) {
  const { slug = "" } = useParams();
  const category = useMemo(() => categories.find((c) => c.slug === slug) || null, [categories, slug]);
  const items = useMemo<DbSubcategory[]>(() => {
    if (!category) return [];
    const normalizeKey = (value: string) => String(value || "").trim().toLowerCase();
    const catKey = normalizeKey(category.name);
    const map = new Map<string, DbSubcategory>();
    let pos = 0;
    for (const p of products) {
      if (normalizeKey(p.category) !== catKey) continue;
      const sub = String(p.subcategory || "").trim();
      if (!sub) continue;
      const key = normalizeKey(sub);
      if (map.has(key)) continue;
      map.set(key, {
        id: `sub-${category.slug}-${key}`,
        parent_slug: category.slug,
        name: sub,
        slug: slugifyCategory(sub),
        position: pos++,
        is_active: true,
        image_url: undefined,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [category, products]);

  const fallback = useMemo<DbSubcategory[]>(() => {
    const slugNorm = slugifyCategory(category?.name || "");
    if (slug === "pneus-et-produits-associes" || slugNorm === "pneus-et-produits-associes") {
      return PNEUS_SUBCATEGORIES.map((name, i) => ({
        id: `sub-${slugNorm}-${i}`,
        parent_slug: slugNorm,
        name,
        slug: slugifyCategory(name),
        position: i,
        is_active: true,
        image_url: undefined,
      }));
    }
    return [];
  }, [category?.name, slug]);

  const visible = useMemo(() => (items.length ? items : fallback), [items, fallback]);

  if (!category) {
    return (
      <PageShell>
        <main className="container mx-auto px-4 py-14">
          <div className="max-w-4xl mx-auto">
            <PageCard title="Catégorie introuvable" subtitle="Cette catégorie n'existe pas.">
              <Link to="/categories" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
                Retour catégories
              </Link>
            </PageCard>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Choisir" title={category.name} subtitle="Sélectionnez une sous-catégorie." />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 auto-rows-fr">
            {visible.map((s, i) => (
              <Link
                key={s.id}
                to={`/catalogue?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(s.name)}`}
                className="category-card-fx category-card-3d h-full p-0 group animate-fade-in-up transition-transform hover:scale-[1.02]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="category-card-fx-content h-full">
                  <div className="flex items-stretch h-full">
                    <div className="w-16 sm:w-20 shrink-0 self-stretch overflow-hidden" style={{ background: "var(--color-item-bg)" }}>
                      {s.image_url || category.image_url ? (
                        <img src={s.image_url || category.image_url} alt={s.name} className="block w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base font-black" style={{ color: "#C9A961" }}>
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center min-w-0 flex-1 p-4 sm:p-5">
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-sm sm:text-base font-bold line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                          {s.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!visible.length ? (
            <div className="mt-8 card-premium p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucune sous-catégorie trouvée pour cette catégorie.
            </div>
          ) : null}

          <div className="mt-12">
            <Link to="/categories" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
              Retour catégories
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
