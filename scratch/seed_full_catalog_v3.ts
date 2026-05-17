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

const categories = [
  "Pneus et produits associés",
  "Freinage",
  "Filtre",
  "Huiles et fluides",
  "Moteur",
  "Carrosserie",
  "Suspension et bras",
  "Amortissement",
  "Nettoyage des vitres",
  "Echappement",
  "Accessoires",
  "Système d'allumage et bougies de préchauffage",
  "Tuning intérieur et confort",
  "Courroies chaîne galet",
  "Éclairage",
  "Système électrique",
  "Refroidissement moteur",
  "Embrayage/composants",
  "Cardan de transmission et joint homocinétique",
  "Produits de nettoyage et d'entretien du véhicules",
  "Outils",
  "Turbocompresseur",
  "Climatisation",
  "Système d'alimentation",
  "Direction",
  "Boîte de vitesses",
  "Éléments de fixation",
  "Tuyaux et conduites",
  "Joints de rondelles d'étanchéité",
  "Chauffage ventilation",
  "Roulements",
  "Suspension pneumatique",
  "Capteurs relais unités de commande",
  "Kit de réparation",
  "Arbre de transmission et différentiels",
  "Dispositif d'attelage / accessoires"
];

const subcategories: Record<string, string[]> = {
  "pneus-et-produits-associes": [
    "Pneus", "Enjoliveurs", "Démonte roues", "Contrôle de pression des pneumatiques", 
    "Boulon de roue", "Jantes", "Chambres à air", "Valves et accessoires", 
    "Chaînes neige & chaussettes", "Kit réparation crevaison", "Équilibrage et géométrie"
  ],
  "freinage": [
    "Plaquettes de frein", "Disques de frein", "Étriers de frein", "Flexibles de frein", 
    "Maître-cylindre", "Liquide de frein", "Tambours de frein", "Capteurs ABS"
  ],
  "filtre": [
    "Filtre à huile", "Filtre à air", "Filtre à carburant", "Filtre d'habitacle"
  ],
  "huiles-et-fluides": [
    "Huile moteur", "Huile de boîte", "Liquide de refroidissement", "Liquide de frein"
  ],
  "eclairage": [
    "Phares avant", "Feux arrière", "Clignotants", "Ampoules"
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
  console.log("Seeding Full Catalog v3...");

  // 1. Seed Categories
  console.log("Seeding Categories...");
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i];
    const slug = slugify(name);
    await supabase.from('categories').upsert({ name, slug, position: i, is_active: true }, { onConflict: 'slug' });
  }

  // 2. Seed Subcategories
  console.log("Seeding Subcategories...");
  for (const [parentSlug, subs] of Object.entries(subcategories)) {
    for (let i = 0; i < subs.length; i++) {
      const name = subs[i];
      const slug = slugify(name);
      await supabase.from('subcategories').upsert({ 
        parent_slug: parentSlug, 
        name, 
        slug, 
        position: i, 
        is_active: true 
      }, { onConflict: 'slug,parent_slug' });
    }
  }

  // 3. Seed Sample Products (Pneus example)
  console.log("Seeding Sample Products...");
  const brands = ["Sunny", "Milever", "Michelin", "Continental", "Brembo", "Bosch", "Valeo"];
  
  // Add some tires
  const tires = [
    { name: "Sunny NP226 205/55 R16", brand: "Sunny", price: 345, stock: 12 },
    { name: "Milever Sport Pro 225/45 R17", brand: "Milever", price: 410, stock: 8 },
    { name: "Michelin Pilot Sport 5 225/40 R18", brand: "Michelin", price: 1250, stock: 4 },
    { name: "Continental PremiumContact 6 205/55 R16", brand: "Continental", price: 980, stock: 15 },
    { name: "Sunny NA305 215/60 R17", brand: "Sunny", price: 450, stock: 20 },
    { name: "Milever Winter 195/65 R15", brand: "Milever", price: 320, stock: 10 }
  ];

  for (const t of tires) {
    const slug = slugify(t.name);
    await supabase.from('products').upsert({
      name: t.name,
      slug,
      brand: t.brand,
      category: "Pneus et produits associés",
      subcategory: "Pneus",
      price_cents: t.price * 100,
      currency: "MAD",
      stock: t.stock,
      is_active: true
    }, { onConflict: 'slug' });
  }

  // Add some brakes
  const brakes = [
    { name: "Plaquettes de frein Avant BREMBO P85020", brand: "Brembo", price: 450, stock: 25 },
    { name: "Disques de frein BOSCH 0986479107", brand: "Bosch", price: 890, stock: 10 }
  ];

  for (const b of brakes) {
    const slug = slugify(b.name);
    await supabase.from('products').upsert({
      name: b.name,
      slug,
      brand: b.brand,
      category: "Freinage",
      subcategory: "Plaquettes de frein",
      price_cents: b.price * 100,
      currency: "MAD",
      stock: b.stock,
      is_active: true
    }, { onConflict: 'slug' });
  }

  console.log("Seed finished successfully!");
}

seed();
