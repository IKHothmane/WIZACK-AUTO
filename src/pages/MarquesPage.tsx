import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { 
  type Product, 
  type Brand as DbBrand 
} from "../lib/supabase";
import { useAdminStore } from "../store";

function SectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 animate-fade-in-up">
      <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#C9A84C" }}>{label}</p>
      <h2 className="text-3xl md:text-4xl font-heading font-black" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {subtitle && <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

export function MarquesPage({ products, brands }: { products: Product[]; brands: DbBrand[] }) {
  const { brands: brandsConfig } = useAdminStore();
  const [failedBrandLogos, setFailedBrandLogos] = useState<Set<string>>(() => new Set());

  const sourceBrands = useMemo(() => {
    if (brands.length) return brands;
    return brandsConfig.map((b, i) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logoUrl,
      is_visible: b.isVisible,
      position: i,
    })) as DbBrand[];
  }, [brands, brandsConfig]);

  const visibleBrands = useMemo(() => sourceBrands.filter((b) => b.is_visible).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), [sourceBrands]);
  
  const brandCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => { m[p.brand] = (m[p.brand] || 0) + 1; });
    return m;
  }, [products]);

  const getBrandLogo = (brandName: string) => {
    const norm = (brandName || "").trim().toLowerCase();
    const b = visibleBrands.find((v) => v.name.trim().toLowerCase() === norm);
    if (b?.logo_url && !failedBrandLogos.has(norm)) return b.logo_url;
    return `https://www.carlogos.org/car-logos/${norm.replace(/\s+/g, "-")}-logo.png`;
  };

  const handleImgError = (brandName: string) => {
    const norm = (brandName || "").trim().toLowerCase();
    setFailedBrandLogos((prev) => {
      const next = new Set(prev);
      next.add(norm);
      return next;
    });
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <SectionTitle label="Choisir" title="Marques" subtitle="Parcourez les pièces par marque de véhicule." />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleBrands.map((b, i) => (
              <Link
                key={b.id}
                to={`/catalogue?brand=${encodeURIComponent(b.name)}`}
                className="card-premium group p-6 flex flex-col items-center justify-center text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-20 h-20 mb-4 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                  <img
                    src={getBrandLogo(b.name)}
                    alt={b.name}
                    className="max-w-full max-h-full object-contain"
                    onError={() => handleImgError(b.name)}
                  />
                </div>
                <p className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--color-text-primary)" }}>
                  {b.name}
                </p>
                <p className="mt-1 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {brandCounts[b.name] || 0} Pièces
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
