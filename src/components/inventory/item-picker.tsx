"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { controlClass } from "@/components/ui/input";

export type ItemOption = { id: string; code: string; name: string; quantity: number };

const MAX_RESULTS = 8;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Accessible combobox (WAI-ARIA 1.2 list autocomplete) to pick an inventory item by code or name. */
export function ItemPicker({
  options,
  onSelect,
  invalid,
}: {
  options: ItemOption[];
  onSelect: (item: ItemOption) => void;
  invalid?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return options.slice(0, MAX_RESULTS);
    return options
      .filter((o) => normalize(o.code).includes(term) || normalize(o.name).includes(term))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  const choose = (item: ItemOption) => {
    onSelect(item);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${id}-${results[active].id}` : undefined}
        aria-invalid={invalid || undefined}
        aria-label="Buscar ítem"
        autoComplete="off"
        autoFocus
        placeholder="Busca por código o nombre…"
        className={cn(controlClass, "h-10 pl-9")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-fg-muted">Sin resultados para “{query}”</li>
          ) : (
            results.map((item, index) => (
              <li
                key={item.id}
                id={`${id}-${item.id}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm",
                  index === active && "bg-surface-muted",
                )}
              >
                <span className="w-20 shrink-0 truncate font-mono text-xs text-fg-muted">{item.code}</span>
                <span className="flex-1 truncate text-fg">{item.name}</span>
                <span className="text-xs text-fg-subtle tabular">{formatNumber(item.quantity)} u.</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
