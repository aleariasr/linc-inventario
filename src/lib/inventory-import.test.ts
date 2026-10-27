import { describe, expect, it } from "vitest";
import {
  buildImportPlan,
  normalizeHeader,
  parseInventoryRows,
  parseQuantity,
  type ExistingItem,
} from "./inventory-import";

const header = { row: 1, cells: ["Código", "Nombre", "Cantidad", "Ubicación"] };

describe("normalizeHeader", () => {
  it("ignores accents, case and punctuation", () => {
    expect(normalizeHeader(" UBICACIÓN: ")).toBe("ubicacion");
    expect(normalizeHeader("Código")).toBe("codigo");
  });
});

describe("parseQuantity", () => {
  it.each([
    [5, 5],
    ["12", 12],
    [" 3 ", 3],
    [null, 0],
    ["", 0],
  ])("parses %p as %p", (input, expected) => {
    expect(parseQuantity(input)).toBe(expected);
  });

  it.each([-1, 1.5, "abc", "2,5"])("rejects %p", (input) => {
    expect(parseQuantity(input)).toBeNull();
  });
});

describe("parseInventoryRows", () => {
  it("keeps leading zeros in codes and trims whitespace", () => {
    const result = parseInventoryRows([
      header,
      { row: 2, cells: ["000013", "  Cinta   métrica ", 1, "Bodega"] },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { row: 2, code: "000013", name: "Cinta métrica", quantity: 1, location: "Bodega" },
    ]);
  });

  it("accepts columns in any order and without location", () => {
    const result = parseInventoryRows([
      { row: 1, cells: ["nombre", "CANTIDAD", "codigo"] },
      { row: 2, cells: ["Mouse", 3, "00002"] },
    ]);
    expect(result.rows[0]).toMatchObject({ code: "00002", name: "Mouse", quantity: 3, location: null });
  });

  it("reports missing required columns as fatal", () => {
    const result = parseInventoryRows([{ row: 1, cells: ["Código", "Nombre"] }]);
    expect(result.fatal).toMatch(/Cantidad/);
  });

  it("skips blank rows and reports invalid ones with their row number", () => {
    const result = parseInventoryRows([
      header,
      { row: 2, cells: ["A-1", "Arduino", 2, "Bodega"] },
      { row: 3, cells: [null, null, null, null] },
      { row: 4, cells: ["", "Sin código", 1, null] },
      { row: 5, cells: ["A-1", "Duplicado", 1, null] },
      { row: 6, cells: ["B-1", "Negativo", -2, null] },
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.errors.map((e) => e.row)).toEqual([4, 5, 6]);
    expect(result.errors[1]!.message).toMatch(/fila 2/);
  });
});

describe("buildImportPlan", () => {
  const existing: ExistingItem[] = [
    { id: "1", code: "OSC-002", name: "Osciloscopio", quantity: 1, location: "Bodega" },
    { id: "2", code: "RPI-005", name: "Raspberry Pi 5", quantity: 12, location: "Bodega" },
  ];

  const rows = [
    { row: 2, code: "OSC-002", name: "Osciloscopio", quantity: 1, location: "Bodega" },
    { row: 3, code: "RPI-005", name: "Raspberry Pi 5", quantity: 4, location: null },
    { row: 4, code: "NEW-1", name: "Nuevo", quantity: 7, location: "Laboratorio" },
  ];

  it("replace mode sets quantities to the file values", () => {
    const plan = buildImportPlan(rows, existing, "replace");
    expect(plan.unchanged).toBe(1);
    expect(plan.creates.map((c) => c.code)).toEqual(["NEW-1"]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0]).toMatchObject({
      code: "RPI-005",
      nextQuantity: 4,
      delta: -8,
      location: "Bodega",
    });
  });

  it("add mode sums quantities as incoming stock", () => {
    const plan = buildImportPlan(rows, existing, "add");
    expect(plan.unchanged).toBe(0);
    expect(plan.updates.map((u) => [u.code, u.nextQuantity, u.delta])).toEqual([
      ["OSC-002", 2, 1],
      ["RPI-005", 16, 4],
    ]);
  });
});
