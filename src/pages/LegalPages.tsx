import { PageShell } from "../components/PageShell";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingMinutes: number;
  tags: string[];
  heroImage?: string;
  content: Array<{ kind: "p" | "h2" | "ul"; text?: string; items?: string[] }>;
};

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "comment-choisir-la-bonne-piece-auto",
    title: "Comment choisir la bonne pièce auto (sans se tromper)",
    excerpt:
      "Référence OEM, compatibilité, marque, et erreurs fréquentes. Un guide simple pour acheter la bonne pièce du premier coup.",
    date: "2026-05-18",
    readingMinutes: 4,
    tags: ["Guide", "Compatibilité", "Conseils"],
    heroImage: "/garage/zone-03-vidange.webp",
    content: [
      {
        kind: "p",
        text:
          "Le plus important avant d’acheter une pièce auto, c’est la compatibilité. Une pièce peut avoir le bon nom, mais ne pas correspondre à ta motorisation, ton année, ou ton châssis.",
      },
      { kind: "h2", text: "1) Utilise la référence OEM quand c’est possible" },
      {
        kind: "p",
        text:
          "La référence OEM (constructeur) permet d’éviter 90% des erreurs. Si tu l’as, compare-la directement.",
      },
      { kind: "h2", text: "2) Vérifie les détails techniques" },
      {
        kind: "ul",
        items: ["Année / phase", "Motorisation", "Type de boîte", "Dimensions (ex: filtres, disques, pneus)"],
      },
      { kind: "h2", text: "3) Choisis une marque fiable" },
      {
        kind: "p",
        text:
          "Le prix n’est pas toujours un bon indicateur. Privilégie les marques reconnues pour la catégorie concernée (freinage, filtration, etc.).",
      },
    ],
  },
  {
    slug: "freinage-quand-changer-plaquettes-disques",
    title: "Freinage : quand changer plaquettes et disques ?",
    excerpt:
      "Signes d’usure, distances de freinage, bruit, vibrations. Les bons réflexes pour rouler en sécurité.",
    date: "2026-05-18",
    readingMinutes: 3,
    tags: ["Freinage", "Sécurité"],
    heroImage: "/garage/zone-02-pneus.webp",
    content: [
      {
        kind: "p",
        text:
          "Un freinage fatigué, c’est plus de distance d’arrêt et une usure accélérée. L’important est de surveiller les signes avant la panne.",
      },
      { kind: "h2", text: "Signes fréquents" },
      {
        kind: "ul",
        items: ["Bruit métallique", "Vibration au freinage", "Pédale spongieuse", "Voiture qui tire d’un côté"],
      },
      {
        kind: "p",
        text:
          "Si tu as un doute, fais vérifier rapidement. Le coût d’un contrôle est faible comparé au risque.",
      },
    ],
  },
  {
    slug: "pneus-bonnes-dimensions-largeur-hauteur-diametre",
    title: "Pneus : comprendre largeur / hauteur / diamètre",
    excerpt:
      "205/55 R16 ? On t’explique comment lire une dimension, et comment choisir la bonne monte.",
    date: "2026-05-18",
    readingMinutes: 3,
    tags: ["Pneus", "Guide"],
    heroImage: "/garage/zone-02-pneus.webp",
    content: [
      {
        kind: "p",
        text:
          "La dimension d’un pneu se lit sous la forme 205/55 R16. Chaque chiffre a une signification et influence le confort et la tenue de route.",
      },
      { kind: "h2", text: "Décryptage rapide" },
      {
        kind: "ul",
        items: [
          "205 = largeur (mm)",
          "55 = hauteur (ratio en % de la largeur)",
          "R16 = diamètre de jante (pouces)",
        ],
      },
      {
        kind: "p",
        text:
          "Pour éviter les erreurs, respecte la monte homologuée ou demande une confirmation avant achat.",
      },
    ],
  },
];

const ensureMeta = (name: string, content: string) => {
  const head = document.head;
  if (!head) return;
  const existing = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  const el = existing ?? document.createElement("meta");
  el.setAttribute("name", name);
  el.setAttribute("content", content);
  if (!existing) head.appendChild(el);
};

