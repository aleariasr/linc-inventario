"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

type Orientation = "vertical" | "horizontal";

/**
 * The active segment is URL data, which can't be part of the prerendered shell.
 * The fallback renders the same links without highlight, so there's no layout shift.
 */
export function NavLinks({ orientation = "vertical" }: { orientation?: Orientation }) {
  return (
    <Suspense fallback={<NavList orientation={orientation} active={null} />}>
      <ActiveNavList orientation={orientation} />
    </Suspense>
  );
}

function ActiveNavList({ orientation }: { orientation: Orientation }) {
  const segment = useSelectedLayoutSegment();
  return <NavList orientation={orientation} active={segment ? `/${segment}` : null} />;
}

function NavList({ orientation, active }: { orientation: Orientation; active: string | null }) {
  return (
    <nav
      aria-label="Principal"
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "-mx-1 [scrollbar-width:none] overflow-x-auto px-1",
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = active === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive ? "text-primary-soft-fg" : "text-fg-muted hover:bg-surface-muted hover:text-fg",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`nav-active-${orientation}`}
                className="absolute inset-0 rounded-md bg-primary-soft"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
