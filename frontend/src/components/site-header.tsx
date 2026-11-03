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
      <div
        style={{
          backgroundColor: isDark ? "#000000" : "var(--trust)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <div
            className="flex items-center gap-5 font-mono text-[11px]"
            style={{ color: "rgba(255,255,255,0.72)" }}
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
          <div className="font-mono text-[11px] text-white/60">🇽🇰 Kosova &bull; €EUR</div>
        </div>
      </div>

      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: isDark ? "#0a0a0a" : "var(--trust)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(11,31,58,0.18)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--action)" }}
            >
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} style={{ color: "#4ade80" }} />
            </div>
            <div className="relative pb-1">
              <span className="text-base font-extrabold tracking-tight text-white">Krahaso</span>
              <span className="text-base font-extrabold tracking-tight text-white">
                {" "}Çmimin
              </span>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-[3px] w-full rounded-full"
                style={{ backgroundColor: "#059669" }}
              />
            </div>
            <span
              className="self-start rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Beta
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* TEMP: preview toggle for the support popup — remove when the design is settled */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(SUPPORT_POPUP_EVENT))}
              aria-label="Hap popup-in e mbështetjes"
              title="Preview popup (temp)"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition-colors sm:px-3.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
            >
              <HeartHandshake className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
              <span className="hidden sm:inline">Përkrah Krahaso</span>
            </button>
            <button
              onClick={toggle}
              aria-label={isDark ? "Tema e çelët" : "Tema e errët"}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
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
              className="hidden text-sm font-medium text-white/75 transition-colors hover:text-white sm:block"
            >
              Kyçu
            </Link>
            <Link
              href="/regjistrohu"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-colors"
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
