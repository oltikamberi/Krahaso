"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { CategoryIcon } from "@/components/category-icon";
import type { Category } from "@/lib/types";

export function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const allActive = pathname === "/" || pathname.startsWith("/kerko");
  const isDark = theme === "dark";

  return (
    <div
      style={{
        backgroundColor: isDark ? "#121212" : "var(--brand)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
        <Link
          href="/"
          className="group relative flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors hover:text-white"
          style={{
            color: allActive ? "#fff" : "rgba(255,255,255,0.7)",
            fontWeight: allActive ? 700 : 500,
          }}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
          <span className="border-b border-transparent transition-colors group-hover:border-white">
            Të gjitha
          </span>
          {allActive && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
              style={{ backgroundColor: "var(--deal)" }}
            />
          )}
        </Link>
        {categories.map((cat) => {
          const isActive = pathname === `/kategoria/${cat.slug}`;
          return (
            <Link
              key={cat.id}
              href={`/kategoria/${cat.slug}`}
              className="group relative flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors hover:text-white"
              style={{
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <CategoryIcon icon={cat.icon} className="h-5 w-5" strokeWidth={1.5} />
              <span className="border-b border-transparent transition-colors group-hover:border-white">
                {cat.name}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ backgroundColor: "var(--deal)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
