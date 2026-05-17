
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

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try a simple query to a common table
    console.log('RPC get_tables failed, trying manual check...');
    const tables = ['services', 'atelier_services', 'products', 'categories'];
    for (const t of tables) {
      const { error: e } = await supabase.from(t).select('id', { head: true, count: 'exact' }).limit(1);
      if (!e) {
        console.log(`Table "${t}" exists.`);
      } else {
        console.log(`Table "${t}" check error: ${e.message}`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
