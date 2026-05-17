
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
  const { data: products, error: pError } = await supabase.from('products').select('count', { count: 'exact', head: true });
  if (pError) {
    console.error('Error fetching products count:', pError.message);
    // Maybe the table is named "Product"
    const { data: products2, error: pError2 } = await supabase.from('Product').select('count', { count: 'exact', head: true });
    if (pError2) {
      console.error('Error fetching Product count:', pError2.message);
    } else {
      console.log('Found table "Product" with', products2, 'items');
    }
  } else {
    console.log('Found table "products" with', products, 'items');
  }

  // 2. Try to list categories
  const { data: categories, error: cError } = await supabase.from('categories').select('count', { count: 'exact', head: true });
  if (cError) {
    console.error('Error fetching categories count:', cError.message);
  } else {
    console.log('Found table "categories" with', categories, 'items');
  }
}

checkConnection();
