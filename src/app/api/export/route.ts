import type { NextRequest } from "next/server";
import { parseInventoryFilters } from "@/lib/filters";
import { formatIsoDate } from "@/lib/format";
import { buildInventoryWorkbook, XLSX_MIME } from "@/server/excel";
import { listItemsForExport } from "@/server/queries/inventory";
import { getSessionUser } from "@/server/session";

export async function GET(request: NextRequest) {
  if (!(await getSessionUser())) return new Response("No autorizado", { status: 401 });

  const params = request.nextUrl.searchParams;
  const template = params.get("template") === "1";
  const rows = template ? [] : await listItemsForExport(parseInventoryFilters(params));
  const now = new Date();
  const buffer = await buildInventoryWorkbook(rows, now);
  const fileName = template ? "plantilla-inventario-linc.xlsx" : `inventario-linc-${formatIsoDate(now)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
