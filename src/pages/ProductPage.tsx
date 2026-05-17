import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Package, ShoppingBag, ShoppingCart, Star, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { type Product } from "../lib/supabase";
import { formatPrice } from "../lib/formatters";
import { useCartStore } from "../store";

export function ProductPage({ products }: { products: Product[] }) {
  const { slug } = useParams();
  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package size={48} className="mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold">Produit non trouvé</h1>
          <Link to="/catalogue" className="mt-4 inline-block btn-gold px-6 py-2">Retour au catalogue</Link>
        </div>
      </PageShell>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price_cents: product.price_cents,
      currency: product.currency,
      quantity,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-8 opacity-60">
            <Link to="/" className="hover:text-[var(--color-primary)]">Accueil</Link>
            <ChevronRight size={12} />
            <Link to="/catalogue" className="hover:text-[var(--color-primary)]">Catalogue</Link>
            <ChevronRight size={12} />
            <Link to={`/catalogue?category=${product.category}`} className="hover:text-[var(--color-primary)]">{product.category}</Link>
            <ChevronRight size={12} />
            <span className="text-[var(--color-text-primary)]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="card-premium p-8 aspect-square flex items-center justify-center bg-white/5 overflow-hidden group">
                <img 
                  src={product.image || "/logo-512.jpg"} 
                  alt={product.name} 
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="card-premium p-2 aspect-square flex items-center justify-center opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                    <img src={product.image || "/logo-512.jpg"} alt="" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-[var(--color-primary)] uppercase mb-2">{product.brand}</p>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--color-text-primary)] font-heading leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex text-yellow-500">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <span className="text-xs font-bold opacity-40 uppercase tracking-widest">12 Avis clients</span>
                </div>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-[var(--color-primary)]">{formatPrice(product.price_cents, product.currency)}</span>
                <span className="text-lg opacity-40 line-through">{formatPrice(product.price_cents * 1.2, product.currency)}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"}`} />
                  <span className="text-sm font-bold">{product.stock > 0 ? "En Stock — Expédition sous 24h" : "Sur Commande — Délai 7-10 jours"}</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Pièce automobile de haute qualité, certifiée conforme aux normes constructeurs. Cette référence est spécifiquement conçue pour offrir des performances optimales et une durabilité accrue.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center border border-[var(--border)] rounded-xl bg-[var(--color-item-bg)]">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:text-[var(--color-primary)] transition-colors">-</button>
                  <input type="number" value={quantity} readOnly className="w-12 text-center bg-transparent font-bold" />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 hover:text-[var(--color-primary)] transition-colors">+</button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 btn-gold py-4 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                  disabled={added}
                >
                  {added ? (
                    <>✅ Ajouté au panier</>
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      Ajouter au panier
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Garantie 2 ans</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck size={20} className="text-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Livraison Express</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw size={20} className="text-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Retour 30 jours</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star size={20} className="text-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Qualité Premium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-24">
              <h2 className="text-2xl font-black mb-8 uppercase tracking-widest">Produits Similaires</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {related.map(p => (
                  <Link key={p.id} to={`/produit/${p.slug}`} className="card-premium p-4 block group">
                    <div className="aspect-square mb-4 bg-white/5 rounded-xl p-4 flex items-center justify-center">
                      <img src={p.image || "/logo-512.jpg"} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">{p.brand}</p>
                    <p className="text-xs font-bold text-[var(--color-text-primary)] truncate mt-1">{p.name}</p>
                    <p className="text-sm font-black text-[var(--color-primary)] mt-2">{formatPrice(p.price_cents, p.currency)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
