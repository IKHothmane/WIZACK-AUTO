
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
  console.log('Listing tables for:', supabaseUrl);
  
  // This is a common way to list tables in Supabase if you have access
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    console.log('RPC get_tables failed, trying individual checks...');
    const candidates = ['products', 'Product', 'Products', 'product', 'categories', 'subcategories'];
    for (const table of candidates) {
      const { error: e } = await supabase.from(table).select('id').limit(1);
      if (!e) {
        console.log(`Table "${table}" exists.`);
      } else {
        console.log(`Table "${table}" check error: ${e.message}`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
