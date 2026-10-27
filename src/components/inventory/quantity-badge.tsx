import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";

export function QuantityBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return (
      <Badge tone="danger" dot>
        Sin stock
      </Badge>
    );
  }
  return <span className="font-semibold text-fg tabular">{formatNumber(quantity)}</span>;
}
