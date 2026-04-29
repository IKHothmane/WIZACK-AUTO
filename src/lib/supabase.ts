import { createClient } from "@supabase/supabase-js";

export type ProductRow = {
  id: string;
  slug: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  is_active: boolean;
  brand: string | null;
  category: string | null;
  created_at: string;
};

export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase non configuré: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants.");
  }

  return createClient(url, anonKey, { auth: { persistSession: false } });
};
