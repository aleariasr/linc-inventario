"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryDialog } from "./entry-dialog";
import type { ItemOption } from "./item-picker";

export function NewEntryButton({ options }: { options: ItemOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={options.length === 0}>
        <Plus />
        Registrar entrada
      </Button>
      <EntryDialog open={open} onOpenChange={setOpen} options={options} />
    </>
  );
}
