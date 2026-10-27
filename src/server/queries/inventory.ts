import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { items, locations, movements, user, type MovementType } from "@/server/db/schema";
import { requireUser } from "@/server/session";

export const PAGE_SIZE = 25;

import type { ItemSort, StockFilter } from "@/lib/filters";
export type { ItemSort, StockFilter };

export type InventoryFilters = {
  q?: string;
  location?: string;
  stock?: StockFilter;
  sort?: ItemSort;
  page?: number;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function itemConditions({ q, location, stock }: InventoryFilters) {
  const conditions: SQL[] = [];
  const term = q?.trim();
  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    conditions.push(or(ilike(items.code, pattern), ilike(items.name, pattern))!);
  }
  if (location === "none") conditions.push(sql`${items.locationId} is null`);
  else if (location) conditions.push(eq(items.locationId, location));
  if (stock === "out") conditions.push(eq(items.quantity, 0));
  if (stock === "available") conditions.push(sql`${items.quantity} > 0`);
  return conditions.length ? and(...conditions) : undefined;
}

const sortOrder: Record<ItemSort, SQL[]> = {
  code: [asc(items.code)],
  name: [asc(items.name), asc(items.code)],
  quantity: [asc(items.quantity), asc(items.name)],
  updated: [desc(items.updatedAt)],
};

const itemColumns = {
  id: items.id,
  code: items.code,
  name: items.name,
  quantity: items.quantity,
  notes: items.notes,
  updatedAt: items.updatedAt,
  locationId: items.locationId,
  location: locations.name,
};

export type InventoryRow = Awaited<ReturnType<typeof listItems>>["rows"][number];

export async function listItems(filters: InventoryFilters) {
  await requireUser();
  const where = itemConditions(filters);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select(itemColumns)
      .from(items)
      .leftJoin(locations, eq(items.locationId, locations.id))
      .where(where)
      .orderBy(...sortOrder[filters.sort ?? "code"])
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(items).where(where),
  ]);

  return {
    rows,
    total: total?.value ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((total?.value ?? 0) / PAGE_SIZE)),
  };
}

/** Full, unpaginated listing for exports. Respects the same filters as the table. */
export async function listItemsForExport(filters: InventoryFilters) {
  await requireUser();
  return db
    .select(itemColumns)
    .from(items)
    .leftJoin(locations, eq(items.locationId, locations.id))
    .where(itemConditions(filters))
    .orderBy(...sortOrder[filters.sort ?? "code"]);
}

export async function getInventoryStats() {
  await requireUser();
  const [stats] = await db
    .select({
      items: count(),
      units: sql<number>`coalesce(sum(${items.quantity}), 0)::int`,
      outOfStock: sql<number>`count(*) filter (where ${items.quantity} = 0)::int`,
      locations: sql<number>`count(distinct ${items.locationId})::int`,
    })
    .from(items);
  return stats ?? { items: 0, units: 0, outOfStock: 0, locations: 0 };
}

export async function listLocations() {
  await requireUser();
  return db
    .select({ id: locations.id, name: locations.name, items: count(items.id) })
    .from(locations)
    .leftJoin(items, eq(items.locationId, locations.id))
    .groupBy(locations.id)
    .orderBy(asc(locations.name));
}

export async function getItem(id: string) {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select({ ...itemColumns, createdAt: items.createdAt })
    .from(items)
    .leftJoin(locations, eq(items.locationId, locations.id))
    .where(eq(items.id, id));
  return row ?? null;
}

const movementColumns = {
  id: movements.id,
  type: movements.type,
  delta: movements.delta,
  quantityAfter: movements.quantityAfter,
  note: movements.note,
  createdAt: movements.createdAt,
  userName: user.name,
  itemId: items.id,
  itemCode: items.code,
  itemName: items.name,
};

export type MovementRow = Awaited<ReturnType<typeof listMovements>>["rows"][number];

export async function listMovements({
  type,
  itemId,
  page = 1,
}: {
  type?: MovementType;
  itemId?: string;
  page?: number;
}) {
  await requireUser();
  const conditions: SQL[] = [];
  if (type) conditions.push(eq(movements.type, type));
  if (itemId) conditions.push(eq(movements.itemId, itemId));
  const where = conditions.length ? and(...conditions) : undefined;
  const current = Math.max(1, page);

  const [rows, [total]] = await Promise.all([
    db
      .select(movementColumns)
      .from(movements)
      .innerJoin(items, eq(movements.itemId, items.id))
      .leftJoin(user, eq(movements.userId, user.id))
      .where(where)
      .orderBy(desc(movements.createdAt), desc(movements.id))
      .limit(PAGE_SIZE)
      .offset((current - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(movements).where(where),
  ]);

  return {
    rows,
    total: total?.value ?? 0,
    page: current,
    pageCount: Math.max(1, Math.ceil((total?.value ?? 0) / PAGE_SIZE)),
  };
}
