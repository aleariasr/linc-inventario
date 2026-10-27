import { Skeleton } from "./skeleton";

export function TableSkeleton({ rows = 8, toolbar = true }: { rows?: number; toolbar?: boolean }) {
  return (
    <div role="status" aria-label="Cargando">
      {toolbar && (
        <div className="flex gap-3 border-b border-border p-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="hidden h-9 w-44 sm:block" />
          <Skeleton className="hidden h-9 w-36 sm:block" />
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${40 + ((i * 37) % 45)}%` }} />
            <Skeleton className="ml-auto h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
