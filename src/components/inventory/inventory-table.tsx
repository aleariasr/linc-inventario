"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { ItemActions } from "./item-actions";
import { QuantityBadge } from "./quantity-badge";

export type InventoryTableRow = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  location: string | null;
  notes: string | null;
  updatedAt: Date;
};

export function InventoryTable({ rows, locations }: { rows: InventoryTableRow[]; locations: string[] }) {
  return (
    <Table>
      <THead>
        <tr>
          <TH className="hidden w-32 sm:table-cell">Código</TH>
          <TH>Nombre</TH>
          <TH className="hidden md:table-cell">Ubicación</TH>
          <TH className="text-right">Cantidad</TH>
          <TH className="hidden lg:table-cell">Actualizado</TH>
          <TH className="w-px">
            <span className="sr-only">Acciones</span>
          </TH>
        </tr>
      </THead>
      <TBody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            style={{ animationDelay: `${Math.min(index * 15, 250)}ms` }}
            className="animate-enter border-b border-border transition-colors hover:bg-surface-muted/50"
          >
            <TD className="hidden font-mono text-[13px] text-fg-muted sm:table-cell">{row.code}</TD>
            <TD>
              <Link
                href={`/inventario/${row.id}`}
                className="font-medium text-fg underline-offset-4 hover:text-primary hover:underline"
              >
                {row.name}
              </Link>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-fg-subtle md:hidden">
                <span className="font-mono sm:hidden">{row.code}</span>
                {row.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {row.location}
                  </span>
                )}
              </span>
            </TD>
            <TD className="hidden md:table-cell">
              {row.location ? <Badge>{row.location}</Badge> : <span className="text-fg-subtle">—</span>}
            </TD>
            <TD className="text-right">
              <QuantityBadge quantity={row.quantity} />
            </TD>
            <TD className="hidden text-fg-muted lg:table-cell">{formatDate(row.updatedAt)}</TD>
            <TD>
              <ItemActions item={row} locations={locations} />
            </TD>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
