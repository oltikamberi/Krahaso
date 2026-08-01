"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/kerko?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function popular(term: string) {
    setQuery(term);
    router.push(`/kerko?q=${encodeURIComponent(term)}`);
  }

  return (
    <section
      className="border-b"
      style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h1
          className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: "var(--foreground)" }}
        >
          Gjej çmimin <span style={{ color: "var(--brand-soft)" }}>më të mirë</span> sot
        </h1>

        <p
          className="mx-auto mb-10 max-w-xl text-base"
          style={{ color: "var(--muted-foreground)" }}
        >
          Krahaso çmimet nga dyqanet kryesore në Kosovë dhe kurseni para çdo herë që blini.
        </p>

        <form onSubmit={submit} className="relative mx-auto max-w-2xl">
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
              placeholder="Kërko produkt, markë ose kategori..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-4 text-sm outline-none"
              style={{ color: "var(--foreground)" }}
              aria-label="Kërko produkte"
            />
            <button
              type="submit"
              className="m-1.5 shrink-0 rounded px-6 py-2.5 text-sm font-bold transition-colors"
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

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
              Popullar:
            </span>
            {["iPhone 15", "Samsung S24", "MacBook", "Sony TV"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => popular(term)}
                className="rounded-full bg-white px-2 py-0.5 text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              >
                {term}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
