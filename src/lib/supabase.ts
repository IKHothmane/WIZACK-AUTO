import { createClient } from "@supabase/supabase-js";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price_cents: number;
  currency: "MAD";
  stock: number;
  image?: string;
};

type DbProductRow = {
  id: string;
  slug: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  subcategory?: string | null;
  price_cents?: number;
  priceCents?: number;
  currency?: string;
  stock: number;
  is_active?: boolean;
  isActive?: boolean;
  brand?: string | null;
  category?: string | null;
  created_at?: string;
  createdAt?: string;
  image?: string | null;
};

const getEnv = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  return { url, anonKey };
};

export const isSupabaseConfigured = () => {
  const { url, anonKey } = getEnv();
  return Boolean(url && anonKey);
};

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  const { url, anonKey } = getEnv();
  if (!url || !anonKey) {
    throw new Error("Supabase non configuré: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants.");
  }
  supabaseInstance = createClient(url, anonKey);
  return supabaseInstance;
};

const getStorageBucket = () => {
  const bucket = (import.meta as any).env?.VITE_SUPABASE_BUCKET as string | undefined;
  return (bucket || "images").trim() || "images";
};

export const uploadPublicImage = async (path: string, file: File): Promise<string> => {
  const client = getSupabaseClient();
  const bucket = getStorageBucket();
  const cleanPath = String(path || "").replace(/^\/+/, "");
  if (!cleanPath) throw new Error("Chemin de fichier invalide.");

  const { data, error } = await client.storage.from(bucket).upload(cleanPath, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) {
    const msg = String((error as any)?.message || error);
    if (msg.toLowerCase().includes("bucket not found")) {
      throw new Error(`Bucket introuvable: "${bucket}". Créez ce bucket dans Supabase → Storage, ou définissez VITE_SUPABASE_BUCKET dans .env.local puis redémarrez l'app.`);
    }
    throw error;
  }

  const pub = client.storage.from(bucket).getPublicUrl(data.path);
  const url = (pub as any)?.data?.publicUrl as string | undefined;
  if (!url) throw new Error("Impossible de récupérer l'URL publique de l'image.");
  return url;
};

let cachedProductsTable: string | null = null;

const resolveProductsTable = async () => {
  if (cachedProductsTable) return cachedProductsTable;
  const client = getSupabaseClient();
  const candidates = ["products", "Product"];
  let lastError: unknown = null;

  for (const table of candidates) {
    const { error } = await client.from(table).select("id", { head: true }).limit(1);
    if (!error) {
      cachedProductsTable = table;
      return table;
    }
    lastError = error;
  }

  throw new Error(`Table produits introuvable sur Supabase (essayé: ${candidates.join(", ")}). ${String((lastError as any)?.message || lastError)}`);
};

const normalizeProduct = (row: DbProductRow): Product | null => {
  const id = String((row as any).id || "");
  const name = typeof (row as any).name === "string" ? (row as any).name : "";
  const slugRaw = (row as any).slug;
  const slug = typeof slugRaw === "string" && slugRaw ? slugRaw : "";
  const priceCents = Number((row as any).price_cents ?? (row as any).priceCents);
  const stock = Number((row as any).stock);
  if (!id || !name || !slug || !Number.isFinite(priceCents) || !Number.isFinite(stock)) return null;

  const currencyRaw = (row as any).currency;
  const currency = currencyRaw === "MAD" ? "MAD" : "MAD";
  const brandRaw = (row as any).brand;
  const categoryRaw = (row as any).category;
  const subcategoryRaw = (row as any).subcategory;
  const imageRaw = (row as any).image;

  const p: Product = {
    id,
    slug,
    name,
    brand: typeof brandRaw === "string" && brandRaw ? brandRaw : "—",
    category: typeof categoryRaw === "string" && categoryRaw ? categoryRaw : "—",
    subcategory: typeof subcategoryRaw === "string" && subcategoryRaw ? subcategoryRaw : undefined,
    price_cents: Math.round(priceCents),
    currency,
    stock: Math.max(0, Math.round(stock)),
    image: typeof imageRaw === "string" && imageRaw ? imageRaw : undefined,
  };

  return p;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const client = getSupabaseClient();
  const table = await resolveProductsTable();

  const { data, error } = await client.from(table).select("*");
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as DbProductRow[]) : [];
  const mapped = rows.map(normalizeProduct).filter(Boolean) as Product[];
  return mapped.filter((p) => p.name && p.slug);
};

