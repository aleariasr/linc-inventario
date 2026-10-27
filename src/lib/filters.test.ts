import { describe, expect, it } from "vitest";
import { parseInventoryFilters, toQueryString } from "./filters";

describe("parseInventoryFilters", () => {
  it("drops unknown and malformed values", () => {
    expect(
      parseInventoryFilters({ q: "  osc ", stock: "bogus", sort: "quantity", page: "-3", location: "x';--" }),
    ).toEqual({ q: "osc", stock: undefined, sort: "quantity", page: 1, location: undefined });
  });

  it("accepts the 'none' location and valid uuids", () => {
    expect(parseInventoryFilters({ location: "none" }).location).toBe("none");
    const id = "6f1c1f9e-2b7a-4c1e-9a55-2f3b1e0c9d11";
    expect(parseInventoryFilters(new URLSearchParams({ location: id })).location).toBe(id);
  });
});

describe("toQueryString", () => {
  it("omits empty values and the first page", () => {
    expect(toQueryString({ q: "", page: 1, stock: "out" })).toBe("?stock=out");
    expect(toQueryString({})).toBe("");
  });
});
