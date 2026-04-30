import { Link } from "react-router-dom";
import { Menu, Moon, Search, ShoppingCart, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "../store";

export function Navbar() {
  const storageKey = "wizack-theme";

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const cartCount = useCartStore((state) => state.getTotalCount());

  const applyTheme = (nextTheme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme: "light" | "dark" = root.classList.contains("dark") ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b"
      style={{ borderColor: "rgba(201, 168, 76, 0.15)" }}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-heading font-bold text-xl tracking-wider flex items-center gap-3 group">
          <div className="relative w-12 h-12 flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="WIZACK AUTO"
              className="w-12 h-12 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 block dark:hidden"
            />
            <img
              src="/logodark.jpg"
              alt="WIZACK AUTO"
              className="w-12 h-12 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 hidden dark:block"
            />
          </div>
          <span className="flex flex-col leading-tight">
            <span className="text-gold-gradient text-lg font-extrabold tracking-[0.12em]">
              WIZACK AUTO
            </span>
            <span className="text-[10px] font-normal tracking-widest uppercase"
              style={{ color: "var(--color-text-secondary)" }}>
              Pièces de Rechange
            </span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/catalogue", label: "Catalogue" },
            { href: "/atelier", label: "Atelier" },
            { href: "/categories", label: "Catégories" },
            { href: "/marques", label: "Marques" },
            { href: "/vehicle-selector", label: "Identification Véhicule" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className="text-sm font-medium transition-all duration-200 relative group"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span className="group-hover:text-[#C9A84C] transition-colors">{label}</span>
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-[#C9A84C] to-[#E8D5A3] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Changer le thème"
            className="transition-colors duration-200 hover:text-[#C9A84C]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Moon size={20} className="hidden dark:block" />
            <Sun size={20} className="block dark:hidden" />
          </button>
          <Link
            to="/search"
            aria-label="Rechercher"
            className="transition-colors duration-200 hover:text-[#C9A84C]"
            style={{ color: "var(--color-text-secondary)" }}>
            <Search size={20} />
          </Link>
          <Link
            to="/login"
            aria-label="Mon compte"
            className="hidden sm:inline-flex transition-colors duration-200 hover:text-[#C9A84C]"
            style={{ color: "var(--color-text-secondary)" }}>
            <User size={20} />
          </Link>
          <Link to="/cart"
            aria-label="Panier"
            className="transition-colors duration-200 hover:text-[#C9A84C] relative"
            style={{ color: "var(--color-text-secondary)" }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold text-[#0A0A0A]"
                style={{ background: "linear-gradient(135deg, #C9A84C, #B8860B)" }}>
                {cartCount}
              </span>
            )}
          </Link>
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden transition-colors hover:text-[#C9A84C]"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label={isMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMobileOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            aria-label="Fermer le menu"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            className="absolute top-20 left-0 right-0 z-50"
            style={{
              background: "var(--surface)",
              borderTop: "1px solid rgba(201,168,76,0.12)",
              borderBottom: "1px solid rgba(201,168,76,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div className="container mx-auto px-4 py-5">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { href: "/catalogue", label: "Catalogue" },
                  { href: "/atelier", label: "Atelier" },
                  { href: "/categories", label: "Catégories" },
                  { href: "/marques", label: "Marques" },
                  { href: "/vehicle-selector", label: "Identification Véhicule" },
                  { href: "/ai-search", label: "Recherche IA" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    to={href}
                    onClick={() => setIsMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold hover-glow transition-all"
                    style={{
                      background: "var(--card)",
                      border: "1px solid rgba(201,168,76,0.12)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                    style={{
                      background: "rgba(201,168,76,0.10)",
                      border: "1px solid rgba(201,168,76,0.18)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <User size={18} />
                    Mon Compte
                  </Link>
                <Link
                  to="/cart"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                    color: "#0A0A0A",
                    boxShadow: "0 10px 35px rgba(201,168,76,0.25)",
                  }}
                >
                  <ShoppingCart size={18} />
                  Panier
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
