"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { CategoryIcon } from "@/components/category-icon";
import type { Category } from "@/lib/types";

/**
 * Site-wide category navigation.
 *
 * Phone: a horizontally scrolling row of pill chips on the page background.
 * Chips give a 40px touch target and read as filters rather than a second
 * header bar, which is what the dark tab strip looked like under the hero.
 *
 * Desktop (md+): the original dark tab bar with an underline indicator.
 */
export function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const allActive = pathname === "/" || pathname.startsWith("/kerko");
  const isDark = theme === "dark";

  return (
    <>
      {/* ── Phone: pill chips ─────────────────────────────────────────── */}
      <nav
        aria-label="Kategoritë"
        className="md:hidden"
        style={{
          backgroundColor: "var(--background)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-3"
          style={{
            // Soft fade on the right so a clipped chip reads as "more to scroll"
            WebkitMaskImage:
              "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)",
            maskImage:
              "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)",
          }}
        >
          <Chip href="/" active={allActive} label="Të gjitha">
            <LayoutGrid className="h-4 w-4" strokeWidth={2} />
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              href={`/kategoria/${cat.slug}`}
              active={pathname === `/kategoria/${cat.slug}`}
              label={cat.name}
            >
              <CategoryIcon icon={cat.icon} className="h-4 w-4" strokeWidth={2} />
            </Chip>
          ))}
          {/* Spacer so the last chip clears the fade when fully scrolled */}
          <span aria-hidden className="w-4 shrink-0" />
        </div>
      </nav>

      {/* ── Desktop: light tab bar under the navy header ──────────────── */}
      <div
        className="hidden md:block"
        style={{
          backgroundColor: isDark ? "var(--card)" : "#ffffff",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
          <Tab href="/" active={allActive} label="Të gjitha">
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
          </Tab>
          {categories.map((cat) => (
            <Tab
              key={cat.id}
              href={`/kategoria/${cat.slug}`}
              active={pathname === `/kategoria/${cat.slug}`}
              label={cat.name}
            >
              <CategoryIcon icon={cat.icon} className="h-5 w-5" strokeWidth={1.5} />
            </Tab>
          ))}
        </div>
      </div>
    </>
  );
}

function Chip({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors active:scale-[0.98]"
      style={{
        backgroundColor: active ? "var(--action)" : "var(--secondary)",
        color: active ? "var(--action-foreground)" : "var(--foreground)",
        border: active ? "1px solid var(--action)" : "1px solid var(--border)",
      }}
    >
      {children}
      {label}
    </Link>
  );
}

function Tab({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group relative flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] transition-colors"
      style={{
        color: active ? "var(--heading)" : "var(--muted-foreground)",
        fontWeight: active ? 700 : 500,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "var(--muted-foreground)";
      }}
    >
      {children}
      <span>{label}</span>
      {active && (
        <span
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t"
          style={{ backgroundColor: "var(--action)" }}
        />
      )}
    </Link>
  );
}
