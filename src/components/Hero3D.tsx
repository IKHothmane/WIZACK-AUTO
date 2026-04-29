import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero3D() {
  return (
    <div
      className="w-full min-h-[85vh] relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--bg) 60%, var(--bg) 100%)" }}
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 w-full h-full object-cover block dark:hidden"
          src="/animateL.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <video
          className="absolute inset-0 w-full h-full object-cover hidden dark:block"
          src="/animate.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        {/* Enhanced overlay gradient */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)"
        }} />
      </div>

      {/* Decorative gold particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              background: `radial-gradient(circle, rgba(201,168,76,${0.3 - i * 0.04}) 0%, transparent 70%)`,
              top: `${15 + i * 16}%`,
              left: `${10 + i * 18}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
        {/* Tagline badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 animate-fade-in-up pointer-events-auto"
          style={{
            background: "rgba(201,168,76,0.10)",
            border: "1px solid rgba(201,168,76,0.25)",
            backdropFilter: "blur(12px)",
            animationDelay: "0.1s",
          }}
        >
          <Sparkles size={14} style={{ color: "#C9A84C" }} />
          <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#C9A84C" }}>
            Importation • Vente • Excellence
          </p>
        </div>

        {/* Title */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-center uppercase tracking-tighter drop-shadow-2xl animate-fade-in-up"
          style={{
            background: "linear-gradient(135deg, #E8D5A3 0%, #C9A84C 40%, #8B6914 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animationDelay: "0.3s",
          }}
        >
          WIZACK AUTO
        </h1>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg lg:text-xl text-center max-w-2xl mt-5 drop-shadow-lg leading-relaxed animate-fade-in-up"
          style={{ color: "rgba(232,213,163,0.85)", animationDelay: "0.5s" }}
        >
          Trouvez instantanément les pièces parfaitement compatibles avec votre véhicule grâce à notre intelligence artificielle.
        </p>

        {/* CTA Buttons */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto animate-fade-in-up"
          style={{ animationDelay: "0.7s" }}
        >
          <Link
            to="/catalogue"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
              color: "#0A0A0A",
              boxShadow: "0 8px 32px rgba(201,168,76,0.35), 0 0 0 1px rgba(201,168,76,0.2)",
            }}
          >
            Explorer le Catalogue
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/vehicle-selector"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(201,168,76,0.30)",
              color: "#E8D5A3",
              backdropFilter: "blur(12px)",
            }}
          >
            Identifier mon Véhicule
          </Link>
        </div>

        {/* Séparateur doré animé */}
        <div
          className="h-px w-32 mt-10 animate-fade-in"
          style={{
            background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
            animationDelay: "0.9s",
          }}
        />

        {/* Stats */}
        <div
          className="mt-6 flex items-center gap-8 animate-fade-in-up"
          style={{ animationDelay: "1.1s" }}
        >
          {[
            { value: "10K+", label: "Pièces" },
            { value: "50+", label: "Marques" },
            { value: "24h", label: "Livraison" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg md:text-xl font-black" style={{ color: "#C9A84C" }}>{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(232,213,163,0.55)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[5] pointer-events-none"
        style={{ background: "linear-gradient(0deg, var(--bg) 0%, transparent 100%)" }}
      />
    </div>
  );
}
