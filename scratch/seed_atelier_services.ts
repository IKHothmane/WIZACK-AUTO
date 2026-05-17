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

const slugify = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

const services = [
  "TIRE DYNAMICS",
  "PRECISION FITTING",
  "ADVANCED BALANCING",
  "AUTOMATED SYSTEMS",
];

async function seed() {
  console.log(`Seeding atelier services...`);
  
  for (let i = 0; i < services.length; i++) {
    const name = services[i];
    
    // First, check if it exists (by name, since we don't know the exact schema's unique constraints)
    const { data: existing } = await supabase
      .from('atelier_services')
      .select('id')
      .eq('name', name)
      .limit(1)
      .single();

    if (existing) {
      console.log(`Updating position for: ${name}`);
      await supabase
        .from('atelier_services')
        .update({ position: i, is_visible: true })
        .eq('id', existing.id);
    } else {
      console.log(`Inserting: ${name}`);
      const { error } = await supabase
        .from('atelier_services')
        .insert({
          id: `service-${slugify(name)}`,
          name: name,
          description: `High-tech service for: ${name}`,
          price_mad: 200 + (i * 50),
          is_visible: true,
          position: i,
        });

      if (error) {
        console.error(`Error inserting ${name}:`, error.message);
      }
    }
  }
  console.log('Seeding finished.');
}

seed();
