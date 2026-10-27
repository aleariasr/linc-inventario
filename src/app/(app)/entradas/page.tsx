import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOVEMENT_TYPES, parseMovementFilters, toQueryString, type MovementTypeFilter } from "@/lib/filters";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { MOVEMENT_META } from "@/components/inventory/movement-type-badge";
import { MovementsTable } from "@/components/inventory/movements-table";
import { NewEntryButton } from "@/components/inventory/new-entry-button";
import { listMovements, PAGE_SIZE } from "@/server/queries/inventory";
import { listItemOptions } from "@/server/queries/item-options";

export const metadata: Metadata = { title: "Movimientos" };

type SearchParams = PageProps<"/entradas">["searchParams"];

export default function MovementsPage({ searchParams }: PageProps<"/entradas">) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        description="Historial de entradas, ajustes e importaciones."
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-40" />}>
            <EntryAction />
          </Suspense>
        }
      />
      <Card className="overflow-hidden">
        <Suspense fallback={<TableSkeleton />}>
          <MovementsContent searchParams={searchParams} />
        </Suspense>
      </Card>
    </div>
  );
}

async function EntryAction() {
  return <NewEntryButton options={await listItemOptions()} />;
}

function TypeTabs({ current }: { current?: MovementTypeFilter }) {
  const tabs: { value?: MovementTypeFilter; label: string }[] = [
    { label: "Todos" },
    ...MOVEMENT_TYPES.map((value) => ({ value, label: MOVEMENT_META[value].label })),
  ];
  return (
    <nav aria-label="Filtrar por tipo" className="flex gap-1 overflow-x-auto border-b border-border p-2">
      {tabs.map((tab) => {
        const active = tab.value === current;
        return (
          <Link
            key={tab.label}
            href={`/entradas${toQueryString({ type: tab.value })}`}
            aria-current={active ? "page" : undefined}
            scroll={false}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary-soft text-primary-soft-fg"
                : "text-fg-muted hover:bg-surface-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

async function MovementsContent({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseMovementFilters(await searchParams);
  const result = await listMovements(filters);

  return (
    <>
      <TypeTabs current={filters.type} />
      {result.rows.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin movimientos"
          description="Cuando registres entradas o importes un Excel aparecerán aquí."
        />
      ) : (
        <FadeIn key={`${filters.type}-${filters.page}`}>
          <MovementsTable rows={result.rows} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={PAGE_SIZE}
            hrefFor={(page) => `/entradas${toQueryString({ type: filters.type, page })}`}
          />
        </FadeIn>
      )}
    </>
  );
}
