import { lazy, Suspense, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

const Scene = lazy(() => import('./Scene'))

// ⚠️ À personnaliser : coordonnées réelles du garage.
const CONTACT = {
  phone: '06 31 63 64 75',
  whatsapp: '212631636475', // format international sans "+"
  address: 'Casablanca, Maroc',
  hours: 'Lun – Sam : 9h00 – 19h00',
  lat: 33.6018405,
  lng: -7.5823491,
  mapsUrl: 'https://www.google.com/maps/place/Wizack+Auto/@33.6018405,-7.5823491,17z',
}

const CATEGORIES = [
  { icon: 'M3 9h3l2-3h6l1 2h3v3h2v4h-2v2H8l-2-2H3z M9 9v3h6V9', title: 'Moteur & transmission', text: 'Filtres, courroies, bougies, embrayages et pièces moteur d’origine ou adaptables.' },
  { icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', title: 'Pneus & jantes', text: 'Large choix de pneumatiques, montage et équilibrage sur place.' },
  { icon: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', title: 'Vidange & entretien', text: 'Huiles, filtres, liquides : l’entretien complet de votre véhicule.' },
  { icon: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z', title: 'Éclairage', text: 'Phares, feux, ampoules LED et xénon pour voir et être vu.' },
  { icon: 'M3 15l2-6h14l2 6v4h-3v-2H6v2H3z M5 15h14 M7 12h.01 M17 12h.01', title: 'Carrosserie', text: 'Pare-chocs, ailes, rétroviseurs et accessoires pour toutes marques.' },
]

const REASONS = [
  { n: '01', t: 'Pièces de qualité', d: 'Origine et équivalents sélectionnés, testés avant la vente.' },
  { n: '02', t: 'Garage sur place', d: 'Nos mécaniciens montent la pièce que vous achetez chez nous.' },
  { n: '03', t: 'Conseil honnête', d: 'On vous oriente vers la bonne pièce, pas la plus chère.' },
  { n: '04', t: 'Réponse rapide', d: 'Envoyez votre véhicule et la pièce : on répond le jour même.' },
]

const BRANDS = ['Renault', 'Peugeot', 'Dacia', 'Volkswagen', 'Toyota', 'Hyundai', 'Citroën', 'Mercedes', 'BMW', 'Audi', 'Kia', 'Ford']

const fade = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
}

export default function App() {
  const [form, setForm] = useState({ name: '', car: '', part: '' })

  const send = (e: FormEvent) => {
    e.preventDefault()
    const msg = `Bonjour Wizack Auto, je suis ${form.name}. Véhicule : ${form.car}. Pièce recherchée : ${form.part}.`
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <header className="nav">
        <a href="#top" className="brand">
          <img src="/logo-192.jpg" alt="" />
          WIZACK<span>AUTO</span>
        </a>
        <nav>
          <a href="#pieces">Pièces</a>
          <a href="#garage">Garage</a>
          <a href="#contact" className="btn small">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <motion.p className="eyebrow" {...fade}>Garage · Pièces automobiles</motion.p>
          <motion.h1 {...fade} transition={{ ...fade.transition, delay: 0.1 }}>
            Les bonnes pièces.<br /><em>Le bon montage.</em>
          </motion.h1>
          <motion.p className="lead" {...fade} transition={{ ...fade.transition, delay: 0.2 }}>
            Wizack Auto vend et monte des pièces de voiture de qualité, pour toutes les marques.
          </motion.p>
          <motion.div className="cta" {...fade} transition={{ ...fade.transition, delay: 0.3 }}>
            <a href="#contact" className="btn">Demander une pièce</a>
            <a href="#pieces" className="btn ghost">Voir les catégories</a>
          </motion.div>
          <div className="scroll-hint">Défiler ↓</div>
        </section>

        <div className="marquee" aria-label="Marques de voitures">
          <div className="track">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}</span>)}
          </div>
        </div>

        <section id="pieces" className="block right">
          <motion.h2 {...fade}>Nos pièces</motion.h2>
          <div className="cards">
            {CATEGORIES.map((c, i) => (
              <motion.article key={c.title} className="card" {...fade} transition={{ ...fade.transition, delay: i * 0.08 }} whileHover={{ y: -6 }}>
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={c.icon} /></svg>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="garage" className="block left">
          <motion.h2 {...fade}>Pourquoi Wizack Auto</motion.h2>
          <ul className="reasons">
            {REASONS.map((r, i) => (
              <motion.li key={r.n} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }}>
                <b>{r.n}</b>
                <div><h3>{r.t}</h3><p>{r.d}</p></div>
              </motion.li>
            ))}
          </ul>
        </section>

        <section id="contact" className="block center">
          <motion.h2 {...fade}>Trouvons votre pièce</motion.h2>
          <motion.form className="form" onSubmit={send} {...fade}>
            <input required placeholder="Votre nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required placeholder="Marque, modèle, année" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} />
            <input required placeholder="Pièce recherchée" value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} />
            <button className="btn" type="submit">Envoyer sur WhatsApp</button>
          </motion.form>
          <p className="info"><a href={`tel:+212631636475`}>{CONTACT.phone}</a><span>{CONTACT.address}</span><span>{CONTACT.hours}</span></p>
          <motion.div className="map" {...fade}>
            <iframe
              title="Localisation de Wizack Auto"
              src={`https://maps.google.com/maps?q=${CONTACT.lat},${CONTACT.lng}&z=17&hl=fr&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a className="btn small" href={CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer">Ouvrir dans Google Maps</a>
          </motion.div>
        </section>
      </main>

      <a
        className="wa"
        href={`https://wa.me/${CONTACT.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Écrire sur WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
      </a>

      <footer>© {new Date().getFullYear()} Wizack Auto — Tous droits réservés</footer>
    </>
  )
}
