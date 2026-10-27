import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La dirección que buscas no existe."
        action={
          <Link href="/inventario" className={buttonVariants({ variant: "secondary" })}>
            Ir al inventario
          </Link>
        }
      />
    </main>
  );
}
