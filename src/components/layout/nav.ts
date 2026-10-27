import { Boxes, FileSpreadsheet, History, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/entradas", label: "Movimientos", icon: History },
  { href: "/importar", label: "Importar Excel", icon: FileSpreadsheet },
];
