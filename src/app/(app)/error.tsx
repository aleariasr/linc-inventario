"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={AlertTriangle}
        title="Algo salió mal"
        description={
          <>
            No pudimos cargar esta sección. Inténtalo de nuevo en unos segundos.
            {error.digest && (
              <span className="mt-2 block font-mono text-xs text-fg-subtle">Ref: {error.digest}</span>
            )}
          </>
        }
        action={<Button onClick={reset}>Reintentar</Button>}
      />
    </Card>
  );
}
