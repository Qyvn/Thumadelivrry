import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * On Vercel (and similar serverless hosts) the filesystem is ephemeral.
 * We keep a seeded SQLite snapshot in data/demo.db and copy it to /tmp
 * on cold start so the demo app works without a hosted Postgres URL.
 * Set DATABASE_URL to a Postgres connection string for a durable deploy.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured && !configured.startsWith("file:")) {
    return configured;
  }

  if (process.env.VERCEL || process.env.THUMA_USE_TMP_DB === "1") {
    const tmpDir = "/tmp";
    const tmpDb = path.join(tmpDir, "thuma.db");
    if (!existsSync(tmpDb)) {
      const demoDb = path.join(process.cwd(), "data", "demo.db");
      if (!existsSync(demoDb)) {
        throw new Error(
          "Missing data/demo.db for serverless SQLite bootstrap. Set DATABASE_URL to Postgres instead.",
        );
      }
      mkdirSync(tmpDir, { recursive: true });
      copyFileSync(demoDb, tmpDb);
    }
    const url = `file:${tmpDb}`;
    process.env.DATABASE_URL = url;
    return url;
  }

  return configured ?? "file:./dev.db";
}

resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
