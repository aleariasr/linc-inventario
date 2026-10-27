"use client";

import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { DeleteItemDialog } from "./delete-item-dialog";
import { EntryDialog } from "./entry-dialog";
import { ItemFormDialog, type EditableItem } from "./item-form-dialog";

const menuItem = cn(
  "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none",
  "data-[highlighted]:bg-surface-muted [&_svg]:size-4",
);

type Dialog = "entry" | "edit" | "delete" | null;

/** Per-item actions used by the table rows and the detail page alike. */
export function ItemActions({
  item,
  locations,
  variant = "row",
}: {
  item: EditableItem;
  locations: string[];
  variant?: "row" | "page";
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const setOpen = (name: Dialog) => (open: boolean) => setDialog(open ? name : null);

  return (
    <>
      {variant === "row" ? (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="soft"
            size="sm"
            onClick={() => setDialog("entry")}
            aria-label={`Registrar entrada de ${item.name}`}
          >
            <Plus />
            <span className="hidden sm:inline">Entrada</span>
          </Button>
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Más acciones para ${item.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-md"
              >
                <DropdownMenu.Item
                  className={cn(menuItem, "text-fg [&_svg]:text-fg-muted")}
                  onSelect={() => setDialog("edit")}
                >
                  <Pencil />
                  Editar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(menuItem, "text-danger")}
                  onSelect={() => setDialog("delete")}
                >
                  <Trash2 />
                  Eliminar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setDialog("delete")} className="text-danger">
            <Trash2 />
            Eliminar
          </Button>
          <Button variant="secondary" onClick={() => setDialog("edit")}>
            <Pencil />
            Editar
          </Button>
          <Button onClick={() => setDialog("entry")}>
            <Plus />
            Registrar entrada
          </Button>
        </div>
      )}

      <EntryDialog open={dialog === "entry"} onOpenChange={setOpen("entry")} item={item} />
      <ItemFormDialog
        open={dialog === "edit"}
        onOpenChange={setOpen("edit")}
        item={item}
        locations={locations}
      />
      <DeleteItemDialog
        open={dialog === "delete"}
        onOpenChange={setOpen("delete")}
        item={item}
        redirectTo={variant === "page" ? "/inventario" : undefined}
      />
    </>
  );
}
