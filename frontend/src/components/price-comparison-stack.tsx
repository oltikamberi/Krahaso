"use client";

import { ExternalLink, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/api";
import type { ProductOffer } from "@/lib/types";

interface Props {
  offers: ProductOffer[];
  currency: string;
}

/** In-stock retailers only — cheapest first. */
export function PriceComparisonStack({ offers, currency }: Props) {
  const stockOffers = offers.filter((o) => o.inStock).sort((a, b) => a.price - b.price);
  if (stockOffers.length === 0) return null;

  const cheapestId = stockOffers[0]?.id;
  const savings =
    stockOffers.length > 1
      ? Math.max(...stockOffers.map((o) => o.price)) - Math.min(...stockOffers.map((o) => o.price))
      : 0;
  const highlightSavings = savings > 5;
  const tinyDifference = stockOffers.length > 1 && savings > 0 && savings <= 5;
  const samePrices = stockOffers.length > 1 && savings === 0;
  const isComparison = stockOffers.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {isComparison
              ? `Krahaso çmimet (${stockOffers.length} dyqane)`
              : "Disponueshmëria"}
          </h3>
        </div>
        {highlightSavings ? (
          <span className="text-xs font-semibold" style={{ color: "var(--savings)" }}>
            Kurseni {formatPrice(savings, currency)}
          </span>
        ) : tinyDifference ? (
          <span
            className="inline-flex items-baseline gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: "var(--cheapest-bg)",
              color: "var(--deal-foreground)",
              border: "1px solid var(--cheapest-border)",
            }}
          >
            Diferencë shumë e vogël
            <span className="font-mono tabular-nums">{formatPrice(savings, currency)}</span>
          </span>
        ) : samePrices ? (
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: "var(--cheapest-bg)",
              color: "var(--deal-foreground)",
              border: "1px solid var(--cheapest-border)",
            }}
          >
            Çmime të njejta
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {stockOffers.map((listing, i) => {
          const isHighlighted = highlightSavings && listing.id === cheapestId;
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
                {isComparison && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: isHighlighted ? "var(--savings)" : "var(--border)",
                      color: isHighlighted ? "#ffffff" : "var(--muted-foreground)",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {listing.providerName}
                </span>
                {isHighlighted && isComparison && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--savings)",
                      color: "#ffffff",
                    }}
                  >
                    Më i lirë
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`font-mono tabular-nums tracking-tight ${
                    listing.id === cheapestId ? "text-base font-black" : "text-sm font-semibold"
                  }`}
                  style={{
                    color: listing.id === cheapestId ? "var(--price)" : "var(--price-muted)",
                  }}
                >
                  {formatPrice(listing.price, currency)}
                </span>
                <a
                  href={listing.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors"
                  style={
                    isHighlighted
                      ? { backgroundColor: "var(--action)", color: "var(--action-foreground)" }
                      : {
                          backgroundColor: "var(--card)",
                          color: "var(--foreground)",
                          border: "1px solid var(--border)",
                        }
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isHighlighted
                      ? "var(--action-hover)"
                      : "var(--secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isHighlighted
                      ? "var(--action)"
                      : "var(--card)";
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
