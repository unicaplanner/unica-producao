"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Painel" },
  { href: "/pedidos", label: "Por pedido" },
  { href: "/produtos", label: "Agrupado por item" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-vinho text-white" : "bg-border-soft text-ink/70 hover:bg-border"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
