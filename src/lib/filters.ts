/** Parses untrusted URL search params into typed, bounded filter values. */
type Params = Record<string, string | string[] | undefined> | URLSearchParams;

export const STOCK_FILTERS = ["all", "available", "out"] as const;
export const ITEM_SORTS = ["code", "name", "quantity", "updated"] as const;
export const MOVEMENT_TYPES = ["entrada", "ajuste", "importacion", "alta"] as const;

export type StockFilter = (typeof STOCK_FILTERS)[number];
export type ItemSort = (typeof ITEM_SORTS)[number];
export type MovementTypeFilter = (typeof MOVEMENT_TYPES)[number];

function read(params: Params, key: string): string | undefined {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() || undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseInventoryFilters(params: Params) {
  const location = read(params, "location");
  const page = Number(read(params, "page"));
  return {
    q: read(params, "q")?.slice(0, 100),
    location: location === "none" || (location && UUID.test(location)) ? location : undefined,
    stock: oneOf(read(params, "stock"), STOCK_FILTERS),
    sort: oneOf(read(params, "sort"), ITEM_SORTS),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function parseMovementFilters(params: Params) {
  const page = Number(read(params, "page"));
  return {
    type: oneOf(read(params, "type"), MOVEMENT_TYPES),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Builds a query string, dropping empty values and defaults. */
export function toQueryString(values: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "" || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
