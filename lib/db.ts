import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dns from "node:dns";

// Neon Postgres over TCP (node-postgres pool + Prisma driver adapter).
//
// Why TCP and not the HTTP serverless driver: this network has a broken
// IPv6 path and intermittent packet loss to the region, which made
// fetch-based queries fail wholesale. TCP retries per address.
//
// Why the retry wrapper: connections to the trial Neon compute are
// intermittently dropped at connect time (ETIMEDOUT with all addresses
// failing). A failed CONNECT means no statement ran, so retrying is safe;
// we retry only connection-class errors, never mid-statement ones.
//
// Fail closed when DATABASE_URL is absent so `bun run build` needs no DB.
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isTransientConnectError(error: unknown): boolean {
  const e = error as { code?: string; message?: string; errors?: Array<{ code?: string }> };
  const code = e?.code ?? "";
  if (["ETIMEDOUT", "P1001", "P1002", "P2024", "P2037"].includes(code)) return true;
  const text = `${e?.message ?? ""} ${(e?.errors ?? []).map((x) => x?.code ?? "").join(" ")}`;
  return /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|timeout/i.test(text);
}

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const pool = new Pool({
      connectionString: url,
      max: 5,
      keepAlive: true,
      // Keep a warm socket between requests so most queries never reconnect.
      idleTimeoutMillis: 120_000,
      connectionTimeoutMillis: 8_000,
    });
    const base = new PrismaClient({ adapter: new PrismaPg(pool) });
    // Retry connection-level failures (5 attempts, gentle backoff ≈5s total).
    const client = base.$extends({
      query: {
        async $allOperations({ args, query }) {
          let lastError: unknown;
          for (let attempt = 0; attempt < 5; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              lastError = error;
              if (!isTransientConnectError(error) || attempt === 4) throw error;
              await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
            }
          }
          throw lastError;
        },
      },
    });
    return client as unknown as PrismaClient;
  } catch {
    return null;
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export function requireDb(): PrismaClient {
  if (!prisma) {
    throw new Error(
      "DATABASE_URL is not configured. Set the Neon connection string in .env to enable database features.",
    );
  }
  return prisma;
}

export function isDbConfigured(): boolean {
  return prisma !== null;
}