export const upsertProduct = async (product: Product) => {
  const client = getSupabaseClient();
  const table = await resolveProductsTable();

  const payload = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory ?? null,
    price_cents: product.price_cents,
    currency: product.currency,
    stock: product.stock,
    image: product.image ?? null,
    is_active: true,
  };

  let { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
  if (error) {
    const msg = String((error as any)?.message || error);
    if (msg.toLowerCase().includes("subcategory")) {
      const { subcategory: _subcategory, ...fallback } = payload as any;
      const retry = await client.from(table).upsert(fallback, { onConflict: "id" });
      error = retry.error;
    }
  }
  if (error) throw error;
};

export const deleteProduct = async (id: string) => {
  const client = getSupabaseClient();
  const table = await resolveProductsTable();

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
  image_url?: string;
};

type DbCategoryRow = {
  id: string;
  name: string;
  slug?: string | null;
  position?: number | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  image_url?: string | null;
  imageUrl?: string | null;
  created_at?: string;
  createdAt?: string;
};

export const MAIN_CATEGORIES = [
  "Pneus et produits associés",
  "Freinage",
  "Filtre",
  "Huiles et fluides",
  "Moteur",
  "Carrosserie",
  "Suspension et bras",
  "Amortissement",
  "Nettoyage des vitres",
  "Echappement",
  "Accessoires",
  "Système d'allumage et bougies de préchauffage",
  "Tuning intérieur et confort",
  "Courroies chaîne galet",
  "Éclairage",
  "Système électrique",
  "Refroidissement moteur",
  "Embrayage/composants",
  "Cardan de transmission et joint homocinétique",
  "Produits de nettoyage et d'entretien du véhicules",
  "Outils",
  "Turbocompresseur",
  "Climatisation",
  "Système d'alimentation",
  "Direction",
  "Boîte de vitesses",
  "Éléments de fixation",
  "Tuyaux et conduites",
  "Joints de rondelles d'étanchéité",
  "Chauffage ventilation",
  "Roulements",
  "Suspension pneumatique",
  "Capteurs relais unités de commande",
  "Kit de réparation",
  "Arbre de transmission et différentiels",
  "Dispositif d'attelage / accessoires",
];

const slugify = (value: string) => {
  const v = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return v || "categorie";
};

export const slugifyCategory = slugify;

let cachedCategoriesTable: string | null = null;

const resolveCategoriesTable = async () => {
  if (cachedCategoriesTable) return cachedCategoriesTable;
  const client = getSupabaseClient();
  const candidates = ["categories", "Category"];
  let lastError: unknown = null;

  for (const table of candidates) {
    const { error } = await client.from(table).select("id", { head: true }).limit(1);
    if (!error) {
      cachedCategoriesTable = table;
      return table;
    }
    lastError = error;
  }

  throw new Error(`Table catégories introuvable sur Supabase (essayé: ${candidates.join(", ")}). ${String((lastError as any)?.message || lastError)}`);
};

const normalizeCategory = (row: DbCategoryRow): Category | null => {
  const id = String((row as any).id || "");
  const name = typeof (row as any).name === "string" ? (row as any).name : "";
  const slugRaw = (row as any).slug;
  const slug = typeof slugRaw === "string" && slugRaw ? slugRaw : slugify(name);
  const position = Number((row as any).position ?? 0);
  const isActiveRaw = (row as any).is_active ?? (row as any).isActive;
  const is_active = typeof isActiveRaw === "boolean" ? isActiveRaw : true;
  const imageRaw = (row as any).image_url ?? (row as any).imageUrl;
  const image_url = typeof imageRaw === "string" && imageRaw ? imageRaw : undefined;
  if (!id || !name) return null;
  return {
    id,
    name,
    slug,
    position: Number.isFinite(position) ? position : 0,
    is_active,
    image_url,
  };
};

