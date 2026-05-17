
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMoreTables() {
  const candidates = ['tire_widths', 'tire_heights', 'tire_diameters', 'services', 'atelier_services'];
  for (const table of candidates) {
    const { error: e } = await supabase.from(table).select('id').limit(1);
    if (!e) {
      console.log(`Table "${table}" exists.`);
    } else {
      console.log(`Table "${table}" check error: ${e.message}`);
    }
  }
}

checkMoreTables();
