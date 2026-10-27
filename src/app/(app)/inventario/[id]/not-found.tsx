import Link from "next/link";
import { PackageX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function ItemNotFound() {
  return (
    <Card>
      <EmptyState
        icon={PackageX}
        title="Ítem no encontrado"
        description="Puede que haya sido eliminado o que el enlace sea incorrecto."
        action={
          <Link href="/inventario" className={buttonVariants({ variant: "secondary" })}>
            Volver al inventario
          </Link>
        }
      />
    </Card>
  );
}
