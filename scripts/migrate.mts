/** Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está definida");

const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("✔ Migraciones aplicadas");
} finally {
  await client.end();
}
