import { Search, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const brands = ["BMW", "Audi", "Mercedes", "Renault", "Peugeot", "Toyota", "Volkswagen", "Honda"];
const models: Record<string, string[]> = {
  BMW: ["Série 1", "Série 3", "Série 5", "X3", "X5"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5"],
  Mercedes: ["Classe A", "Classe C", "Classe E", "GLC", "GLE"],
  Renault: ["Clio", "Megane", "Kadjar", "Duster", "Captur"],
  Peugeot: ["208", "308", "3008", "5008", "2008"],
  Toyota: ["Yaris", "Corolla", "RAV4", "Camry", "C-HR"],
  Volkswagen: ["Polo", "Golf", "Passat", "Tiguan", "T-Roc"],
  Honda: ["Civic", "CR-V", "HR-V", "Jazz", "Accord"],
};
const years = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

export function VehicleSelector() {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [partQuery, setPartQuery] = useState("");
  const [techText, setTechText] = useState<string>("");
  const [techError, setTechError] = useState<string>("");
  const [isTechLoading, setIsTechLoading] = useState(false);

  const hasVehicle = Boolean(selectedBrand && selectedModel && selectedYear);
  const techMode = "vehicle_sheet_garage_v2_no_icons";

  const vehicleKey = useMemo(() => {
    if (!hasVehicle) return "";
    return `wizack-vehicle-sheet:${techMode}:${selectedBrand}:${selectedModel}:${selectedYear}`;
  }, [hasVehicle, selectedBrand, selectedModel, selectedYear, techMode]);

  useEffect(() => {
    setTechError("");
    if (!hasVehicle) {
      setTechText("");
      return;
    }
    try {
      const cached = window.localStorage.getItem(vehicleKey);
      setTechText(cached || "");
    } catch {
      setTechText("");
    }
  }, [hasVehicle, vehicleKey]);

  useEffect(() => {
    if (!hasVehicle) return;
    try {
      window.localStorage.setItem(
        "wizack-selected-vehicle",
        JSON.stringify({ brand: selectedBrand, model: selectedModel, year: selectedYear }),
      );
    } catch {
      // ignore
    }
  }, [hasVehicle, selectedBrand, selectedModel, selectedYear]);

  const cleanTech = (text: string) => {
    const lines = text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.replace(/^#{1,6}\s*/g, "").replace(/\*\*/g, "").trimEnd());

    const filtered = lines.filter((l) => {
      const t = l.trim();
      if (!t) return true;
      const lower = t.toLowerCase();
      if (lower.includes("à confirmer")) return false;
      if (lower.includes("a confirmer")) return false;
      if (lower.includes("non fourni")) return false;
      if (lower.includes("non fournie")) return false;
      if (lower.includes("non renseign")) return false;
      if (lower.includes("(si connu")) return false;
      if (lower.includes("(si four")) return false;
      if (lower.includes("essence / diesel / hybride")) return false;
      if (t.includes("_____")) return false;
      if (t.includes("____")) return false;
      return true;
    });

    return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const ensureUserId = () => {
    const key = "wizack-dify-user-tech";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id = `u-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    window.localStorage.setItem(key, id);
    return id;
  };

  const fetchTechSheet = async () => {
    if (!hasVehicle || isTechLoading) return;
    setIsTechLoading(true);
    setTechError("");

    try {
      const user = ensureUserId();
      const query = `Tu es un assistant IA expert en mécanique automobile niveau garage professionnel.
Tu dois répondre UNIQUEMENT en texte professionnel, SANS emojis/icônes, SANS markdown (pas de ###, pas de **).
Règle: si une donnée est inconnue, NE L'AFFICHE PAS (ne pas écrire "à confirmer").
Utilise les infos du véhicule:
Marque=${selectedBrand}, Modèle=${selectedModel}, Année=${selectedYear}.

MODELE A RESPECTER:
FICHE TECHNIQUE GARAGE
IDENTIFICATION VEHICULE
Marque : ${selectedBrand}
Modèle : ${selectedModel}
Année : ${selectedYear}
Motorisation : (mettre valeur seulement si connue, sinon ne pas afficher la ligne)
Puissance : (mettre valeur seulement si connue, sinon ne pas afficher la ligne)
Kilométrage : (mettre valeur seulement si fourni par le client, sinon ne pas afficher la ligne)

HUILES ET LUBRIFIANTS
Huile moteur
Type recommandé : (donne 2-3 viscosités possibles selon motorisation et climat)
Norme constructeur : (mettre seulement si connue)
Quantité huile moteur (avec filtre) : (mettre seulement si connue)
Intervalle vidange : (mettre seulement si connu)

FLUIDES
Liquide refroidissement : (mettre seulement si connu)
Liquide frein : (mettre seulement si connu)
Direction assistée : (mettre seulement si connu)
Boîte de vitesse :
Manuelle : (mettre seulement si connu)
Automatique : (mettre seulement si connu)

PNEUS
Tailles standards : (donne 2-3 tailles possibles)
Pression avant : (mettre seulement si connue)
Pression arrière : (mettre seulement si connue)

PIECES D'ENTRETIEN (LISTE)
Filtres : huile, air, carburant (si diesel), habitacle
Allumage/injection : bougies/bobines (essence), injecteurs (si utile)
Courroies : accessoires, distribution (si applicable)
Freinage : plaquettes, disques
Batterie : (mettre seulement si connue)

ENTRETIEN GENERAL
Vidange : 10 000 – 20 000 km
Filtre huile : à chaque vidange
Freins : contrôle tous 10 000 km
Pneus : contrôle tous mois
Batterie : 3 à 5 ans

NOTES GARAGE
Toujours vérifier carnet constructeur
Toujours adapter huile selon climat
Ne jamais mélanger huiles différentes sans compatibilité`;

      const res = await fetch("/api/dify/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: { brand: selectedBrand, model: selectedModel, year: selectedYear, mode: techMode },
          query,
          response_mode: "blocking",
          user,
          conversation_id: "",
          auto_generate_name: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401 || res.status === 403) throw new Error("API Key Dify manquante ou invalide (DIFY_API_KEY).");
        throw new Error(`${res.status} ${text.slice(0, 180)}`);
      }

      const json = (await res.json()) as { answer?: string };
      const answer = cleanTech((json.answer ?? "").trim());
      if (!answer) throw new Error("Réponse IA vide.");
      setTechText(answer);
      try {
        window.localStorage.setItem(vehicleKey, answer);
      } catch {
        // ignore
      }
    } catch (e: any) {
      setTechError(String(e?.message || e));
    } finally {
      setIsTechLoading(false);
    }
  };

  const handleVehicleSearch = () => {
    const params = new URLSearchParams();
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedModel) params.set("model", selectedModel);
    if (selectedYear) params.set("year", selectedYear);
    navigate(`/search?${params.toString()}`);
  };

  const selectStyle = {
    background: "var(--card)",
    border: "1px solid rgba(201,168,76,0.2)",
    color: "var(--color-text-primary)",
    borderRadius: "12px",
    padding: "14px 16px",
    width: "100%",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  return (
    <div
      className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl max-w-4xl mx-auto relative overflow-hidden"
      style={{
        background: "var(--surface)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(201,168,76,0.18)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 80px rgba(201,168,76,0.05)",
      }}
    >
      {/* Glow décoratif */}
      <div
        className="absolute -top-24 -right-24 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)" }}
      />

      {/* Titre */}
      <div className="mb-4">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold mb-0.5" style={{ color: "#C9A84C" }}>
          Identification
        </p>
        <h2 className="text-lg font-heading font-bold" style={{ color: "var(--color-text-primary)" }}>
          Trouver les pièces
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative">
          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(""); }}
            aria-label="Marque"
            style={{ ...selectStyle, padding: "12px 14px" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
          >
            <option value="">Marque</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#C9A84C" }} />
        </div>

        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedBrand}
            aria-label="Modèle"
            style={{
              ...selectStyle,
              padding: "12px 14px",
              opacity: selectedBrand ? 1 : 0.45,
              cursor: selectedBrand ? "pointer" : "not-allowed",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
          >
            <option value="">Modèle</option>
            {selectedBrand && models[selectedBrand]?.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#C9A84C" }} />
        </div>

        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedModel}
            aria-label="Année"
            style={{
              ...selectStyle,
              padding: "12px 14px",
              opacity: selectedModel ? 1 : 0.45,
              cursor: selectedModel ? "pointer" : "not-allowed",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
          >
            <option value="">Année</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#C9A84C" }} />
        </div>

        <button
          onClick={handleVehicleSearch}
          className="flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
            color: "#0A0A0A",
            padding: "12px 14px",
            boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 30px rgba(201,168,76,0.55)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Search size={17} />
          Rechercher
        </button>
      </div>

      {hasVehicle ? (
        <div className="mt-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>
                  Fiche technique (IA)
                </p>
                <p className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                  {selectedBrand} {selectedModel} {selectedYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void fetchTechSheet()}
                disabled={isTechLoading}
                className="rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #C9A84C 0%, #B8860B 100%)",
                  color: "#0A0A0A",
                  boxShadow: "0 6px 24px rgba(201,168,76,0.25)",
                  opacity: isTechLoading ? 0.75 : 1,
                }}
              >
                {isTechLoading ? "Génération..." : techText ? "Régénérer" : "Générer"}
              </button>
            </div>

            {techError ? (
              <div className="mt-3 text-sm font-semibold rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>
                {techError}
              </div>
            ) : null}

            {techText ? (
              <div
                className="mt-3 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(201,168,76,0.12)",
                  color: "var(--color-text-primary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {techText}
              </div>
            ) : (
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Clique sur “Générer” pour afficher la fiche technique du véhicule.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (partQuery) params.set("q", partQuery);
          navigate(`/search?${params.toString()}`);
        }}
      >
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#C9A84C" }} />
          <input
            type="text"
            value={partQuery}
            onChange={(e) => setPartQuery(e.target.value)}
            aria-label="Rechercher une pièce (nom ou SKU)"
            placeholder="Rechercher une pièce (nom ou SKU)..."
            className="w-full rounded-2xl pl-11 pr-4 py-4 text-sm outline-none transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(201,168,76,0.2)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
          />
        </div>
      </form>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Données fournies par <span style={{ color: "#C9A84C", fontWeight: 600 }}>Afteriize API</span> • Identification via SIV Europe
      </p>
    </div>
  );
}
