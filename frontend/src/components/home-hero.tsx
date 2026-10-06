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
      className="border-b"
      style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-5 px-4 py-8 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] md:gap-8 md:py-14 lg:gap-12">
        <div className="min-w-0 text-left">
          <h1
            className="mb-3 max-w-xl text-[1.85rem] font-extrabold leading-tight tracking-tight sm:mb-4 sm:text-5xl md:text-[3.25rem]"
            style={{ color: "var(--foreground)" }}
          >
            Gjej çmimin{" "}
            <span style={{ color: "var(--brand-soft)" }}>më të mirë</span> sot
          </h1>

          <p
            className="mb-5 max-w-lg text-sm leading-relaxed sm:mb-8 sm:text-base"
            style={{ color: "var(--muted-foreground)" }}
          >
            Krahaso çmimet nga dyqanet kryesore në Kosovë dhe kurseni para çdo herë që blini.
          </p>

          <form onSubmit={submit} className="relative max-w-xl">
            <div
              className="flex items-center overflow-hidden rounded-lg bg-white"
              style={{
                border: "2px solid var(--border)",
                boxShadow: "0 2px 12px rgba(0,59,113,0.08)",
              }}
            >
              <Search className="ml-4 h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
              <input
                type="text"
                placeholder="Kërko produkte"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm outline-none sm:px-4"
                style={{ color: "var(--foreground)" }}
                aria-label="Kërko produkte"
              />
              <button
                type="submit"
                className="m-1.5 shrink-0 rounded px-4 py-2.5 text-sm font-bold transition-colors sm:px-6"
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
