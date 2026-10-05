import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbAvailable?: boolean;
  lastDbFailure?: number;
};

export const isDatabaseConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
};

const RETRY_INTERVAL_MS = 60000;

export const isDatabaseAvailable = (): boolean => {
  return isDatabaseConfigured();
};

export const markDatabaseFailure = (): void => {
  globalForPrisma.lastDbFailure = Date.now();
};

export const markDatabaseSuccess = (): void => {
  globalForPrisma.dbAvailable = true;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
