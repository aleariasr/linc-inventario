import type { Metadata } from "next";
import { Suspense } from "react";
import { Download, PackageSearch, SearchX } from "lucide-react";
import { parseInventoryFilters, toQueryString } from "@/lib/filters";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { InventoryStats, InventoryStatsSkeleton } from "@/components/inventory/inventory-stats";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryToolbar } from "@/components/inventory/inventory-toolbar";
import { NewItemButton } from "@/components/inventory/new-item-button";
import { listItems, listLocations, PAGE_SIZE } from "@/server/queries/inventory";

export const metadata: Metadata = { title: "Inventario" };

type SearchParams = PageProps<"/inventario">["searchParams"];

export default function InventoryPage({ searchParams }: PageProps<"/inventario">) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Lo que hay actualmente en el laboratorio."
        actions={
          <Suspense
            fallback={
              <>
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-32" />
              </>
            }
          >
            <HeaderActions searchParams={searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<InventoryStatsSkeleton />}>
        <InventoryStats />
      </Suspense>
      <Card className="overflow-hidden">
        <Suspense fallback={<TableSkeleton />}>
          <InventoryContent searchParams={searchParams} />
        </Suspense>
      </Card>
    </div>
  );
}

async function HeaderActions({ searchParams }: { searchParams: SearchParams }) {
  const [filters, locations] = await Promise.all([searchParams.then(parseInventoryFilters), listLocations()]);
  const exportFilters = { ...filters, page: undefined };
  return (
    <>
      <a
        href={`/api/export${toQueryString(exportFilters)}`}
        className={buttonVariants({ variant: "secondary" })}
        download
      >
        <Download />
        Exportar Excel
      </a>
      <NewItemButton locations={locations.map((l) => l.name)} />
    </>
  );
}

async function InventoryContent({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseInventoryFilters(await searchParams);
  const [result, locations] = await Promise.all([listItems(filters), listLocations()]);
  const hasFilters = Boolean(filters.q || filters.location || filters.stock);
  const locationNames = locations.map((l) => l.name);

  return (
    <>
      <InventoryToolbar filters={filters} locations={locations} />
      {result.rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="Sin resultados"
            description="Ningún ítem coincide con los filtros aplicados."
          />
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="El inventario está vacío"
            description="Agrega tu primer ítem o importa tu Excel existente."
            action={<NewItemButton locations={locationNames} variant="secondary" />}
          />
        )
      ) : (
        <FadeIn key={`${filters.page}-${filters.sort}`}>
          <InventoryTable rows={result.rows} locations={locationNames} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={PAGE_SIZE}
            hrefFor={(page) => `/inventario${toQueryString({ ...filters, page })}`}
          />
        </FadeIn>
      )}
    </>
  );
}
