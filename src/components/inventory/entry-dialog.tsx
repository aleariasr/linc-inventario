"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Minus, Plus, X } from "lucide-react";
import { registerEntry } from "@/server/actions/inventory";
import { useActionForm } from "@/hooks/use-action-form";
import { useResetKey } from "@/hooks/use-reset-key";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ItemPicker, type ItemOption } from "./item-picker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselected item (from a table row). Without it the user picks one. */
  item?: ItemOption;
  /** Needed only when no item is preselected. */
  options?: ItemOption[];
};

export function EntryDialog(props: Props) {
  const key = useResetKey(props.open);
  return <EntryDialogContent key={key} {...props} />;
}

function EntryDialogContent({ open, onOpenChange, item: preselected, options = [] }: Props) {
  const close = () => onOpenChange(false);
  const { onSubmit, pending, fieldErrors } = useActionForm(registerEntry, { onSuccess: close });
  const [item, setItem] = useState<ItemOption | undefined>(preselected);
  const [amount, setAmount] = useState("1");

  const parsed = Number(amount);
  const valid = Number.isInteger(parsed) && parsed > 0;
  const step = (delta: number) => setAmount(String(Math.max(1, (valid ? parsed : 0) + delta)));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar entrada"
      description="Suma unidades que ingresan al laboratorio."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="entry-form" loading={pending} disabled={!item}>
            Registrar entrada
          </Button>
        </>
      }
    >
      <form id="entry-form" onSubmit={onSubmit} noValidate className="space-y-5">
        {item ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/60 p-3">
            <input type="hidden" name="itemId" value={item.id} />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-fg-muted">{item.code}</p>
              <p className="truncate font-medium text-fg">{item.name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fg-muted tabular">{formatNumber(item.quantity)}</span>
              <ArrowRight className="size-3.5 text-fg-subtle" aria-hidden />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={valid ? parsed : "x"}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  className="font-semibold text-success tabular"
                  aria-live="polite"
                >
                  {valid ? formatNumber(item.quantity + parsed) : "—"}
                </motion.span>
              </AnimatePresence>
            </div>
            {!preselected && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setItem(undefined)}
                aria-label="Cambiar ítem"
              >
                <X />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-fg">Ítem</p>
            <ItemPicker options={options} onSelect={setItem} invalid={Boolean(fieldErrors.itemId)} />
          </div>
        )}

        <Field label="Cantidad que ingresa" error={fieldErrors.quantity} htmlFor="entry-quantity">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => step(-1)}
              aria-label="Restar uno"
              disabled={pending}
            >
              <Minus />
            </Button>
            <Input
              id="entry-quantity"
              name="quantity"
              type="number"
              aria-invalid={fieldErrors.quantity ? true : undefined}
              inputMode="numeric"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-base font-semibold tabular"
              disabled={pending}
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => step(1)}
              aria-label="Sumar uno"
              disabled={pending}
            >
              <Plus />
            </Button>
          </div>
        </Field>

        <Field label="Nota (opcional)" error={fieldErrors.note} hint="Ej. proveedor, factura, donación…">
          <Input name="note" maxLength={300} disabled={pending} />
        </Field>
      </form>
    </Dialog>
  );
}
