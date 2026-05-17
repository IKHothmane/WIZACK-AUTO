import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const catalog: Record<string, string[]> = {
  "filtre": [
    "Filtre à huile", "Filtre à air", "Filtre à carburant", "Filtre d'habitacle", "Filtre hydraulique", "Filtre de boîte automatique"
  ],
  "huiles-et-fluides": [
    "Huile moteur", "Huile de boîte", "Liquide de refroidissement", "Liquide de frein", "Lave-glace", "Additifs", "Huile de direction assistée"
  ],
  "moteur": [
    "Joint de culasse", "Support moteur", "Pistons et segments", "Soupapes", "Arbre à cames", "Pompe à huile", "Turbo", "Carter d'huile"
  ],
  "carrosserie": [
    "Pare-chocs", "Ailes", "Capot", "Rétroviseurs", "Vérins de coffre", "Grilles et calandres", "Poignées de porte"
  ],
  "suspension-et-bras": [
    "Bras de suspension", "Rotules de suspension", "Silentblocs", "Barre stabilisatrice", "Biellettes de barre stab", "Moyeux de roue"
  ],
  "echappement": [
    "Silencieux arrière", "Catalyseur", "Sonde lambda", "Filtre à particules (FAP)", "Collecteur d'échappement", "Vanne EGR"
  ],
  "accessoires": [
    "Tapis de sol", "Housses de siège", "Barres de toit", "Porte-vélos", "Équipement de sécurité"
  ],
  "systeme-dallumage-et-bougies-de-prechauffage": [
    "Bougies d'allumage", "Bougies de préchauffage", "Bobines d'allumage", "Faisceau d'allumage"
  ],
  "courroies-chaine-galet": [
    "Kit de distribution", "Pompe à eau", "Courroie d'accessoire", "Galet tendeur", "Chaîne de distribution", "Poulie damper"
  ],
  "eclairage": [
    "Phares avant", "Feux arrière", "Clignotants", "Feux antibrouillard", "Ampoules", "Éclairage de plaque"
  ],
  "systeme-electrique": [
    "Batterie", "Alternateur", "Démarreur", "Klaxon", "Relais", "Fusibles", "Câblage"
  ],
  "refroidissement-moteur": [
    "Radiateur", "Pompe à eau", "Thermostat", "Ventilateur de radiateur", "Vase d'expansion", "Durites de refroidissement"
  ],
  "embrayage-composants": [
    "Kit d'embrayage", "Volant moteur", "Butée d'embrayage", "Émetteur d'embrayage", "Récepteur d'embrayage"
  ],
  "cardan-de-transmission-et-joint-homocinetique": [
    "Cardan", "Soufflet de cardan", "Joint homocinétique", "Arbre de transmission"
  ],
  "turbocompresseur": [
    "Turbo", "Intercooler", "Durites de turbo", "Électrovanne de turbo"
  ],
  "climatisation": [
    "Compresseur de clim", "Condenseur", "Détendeur", "Bouteille déshydratante", "Capteur de pression de clim"
  ],
  "systeme-dalimentation": [
    "Pompe à carburant", "Injecteurs", "Rampe commune", "Réservoir à carburant", "Jauge à carburant"
  ],
  "direction": [
    "Crémaillère de direction", "Pompe de direction assistée", "Rotules de direction", "Colonne de direction"
  ],
  "boite-de-vitesses": [
    "Filtre de boîte", "Capteur de vitesse", "Levier de vitesse", "Joints de boîte de vitesses"
  ],
  "tuyaux-et-conduites": [
    "Conduites de frein", "Conduites de carburant", "Tuyaux de dépression"
  ],
  "joints-de-rondelles-detancheite": [
    "Joint de vidange", "Joint de cache-culbuteurs", "Joint de collecteur"
  ],
  "capteurs-relais-unites-de-commande": [
    "Calculateur moteur", "Capteur PMH", "Capteur de pression", "Capteur de température"
  ]
};

const slugify = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

async function seed() {
  console.log("Updating catalog with new subcategories...");
  
  for (const [parentSlug, subcategories] of Object.entries(catalog)) {
    console.log(`Processing: ${parentSlug}`);
    
    for (let i = 0; i < subcategories.length; i++) {
      const name = subcategories[i];
      const slug = slugify(name);
      
      const { error } = await supabase
        .from('subcategories')
        .upsert({
          parent_slug: parentSlug,
          name: name,
          slug: slug,
          position: i,
          is_active: true
        }, { onConflict: 'slug,parent_slug' });

      if (error) {
        console.error(`  [ERROR] ${name}:`, error.message);
      } else {
        console.log(`  [OK] ${name}`);
      }
    }
  }
  
  console.log("Seed finished!");
}

seed();
