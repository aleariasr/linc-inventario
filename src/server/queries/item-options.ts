import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/server/db";
import { items } from "@/server/db/schema";
import { requireUser } from "@/server/session";

/** Lightweight list used by the item picker. */
export async function listItemOptions() {
  await requireUser();
  return db
    .select({ id: items.id, code: items.code, name: items.name, quantity: items.quantity })
    .from(items)
    .orderBy(asc(items.name));
}
