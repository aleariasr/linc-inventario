import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

type Tone = "primary" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-soft-fg",
  success: "bg-success-soft text-success-soft-fg",
  warning: "bg-warning-soft text-warning-soft-fg",
  danger: "bg-danger-soft text-danger-soft-fg",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-fg tabular">{value}</p>
        {hint && <p className="truncate text-xs text-fg-subtle">{hint}</p>}
      </div>
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-lg", toneClass[tone])}>
        <Icon className="size-5" aria-hidden />
      </div>
    </Card>
  );
}
