export type FieldErrors = Record<string, string | undefined>;

export type ActionResult<T = undefined> =
  { ok: true; message: string; data?: T } | { ok: false; error: string; fieldErrors?: FieldErrors };

export const initialActionState = null as ActionResult | null;
