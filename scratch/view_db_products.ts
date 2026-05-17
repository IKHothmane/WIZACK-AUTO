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

async function view() {
  const { data, error } = await supabase.from('products').select('name, brand, price_cents').limit(10);
  if (error) {
    // Try table name with different casing
    const { data: data2, error: error2 } = await supabase.from('Products').select('name, brand, price_cents').limit(10);
    if (error2) {
      console.error('Error fetching products:', error, error2);
      return;
    }
    console.log(JSON.stringify(data2, null, 2));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

view();
