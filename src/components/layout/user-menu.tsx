"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useTheme } from "next-themes";
import { ChevronsUpDown, KeyRound, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { ChangePasswordDialog } from "./change-password-dialog";

type User = { name: string; email: string };

const itemClass = cn(
  "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg outline-none select-none",
  "data-[highlighted]:bg-surface-muted [&_svg]:size-4 [&_svg]:text-fg-muted",
);

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  const signOut = () =>
    startSignOut(async () => {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    });

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-muted data-[state=open]:bg-surface-muted"
          disabled={signingOut}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{user.name}</span>
            <span className="block truncate text-xs text-fg-subtle">{user.email}</span>
          </span>
          <ChevronsUpDown className="size-4 text-fg-subtle" aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="top"
            align="start"
            sideOffset={8}
            className="z-50 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border border-border bg-surface p-1 shadow-md"
          >
            <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg-subtle">
              Tema
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme}>
              {[
                { value: "light", label: "Claro", icon: Sun },
                { value: "dark", label: "Oscuro", icon: Moon },
                { value: "system", label: "Sistema", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <DropdownMenu.RadioItem key={value} value={value} className={itemClass}>
                  <Icon />
                  <span className="flex-1">{label}</span>
                  <DropdownMenu.ItemIndicator>
                    <span className="size-1.5 rounded-full bg-primary" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item className={itemClass} onSelect={() => setPasswordOpen(true)}>
              <KeyRound />
              Cambiar contraseña
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={signOut}>
              <LogOut />
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
