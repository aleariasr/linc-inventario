"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createItem, updateItem } from "@/server/actions/inventory";
import { useActionForm } from "@/hooks/use-action-form";
import { useResetKey } from "@/hooks/use-reset-key";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";

export type EditableItem = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  location: string | null;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: string[];
  /** When provided the dialog edits this item; otherwise it creates a new one. */
  item?: EditableItem;
};

export function ItemFormDialog(props: Props) {
  const key = useResetKey(props.open);
  return <ItemFormDialogContent key={key} {...props} />;
}

function ItemFormDialogContent({ open, onOpenChange, locations, item }: Props) {
  const close = () => onOpenChange(false);
  const { onSubmit, pending, fieldErrors } = useActionForm(item ? updateItem : createItem, {
    onSuccess: close,
  });
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const quantityChanged = item !== undefined && quantity !== String(item.quantity);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Editar ítem" : "Nuevo ítem"}
      description={item ? `Código ${item.code}` : "Agrega un artículo al inventario del laboratorio."}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="item-form" loading={pending}>
            {item ? "Guardar cambios" : "Agregar ítem"}
          </Button>
        </>
      }
    >
      <form id="item-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {item && <input type="hidden" name="id" value={item.id} />}
        <fieldset disabled={pending} className="contents">
          <Field
            label="Código"
            error={fieldErrors.code}
            hint="Se guarda tal cual, incluyendo ceros iniciales."
          >
            <Input
              name="code"
              defaultValue={item?.code}
              required
              maxLength={64}
              autoFocus={!item}
              className="font-mono"
            />
          </Field>
          <Field label={item ? "Cantidad" : "Cantidad inicial"} error={fieldErrors.quantity}>
            <Input
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tabular"
            />
          </Field>
          <Field label="Nombre" error={fieldErrors.name} className="sm:col-span-2">
            <Input name="name" defaultValue={item?.name} required maxLength={200} />
          </Field>
          <Field
            label="Ubicación"
            error={fieldErrors.location}
            hint="Elige una existente o escribe una nueva."
            className="sm:col-span-2"
          >
            <Input
              name="location"
              defaultValue={item?.location ?? ""}
              list="location-options"
              maxLength={80}
              autoComplete="off"
            />
          </Field>
          <datalist id="location-options">
            {locations.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <AnimatePresence initial={false}>
            {quantityChanged && (
              <motion.div
                className="sm:col-span-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Field
                  label="Motivo del ajuste"
                  error={fieldErrors.reason}
                  hint={`La cantidad pasará de ${item!.quantity} a ${quantity || 0}. Quedará registrado en el historial.`}
                >
                  <Input name="reason" maxLength={300} placeholder="Ej. conteo físico, pieza dañada…" />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
          <Field label="Notas" error={fieldErrors.notes} className="sm:col-span-2">
            <Textarea name="notes" defaultValue={item?.notes ?? ""} maxLength={1000} rows={2} />
          </Field>
        </fieldset>
      </form>
    </Dialog>
  );
}
