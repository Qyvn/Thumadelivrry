#!/usr/bin/env node
/**
 * Prisma provider switch. prisma/schema.prisma (SQLite) is the source of truth.
 * prisma/postgres/schema.prisma is generated from it with provider = "postgresql";
 * its migrations live in prisma/postgres/migrations.
 *
 *   node scripts/prisma-db.mjs sync      # regenerate prisma/postgres/schema.prisma
 *   node scripts/prisma-db.mjs check     # fail if the postgres schema is out of date
 *   node scripts/prisma-db.mjs generate  # prisma generate for the provider in DATABASE_URL
 *   node scripts/prisma-db.mjs deploy    # prisma migrate deploy for the provider in DATABASE_URL
 *
 * Provider is chosen from DATABASE_URL: postgres:// or postgresql:// => Postgres, else SQLite.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SQLITE_SCHEMA = "prisma/schema.prisma";
const PG_SCHEMA = "prisma/postgres/schema.prisma";

function pgSchemaText() {
  const src = readFileSync(SQLITE_SCHEMA, "utf8");
  const out = src.replace(/provider = "sqlite"/, 'provider = "postgresql"');
  if (out === src) throw new Error('Could not find provider = "sqlite" in schema.prisma');
  return (
    "// GENERATED from prisma/schema.prisma by scripts/prisma-db.mjs sync — do not edit by hand.\n" +
    out
  );
}

function isPostgres() {
  return /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");
}

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const mode = process.argv[2];

if (mode === "sync") {
  writeFileSync(PG_SCHEMA, pgSchemaText());
  console.log(`wrote ${PG_SCHEMA}`);
} else if (mode === "check") {
  if (readFileSync(PG_SCHEMA, "utf8") !== pgSchemaText()) {
    console.error(`${PG_SCHEMA} is stale. Run: node scripts/prisma-db.mjs sync`);
    process.exit(1);
  }
  console.log("postgres schema in sync");
} else if (mode === "generate") {
  const schema = isPostgres() ? PG_SCHEMA : SQLITE_SCHEMA;
  console.log(`prisma generate (${isPostgres() ? "postgresql" : "sqlite"})`);
  run(`npx prisma generate --schema ${schema}`);
} else if (mode === "deploy") {
  const schema = isPostgres() ? PG_SCHEMA : SQLITE_SCHEMA;
  run(`npx prisma migrate deploy --schema ${schema}`);
} else {
  console.error("usage: prisma-db.mjs sync|check|generate|deploy");
  process.exit(2);
}
