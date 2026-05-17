import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CreditCard, Truck, ShieldCheck, ShoppingBag } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { useCartStore } from "../store";
import { formatPrice } from "../lib/formatters";

export function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [step, setStep] = useState(1);

  if (items.length === 0) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold">Votre panier est vide</h1>
          <Link to="/catalogue" className="mt-4 inline-block btn-gold px-6 py-2">Retour au catalogue</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 sm:gap-12 mb-12">
            {[
              { id: 1, label: "Expédition", icon: <Truck size={18} /> },
              { id: 2, label: "Paiement", icon: <CreditCard size={18} /> },
              { id: 3, label: "Confirmation", icon: <ShieldCheck size={18} /> },
            ].map((s) => (
              <div key={s.id} className={`flex items-center gap-3 ${step === s.id ? "text-[var(--color-primary)]" : "opacity-40"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${step === s.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--border)]"}`}>
                  {s.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="card-premium p-8">
                <h2 className="text-xl font-black uppercase tracking-widest mb-8">Informations de livraison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Prénom</label>
                    <input className="input-premium w-full" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom</label>
                    <input className="input-premium w-full" placeholder="Doe" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse</label>
                    <input className="input-premium w-full" placeholder="123 Rue de l'Automobile" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Ville</label>
                    <input className="input-premium w-full" placeholder="Casablanca" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Téléphone</label>
                    <input className="input-premium w-full" placeholder="+212 6..." />
                  </div>
                </div>
              </div>

              <div className="card-premium p-8">
                <h2 className="text-xl font-black uppercase tracking-widest mb-8">Méthode de livraison</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-xl border border-[#C9A84C] bg-[#C9A84C]/5 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full border-4 border-[#C9A84C] bg-black" />
                      <div>
                        <p className="text-sm font-bold">Livraison Express (Wizack Delivery)</p>
                        <p className="text-[10px] opacity-60">Livraison sous 24-48h à Casablanca et régions.</p>
                      </div>
                    </div>
                    <span className="text-xs font-black">GRATUIT</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-premium p-8 sticky top-28">
                <h3 className="text-xl font-black uppercase tracking-widest mb-8">Votre Commande</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto mb-8 no-scrollbar">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 p-1 shrink-0">
                        <img src={item.image || "/logo-96.jpg"} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <p className="text-[10px] opacity-40">Qté: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-black">{formatPrice(item.price_cents * item.quantity, item.currency)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 pt-6 border-t border-[var(--border)]">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                    <span>Sous-total</span>
                    <span>{formatPrice(getTotalPrice(), "MAD")}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black uppercase tracking-widest pt-2">
                    <span>Total</span>
                    <span className="text-[var(--color-primary)]">{formatPrice(getTotalPrice(), "MAD")}</span>
                  </div>
                </div>

                <button className="btn-gold w-full py-4 mt-8 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                  Continuer au paiement <ChevronRight size={18} />
                </button>
                
                <p className="text-[9px] text-center mt-6 opacity-40 font-bold uppercase tracking-widest">
                  En commandant, vous acceptez nos conditions générales de vente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
