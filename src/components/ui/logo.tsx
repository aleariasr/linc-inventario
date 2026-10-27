import { cn } from "@/lib/cn";

/**
 * LINC mark: three linked nodes inside a rounded tile — inventory items
 * connected to the lab. Uses currentColor-free tokens so it adapts to themes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M10.5 21.5 16 10.5l5.5 11h-11Z"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
        className="stroke-primary-fg/55"
      />
      <circle cx="16" cy="10.5" r="3" className="fill-primary-fg" />
      <circle cx="10.5" cy="21.5" r="3" className="fill-primary-fg" />
      <circle cx="21.5" cy="21.5" r="3" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-fg">LINC</span>
        <span className="text-[11px] font-medium text-fg-subtle">Inventario</span>
      </span>
    </span>
  );
}
