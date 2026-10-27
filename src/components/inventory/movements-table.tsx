import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDelta, formatNumber } from "@/lib/format";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MovementRow } from "@/server/queries/inventory";
import { MovementTypeBadge } from "./movement-type-badge";

export function MovementsTable({ rows, showItem = true }: { rows: MovementRow[]; showItem?: boolean }) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Fecha</TH>
          <TH>Tipo</TH>
          {showItem && <TH>Ítem</TH>}
          <TH className="text-right">Cambio</TH>
          <TH className="text-right">Total</TH>
          <TH className="hidden md:table-cell">Detalle</TH>
        </tr>
      </THead>
      <TBody>
        {rows.map((m) => (
          <TR key={m.id}>
            <TD className="whitespace-nowrap text-fg-muted">{formatDateTime(m.createdAt)}</TD>
            <TD>
              <MovementTypeBadge type={m.type} />
            </TD>
            {showItem && (
              <TD>
                <Link href={`/inventario/${m.itemId}`} className="group block max-w-64">
                  <span className="block font-mono text-xs text-fg-subtle">{m.itemCode}</span>
                  <span className="block truncate font-medium text-fg group-hover:text-primary">
                    {m.itemName}
                  </span>
                </Link>
              </TD>
            )}
            <TD
              className={cn(
                "text-right font-semibold tabular",
                m.delta > 0 ? "text-success" : m.delta < 0 ? "text-danger" : "text-fg-muted",
              )}
            >
              {formatDelta(m.delta)}
            </TD>
            <TD className="text-right text-fg tabular">{formatNumber(m.quantityAfter)}</TD>
            <TD className="hidden max-w-72 md:table-cell">
              <p className="truncate text-fg-muted">{m.note ?? "—"}</p>
              <p className="text-xs text-fg-subtle">{m.userName ?? "Usuario eliminado"}</p>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
