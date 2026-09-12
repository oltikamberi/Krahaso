"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plug, Package, Settings } from "lucide-react";

const ITEMS = [
  { href: "/panel", label: "Përmbledhje", icon: LayoutDashboard },
  { href: "/panel/integrimet", label: "Integrimet", icon: Plug },
  { href: "/panel/produktet", label: "Produktet", icon: Package },
  { href: "/panel/cilesimet", label: "Cilësimet", icon: Settings },
];

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: active ? "var(--secondary)" : "transparent",
              color: active ? "var(--brand-soft)" : "var(--muted-foreground)",
            }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
