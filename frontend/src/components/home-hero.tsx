"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { DealSlider } from "@/components/deal-slider";
import type { GroupedProduct } from "@/lib/types";

export function HomeHero({ deals = [] }: { deals?: GroupedProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/kerko?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <section
      className="relative overflow-hidden border-b"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      {/* Soft brand wash — keeps the canvas calm but not flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 420px at 12% 0%, rgba(29,78,216,0.09) 0%, transparent 60%), radial-gradient(760px 380px at 92% 100%, rgba(234,88,12,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-9 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] md:gap-8 md:py-14 lg:gap-12">
        <div className="min-w-0 text-left">
          <span
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{
              backgroundColor: "var(--brand-tint)",
              color: "var(--brand)",
              border: "1px solid rgba(29,78,216,0.18)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--savings)" }}
            />
            Çmime të përditësuara sot
          </span>

          <h1
            className="mb-3 max-w-xl text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:mb-4 sm:text-5xl md:text-[3.25rem]"
            style={{ color: "var(--heading)" }}
          >
            Gjej çmimin{" "}
            <span style={{ color: "var(--warm)" }}>më të mirë</span> sot
          </h1>

          <p
            className="mb-6 max-w-lg text-[15px] leading-relaxed sm:mb-7 sm:text-base"
            style={{ color: "var(--muted-foreground)" }}
          >
            Krahaso çmimet nga dyqanet kryesore në Kosovë dhe kurseni para çdo herë që blini.
          </p>

          <form onSubmit={submit} className="relative max-w-xl">
            <div
              className="flex items-center overflow-hidden rounded-xl bg-white transition-shadow focus-within:shadow-[0_0_0_4px_rgba(234,88,12,0.14)]"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(11,31,58,0.08)",
              }}
            >
              <Search
                className="ml-4 h-5 w-5 shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type="text"
                placeholder="Kërko iPhone, laptop, televizor…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[15px] outline-none placeholder:text-slate-400 sm:px-4"
                style={{ color: "var(--foreground)" }}
                aria-label="Kërko produkte"
              />
              <button
                type="submit"
                className="m-1.5 shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:px-6"
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
                Kërko
              </button>
            </div>
          </form>

          <ul
            className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-[13px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {["Falas, pa regjistrim", "Vetëm produkte në stok", "Dyqane të verifikuara"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="var(--savings)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 10.5l3.2 3L15 7" />
                  </svg>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        {deals.length > 0 && (
          <div className="min-w-0 w-full md:justify-self-stretch">
            <DealSlider deals={deals} />
          </div>
        )}
      </div>
    </section>
  );
}
