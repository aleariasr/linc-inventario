"use client";

import { useTransition } from "react";
import { deleteItem } from "@/server/actions/inventory";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
  redirectTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { id: string; code: string; name: string };
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteItem(item.id, { redirectTo });
      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="¿Eliminar este ítem?"
      description={
        <>
          Se eliminará <strong className="font-medium text-fg">{item.name}</strong> ({item.code}) y todo su
          historial de movimientos. Esta acción no se puede deshacer.
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={pending}>
            Eliminar
          </Button>
        </>
      }
    >
      {null}
    </Dialog>
  );
}
