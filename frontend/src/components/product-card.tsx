"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageOff, ExternalLink, Heart } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { upgradeImageUrl } from "@/lib/image-url";
import type { GroupedProduct } from "@/lib/types";

/** Prefer CDNs that allow hotlinking; Neptun blocks localhost Referer. */
const IMAGE_PRIORITY: Record<string, number> = {
  gjirafa50: 0,
  buton: 1,
  aztech: 2,
  foleja: 3,
  neptun: 9,
};

function pickImageUrl(product: GroupedProduct): string | null {
  const fromOffers = [...product.offers]
    .filter((o) => o.imageUrl)
    .sort(
      (a, b) =>
        (IMAGE_PRIORITY[a.providerSlug] ?? 5) - (IMAGE_PRIORITY[b.providerSlug] ?? 5),
    );
  return fromOffers[0]?.imageUrl ?? product.imageUrl ?? null;
}

export function ProductCard({ product }: { product: GroupedProduct }) {
  const [liked, setLiked] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const offers = product.offers;
  const lowest = offers[0];
  const highest = offers[offers.length - 1];
  const savings = highest && lowest ? highest.price - lowest.price : 0;
  const highlightSavings = savings >= 10;
  const detailId = lowest?.id;
  const imageUrl = upgradeImageUrl(pickImageUrl(product), "card");

  return (
    <div
      className="@container group relative flex h-full flex-col overflow-hidden rounded-lg bg-card transition-shadow duration-200 hover:shadow-lg active:shadow-md"
      style={{ border: "1px solid var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setLiked(!liked)}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-gray-50 active:scale-95 dark:bg-[var(--muted)] sm:right-3 sm:top-3 sm:h-7 sm:w-7"
        style={{ border: "1px solid var(--border)" }}
        aria-label="Ruaj"
      >
        <Heart
          className={`h-4 w-4 transition-colors sm:h-3.5 sm:w-3.5 ${liked ? "fill-red-500 text-red-500" : ""}`}
          style={!liked ? { color: "var(--muted-foreground)" } : undefined}
        />
      </button>

      <Link
        href={detailId ? `/produkti/${detailId}` : "#"}
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-white @[280px]:aspect-auto @[280px]:h-44 sm:h-48"
      >
        {imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain p-2.5 transition-transform duration-500 group-hover:scale-105 sm:p-4"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImageOff
            className="h-7 w-7 opacity-30 sm:h-8 sm:w-8"
            style={{ color: "var(--muted-foreground)" }}
            aria-hidden
          />
        )}
      </Link>

      <div className="px-2 pt-2 sm:px-3 sm:pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mb-1.5 flex flex-col gap-1.5 @[240px]:mb-2 @[240px]:flex-row @[240px]:items-center @[240px]:justify-between @[240px]:gap-2">
          <span
            className="font-mono text-[9px] uppercase tracking-wider sm:text-[10px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nga {offers.length} dyqane
          </span>
          {highlightSavings && (
            <span
              className="inline-flex w-full items-baseline justify-between gap-1 rounded-md px-1.5 py-1 @[240px]:w-auto @[240px]:justify-start @[240px]:gap-1.5 @[240px]:px-2"
              style={{
                backgroundColor: "var(--savings-bg)",
                color: "var(--savings)",
              }}
              title={`Mund të kurseni deri në ${formatPrice(savings, product.currency)} duke zgjedhur dyqanin më të lirë`}
            >
              <span className="text-[10px] font-medium leading-none tracking-wide sm:text-[11px]">
                Ti Kursen
              </span>
              <span className="font-mono text-[13px] font-bold leading-none tracking-tight tabular-nums sm:text-[14px]">
                {formatPrice(savings, product.currency)}
              </span>
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          {offers.map((offer, i) => {
            const isCheapest = i === 0;
            const isHighlighted = highlightSavings && isCheapest;
            return (
              <a
                key={`${offer.providerSlug}-${offer.id}`}
                href={offer.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-9 items-center justify-between gap-1 rounded px-1.5 py-1.5 transition-opacity hover:opacity-90 active:opacity-80 sm:min-h-0 sm:gap-2 sm:px-2.5"
                style={
                  isHighlighted
                    ? {
                        backgroundColor: "var(--cheapest-bg)",
                        border: "1px solid var(--cheapest-border)",
                      }
                    : undefined
                }
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="min-w-0 truncate text-[11px] sm:text-xs"
                  style={{
                    color: isCheapest ? "var(--foreground)" : "var(--muted-foreground)",
                    fontWeight: isCheapest ? 600 : 400,
                  }}
                >
                  {offer.providerName}
                </span>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <span
                    className="font-mono text-xs font-bold tabular-nums sm:text-sm"
                    style={{
                      color: isHighlighted ? "var(--price-highlight)" : "var(--price-muted)",
                    }}
                  >
                    {formatPrice(offer.price, offer.currency)}
                  </span>
                  {isHighlighted && (
                    <span
                      className="hidden rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider @[260px]:inline"
                      style={{
                        backgroundColor: "var(--deal)",
                        color: "var(--deal-foreground)",
                      }}
                    >
                      Më i lirë
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4">
        <div>
          <p
            className="mb-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-widest sm:mb-1 sm:text-[10px]"
            style={{ color: "var(--brand-soft)" }}
          >
            {product.categorySlug}
          </p>
          <Link href={detailId ? `/produkti/${detailId}` : "#"}>
            <h3
              className="line-clamp-2 text-[13px] font-semibold leading-snug hover:underline sm:text-sm sm:leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {product.name}
            </h3>
          </Link>
        </div>

        {lowest && (
          <a
            href={lowest.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded px-2 py-2 text-[11px] font-bold transition-colors hover:opacity-95 active:opacity-90 sm:min-h-0 sm:gap-2 sm:py-2.5 sm:text-xs"
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
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="truncate @[220px]:hidden">
              Shiko — {formatPrice(lowest.price, lowest.currency)}
            </span>
            <span className="hidden truncate @[220px]:inline">
              Shko te {lowest.providerName} — {formatPrice(lowest.price, lowest.currency)}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
