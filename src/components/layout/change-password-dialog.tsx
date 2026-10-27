"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

type Errors = { current?: string; next?: string; confirm?: string };

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = String(form.get("current"));
    const next = String(form.get("next"));
    const confirm = String(form.get("confirm"));

    const found: Errors = {};
    if (next.length < 8) found.next = "Debe tener al menos 8 caracteres";
    if (next !== confirm) found.confirm = "Las contraseñas no coinciden";
    setErrors(found);
    if (Object.keys(found).length) return;

    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (error) {
        setErrors({
          current:
            error.status === 429 ? "Demasiados intentos, espera un minuto" : "Contraseña actual incorrecta",
        });
        return;
      }
      toast.success("Contraseña actualizada", { description: "Se cerraron tus otras sesiones abiertas." });
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setErrors({});
        onOpenChange(value);
      }}
      title="Cambiar contraseña"
      description="Usa al menos 8 caracteres."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="change-password" loading={pending}>
            Actualizar
          </Button>
        </>
      }
    >
      <form id="change-password" onSubmit={onSubmit} className="space-y-4">
        <Field label="Contraseña actual" error={errors.current}>
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Nueva contraseña" error={errors.next}>
          <Input name="next" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="Confirmar nueva contraseña" error={errors.confirm}>
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </form>
    </Dialog>
  );
}