export const fetchCategories = async (): Promise<Category[]> => {
  const client = getSupabaseClient();
  const table = await resolveCategoriesTable();

  const { data, error } = await client
    .from(table)
    .select("*")
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as DbCategoryRow[]) : [];
  return rows.map(normalizeCategory).filter(Boolean) as Category[];
};

export const seedMainCategoriesIfEmpty = async () => {
  const client = getSupabaseClient();
  const table = await resolveCategoriesTable();

  const { count, error: countError } = await client.from(table).select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count || 0) > 0) return;

  const payload = MAIN_CATEGORIES.map((name, i) => ({
    id: `cat-${slugify(name)}`,
    name,
    slug: slugify(name),
    position: i,
    is_active: true,
  }));

  const { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
  if (error) throw error;
};

export const upsertCategory = async (category: Category) => {
  const client = getSupabaseClient();
  const table = await resolveCategoriesTable();

  const payload: any = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    position: category.position,
    is_active: category.is_active,
    isActive: category.is_active, // Fallback for camelCase
    image_url: category.image_url ?? null,
    imageUrl: category.image_url ?? null, // Fallback for camelCase
  };

  let { error } = await client.from(table).upsert(payload, { onConflict: "id" });
  
  if (error) {
    const msg = String((error as any)?.message || error).toLowerCase();
    // If one of the fallback columns doesn't exist, try removing them one by one
    if (msg.includes("is_active") || msg.includes("isactive") || msg.includes("image_url") || msg.includes("imageurl")) {
      const { isActive: _ia, imageUrl: _iu, ...cleaned } = payload;
      const retry1 = await client.from(table).upsert(cleaned, { onConflict: "id" });
      if (retry1.error) {
         // Second attempt with only snake_case
         const { is_active: _is, image_url: _im, ...retryPayload } = payload;
         const retry2 = await client.from(table).upsert(retryPayload, { onConflict: "id" });
         error = retry2.error;
      } else {
         error = null;
      }
    }
  }
  
  if (error) throw error;
};

export const deleteCategory = async (id: string) => {
  const client = getSupabaseClient();
  const table = await resolveCategoriesTable();

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
};

export type Subcategory = {
  id: string;
  parent_slug: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
  image_url?: string;
};

type DbSubcategoryRow = {
  id: string;
  parent_slug: string;
  name: string;
  slug?: string | null;
  position?: number | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  image_url?: string | null;
  created_at?: string;
  createdAt?: string;
};

export const PNEUS_SUBCATEGORIES = [
  "Pneus",
  "Enjoliveurs",
  "Démonte roues",
  "Contrôle de pression des pneumatiques",
  "Boulon de roue",
  "Jantes",
  "Chambres à air",
  "Valves et accessoires",
  "Chaînes neige & chaussettes",
  "Kit réparation crevaison",
  "Équilibrage et géométrie",
  "Crics et chandelles",
  "Housses et stockage pneus",
];

