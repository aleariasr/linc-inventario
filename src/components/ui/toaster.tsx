"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border-border !bg-surface !text-fg !shadow-md !font-sans",
          description: "!text-fg-muted",
          closeButton: "!bg-surface !border-border !text-fg-muted",
        },
      }}
    />
  );
}

export { toast } from "sonner";
