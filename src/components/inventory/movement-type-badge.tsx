import { ArrowDownToLine, FilePlus2, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import type { MovementTypeFilter } from "@/lib/filters";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export const MOVEMENT_META: Record<
  MovementTypeFilter,
  { label: string; tone: BadgeTone; icon: typeof ArrowDownToLine }
> = {
  entrada: { label: "Entrada", tone: "success", icon: ArrowDownToLine },
  ajuste: { label: "Ajuste", tone: "warning", icon: SlidersHorizontal },
  importacion: { label: "Importación", tone: "primary", icon: FileSpreadsheet },
  alta: { label: "Alta", tone: "neutral", icon: FilePlus2 },
};

export function MovementTypeBadge({ type }: { type: MovementTypeFilter }) {
  const { label, tone, icon: Icon } = MOVEMENT_META[type];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