export const FREINAGE_SUBCATEGORIES = [
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

let cachedSubcategoriesTable: string | null = null;

const resolveSubcategoriesTable = async () => {
  if (cachedSubcategoriesTable) return cachedSubcategoriesTable;
  const client = getSupabaseClient();
  const candidates = ["subcategories", "Subcategory"];
  let lastError: unknown = null;

  for (const table of candidates) {
    const { error } = await client.from(table).select("id", { head: true }).limit(1);
    if (!error) {
      cachedSubcategoriesTable = table;
      return table;
    }
    lastError = error;
  }

  throw new Error(`Table sous-catégories introuvable sur Supabase (essayé: ${candidates.join(", ")}). ${String((lastError as any)?.message || lastError)}`);
};

const normalizeSubcategory = (row: DbSubcategoryRow): Subcategory | null => {
  const id = String((row as any).id || "");
  const parent_slug = String((row as any).parent_slug || "");
  const name = typeof (row as any).name === "string" ? (row as any).name : "";
  const slugRaw = (row as any).slug;
  const slug = typeof slugRaw === "string" && slugRaw ? slugRaw : slugify(name);
  const position = Number((row as any).position ?? 0);
  const isActiveRaw = (row as any).is_active ?? (row as any).isActive;
  const is_active = typeof isActiveRaw === "boolean" ? isActiveRaw : true;
  const imageRaw = (row as any).image_url;
  const image_url = typeof imageRaw === "string" && imageRaw ? imageRaw : undefined;
  if (!id || !parent_slug || !name) return null;
  return {
    id,
    parent_slug,
    name,
    slug,
    position: Number.isFinite(position) ? position : 0,
    is_active,
    image_url,
  };
};

export const fetchSubcategories = async (parentSlug: string): Promise<Subcategory[]> => {
  const client = getSupabaseClient();
  const table = await resolveSubcategoriesTable();

  const { data, error } = await client
    .from(table)
    .select("*")
    .eq("parent_slug", parentSlug)
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as DbSubcategoryRow[]) : [];
  return rows.map(normalizeSubcategory).filter(Boolean) as Subcategory[];
};

export const fetchSubcategoriesForCategory = async (category: { slug: string; name?: string | null }): Promise<Subcategory[]> => {
  const slug = String(category.slug || "").trim();
  const name = typeof category.name === "string" ? category.name.trim() : "";
  if (!slug) return [];

  const bySlug = await fetchSubcategories(slug);
  if (bySlug.length) return bySlug;

  if (name && name !== slug) {
    const byName = await fetchSubcategories(name);
    if (byName.length) return byName;
  }

  return [];
};

export const upsertSubcategory = async (subcategory: Subcategory) => {
  const client = getSupabaseClient();
  const table = await resolveSubcategoriesTable();

  const payload: any = {
    id: subcategory.id,
    parent_slug: subcategory.parent_slug,
    name: subcategory.name,
    slug: subcategory.slug,
    position: subcategory.position,
    is_active: subcategory.is_active,
    isActive: subcategory.is_active,
    image_url: subcategory.image_url ?? null,
    imageUrl: subcategory.image_url ?? null,
  };

  let { error } = await client.from(table).upsert(payload, { onConflict: "id" });

  if (error) {
    const msg = String((error as any)?.message || error).toLowerCase();
    if (msg.includes("is_active") || msg.includes("isactive") || msg.includes("image_url") || msg.includes("imageurl")) {
      const { isActive: _ia, imageUrl: _iu, ...cleaned } = payload;
      const retry1 = await client.from(table).upsert(cleaned, { onConflict: "id" });
      if (retry1.error) {
         const { is_active: _is, image_url: _im, ...retryPayload } = payload;
         const retry2 = await client.from(table).upsert(retryPayload, { onConflict: "id" });
         error = retry2.error;
      } else {
         error = null;
      }
    }
  }

  if (error) throw error;
};

export const deleteSubcategory = async (id: string) => {
  const client = getSupabaseClient();
  const table = await resolveSubcategoriesTable();

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
};

export type AtelierService = {
  id: string;
  name: string;
  description: string;
  price: number;
  isVisible: boolean;
  position: number;
  imageUrl?: string;
};

type DbAtelierServiceRow = {
  id: string;
  name?: string | null;
  description?: string | null;
  price_mad?: number | null;
  priceMad?: number | null;
  price?: number | null;
  is_visible?: boolean | null;
  isVisible?: boolean | null;
  position?: number | null;
  image_url?: string | null;
  imageUrl?: string | null;
  created_at?: string;
  createdAt?: string;
};

let cachedAtelierServicesTable: string | null = null;

