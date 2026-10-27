import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/components/inventory/import-wizard";

export const metadata: Metadata = { title: "Importar Excel" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Importar Excel"
        description="Carga o actualiza el inventario desde una hoja de cálculo. Verás una vista previa antes de aplicar cambios."
      />
      <ImportWizard />
    </div>
  );
}
