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
      className="group flex min-w-[160px] flex-1 flex-col overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-md sm:min-w-0"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center bg-[var(--secondary)]"
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
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
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
        <p
          className="line-clamp-2 text-[13px] font-semibold leading-snug"
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
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p
              className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sponsorizuar
            </p>
            <h2
              className="text-lg font-bold tracking-tight sm:text-xl"
              style={{ color: "var(--foreground)" }}
            >
              Zgjedhje të rekomanduara
            </h2>
          </div>
          <p
            className="max-w-xs text-right text-xs leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Produkte të promovuara nga partnerët — të etiketuar qartë.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-4 sm:pb-0">
          {products.map((product) => (
            <SponsoredCard key={product.matchKey} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