const resolveAtelierServicesTable = async () => {
  if (cachedAtelierServicesTable) return cachedAtelierServicesTable;
  const client = getSupabaseClient();
  const candidates = ["atelier_services", "atelierServices", "atelier"];
  let lastError: unknown = null;

  for (const table of candidates) {
    const { error } = await client.from(table).select("id", { head: true }).limit(1);
    if (!error) {
      cachedAtelierServicesTable = table;
      return table;
    }
    lastError = error;
  }

  throw new Error(`Table atelier introuvable sur Supabase (essayé: ${candidates.join(", ")}). ${String((lastError as any)?.message || lastError)}`);
};

const normalizeAtelierService = (row: DbAtelierServiceRow): AtelierService | null => {
  const id = String((row as any).id || "");
  const name = typeof (row as any).name === "string" ? ((row as any).name as string) : "";
  const description = typeof (row as any).description === "string" ? ((row as any).description as string) : "";
  const price = Number((row as any).price_mad ?? (row as any).priceMad ?? (row as any).price ?? 0);
  const isVisibleRaw = (row as any).is_visible ?? (row as any).isVisible;
  const isVisible = typeof isVisibleRaw === "boolean" ? isVisibleRaw : true;
  const position = Number((row as any).position ?? 0);
  const imageRaw = (row as any).image_url ?? (row as any).imageUrl;
  const imageUrl = typeof imageRaw === "string" && imageRaw ? imageRaw : undefined;
  if (!id || !name) return null;
  return {
    id,
    name,
    description,
    price: Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0,
    isVisible,
    position: Number.isFinite(position) ? position : 0,
    imageUrl,
  };
};

export const fetchAtelierServices = async (): Promise<AtelierService[]> => {
  const client = getSupabaseClient();
  const table = await resolveAtelierServicesTable();

  const { data, error } = await client.from(table).select("*").order("position", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as DbAtelierServiceRow[]) : [];
  return rows.map(normalizeAtelierService).filter(Boolean) as AtelierService[];
};

export const upsertAtelierService = async (service: AtelierService) => {
  const client = getSupabaseClient();
  const table = await resolveAtelierServicesTable();

  const base = {
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    price_mad: service.price,
    is_visible: service.isVisible,
    position: service.position ?? 0,
    image_url: service.imageUrl ?? null,
  } as Record<string, any>;

  const extractMissingColumn = (err: unknown) => {
    const msg = String((err as any)?.message || err);
    const m = msg.match(/Could not find the '([^']+)' column/i);
    return m?.[1] || "";
  };

  let payload: Record<string, any> = { ...base };
  for (let i = 0; i < 6; i++) {
    const { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
    if (!error) return;

    const missing = extractMissingColumn(error);
    if (!missing) throw error;

    if (missing === "price_mad") {
      payload = { ...payload };
      payload.price = payload.price_mad;
      delete payload.price_mad;
      continue;
    }
    if (missing === "is_visible") {
      payload = { ...payload };
      payload.isVisible = payload.is_visible;
      delete payload.is_visible;
      continue;
    }
    if (missing === "image_url") {
      payload = { ...payload };
      payload.imageUrl = payload.image_url;
      delete payload.image_url;
      continue;
    }
    if (missing === "imageUrl") {
      payload = { ...payload };
      delete payload.imageUrl;
      continue;
    }
    if (missing === "isVisible") {
      payload = { ...payload };
      delete payload.isVisible;
      continue;
    }

    payload = { ...payload };
    delete payload[missing];
  }
  throw new Error("Sauvegarde atelier échouée: schéma incompatible (colonnes manquantes).");
};

