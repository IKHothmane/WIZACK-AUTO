import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type GarageZone = {
  id: string;
  label: string;
  title: string;
  background: string;
  description: string;
};

const GARAGE_ZONES: GarageZone[] = [
  {
    id: "01",
    label: "ZONE 01",
    title: "PNEUMATIQUES",
    background: "/garage/zone-02-pneus.webp",
    description: "Montage, équilibrage & géométrie",
  },
  {
    id: "02",
    label: "ZONE 02",
    title: "VIDANGE MOTEUR",
    background: "/garage/zone-03-vidange.webp",
    description: "Entretien & changement des fluides",
  },
  {
    id: "03",
    label: "ZONE 03",
    title: "ÉLECTRICITÉ",
    background: "/garage/zone-04-eclairage.webp",
    description: "Diagnostic & réparation phares/élec",
  },
  {
    id: "04",
    label: "ZONE 04",
    title: "CARROSSERIE",
    background: "/garage/zone-05-carrosserie.webp",
    description: "Peinture cabine & finition",
  },
];

export function GarageTour() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const doorRef = useRef<HTMLDivElement | null>(null);
  const garageRef = useRef<HTMLDivElement | null>(null);
  const zonesRef = useRef<Array<HTMLDivElement | null>>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Preload first zone and curtain
    const preload = async () => {
      const urls = ["/garage/rideau-ferme.webp", GARAGE_ZONES[0].background];
      const promises = urls.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(promises);
      setIsReady(true);
    };
    preload();
  }, []);

  useLayoutEffect(() => {
    if (!isReady) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const zones = zonesRef.current.filter(Boolean) as HTMLDivElement[];
      gsap.set(zones, { opacity: 0, pointerEvents: "none" });
      if (zones[0]) gsap.set(zones[0], { opacity: 1 });
      gsap.set(doorRef.current, { opacity: 1, yPercent: 0 });
      gsap.set(garageRef.current, { scale: 1.15, yPercent: 8, filter: "brightness(0.4) blur(8px)", transformOrigin: "50% 100%" });

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=700%",
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
        },
      });

      masterTl
        .to(doorRef.current, { yPercent: -100, ease: "power2.inOut", duration: 1.5 }, 0)
        .to(garageRef.current, { scale: 1, yPercent: 0, filter: "brightness(1) blur(0px)", ease: "power3.out", duration: 1.8 }, 0.2)
        .to(doorRef.current, { opacity: 0, duration: 0.4 }, 1.1);

      masterTl.to({}, { duration: 1 });

      const z0 = zonesRef.current[0];
      const z1 = zonesRef.current[1];
      const z2 = zonesRef.current[2];
      const z3 = zonesRef.current[3];

      if (z0 && z1) {
        masterTl.to(z0, { opacity: 0, scale: 1.1, yPercent: -8, filter: "brightness(0.3) blur(8px)", duration: 1 }, 3.2);
        masterTl.fromTo(
          z1,
          { opacity: 0, scale: 1.3, yPercent: 15, filter: "brightness(0.4) blur(12px)" },
          { opacity: 1, scale: 1, yPercent: 0, filter: "brightness(1) blur(0px)", ease: "power2.out", duration: 1.3 },
          3.4,
        );
      }

      if (z1 && z2) {
        masterTl.to(z1, { opacity: 0, yPercent: 8, scale: 0.9, filter: "brightness(0.3) blur(8px)", duration: 1 }, 5.4);
        masterTl.fromTo(
          z2,
          { opacity: 0, scale: 0.85, yPercent: -12, filter: "brightness(0.4) blur(12px)" },
          { opacity: 1, scale: 1, yPercent: 0, filter: "brightness(1) blur(0px)", ease: "power2.out", duration: 1.3 },
          5.6,
        );
        masterTl.to(z2, { scale: 1.12, duration: 0.7 }, 6.9);
      }

      if (z2 && z3) {
        masterTl.to(z2, { opacity: 0, scale: 1.25, filter: "brightness(0.3) blur(10px)", duration: 1.1 }, 8.0);
        masterTl.fromTo(
          z3,
          { opacity: 0, scale: 1.4, yPercent: 6, filter: "brightness(0.4) blur(15px)" },
          { opacity: 1, scale: 1, yPercent: 0, filter: "brightness(1) blur(0px)", ease: "power3.out", duration: 1.6 },
          8.2,
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isReady]);

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden bg-black">
      {!isReady && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin" />
        </div>
      )}

      <div ref={doorRef} className={`h-screen w-full absolute inset-0 z-50 transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}>
        <img
          src="/garage/rideau-ferme.webp"
          alt="Rideau garage WIZACK"
          className="w-full h-full object-contain bg-black"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.7) 100%)" }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-8xl md:text-[16rem] font-black text-white mb-12 drop-shadow-[0_4px_80px_rgba(201,169,97,1)]">WIZACK AUTO</h1>
            <div className="flex items-center justify-center gap-6 text-white">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="animate-bounce">
                <path d="M12 5v14M19 12l-7 7-7-7" stroke="#C9A961" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <span className="text-4xl md:text-6xl font-black tracking-[0.5em]">ENTRER</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={garageRef} className={`h-screen w-full relative overflow-hidden transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}>
        {GARAGE_ZONES.map((zone, i) => (
          <div
            key={zone.id}
            ref={(el) => {
              zonesRef.current[i] = el;
            }}
            className="h-screen w-full absolute inset-0 pointer-events-none"
          >
            <img 
              src={zone.background} 
              alt={zone.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
            <div className="absolute bottom-20 left-0 right-0 text-center px-8">
              <p className="text-lg md:text-3xl font-black tracking-[0.4em] text-[#C9A961] mb-6">{zone.label}</p>
              <h2 className="text-8xl md:text-9xl font-black text-white mb-6">{zone.title}</h2>
              <p className="text-3xl md:text-5xl text-white/85 font-semibold">{zone.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
