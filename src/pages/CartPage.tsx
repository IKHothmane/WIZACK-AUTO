import { Link } from "react-router-dom";
import { ChevronRight, Package, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { useCartStore } from "../store";
import { formatPrice } from "../lib/formatters";

export function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ShoppingCart size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-heading uppercase tracking-widest text-[var(--color-text-primary)]">Votre Panier</h1>
          </div>

          {items.length === 0 ? (
            <div className="card-premium p-16 text-center animate-fade-in">
              <Package size={64} className="mx-auto mb-6 opacity-20" />
              <h2 className="text-xl font-bold mb-4">Votre panier est vide</h2>
              <p className="text-[var(--color-text-secondary)] mb-8">Il semblerait que vous n'ayez pas encore ajouté de pièces à votre panier.</p>
              <Link to="/catalogue" className="btn-gold px-10 py-4 inline-flex items-center gap-3 uppercase tracking-widest text-sm">
                Découvrir le catalogue <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card-premium p-6 flex flex-col sm:flex-row items-center gap-6 group animate-fade-in">
                    <div className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 p-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package size={32} className="opacity-20" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-[10px] font-black tracking-widest text-[var(--color-primary)] uppercase mb-1">{item.brand}</p>
                      <Link to={`/produit/${item.slug}`} className="text-lg font-bold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors line-clamp-1">{item.name}</Link>
                      <p className="text-sm font-black mt-2 text-[var(--color-primary)]">{formatPrice(item.price_cents, item.currency)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-[var(--border)] rounded-xl bg-[var(--color-item-bg)]">
                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-3 py-2 hover:text-[var(--color-primary)]">-</button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 hover:text-[var(--color-primary)]">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="card-premium p-8 sticky top-28">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-6">Résumé</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60 font-bold uppercase tracking-wider">Sous-total</span>
                      <span className="font-bold">{formatPrice(getTotalPrice(), "MAD")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60 font-bold uppercase tracking-wider">Livraison</span>
                      <span className="text-green-500 font-bold uppercase tracking-wider">Gratuite</span>
                    </div>
                    <div className="pt-4 border-t border-[var(--border)] flex justify-between">
                      <span className="text-lg font-black uppercase tracking-widest">Total</span>
                      <span className="text-2xl font-black text-[var(--color-primary)]">{formatPrice(getTotalPrice(), "MAD")}</span>
                    </div>
                  </div>
                  <Link to="/checkout" className="btn-gold w-full py-4 mt-8 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                    Commander <ChevronRight size={18} />
                  </Link>
                  <p className="text-[10px] text-center mt-6 opacity-40 font-bold uppercase tracking-widest">Paiement 100% Sécurisé</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
