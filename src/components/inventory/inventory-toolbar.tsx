"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { toQueryString } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { controlClass } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type Filters = { q?: string; location?: string; stock?: string; sort?: string };

export function InventoryToolbar({
  filters,
  locations,
}: {
  filters: Filters;
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");

  const apply = (patch: Filters) =>
    startTransition(() => {
      // Any filter change goes back to the first page.
      router.replace(`${pathname}${toQueryString({ ...filters, ...patch, page: undefined })}`, {
        scroll: false,
      });
    });

  const syncQuery = useEffectEvent((value: string) => {
    if (value !== (filters.q ?? "")) apply({ q: value });
  });

  // Debounce typing so we don't hit the server on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => syncQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <input
          type="search"
          aria-label="Buscar por código o nombre"
          placeholder="Buscar por código o nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(controlClass, "h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden")}
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-fg-subtle">
          {pending ? (
            <Spinner />
          ) : (
            query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="grid hover:text-fg"
              >
                <X className="size-4" />
              </button>
            )
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select
          aria-label="Filtrar por ubicación"
          value={filters.location ?? ""}
          onChange={(e) => apply({ location: e.target.value || undefined })}
          className="col-span-2 sm:w-52"
        >
          <option value="">Todas las ubicaciones</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="none">Sin ubicación</option>
        </Select>
        <Select
          aria-label="Filtrar por existencias"
          value={filters.stock ?? ""}
          onChange={(e) => apply({ stock: e.target.value || undefined })}
          className="sm:w-36"
        >
          <option value="">Stock: todo</option>
          <option value="available">Con stock</option>
          <option value="out">Sin stock</option>
        </Select>
        <Select
          aria-label="Ordenar por"
          value={filters.sort ?? ""}
          onChange={(e) => apply({ sort: e.target.value || undefined })}
          className="sm:w-40"
        >
          <option value="">Por código</option>
          <option value="name">Por nombre</option>
          <option value="quantity">Por cantidad</option>
          <option value="updated">Más recientes</option>
        </Select>
      </div>
    </div>
  );
}
