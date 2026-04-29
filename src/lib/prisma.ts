import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getClient = () => {
  if (!process.env.DATABASE_URL) return undefined;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
};

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      if (!client) {
        throw new Error("DATABASE_URL manquant. Configurez votre base Supabase dans .env.local.");
      }
      return (client as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
) as PrismaClient;
