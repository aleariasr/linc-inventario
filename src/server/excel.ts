import "server-only";
import ExcelJS from "exceljs";
import type { CellValue } from "@/lib/inventory-import";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function toCellValue(cell: ExcelJS.Cell): CellValue {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    // Codes stored as numbers with a zero-padded format ("000013") must keep their padding.
    return cell.numFmt && /^0+$/.test(cell.numFmt) ? cell.text : value;
  }
  if (typeof value === "string") return value;
  if (typeof value === "object" && "result" in value) {
    const result = value.result;
    return typeof result === "number" || typeof result === "string" ? result : null;
  }
  return cell.text || null;
}

/** Reads the first worksheet as rows of primitive cell values. */
export async function readFirstSheet(buffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: { row: number; cells: CellValue[] }[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: CellValue[] = [];
    for (let col = 1; col <= sheet.columnCount; col++) cells.push(toCellValue(row.getCell(col)));
    rows.push({ row: rowNumber, cells });
  });
  return rows;
}

type ExportRow = {
  code: string;
  name: string;
  quantity: number;
  location: string | null;
  updatedAt: Date;
};

/** Produces a workbook in the same layout the importer accepts, so exports can be re-imported. */
export async function buildInventoryWorkbook(rows: ExportRow[], generatedAt: Date) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LINC Inventario";
  workbook.created = generatedAt;

  const sheet = workbook.addWorksheet("Inventario", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Código", key: "code", width: 16, style: { numFmt: "@" } },
    { header: "Nombre", key: "name", width: 42 },
    { header: "Cantidad", key: "quantity", width: 12, style: { numFmt: "0" } },
    { header: "Ubicación", key: "location", width: 22 },
    { header: "Última actualización", key: "updatedAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
  ];

  for (const row of rows) {
    sheet.addRow({ ...row, location: row.location ?? "" });
  }

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.autoFilter = { from: "A1", to: `E${Math.max(rows.length + 1, 1)}` };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