export const upsertAtelierServices = async (services: AtelierService[]) => {
  const client = getSupabaseClient();
  const table = await resolveAtelierServicesTable();

  const extractMissingColumn = (err: unknown) => {
    const msg = String((err as any)?.message || err);
    const m = msg.match(/Could not find the '([^']+)' column/i);
    return m?.[1] || "";
  };

  let payload: Array<Record<string, any>> = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    price_mad: s.price,
    is_visible: s.isVisible,
    position: s.position ?? 0,
    image_url: s.imageUrl ?? null,
  }));

  for (let i = 0; i < 6; i++) {
    const { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
    if (!error) return;

    const missing = extractMissingColumn(error);
    if (!missing) throw error;

    if (missing === "price_mad") {
      payload = payload.map((p) => {
        const next = { ...p, price: p.price_mad };
        delete (next as any).price_mad;
        return next;
      });
      continue;
    }
    if (missing === "is_visible") {
      payload = payload.map((p) => {
        const next = { ...p, isVisible: p.is_visible };
        delete (next as any).is_visible;
        return next;
      });
      continue;
    }
    if (missing === "image_url") {
      payload = payload.map((p) => {
        const next = { ...p, imageUrl: p.image_url };
        delete (next as any).image_url;
        return next;
      });
      continue;
    }
    if (missing === "imageUrl") {
      payload = payload.map((p) => {
        const next = { ...p };
        delete (next as any).imageUrl;
        return next;
      });
      continue;
    }
    if (missing === "isVisible") {
      payload = payload.map((p) => {
        const next = { ...p };
        delete (next as any).isVisible;
        return next;
      });
      continue;
    }

    payload = payload.map((p) => {
      const next = { ...p };
      delete (next as any)[missing];
      return next;
    });
  }
  throw new Error("Sauvegarde ordre atelier échouée: schéma incompatible (colonnes manquantes).");
};

export const deleteAtelierService = async (id: string) => {
  const client = getSupabaseClient();
  const table = await resolveAtelierServicesTable();

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
};

export type Brand = {
  id: string;
  name: string;
  logo_url?: string;
  is_visible: boolean;
  position: number;
};

type DbBrandRow = {
  id: string;
  name?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  is_visible?: boolean | null;
  isVisible?: boolean | null;
  position?: number | null;
  created_at?: string;
  createdAt?: string;
};

let cachedBrandsTable: string | null = null;

const resolveBrandsTable = async () => {
  if (cachedBrandsTable) return cachedBrandsTable;
  const client = getSupabaseClient();
  const candidates = ["brands", "marques", "Brands", "Marques"];
  let lastError: unknown = null;

  for (const table of candidates) {
    const { error } = await client.from(table).select("id", { head: true }).limit(1);
    if (!error) {
      cachedBrandsTable = table;
      return table;
    }
    lastError = error;
  }

  throw new Error(`Table marques introuvable sur Supabase (essayé: ${candidates.join(", ")}). ${String((lastError as any)?.message || lastError)}`);
};

const normalizeBrand = (row: DbBrandRow): Brand | null => {
  const id = String((row as any).id || "");
  const name = typeof (row as any).name === "string" ? ((row as any).name as string) : "";
  const logoRaw = (row as any).logo_url ?? (row as any).logoUrl;
  const logo_url = typeof logoRaw === "string" && logoRaw ? logoRaw : undefined;
  const isVisibleRaw = (row as any).is_visible ?? (row as any).isVisible;
  const is_visible = typeof isVisibleRaw === "boolean" ? isVisibleRaw : true;
  const position = Number((row as any).position ?? 0);
  if (!id || !name) return null;
  return {
    id,
    name,
    logo_url,
    is_visible,
    position: Number.isFinite(position) ? position : 0,
  };
};

export const fetchBrands = async (): Promise<Brand[]> => {
  const client = getSupabaseClient();
  const table = await resolveBrandsTable();

  const { data, error } = await client.from(table).select("*").order("position", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as DbBrandRow[]) : [];
  return rows.map(normalizeBrand).filter(Boolean) as Brand[];
};

