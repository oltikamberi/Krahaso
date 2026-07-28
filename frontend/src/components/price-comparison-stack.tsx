"use client";

import { ExternalLink, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/api";
import type { ProductOffer } from "@/lib/types";

interface Props {
  offers: ProductOffer[];
  currency: string;
}

/** Renders a cheapest-first stack of retailer offers for a product. */
export function PriceComparisonStack({ offers, currency }: Props) {
  if (offers.length < 2) return null;

  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const savings = sorted[sorted.length - 1].price - cheapest.price;
  const highlightSavings = savings >= 10;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            Krahaso çmimet ({sorted.length} dyqane)
          </h3>
        </div>
        {highlightSavings && (
          <span className="text-xs font-semibold" style={{ color: "var(--savings)" }}>
            Kurseni {formatPrice(savings, currency)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((listing, i) => {
          const isHighlighted = highlightSavings && i === 0;
          return (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-all"
              style={{
                backgroundColor: isHighlighted ? "var(--cheapest-bg)" : "var(--muted)",
                border: isHighlighted
                  ? "1px solid var(--cheapest-border)"
                  : "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isHighlighted ? "var(--deal)" : "var(--border)",
                    color: isHighlighted ? "var(--deal-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {listing.providerName}
                </span>
                {isHighlighted && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--deal)",
                      color: "var(--deal-foreground)",
                    }}
                  >
                    Më i lirë
                  </span>
                )}
                {!listing.inStock && (
                  <span
                    className="text-[9px] font-medium uppercase"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    S&apos;ka stok
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-sm font-bold tabular-nums"
                  style={{
                    color: isHighlighted ? "var(--price-highlight)" : "var(--price-muted)",
                  }}
                >
                  {formatPrice(listing.price, currency)}
                </span>
                <a
                  href={listing.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: isHighlighted ? "var(--action)" : "var(--brand)",
                    color: "#fff",
                  }}
                >
                  Shko
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
