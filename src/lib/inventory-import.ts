/**
 * Pure import logic (no I/O) so it can be unit-tested in isolation:
 *   1. parseInventoryRows: raw spreadsheet cells → validated rows + per-row errors
 *   2. buildImportPlan:     validated rows + current inventory → creates / updates / unchanged
 */

export type CellValue = string | number | null;

export type ParsedRow = {
  row: number;
  code: string;
  name: string;
  quantity: number;
  location: string | null;
};

export type RowError = { row: number; message: string };

export type ImportMode = "replace" | "add";

export const MAX_IMPORT_ROWS = 5000;
export const MAX_CODE_LENGTH = 64;
export const MAX_NAME_LENGTH = 200;
export const MAX_LOCATION_LENGTH = 80;

const COLUMN_ALIASES = {
  code: ["codigo", "cod", "code", "sku", "codigo inventario"],
  name: ["nombre", "name", "descripcion", "articulo", "item"],
  quantity: ["cantidad", "qty", "stock", "existencias", "unidades"],
  location: ["ubicacion", "location", "lugar", "bodega"],
} as const;

type Column = keyof typeof COLUMN_ALIASES;

export function normalizeHeader(value: CellValue): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(value: CellValue): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Maps each known column to its index in the header row. */
export function resolveColumns(header: CellValue[]): {
  columns: Partial<Record<Column, number>>;
  missing: Column[];
} {
  const normalized = header.map(normalizeHeader);
  const columns: Partial<Record<Column, number>> = {};

  for (const column of Object.keys(COLUMN_ALIASES) as Column[]) {
    const index = normalized.findIndex((h) => (COLUMN_ALIASES[column] as readonly string[]).includes(h));
    if (index !== -1) columns[column] = index;
  }

  const required: Column[] = ["code", "name", "quantity"];
  return { columns, missing: required.filter((c) => columns[c] === undefined) };
}

export function parseQuantity(value: CellValue): number | null {
  if (value === null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

const COLUMN_LABELS: Record<Column, string> = {
  code: "Código",
  name: "Nombre",
  quantity: "Cantidad",
  location: "Ubicación",
};

/**
 * @param rows First entry is the header. Each entry carries its 1-based sheet row number.
 */
export function parseInventoryRows(rows: { row: number; cells: CellValue[] }[]): {
  rows: ParsedRow[];
  errors: RowError[];
  fatal?: string;
} {
  const [header, ...body] = rows;
  if (!header) return { rows: [], errors: [], fatal: "El archivo está vacío." };

  const { columns, missing } = resolveColumns(header.cells);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [],
      fatal: `Faltan columnas obligatorias: ${missing.map((c) => COLUMN_LABELS[c]).join(", ")}. La primera fila debe tener los encabezados Código, Nombre, Cantidad y Ubicación.`,
    };
  }

  const dataRows = body.filter((r) => r.cells.some((c) => normalizeText(c) !== ""));
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { rows: [], errors: [], fatal: `El archivo supera el máximo de ${MAX_IMPORT_ROWS} filas.` };
  }

  const parsed: ParsedRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();
  const at = (cells: CellValue[], column: Column) => {
    const index = columns[column];
    return index === undefined ? null : (cells[index] ?? null);
  };

  for (const { row, cells } of dataRows) {
    const code = normalizeText(at(cells, "code"));
    const name = normalizeText(at(cells, "name"));
    const quantity = parseQuantity(at(cells, "quantity"));
    const location = normalizeText(at(cells, "location")) || null;

    const problems: string[] = [];
    if (!code) problems.push("el código está vacío");
    else if (code.length > MAX_CODE_LENGTH) problems.push(`el código supera ${MAX_CODE_LENGTH} caracteres`);
    if (!name) problems.push("el nombre está vacío");
    else if (name.length > MAX_NAME_LENGTH) problems.push(`el nombre supera ${MAX_NAME_LENGTH} caracteres`);
    if (quantity === null) problems.push("la cantidad debe ser un número entero mayor o igual a 0");
    if (location && location.length > MAX_LOCATION_LENGTH)
      problems.push(`la ubicación supera ${MAX_LOCATION_LENGTH} caracteres`);
    if (code && seen.has(code)) problems.push(`el código "${code}" ya aparece en la fila ${seen.get(code)}`);

    if (problems.length > 0) {
      errors.push({ row, message: capitalize(problems.join("; ")) });
      continue;
    }

    seen.set(code, row);
    parsed.push({ row, code, name, quantity: quantity!, location });
  }

  return { rows: parsed, errors };
}

export type ExistingItem = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  location: string | null;
};

export type PlannedCreate = ParsedRow;

export type PlannedUpdate = ParsedRow & {
  id: string;
  /** Quantity after the import is applied. */
  nextQuantity: number;
  delta: number;
  previous: { name: string; quantity: number; location: string | null };
};

export type ImportPlan = {
  creates: PlannedCreate[];
  updates: PlannedUpdate[];
  unchanged: number;
};

/**
 * - replace: the spreadsheet is the source of truth; quantities are set to the file's value.
 * - add:     the file is a batch of incoming stock; quantities are added to existing ones.
 * Name and location are always taken from the file when present.
 */
export function buildImportPlan(rows: ParsedRow[], existing: ExistingItem[], mode: ImportMode): ImportPlan {
  const byCode = new Map(existing.map((item) => [item.code, item]));
  const plan: ImportPlan = { creates: [], updates: [], unchanged: 0 };

  for (const row of rows) {
    const current = byCode.get(row.code);
    if (!current) {
      plan.creates.push(row);
      continue;
    }

    const nextQuantity = mode === "add" ? current.quantity + row.quantity : row.quantity;
    const location = row.location ?? current.location;
    const changed =
      nextQuantity !== current.quantity || row.name !== current.name || location !== current.location;

    if (!changed) {
      plan.unchanged += 1;
      continue;
    }

    plan.updates.push({
      ...row,
      location,
      id: current.id,
      nextQuantity,
      delta: nextQuantity - current.quantity,
      previous: { name: current.name, quantity: current.quantity, location: current.location },
    });
  }

  return plan;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}
