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

const vehicleData: Record<string, string[]> = {
  "Alfa Romeo": ["Giulietta", "Giulia", "Stelvio", "Tonale", "4C"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT", "R8"],
  "BMW": ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 7", "Série 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"],
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C5 Aircross", "Berlingo", "Jumpy", "SpaceTourer"],
  "Dacia": ["Sandero", "Logan", "Duster", "Lodgy", "Spring", "Jogger"],
  "Fiat": ["500", "500X", "500L", "Panda", "Tipo", "Punto", "Ducato"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Kuga", "Explorer", "Transit", "Ranger"],
  "Honda": ["Civic", "Jazz", "HR-V", "CR-V", "Honda e"],
  "Hyundai": ["i10", "i20", "i30", "Ionic 5", "Kona", "Tucson", "Santa Fe", "Bayon"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  "Kia": ["Picanto", "Rio", "Ceed", "Niro", "Sportage", "Sorento", "Stinger", "EV6"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", "Discovery", "Defender"],
  "Mercedes-Benz": ["Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQS", "Vito"],
  "Mini": ["Hatch", "Clubman", "Countryman", "Convertible"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Navara"],
  "Opel": ["Corsa", "Astra", "Insignia", "Mokka", "Grandland", "Crossland", "Combo", "Vivaro"],
  "Peugeot": ["108", "208", "308", "408", "508", "2008", "3008", "5008", "Partner", "Expert"],
  "Porsche": ["911", "718 Boxster", "718 Cayman", "Panamera", "Macan", "Cayenne", "Taycan"],
  "Renault": ["Twingo", "Clio", "Captur", "Megane", "Arkana", "Kadjar", "Austral", "Talisman", "Espace", "Koleos", "Zoe", "Kangoo", "Master"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Skoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y"],
  "Toyota": ["Aygo", "Yaris", "Corolla", "Camry", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Hilux", "Proace"],
  "Volkswagen": ["Up!", "Polo", "Golf", "ID.3", "ID.4", "ID.5", "Passat", "Arteon", "T-Roc", "T-Cross", "Taigo", "Tiguan", "Touareg", "Caddy", "Transporter"],
  "Volvo": ["XC40", "XC60", "XC90", "V60", "V90", "S60", "S90", "C40"]
};

async function seed() {
  console.log("Starting vehicle models seed...");
  
  // We check if table exists first (this is just for reporting)
  // We'll use a generic approach: upsert into a 'vehicle_models' table
  
  for (const [brand, models] of Object.entries(vehicleData)) {
    console.log(`Processing brand: ${brand}`);
    
    const rows = models.map(model => ({
      brand: brand,
      model: model,
      slug: `${brand.toLowerCase()}-${model.toLowerCase()}`.replace(/\s+/g, '-'),
      is_active: true
    }));

    const { error } = await supabase
      .from('vehicle_models')
      .upsert(rows, { onConflict: 'slug' });

    if (error) {
      console.error(`  [ERROR] ${brand}:`, error.message);
      console.log("  Attempting to create table if it doesn't exist? (Note: This script assumes the table exists)");
    } else {
      console.log(`  [OK] ${brand} (${models.length} models)`);
    }
  }
  
  console.log("Seed finished!");
}

seed();
