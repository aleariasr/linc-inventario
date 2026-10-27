import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const controlClass = cn(
  "w-full rounded-md border border-border bg-surface text-sm text-fg shadow-xs",
  "placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-150",
  "hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/30",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-9 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-20 resize-y px-3 py-2", className)} {...props} />;
}