const ensureOg = (property: string, content: string) => {
  const head = document.head;
  if (!head) return;
  const existing = head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  const el = existing ?? document.createElement("meta");
  el.setAttribute("property", property);
  el.setAttribute("content", content);
  if (!existing) head.appendChild(el);
};

const ensureCanonical = (href: string) => {
  const head = document.head;
  if (!head) return;
  const existing = head.querySelector(`link[rel="canonical"]`) as HTMLLinkElement | null;
  const el = existing ?? document.createElement("link");
  el.setAttribute("rel", "canonical");
  el.setAttribute("href", href);
  if (!existing) head.appendChild(el);
};

const useSeo = (title: string, description: string, canonicalPath: string, image?: string) => {
  useEffect(() => {
    const origin = window.location.origin;
    const canonical = `${origin}${canonicalPath}`;
    document.title = title;
    ensureMeta("description", description);
    ensureCanonical(canonical);
    ensureOg("og:title", title);
    ensureOg("og:description", description);
    ensureOg("og:url", canonical);
    ensureOg("og:type", "website");
    ensureMeta("twitter:card", "summary_large_image");
    if (image) ensureOg("og:image", `${origin}${image.startsWith("/") ? image : `/${image}`}`);
  }, [canonicalPath, description, image, title]);
};

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

export function BlogPage() {
  useSeo(
    "Blog Wizack Auto — Conseils & Guides",
    "Guides et conseils pour choisir les bonnes pièces auto, pneus, freinage, et entretien.",
    "/blog"
  );

  const posts = useMemo(
    () => BLOG_POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    []
  );

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="card-premium p-10">
            <h1 className="text-3xl font-black uppercase tracking-widest">Blog</h1>
            <p className="mt-2 text-sm opacity-60">
              Conseils pratiques pour acheter la bonne pièce et entretenir votre véhicule.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${encodeURIComponent(p.slug)}`}
                  className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                  style={{ border: "1px solid var(--border)", background: "var(--card)" }}
                >
                  {p.heroImage ? (
                    <div className="w-full h-44 overflow-hidden" style={{ background: "var(--color-item-bg)" }}>
                      <img src={p.heroImage} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{p.date}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{p.readingMinutes} min</p>
                    </div>
                    <h2 className="mt-3 text-lg font-black" style={{ color: "var(--color-text-primary)" }}>
                      {p.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {p.excerpt}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function BlogPostPage() {
  const { slug = "" } = useParams();
  const post = useMemo(() => BLOG_POSTS.find((p) => p.slug === slug) || null, [slug]);

  useSeo(
    post ? `${post.title} — Wizack Auto` : "Article introuvable — Wizack Auto",
    post ? post.excerpt : "Cet article n'existe pas ou a été déplacé.",
    post ? `/blog/${encodeURIComponent(post.slug)}` : "/blog",
    post?.heroImage
  );

  if (!post) {
    return (
      <PageShell>
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto card-premium p-10 space-y-6">
            <h1 className="text-3xl font-black uppercase tracking-widest">Article introuvable</h1>
            <p className="text-sm opacity-60">Cet article n'existe pas ou a été déplacé.</p>
            <Link to="/blog" className="btn-gold px-8 py-4 text-xs tracking-widest uppercase inline-flex">
              Retour au blog
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto card-premium overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {post.heroImage ? (
            <div className="w-full h-56 overflow-hidden" style={{ background: "var(--color-item-bg)" }}>
              <img src={post.heroImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="p-10 space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {post.date} • {post.readingMinutes} min
              </p>
              <h1 className="text-3xl font-black" style={{ color: "var(--color-text-primary)" }}>
                {post.title}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {post.excerpt}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-6 opacity-80">
              {post.content.map((b, i) => {
                if (b.kind === "h2") return <h2 key={i} className="text-lg font-bold text-white">{b.text}</h2>;
                if (b.kind === "ul") {
                  const items = Array.isArray(b.items) ? b.items : [];
                  return (
                    <ul key={i}>
                      {items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i}>{b.text}</p>;
              })}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Link to="/blog" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.18)", color: "var(--color-text-primary)" }}>
                Retour blog
              </Link>
              <Link to="/catalogue" className="btn-gold px-6 py-3 text-xs tracking-widest uppercase inline-flex">
                Voir le catalogue
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
