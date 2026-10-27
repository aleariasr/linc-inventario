"use client";

import { Dialog as RadixDialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" } as const;

/**
 * Controlled modal. Radix handles focus trapping, escape and aria wiring;
 * motion handles enter/exit (forceMount keeps nodes alive for the exit animation).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </RadixDialog.Overlay>
            <div className="fixed inset-0 z-50 grid place-items-end overflow-y-auto p-0 sm:place-items-center sm:p-4">
              <RadixDialog.Content asChild forceMount>
                <motion.div
                  className={cn(
                    "relative flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-border bg-surface shadow-lg sm:rounded-xl",
                    sizeClass[size],
                  )}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ type: "spring", duration: 0.32, bounce: 0.12 }}
                >
                  <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
                    <div className="space-y-1">
                      <RadixDialog.Title className="text-base font-semibold text-fg">
                        {title}
                      </RadixDialog.Title>
                      {description ? (
                        <RadixDialog.Description className="text-sm text-fg-muted">
                          {description}
                        </RadixDialog.Description>
                      ) : (
                        <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                      )}
                    </div>
                    <RadixDialog.Close
                      className="-mr-2 grid size-8 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
                      aria-label="Cerrar"
                    >
                      <X className="size-4" />
                    </RadixDialog.Close>
                  </div>
                  <div className="overflow-y-auto px-6 py-4">{children}</div>
                  {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/50 px-6 py-4 sm:flex-row sm:justify-end sm:rounded-b-xl">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
