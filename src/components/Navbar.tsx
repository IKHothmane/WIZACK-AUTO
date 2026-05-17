import { Link, useNavigate } from "react-router-dom";
import { Menu, Moon, Search, ShoppingCart, Sun, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCartStore } from "../store";

export function Navbar({ searchItems = [] }: { searchItems?: Array<{ label: string; kind: "category" | "subcategory"; category?: string }> }) {
  const storageKey = "wizack-theme";
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const cartCount = useCartStore((state) => state.getTotalCount());
  const navigate = useNavigate();

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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/atelier", label: "Services" },
    { href: "/catalogue", label: "Auto's Depot" },
    { href: "/categories", label: "Catégories" },
    { href: "/marques", label: "Marques" },
    { href: "/contact", label: "Contact" },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    navigate(sp.toString() ? `/catalogue?${sp.toString()}` : "/catalogue");
    setIsMobileOpen(false);
  };

  const normalizedQuery = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }, [searchQ]);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    const max = 10;
    const out: Array<{ label: string; kind: "category" | "subcategory"; category?: string }> = [];
    for (const it of searchItems) {
      const label = String(it?.label || "").trim();
      if (!label) continue;
      const hay = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!hay.includes(normalizedQuery)) continue;
      out.push({ label, kind: it.kind, category: it.category });
      if (out.length >= max) break;
    }
    return out;
  }, [normalizedQuery, searchItems]);

  const onPickSuggestion = (it: { label: string; kind: "category" | "subcategory"; category?: string }) => {
    const sp = new URLSearchParams();
    if (it.kind === "category") {
      sp.set("category", it.label);
    } else {
      if (it.category) sp.set("category", it.category);
      sp.set("subcategory", it.label);
    }
    navigate(`/catalogue?${sp.toString()}`);
    setSearchQ(it.label);
    setIsMobileOpen(false);
    setSearchFocused(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      {/* Floating Pill Navbar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#D4AF37]/30 shadow-[0_4px_30px_rgba(0,0,0,0.1),0_0_15px_rgba(212,175,55,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(212,175,55,0.1)] bg-[var(--card)]/85 backdrop-blur-[20px]">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 pl-2 pr-4">
          <img src="/logo-96.jpg" alt="WIZACK AUTO" className="w-8 h-8 rounded-full object-contain dark:invert dark:brightness-110" width={32} height={32} />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded-full transition-all duration-300 text-[#D4AF37] dark:text-[#D4AF37]/70 hover:bg-[#D4AF37]/15 hover:text-[#FFD700] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="relative hidden lg:block">
          <form onSubmit={submitSearch} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/20 bg-[var(--card)]/70 backdrop-blur-[20px]">
            <Search size={16} className="text-[#D4AF37]/60" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              placeholder="Rechercher (catégorie / sous-catégorie)"
              className="bg-transparent outline-none text-xs font-bold tracking-wider text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] w-56"
            />
          </form>
          {searchFocused && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#D4AF37]/25 bg-[var(--card)]/95 backdrop-blur-[18px] overflow-hidden">
              {suggestions.map((it) => (
                <button
                  key={`${it.kind}:${it.category || ""}:${it.label}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickSuggestion(it)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[#D4AF37]/10"
                >
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{it.label}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/80">
                    {it.kind === "category" ? "Catégorie" : "Sous-catégorie"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#D4AF37]/20 ml-2">
          <button type="button" onClick={toggleTheme} aria-label="Thème" className="p-2 rounded-full transition-colors hover:bg-[#D4AF37]/15 text-[#D4AF37]/60 hover:text-[#FFD700]">
            <Moon size={16} className="hidden dark:block" />
            <Sun size={16} className="block dark:hidden" />
          </button>
          <Link to="/cart" aria-label="Panier" className="p-2 rounded-full transition-colors hover:bg-[#D4AF37]/15 text-[#D4AF37]/60 hover:text-[#FFD700] relative">
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold text-black" style={{ background: "linear-gradient(135deg, #D4AF37, #FFD700)" }}>{cartCount}</span>
            )}
          </Link>
          <Link to="/login" aria-label="Compte" className="hidden sm:flex p-2 rounded-full transition-colors hover:bg-[#D4AF37]/15 text-[#D4AF37]/60 hover:text-[#FFD700]">
            <User size={16} />
          </Link>
          <button type="button" className="md:hidden p-2 rounded-full transition-colors hover:bg-[#D4AF37]/15 text-[#D4AF37]/60" onClick={() => setIsMobileOpen((v) => !v)} aria-label={isMobileOpen ? "Fermer" : "Menu"}>
            {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-20">
          <button type="button" className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsMobileOpen(false)} aria-label="Fermer" />
          <div className="relative z-50 mx-4 mt-2 rounded-2xl border border-[#D4AF37]/30 p-4 bg-[var(--card)]/95 backdrop-blur-[20px]">
            <div className="relative mb-3">
              <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-[var(--card)]/70 px-3 py-2">
                <Search size={16} className="text-[#D4AF37]/60" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  placeholder="Rechercher (catégorie / sous-catégorie)"
                  className="bg-transparent outline-none text-sm font-bold tracking-wider text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] w-full"
                />
              </form>
              {searchFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#D4AF37]/25 bg-[var(--card)]/95 backdrop-blur-[18px] overflow-hidden z-50">
                  {suggestions.map((it) => (
                    <button
                      key={`m:${it.kind}:${it.category || ""}:${it.label}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onPickSuggestion(it)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-[#D4AF37]/10"
                    >
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{it.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/80">
                        {it.kind === "category" ? "Catégorie" : "Sous-catégorie"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map(({ href, label }) => (
                <Link key={href} to={href} onClick={() => setIsMobileOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:bg-[#D4AF37]/10" style={{ color: "#D4AF37" }}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/15 flex gap-2">
              <Link to="/login" onClick={() => setIsMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-[#D4AF37]/30 text-[#D4AF37]">
                <User size={16} /> Compte
              </Link>
              <Link to="/cart" onClick={() => setIsMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black" style={{ background: "linear-gradient(135deg, #D4AF37, #FFD700)" }}>
                <ShoppingCart size={16} /> Panier
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
