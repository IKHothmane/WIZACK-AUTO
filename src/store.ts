import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  price_cents: number;
  currency: string;
  quantity: number;
  image?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
      getTotalCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((acc, item) => acc + item.price_cents * item.quantity, 0),
    }),
    {
      name: "wizack-cart-storage",
    }
  )
);

export type AtelierService = {
  id: string;
  name: string;
  price: number;
  description: string;
  isVisible: boolean;
};

export type BrandConfig = {
  id: string;
  name: string;
  logoUrl?: string;
  isVisible: boolean;
};

type AdminStore = {
  services: AtelierService[];
  brands: BrandConfig[];
  addService: (service: AtelierService) => void;
  updateService: (id: string, data: Partial<AtelierService>) => void;
  removeService: (id: string) => void;
  addBrand: (brand: BrandConfig) => void;
  updateBrand: (id: string, data: Partial<BrandConfig>) => void;
  removeBrand: (id: string) => void;
};

const defaultServices: AtelierService[] = [];

const defaultBrands: BrandConfig[] = [
  "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Chevrolet", 
  "Citroën", "Dacia", "Ferrari", "Fiat", "Ford", "Honda", "Hyundai", "Jaguar", 
  "Jeep", "Kia", "Land Rover", "Lexus", "Maserati", "Mazda", "Mercedes-Benz", 
  "Mini", "Mitsubishi", "Nissan", "Peugeot", "Porsche", "Renault", "Seat", 
  "Skoda", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
  "Bosch", "Brembo", "Valeo", "Michelin"
].map(name => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, isVisible: true }));

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      services: defaultServices,
      brands: defaultBrands,
      addService: (service) => set((state) => ({ services: [...state.services, service] })),
      updateService: (id, data) => set((state) => ({
        services: state.services.map((s) => s.id === id ? { ...s, ...data } : s)
      })),
      removeService: (id) => set((state) => ({
        services: state.services.filter((s) => s.id !== id)
      })),
      addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
      updateBrand: (id, data) => set((state) => ({
        brands: state.brands.map((b) => b.id === id ? { ...b, ...data } : b)
      })),
      removeBrand: (id) => set((state) => ({
        brands: state.brands.filter((b) => b.id !== id)
      }))
    }),
    {
      name: "wizack-admin-storage"
    }
  )
);

export type User = {
  id: string;
  email: string;
  name: string;
};

type UserStore = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "wizack-user-storage",
    }
  )
);
