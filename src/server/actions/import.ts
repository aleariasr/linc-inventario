"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import {
  buildImportPlan,
  parseInventoryRows,
  type ImportMode,
  type ImportPlan,
  type RowError,
} from "@/lib/inventory-import";
import { db } from "@/server/db";
import { items, locations, movements } from "@/server/db/schema";
import { MAX_IMPORT_BYTES, readFirstSheet } from "@/server/excel";
import { requireUser } from "@/server/session";
import { ensureLocation } from "./inventory";

export type ImportPreview = {
  fileName: string;
  mode: ImportMode;
  totalRows: number;
  errors: RowError[];
  plan: ImportPlan;
};

async function prepare(formData: FormData): Promise<ActionResult<ImportPreview>> {
  const file = formData.get("file");
  const mode: ImportMode = formData.get("mode") === "add" ? "add" : "replace";

  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Selecciona un archivo Excel (.xlsx)." };
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      ok: false,
      error: "Formato no soportado. Guarda el archivo como Excel (.xlsx) e inténtalo de nuevo.",
    };
  }
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, error: "El archivo supera el máximo de 5 MB." };

  let sheet;
  try {
    sheet = await readFirstSheet(await file.arrayBuffer());
  } catch {
    return {
      ok: false,
      error: "No se pudo leer el archivo. Verifica que sea un Excel válido y no esté protegido.",
    };
  }

  const parsed = parseInventoryRows(sheet);
  if (parsed.fatal) return { ok: false, error: parsed.fatal };

  const codes = parsed.rows.map((r) => r.code);
  const existing = codes.length
    ? await db
        .select({
          id: items.id,
          code: items.code,
          name: items.name,
          quantity: items.quantity,
          location: locations.name,
        })
        .from(items)
        .leftJoin(locations, eq(items.locationId, locations.id))
        .where(inArray(items.code, codes))
    : [];

  return {
    ok: true,
    message: "Vista previa lista.",
    data: {
      fileName: file.name,
      mode,
      totalRows: parsed.rows.length + parsed.errors.length,
      errors: parsed.errors,
      plan: buildImportPlan(parsed.rows, existing, mode),
    },
  };
}

export async function previewImport(formData: FormData): Promise<ActionResult<ImportPreview>> {
  await requireUser();
  return prepare(formData);
}

/**
 * Re-parses the file and re-plans against the current database state, so the result is
 * correct even if inventory changed between preview and confirmation. Runs in one
 * transaction: either every valid row is applied or none.
 */
export async function applyImport(
  formData: FormData,
): Promise<ActionResult<{ created: number; updated: number }>> {
  const actor = await requireUser();
  const prepared = await prepare(formData);
  if (!prepared.ok) return prepared;

  const { plan, mode, fileName } = prepared.data!;
  const note = `Importación de ${fileName}${mode === "add" ? " (suma)" : ""}`;

  await db.transaction(async (tx) => {
    const locationIds = new Map<string, string | null>();
    const resolveLocation = async (name: string | null) => {
      const key = name?.toLowerCase() ?? "";
      if (!locationIds.has(key)) locationIds.set(key, await ensureLocation(tx, name));
      return locationIds.get(key)!;
    };

    for (const row of plan.creates) {
      const [item] = await tx
        .insert(items)
        .values({
          code: row.code,
          name: row.name,
          quantity: row.quantity,
          locationId: await resolveLocation(row.location),
        })
        .returning({ id: items.id });
      await tx.insert(movements).values({
        itemId: item!.id,
        type: "importacion",
        delta: row.quantity,
        quantityAfter: row.quantity,
        note,
        userId: actor.id,
      });
    }

    for (const row of plan.updates) {
      const locationId = await resolveLocation(row.location);
      const [updated] = await tx
        .update(items)
        .set({
          name: row.name,
          locationId,
          quantity: mode === "add" ? sql`${items.quantity} + ${row.quantity}` : row.nextQuantity,
        })
        .where(eq(items.id, row.id))
        .returning({ quantity: items.quantity });
      if (row.delta !== 0 && updated) {
        await tx.insert(movements).values({
          itemId: row.id,
          type: "importacion",
          delta: row.delta,
          quantityAfter: updated.quantity,
          note,
          userId: actor.id,
        });
      }
    }
  });

  refresh();
  const created = plan.creates.length;
  const updated = plan.updates.length;
  return {
    ok: true,
    message: `Importación completada: ${created} nuevos, ${updated} actualizados.`,
    data: { created, updated },
  };
}
