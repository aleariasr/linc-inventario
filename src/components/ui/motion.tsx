import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Shared entrance animation so every page/section enters with the same rhythm. */
export function FadeIn({
  className,
  delay = 0,
  style,
  ...props
}: ComponentProps<"div"> & { delay?: number }) {
  return (
    <div
      className={cn("animate-enter", className)}
      style={{ animationDelay: `${delay}s`, ...style }}
      {...props}
    />
  );
}
