import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "./schema";

/**
 * One pool per server instance. In dev, HMR re-evaluates modules, so the client
 * is cached on globalThis to avoid exhausting connections.
 * `prepare: false` keeps us compatible with transaction-mode poolers (Neon, Supabase).
 */
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
