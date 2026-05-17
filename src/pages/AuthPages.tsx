import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Mail, ChevronRight, LogOut, Package, Settings, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { useUserStore } from "../store";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useUserStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = email.trim().toLowerCase();
    const password = pass.trim();

    const isAdmin =
      (identifier === "admin" || identifier === "admin@wizack.com") &&
      (password === "123123" || password === "123");

    if (isAdmin) {
      window.localStorage.setItem("wizack-auth-role", "ADMIN");
      login({ id: "admin", email: identifier, name: "Admin" });
      navigate("/admin");
      return;
    }

    window.localStorage.removeItem("wizack-auth-role");
    if (!identifier || !password) {
      setError("Identifiant ou mot de passe invalide.");
      return;
    }

    login({ id: "1", email: identifier, name: "Utilisateur" });
    navigate("/profile");
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Connexion</h1>
            <p className="text-sm opacity-60">Accédez à votre espace Wizack Auto</p>
          </div>

          <div className="card-premium p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Identifiant / E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                  <input value={email} onChange={e => setEmail(e.target.value)} className="input-premium w-full pl-12" placeholder="Votre email" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                  <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="input-premium w-full pl-12" placeholder="Votre mot de passe" required />
                </div>
              </div>
              {error ? (
                <div className="text-xs font-bold rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "rgb(239,68,68)" }}>
                  {error}
                </div>
              ) : null}
              <button type="submit" className="btn-gold w-full py-4 text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                Se Connecter <ChevronRight size={16} />
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
              <p className="text-xs opacity-60">Pas encore de compte ?</p>
              <Link to="/register" className="mt-2 inline-block text-xs font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline">Créer un compte</Link>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const login = useUserStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ id: "1", email, name });
    navigate("/profile");
  };

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Inscription</h1>
            <p className="text-sm opacity-60">Rejoignez l'univers de l'excellence automobile</p>
          </div>

          <div className="card-premium p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                  <input value={name} onChange={e => setName(e.target.value)} className="input-premium w-full pl-12" placeholder="Jean Dupont" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-premium w-full pl-12" placeholder="votre@email.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                  <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="input-premium w-full pl-12" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" className="btn-gold w-full py-4 text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                Créer mon compte <ChevronRight size={16} />
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
              <p className="text-xs opacity-60">Déjà un compte ?</p>
              <Link to="/login" className="mt-2 inline-block text-xs font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline">Se connecter</Link>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export function ProfilePage() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <PageShell>
      <main className="container mx-auto px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="card-premium p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#C9A84C] text-[#0A0A0A] flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                  {user.name.slice(0, 1)}
                </div>
                <h2 className="font-black uppercase tracking-widest text-sm">{user.name}</h2>
                <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">{user.email}</p>
              </div>

              <div className="card-premium p-2 space-y-1">
                {[
                  { label: "Mes Commandes", icon: <Package size={18} /> },
                  { label: "Mes Adresses", icon: <Mail size={18} /> },
                  { label: "Sécurité", icon: <ShieldCheck size={18} /> },
                  { label: "Paramètres", icon: <Settings size={18} /> },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-item-bg)] text-xs font-bold transition-colors">
                    <span className="opacity-40">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 text-xs font-bold transition-colors mt-4">
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-8">
              <div className="card-premium p-8">
                <h1 className="text-2xl font-black uppercase tracking-widest mb-8">Espace Client</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: "Commandes", value: "0" },
                    { label: "Retours", value: "0" },
                    { label: "Messages", value: "0" },
                  ].map((s, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[var(--color-item-bg)] border border-[var(--border)] text-center">
                      <p className="text-3xl font-black mb-1">{s.value}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-8 text-center py-20">
                <Package size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-bold opacity-40">Vous n'avez pas encore de commande.</p>
                <Link to="/catalogue" className="mt-6 inline-block btn-gold px-8 py-3 text-[10px] font-black uppercase tracking-widest">Parcourir le catalogue</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
