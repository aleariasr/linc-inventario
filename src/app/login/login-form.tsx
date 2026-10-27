"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/inventario";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (error) {
        setError(
          error.status === 429
            ? "Demasiados intentos. Espera un minuto e inténtalo de nuevo."
            : "Correo o contraseña incorrectos.",
        );
        return;
      }
      router.replace(safeNext(searchParams.get("next")));
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={error ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="p-6 shadow-md">
        <div className="mb-6 space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-sm text-fg-muted">Ingresa con tu cuenta del laboratorio.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
          <Field label="Correo electrónico">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              placeholder="nombre@linc.cr"
            />
          </Field>
          <Field label="Contraseña" error={error ?? undefined}>
            <Input name="password" type="password" autoComplete="current-password" required minLength={8} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            <LogIn />
            Iniciar sesión
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
