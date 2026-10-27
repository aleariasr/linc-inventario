import { useId, type ReactElement, type ReactNode, cloneElement } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /**
   * A single form control; receives id, aria-invalid and aria-describedby.
   * For composite controls pass `htmlFor` and wire the inner control's id yourself.
   */
  children: ReactElement<Record<string, unknown>>;
  htmlFor?: string;
};

export function Field({ label, hint, error, className, children, htmlFor }: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">
        {label}
      </label>
      {htmlFor
        ? children
        : cloneElement(children, {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": hasMessage ? messageId : undefined,
          })}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={messageId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-danger"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" id={messageId} className="text-xs text-fg-subtle">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
