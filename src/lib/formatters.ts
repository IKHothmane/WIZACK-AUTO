export const formatPrice = (priceCents: number, currency: string) => {
  const value = priceCents / 100;
  const formatted = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
  if (currency === "MAD") return `${formatted} DH`;
  return `${formatted} ${currency}`;
};

export const slugify = (value: string) => {
  const v = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return v || "produit";
};

export const makeId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
