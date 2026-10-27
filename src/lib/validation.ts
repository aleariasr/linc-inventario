import { z } from "zod";
import { MAX_CODE_LENGTH, MAX_LOCATION_LENGTH, MAX_NAME_LENGTH } from "./inventory-import";
import type { FieldErrors } from "./action-result";

const text = (label: string, max: number) =>
  z
    .string({ error: `${label} es obligatorio` })
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, { error: `${label} es obligatorio` })
        .max(max, { error: `${label} admite máximo ${max} caracteres` }),
    );

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .pipe(
      z
        .string()
        .max(max, { error: `Máximo ${max} caracteres` })
        .nullable(),
    );

const quantity = (min: number) =>
  z.coerce
    .number({ error: "Ingresa un número" })
    .int({ error: "Debe ser un número entero" })
    .min(min, { error: min === 0 ? "No puede ser negativa" : `Debe ser al menos ${min}` })
    .max(1_000_000, { error: "Cantidad demasiado grande" });

export const itemSchema = z.object({
  code: text("El código", MAX_CODE_LENGTH),
  name: text("El nombre", MAX_NAME_LENGTH),
  quantity: quantity(0),
  location: optionalText(MAX_LOCATION_LENGTH),
  notes: optionalText(1000),
});

export const updateItemSchema = itemSchema.extend({
  id: z.uuid(),
  reason: optionalText(300),
});

export const entrySchema = z.object({
  itemId: z.uuid({ error: "Ítem inválido" }),
  quantity: quantity(1),
  note: optionalText(300),
});

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
