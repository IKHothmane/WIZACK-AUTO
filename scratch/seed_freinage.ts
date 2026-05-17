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

const parentSlug = 'freinage';
const subcategories = [
  "Plaquettes de frein",
  "Disques de frein",
  "Étriers de frein",
  "Flexibles de frein",
  "Maître-cylindre",
  "Liquide de frein",
  "Tambours de frein",
  "Capteurs ABS",
  "Témoin d'usure plaquettes",
  "Câble de frein à main",
  "Kit d'accessoires plaquettes",
  "Ressort de rappel",
];

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
  console.log(`Seeding subcategories for: ${parentSlug}`);
  
  for (let i = 0; i < subcategories.length; i++) {
    const name = subcategories[i];
    const slug = slugify(name);
    
    const { data, error } = await supabase
      .from('subcategories')
      .upsert({
        parent_slug: parentSlug,
        name: name,
        slug: slug,
        position: i,
        is_active: true
      }, { onConflict: 'slug,parent_slug' });

    if (error) {
      console.error(`Error inserting ${name}:`, error.message);
    } else {
      console.log(`Inserted: ${name}`);
    }
  }
}

seed();
