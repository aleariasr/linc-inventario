import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const control = (target: number, disabled: boolean, label: string, icon: React.ReactNode) =>
    disabled ? (
      <span
        aria-disabled
        className={cn(buttonVariants({ variant: "secondary", size: "icon-sm" }), "opacity-50")}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </span>
    ) : (
      <Link
        href={hrefFor(target)}
        scroll={false}
        className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Link>
    );

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 text-sm text-fg-muted">
      <p className="tabular">
        {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden tabular sm:inline">
          Página {page} de {pageCount}
        </span>
        {control(page - 1, page <= 1, "Página anterior", <ChevronLeft />)}
        {control(page + 1, page >= pageCount, "Página siguiente", <ChevronRight />)}
      </div>
    </div>
  );
}
