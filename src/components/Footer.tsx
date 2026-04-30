import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="border-t mt-auto relative overflow-hidden"
      style={{ borderColor: "rgba(201, 168, 76, 0.12)", backgroundColor: "var(--surface)" }}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }} />

      <div className="container mx-auto px-4 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10">
                <img
                  src="/logo-96.jpg"
                  srcSet="/logo-96.jpg 1x, /logo-192.jpg 2x"
                  sizes="40px"
                  alt="WIZACK AUTO"
                  className="w-10 h-10 object-contain rounded-lg dark:invert dark:brightness-110"
                  width={40}
                  height={40}
                  decoding="async"
                />
              </div>
              <div>
                <p className="font-heading font-extrabold text-base tracking-[0.1em] text-gold-gradient">
                  WIZACK AUTO
                </p>
                <p className="text-[9px] tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>
                  Pièces Automobiles
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
              Votre partenaire de confiance pour l'importation et la vente de pièces automobiles de qualité supérieure.
            </p>
          </div>

          {/* Wrapper for links to show 2 per line on mobile */}
          <div className="grid grid-cols-2 sm:contents gap-8">
            {/* Navigation */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--color-primary)" }}>
                Navigation
              </h3>
              <div className="grid gap-2.5">
                {[
                  { href: "/catalogue", label: "Catalogue" },
                  { href: "/categories", label: "Catégories" },
                  { href: "/marques", label: "Marques" },
                  { href: "/vehicle-selector", label: "Identification" },
                  { href: "/atelier", label: "Atelier" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    to={href}
                    className="text-xs transition-all duration-200 hover:text-[#C9A84C] inline-flex"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--color-primary)" }}>
                Infos
              </h3>
              <div className="grid gap-2.5">
                {[
                  { href: "/terms", label: "Conditions" },
                  { href: "/privacy", label: "Confidentialité" },
                  { href: "/login", label: "Espace Client" },
                  { href: "/register", label: "S'inscrire" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    to={href}
                    className="text-xs transition-all duration-200 hover:text-[#C9A84C] inline-flex"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--color-primary)" }}>
              Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
              {[
                { icon: <MapPin size={13} />, text: "Casablanca, Maroc" },
                { icon: <Phone size={13} />, text: "+212 6XX-XXXXXX" },
                { icon: <Mail size={13} />, text: "contact@wizackauto.ma" },
                { icon: <Clock size={13} />, text: "Lun-Sam: 9h-19h" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span style={{ color: "#C9A84C" }}>{icon}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-auto mb-6"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.20), transparent)" }}
        />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            © 2026 <span className="text-[#C9A84C] font-semibold">Wizack Auto</span>. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Fait avec</span>
            <span style={{ color: "#C9A84C" }}>♥</span>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>au Maroc</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
