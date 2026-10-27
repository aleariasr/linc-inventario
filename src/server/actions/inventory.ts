"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { entrySchema, itemSchema, toFieldErrors, updateItemSchema } from "@/lib/validation";
import { db, type Tx } from "@/server/db";
import { items, locations, movements } from "@/server/db/schema";
import { requireUser } from "@/server/session";

const formObject = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));

/** Finds a location by case-insensitive name or creates it. */
export async function ensureLocation(tx: Tx, name: string | null): Promise<string | null> {
  if (!name) return null;
  const [existing] = await tx
    .select({ id: locations.id })
    .from(locations)
    .where(sql`lower(${locations.name}) = lower(${name})`);
  if (existing) return existing.id;
  const [created] = await tx
    .insert(locations)
    .values({ name })
    .onConflictDoUpdate({ target: locations.name, set: { name } })
    .returning({ id: locations.id });
  return created!.id;
}

function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause ?? error;
  return (cause as { code?: string })?.code === "23505";
}

const duplicateCode = (code: string): ActionResult => ({
  ok: false,
  error: "Revisa los campos marcados.",
  fieldErrors: { code: `Ya existe un ítem con el código "${code}"` },
});

export async function createItem(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const actor = await requireUser();
  const parsed = itemSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const input = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const locationId = await ensureLocation(tx, input.location);
      const [item] = await tx
        .insert(items)
        .values({
          code: input.code,
          name: input.name,
          quantity: input.quantity,
          locationId,
          notes: input.notes,
        })
        .returning({ id: items.id });
      await tx.insert(movements).values({
        itemId: item!.id,
        type: "alta",
        delta: input.quantity,
        quantityAfter: input.quantity,
        note: "Ítem creado",
        userId: actor.id,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateCode(input.code);
    throw error;
  }

  refresh();
  return { ok: true, message: `"${input.name}" se agregó al inventario.` };
}

export async function updateItem(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const actor = await requireUser();
  const parsed = updateItemSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const input = parsed.data;

  try {
    const found = await db.transaction(async (tx) => {
      // Lock the row so a concurrent entry can't be lost between read and write.
      const [current] = await tx.select().from(items).where(eq(items.id, input.id)).for("update");
      if (!current) return false;

      const locationId = await ensureLocation(tx, input.location);
      await tx
        .update(items)
        .set({ code: input.code, name: input.name, quantity: input.quantity, locationId, notes: input.notes })
        .where(eq(items.id, input.id));

      const delta = input.quantity - current.quantity;
      if (delta !== 0) {
        await tx.insert(movements).values({
          itemId: input.id,
          type: "ajuste",
          delta,
          quantityAfter: input.quantity,
          note: input.reason ?? "Corrección manual de cantidad",
          userId: actor.id,
        });
      }
      return true;
    });
    if (!found) return { ok: false, error: "El ítem ya no existe." };
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateCode(input.code);
    throw error;
  }

  refresh();
  return { ok: true, message: "Cambios guardados." };
}

export async function registerEntry(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const actor = await requireUser();
  const parsed = entrySchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const { itemId, quantity, note } = parsed.data;

  const updated = await db.transaction(async (tx) => {
    // Atomic increment: concurrent entries never overwrite each other.
    const [row] = await tx
      .update(items)
      .set({ quantity: sql`${items.quantity} + ${quantity}` })
      .where(eq(items.id, itemId))
      .returning({ name: items.name, quantity: items.quantity });
    if (!row) return null;
    await tx.insert(movements).values({
      itemId,
      type: "entrada",
      delta: quantity,
      quantityAfter: row.quantity,
      note,
      userId: actor.id,
    });
    return row;
  });

  if (!updated) return { ok: false, error: "El ítem ya no existe." };
  refresh();
  return { ok: true, message: `Entrada registrada: ${updated.name} ahora tiene ${updated.quantity}.` };
}

export async function deleteItem(
  id: string,
  { redirectTo }: { redirectTo?: string } = {},
): Promise<ActionResult> {
  await requireUser();
  const [deleted] = await db
    .delete(items)
    .where(and(eq(items.id, id)))
    .returning({ name: items.name });
  if (!deleted) return { ok: false, error: "El ítem ya no existe." };
  if (redirectTo) redirect(redirectTo);
  refresh();
  return { ok: true, message: `"${deleted.name}" se eliminó del inventario.` };
}
