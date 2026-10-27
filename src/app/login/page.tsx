import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60rem_30rem_at_50%_-10%,var(--primary-soft),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] [background-size:22px_22px] opacity-[0.35]"
      />
      <div className="relative w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-fg-subtle">
          ¿No tienes cuenta? Solicítala al administrador del laboratorio.
        </p>
      </div>
    </main>
  );
}
