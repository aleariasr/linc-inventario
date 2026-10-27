import { Boxes, MapPin, PackageX, Layers } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getInventoryStats } from "@/server/queries/inventory";

export async function InventoryStats() {
  const stats = await getInventoryStats();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard label="Ítems registrados" value={formatNumber(stats.items)} icon={Boxes} />
      <StatCard label="Unidades totales" value={formatNumber(stats.units)} icon={Layers} tone="success" />
      <StatCard
        label="Sin stock"
        value={formatNumber(stats.outOfStock)}
        icon={PackageX}
        tone={stats.outOfStock > 0 ? "danger" : "success"}
      />
      <StatCard
        label="Ubicaciones en uso"
        value={formatNumber(stats.locations)}
        icon={MapPin}
        tone="warning"
      />
    </div>
  );
}

export function InventoryStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="space-y-2 p-5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-16" />
        </Card>
      ))}
    </div>
  );
}
