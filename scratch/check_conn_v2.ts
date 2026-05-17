
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

async function checkConnection() {
  console.log('Checking connection to:', supabaseUrl);
  
  // 1. Try to list products
  const { data: products, error: pError, count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: false }).limit(5);
  if (pError) {
    console.error('Error fetching products:', pError.message);
  } else {
    console.log('Found table "products" with', pCount, 'items.');
    if (products && products.length > 0) {
      console.log('Sample products:', products.map(p => p.name));
    }
  }

  // 2. Try to list categories
  const { data: categories, error: cError, count: cCount } = await supabase.from('categories').select('*', { count: 'exact', head: false }).limit(5);
  if (cError) {
    console.error('Error fetching categories:', cError.message);
  } else {
    console.log('Found table "categories" with', cCount, 'items.');
    if (categories && categories.length > 0) {
      console.log('Sample categories:', categories.map(c => c.name));
    }
  }
}

checkConnection();
