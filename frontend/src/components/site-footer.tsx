"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { FOOTER_COLUMNS } from "@/lib/site";

export function SiteFooter() {
  const { theme } = useTheme();

  return (
    <footer
      className="mt-20"
      style={{ backgroundColor: theme === "dark" ? "#000000" : "var(--trust)" }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 pb-8 pt-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: "var(--action)" }}
            >
              <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-white">Krahaso</span>
            <span className="font-extrabold" style={{ color: "var(--deal)" }}>
              {" "}Çmimin
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Platforma nr. 1 e krahasimit të çmimeve në Kosovë. Kurseni para çdo ditë.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          © 2026 Krahaso Çmimin. Të gjitha të drejtat e rezervuara.
        </span>
        <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          🇽🇰 Bërë me krenari në Kosovë
        </span>
      </div>
    </footer>
  );
}
