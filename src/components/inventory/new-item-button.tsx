"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemFormDialog } from "./item-form-dialog";

export function NewItemButton({
  locations,
  variant = "primary",
}: {
  locations: string[];
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus />
        Nuevo ítem
      </Button>
      <ItemFormDialog open={open} onOpenChange={setOpen} locations={locations} />
    </>
  );
}
