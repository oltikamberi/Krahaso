"use client";

import Link from "next/link";
import { TrendingUp, Moon, Sun, Zap, Shield, Truck, HeartHandshake } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { SUPPORT_POPUP_EVENT } from "@/components/support-popup";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <div style={{ backgroundColor: isDark ? "#000000" : "var(--brand)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div
            className="flex items-center gap-5 font-mono text-[11px]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" style={{ color: "var(--deal)" }} />
              Çmime të përditësuara çdo ditë
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Shield className="h-3 w-3" style={{ color: "var(--deal)" }} />
              Dyqane të verifikuara
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Truck className="h-3 w-3" style={{ color: "var(--deal)" }} />
              Dorëzim në Kosovë
            </span>
          </div>
          <div className="font-mono text-[11px] text-white/80">🇽🇰 Kosova &bull; €EUR</div>
        </div>
      </div>

      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: isDark ? "#0a0a0a" : "var(--brand)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: "var(--deal)" }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">Krahaso</span>
              <span
                className="text-base font-extrabold tracking-tight"
                style={{ color: "var(--deal)" }}
              >
                {" "}Cmimin
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* TEMP: preview toggle for the support popup — remove when the design is settled */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(SUPPORT_POPUP_EVENT))}
              aria-label="Hap popup-in e mbështetjes"
              title="Preview popup (temp)"
              className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-all hover:scale-105 sm:px-3"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "var(--deal)",
              }}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Perkrah Krahaso</span>
            </button>
            <button
              onClick={toggle}
              aria-label={isDark ? "Tema e çelët" : "Tema e errët"}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.22)",
              }}
            >
              {isDark ? (
                <Sun className="h-4 w-4" style={{ color: "var(--deal)" }} />
              ) : (
                <Moon className="h-4 w-4 text-white" />
              )}
            </button>
            <Link
              href="/hyrje"
              className="hidden text-sm font-medium text-white/80 transition-colors hover:text-white sm:block"
            >
              Kyçu
            </Link>
            <Link
              href="/regjistrohu"
              className="rounded px-4 py-2 text-sm font-bold transition-colors"
              style={{
                backgroundColor: "var(--action)",
                color: "var(--action-foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--action-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--action)";
              }}
            >
              Regjistrohu
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
