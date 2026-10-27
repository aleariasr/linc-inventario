import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/server/session";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

async function CurrentUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <UserMenu user={user} />;
}

function UserFallback() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/inventario" aria-label="Inicio">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>
        <div className="border-t border-border p-3">
          <Suspense fallback={<UserFallback />}>
            <CurrentUser />
          </Suspense>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/inventario" aria-label="Inicio">
            <Logo />
          </Link>
        </div>
        <div className="px-3 pb-2">
          <NavLinks orientation="horizontal" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>

      <div className="border-t border-border bg-surface p-3 lg:hidden">
        <Suspense fallback={<UserFallback />}>
          <CurrentUser />
        </Suspense>
      </div>
    </div>
  );
}
