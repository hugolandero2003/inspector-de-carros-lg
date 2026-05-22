import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida");
}

const disableSslVerify =
  process.env.NODE_ENV !== "production" && process.env.DB_SSL_NO_VERIFY !== "false";

const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString: databaseUrl,
    ssl: disableSslVerify ? { rejectUnauthorized: false } : undefined,
  });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
