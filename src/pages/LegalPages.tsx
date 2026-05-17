import { PageShell } from "../components/PageShell";
import { useState } from "react";

export function TermsPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto card-premium p-10 space-y-8">
          <h1 className="text-3xl font-black uppercase tracking-widest">Conditions Générales</h1>
          <div className="prose prose-invert max-w-none text-sm opacity-60 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Objet</h2>
              <p>Les présentes conditions générales de vente régissent l'ensemble des relations entre la société Wizack Auto et ses clients.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. Prix</h2>
              <p>Les prix affichés sur le site sont indiqués en Dirhams Marocains (MAD) toutes taxes comprises.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Livraison</h2>
              <p>La livraison est effectuée à l'adresse indiquée par le client lors de la commande.</p>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto card-premium p-10 space-y-8">
          <h1 className="text-3xl font-black uppercase tracking-widest">Politique de Confidentialité</h1>
          <div className="prose prose-invert max-w-none text-sm opacity-60 leading-relaxed space-y-6">
            <p>Chez Wizack Auto, nous accordons une importance primordiale à la protection de vos données personnelles.</p>
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Collecte des données</h2>
              <p>Nous collectons les informations nécessaires au traitement de vos commandes et à l'amélioration de nos services.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Utilisation des cookies</h2>
              <p>Notre site utilise des cookies pour optimiser votre expérience de navigation.</p>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `Nom: ${name.trim()}`,
      `Email: ${email.trim()}`,
      "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const to = "admin@wizack.com";
    const subject = encodeURIComponent("Contact Wizack Auto");
    const bodyEncoded = encodeURIComponent(body);
    window.location.href = `mailto:${to}?subject=${subject}&body=${bodyEncoded}`;
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="card-premium p-10">
            <h1 className="text-3xl font-black uppercase tracking-widest">Contact</h1>
            <p className="mt-2 text-sm opacity-60">
              Envoyez-nous votre demande. Nous vous répondrons dès que possible.
            </p>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-3 text-sm">
                <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", background: "var(--color-item-bg)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Email</p>
                  <p className="mt-1 font-bold">admin@wizack.com</p>
                </div>
                <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", background: "var(--color-item-bg)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Téléphone</p>
                  <p className="mt-1 font-bold">+212 6XX-XXXXXX</p>
                </div>
                <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", background: "var(--color-item-bg)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ville</p>
                  <p className="mt-1 font-bold">Casablanca, Maroc</p>
                </div>
              </div>

              <form onSubmit={submit} className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="input-premium w-full mt-2" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium w-full mt-2" type="email" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-premium w-full mt-2 h-32" required />
                </div>
                <button type="submit" className="btn-gold px-8 py-4 text-xs tracking-widest uppercase">
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