export const upsertBrand = async (brand: Brand) => {
  const client = getSupabaseClient();
  const table = await resolveBrandsTable();

  const extractMissingColumn = (err: unknown) => {
    const msg = String((err as any)?.message || err);
    const m = msg.match(/Could not find the '([^']+)' column/i);
    return m?.[1] || "";
  };

  let payload: Record<string, any> = {
    id: brand.id,
    name: brand.name,
    logo_url: brand.logo_url ?? null,
    is_visible: brand.is_visible,
    position: brand.position ?? 0,
  };

  for (let i = 0; i < 6; i++) {
    const { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
    if (!error) return;

    const missing = extractMissingColumn(error);
    if (!missing) throw error;

    if (missing === "logo_url") {
      payload = { ...payload };
      payload.logoUrl = payload.logo_url;
      delete payload.logo_url;
      continue;
    }
    if (missing === "is_visible") {
      payload = { ...payload };
      payload.isVisible = payload.is_visible;
      delete payload.is_visible;
      continue;
    }
    if (missing === "logoUrl") {
      payload = { ...payload };
      delete payload.logoUrl;
      continue;
    }
    if (missing === "isVisible") {
      payload = { ...payload };
      delete payload.isVisible;
      continue;
    }

    payload = { ...payload };
    delete payload[missing];
  }

  throw new Error("Sauvegarde marque échouée: schéma incompatible (colonnes manquantes).");
};

export const upsertBrands = async (brands: Brand[]) => {
  const client = getSupabaseClient();
  const table = await resolveBrandsTable();

  const extractMissingColumn = (err: unknown) => {
    const msg = String((err as any)?.message || err);
    const m = msg.match(/Could not find the '([^']+)' column/i);
    return m?.[1] || "";
  };

  let payload: Array<Record<string, any>> = brands.map((b) => ({
    id: b.id,
    name: b.name,
    logo_url: b.logo_url ?? null,
    is_visible: b.is_visible,
    position: b.position ?? 0,
  }));

  for (let i = 0; i < 6; i++) {
    const { error } = await client.from(table).upsert(payload as any, { onConflict: "id" });
    if (!error) return;

    const missing = extractMissingColumn(error);
    if (!missing) throw error;

    if (missing === "logo_url") {
      payload = payload.map((p) => {
        const next = { ...p, logoUrl: p.logo_url };
        delete (next as any).logo_url;
        return next;
      });
      continue;
    }
    if (missing === "is_visible") {
      payload = payload.map((p) => {
        const next = { ...p, isVisible: p.is_visible };
        delete (next as any).is_visible;
        return next;
      });
      continue;
    }
    if (missing === "logoUrl") {
      payload = payload.map((p) => {
        const next = { ...p };
        delete (next as any).logoUrl;
        return next;
      });
      continue;
    }
    if (missing === "isVisible") {
      payload = payload.map((p) => {
        const next = { ...p };
        delete (next as any).isVisible;
        return next;
      });
      continue;
    }

    payload = payload.map((p) => {
      const next = { ...p };
      delete (next as any)[missing];
      return next;
    });
  }

  throw new Error("Sauvegarde marques échouée: schéma incompatible (colonnes manquantes).");
};

export const deleteBrand = async (id: string) => {
  const client = getSupabaseClient();
  const table = await resolveBrandsTable();

  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
};
export const fetchTireWidths = async (): Promise<string[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from("tire_widths").select("value").order("position");
  if (error) return [];
  const rows = Array.isArray(data) ? (data as Array<{ value?: string | null }>) : [];
  return rows.map((d) => String(d.value ?? "")).filter(Boolean);
};

export const fetchTireHeights = async (): Promise<string[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from("tire_heights").select("value").order("position");
  if (error) return [];
  const rows = Array.isArray(data) ? (data as Array<{ value?: string | null }>) : [];
  return rows.map((d) => String(d.value ?? "")).filter(Boolean);
};

export const fetchTireDiameters = async (): Promise<string[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from("tire_diameters").select("value").order("position");
  if (error) return [];
  const rows = Array.isArray(data) ? (data as Array<{ value?: string | null }>) : [];
  return rows.map((d) => String(d.value ?? "")).filter(Boolean);
};
