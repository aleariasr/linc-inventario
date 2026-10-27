"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionResult } from "@/lib/action-result";
import { toast } from "@/components/ui/toaster";

type FormAction = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * Standard wiring for every mutation form: pending state, field errors and a toast.
 * `onSuccess` runs once per successful submission (e.g. to close a dialog).
 *
 * Submits through `onSubmit` instead of `<form action>` so React doesn't auto-reset
 * the form — users keep what they typed when validation fails.
 */
export function useActionForm(action: FormAction, { onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction, pending] = useActionState(action, null);
  const handled = useRef<ActionResult | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      toast.success(state.message);
      onSuccessRef.current?.();
    } else if (!state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return { onSubmit, pending, fieldErrors, state };
}
