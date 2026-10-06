"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { upgradeImageUrl } from "@/lib/image-url";
import type { GroupedProduct } from "@/lib/types";

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
        (IMAGE_PRIORITY[a.providerSlug] ?? 5) -
        (IMAGE_PRIORITY[b.providerSlug] ?? 5),
    );
  return fromOffers[0]?.imageUrl ?? product.imageUrl ?? null;
}

function SponsoredCard({ product }: { product: GroupedProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  const lowest = product.offers[0];
  const detailId = lowest?.id;
  const imageUrl = upgradeImageUrl(pickImageUrl(product), "card");

  return (
    <Link
      href={detailId ? `/produkti/${detailId}` : "#"}
      className="group flex w-[164px] shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-md sm:w-auto sm:flex-1 sm:snap-none"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Fixed-height image box keeps every card the same height in the scroller */}
      <div
        className="relative flex h-[124px] items-center justify-center bg-[var(--secondary)] sm:h-auto sm:aspect-[4/3]"
      >
        <span
          className="absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "var(--deal)",
            color: "var(--deal-foreground)",
          }}
        >
          Sponsorizuar
        </span>
        {imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImageOff
            className="h-7 w-7 opacity-30"
            style={{ color: "var(--muted-foreground)" }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {/* Reserve two lines so short names don't shrink the card */}
        <p
          className="line-clamp-2 min-h-[2.6em] text-[13px] font-semibold leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {product.name}
        </p>
        <p
          className="mt-auto font-mono text-sm font-bold tabular-nums"
          style={{ color: "var(--price-highlight)" }}
        >
          {formatPrice(product.lowestPrice, product.currency)}
        </p>
        <p
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          Nga {product.offerCount} dyqane
        </p>
      </div>
    </Link>
  );
}

export function SponsoredSection({ products }: { products: GroupedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section
      className="border-b"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
      aria-label="Produkte të sponsorizuara"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
          <div>
            <span
              className="mb-1.5 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: "var(--deal)",
                color: "var(--deal-foreground)",
              }}
            >
              Sponsorizuar
            </span>
            <h2
              className="text-lg font-bold tracking-tight sm:text-xl"
              style={{ color: "var(--foreground)" }}
            >
              Zgjedhje të rekomanduara
            </h2>
          </div>
          <p
            className="text-xs leading-relaxed sm:max-w-xs sm:text-right"
            style={{ color: "var(--muted-foreground)" }}
          >
            Produkte të promovuara nga partnerët — të etiketuar qartë.
          </p>
        </div>

        {/* Phone: edge-to-edge snap scroller; the negative margin lets the first
            card align with the heading while the row still bleeds off-screen. */}
        <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4">
          {products.map((product) => (
            <SponsoredCard key={product.matchKey} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
