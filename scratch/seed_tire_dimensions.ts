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

const widths = ["155", "165", "175", "185", "195", "205", "215", "225", "235", "245", "255", "265", "275"];
const heights = ["35", "40", "45", "50", "55", "60", "65", "70", "75"];
const diameters = ["14", "15", "16", "17", "18", "19", "20", "21"];
const brands = ["Michelin", "Continental", "Pirelli", "Bridgestone", "Goodyear", "Hankook", "Sunny", "Milever"];

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
  console.log("Seeding extensive tire dimensions...");

  const products = [];
  
  // Generate a realistic spread of tire sizes
  for (const w of widths) {
    for (const h of heights) {
      // Pick 2 random diameters for each w/h combination to avoid too many rows but ensure coverage
      const selectedDiameters = diameters.filter(() => Math.random() > 0.6);
      if (selectedDiameters.length === 0) selectedDiameters.push(diameters[Math.floor(Math.random() * diameters.length)]);

      for (const d of selectedDiameters) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const name = `${brand} Sport ${w}/${h} R${d}`;
        const slug = slugify(name);
        
        products.push({
          name,
          slug,
          brand,
          category: "Pneus et produits associés",
          subcategory: "Pneus",
          price_cents: (Math.floor(Math.random() * 1500) + 300) * 100,
          currency: "MAD",
          stock: Math.floor(Math.random() * 20) + 2,
          is_active: true
        });
      }
    }
  }

  console.log(`Prepared ${products.length} tire products. Inserting in batches...`);

  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error(`  [ERROR] Batch ${i/batchSize}:`, error.message);
    } else {
      console.log(`  [OK] Batch ${i/batchSize + 1} inserted.`);
    }
  }

  console.log("Tire dimension seeding finished!");
}

seed();
