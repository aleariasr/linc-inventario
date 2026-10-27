import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, History } from "lucide-react";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/motion";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ItemActions } from "@/components/inventory/item-actions";
import { MovementsTable } from "@/components/inventory/movements-table";
import { parseMovementFilters } from "@/lib/filters";
import { getItem, listLocations, listMovements, PAGE_SIZE } from "@/server/queries/inventory";

export const metadata: Metadata = { title: "Detalle de ítem" };

type Props = PageProps<"/inventario/[id]">;

export default function ItemPage({ params, searchParams }: Props) {
  return (
    <div className="space-y-6">
      <Link
        href="/inventario"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inventario
      </Link>
      <Suspense fallback={<ItemSkeleton />}>
        <ItemDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ItemDetail({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const [item, locations] = await Promise.all([getItem(id), listLocations()]);
  if (!item) notFound();

  return (
    <FadeIn className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-surface-sunken px-2 py-0.5 font-mono text-xs text-fg-muted ring-1 ring-border">
              {item.code}
            </span>
            {item.location && <Badge>{item.location}</Badge>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{item.name}</h1>
        </div>
        <ItemActions item={item} locations={locations.map((l) => l.name)} variant="page" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] font-medium text-fg-muted">Cantidad actual</p>
          <p
            className={
              item.quantity === 0
                ? "mt-1 text-3xl font-semibold text-danger tabular"
                : "mt-1 text-3xl font-semibold text-fg tabular"
            }
          >
            {formatNumber(item.quantity)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] font-medium text-fg-muted">Última actualización</p>
          <p className="mt-2 text-sm text-fg">{formatDateTime(item.updatedAt)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] font-medium text-fg-muted">Notas</p>
          <p className="mt-2 text-sm whitespace-pre-line text-fg">{item.notes || "Sin notas"}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <Suspense fallback={<TableSkeleton rows={4} toolbar={false} />}>
          <ItemMovements id={item.id} searchParams={searchParams} />
        </Suspense>
      </Card>
    </FadeIn>
  );
}

async function ItemMovements({ id, searchParams }: { id: string; searchParams: Props["searchParams"] }) {
  const { page } = parseMovementFilters(await searchParams);
  const result = await listMovements({ itemId: id, page });
  if (result.rows.length === 0) {
    return (
      <EmptyState icon={History} title="Sin movimientos" description="Aún no hay cambios registrados." />
    );
  }
  return (
    <>
      <MovementsTable rows={result.rows} showItem={false} />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={PAGE_SIZE}
        hrefFor={(p) => `/inventario/${id}${p > 1 ? `?page=${p}` : ""}`}
      />
    </>
  );
}

function ItemSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
