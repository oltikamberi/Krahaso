"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { upgradeImageUrl } from "@/lib/image-url";
import type { GroupedProduct } from "@/lib/types";

const AUTO_MS = 4500;

const IMAGE_PRIORITY: Record<string, number> = {
  gjirafa50: 0,
  buton: 1,
  aztech: 2,
  foleja: 3,
  neptun: 9,
};

function savingsFor(product: GroupedProduct): number {
  const offers = product.offers;
  if (offers.length < 2) return 0;
  return offers[offers.length - 1].price - offers[0].price;
}

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

export function DealSlider({ deals }: { deals: GroupedProduct[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const dragStartX = useRef<number | null>(null);
  const dragged = useRef(false);

  const count = deals.length;
  const current = deals[index];

  const goTo = useEffectEvent((next: number) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  });

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => goTo(index + 1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, paused, index]);

  if (count === 0 || !current) return null;

  const savings = savingsFor(current);
  const lowest = current.offers[0];
  const detailId = lowest?.id;
  const href = detailId ? `/produkti/${detailId}` : "#";
  const imageUrl = upgradeImageUrl(pickImageUrl(current), "card");
  const imageFailed = failedImages[current.matchKey] === true;

  function pauseBriefly() {
    setPaused(true);
    window.setTimeout(() => setPaused(false), AUTO_MS);
  }

  function onPointerDown(clientX: number) {
    dragStartX.current = clientX;
    dragged.current = false;
    setPaused(true);
  }

  function onPointerUp(clientX: number) {
    if (dragStartX.current == null) return;
    const delta = clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) > 40) {
      dragged.current = true;
      goTo(index + (delta < 0 ? 1 : -1));
    }
    window.setTimeout(() => setPaused(false), AUTO_MS);
  }

  function guardNav(e: React.MouseEvent) {
    if (dragged.current) {
      e.preventDefault();
      dragged.current = false;
    }
  }

  return (
    <div
      className="relative select-none overflow-hidden rounded-xl bg-white"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,59,113,0.08)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
      onTouchEnd={(e) => onPointerUp(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onPointerDown(e.clientX)}
      onMouseUp={(e) => onPointerUp(e.clientX)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Oferta të mira"
    >
      {/* Mobile: compact horizontal deal strip */}
      <div
        key={`m-${current.matchKey}`}
        className="animate-in fade-in duration-500 md:hidden"
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <span
            className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--brand)" }}
          >
            Oferta të mira
          </span>
          {savings >= 10 && (
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums"
              style={{
                backgroundColor: "var(--savings-bg)",
                color: "var(--savings)",
              }}
            >
              −{formatPrice(savings, current.currency)}
            </span>
          )}
        </div>

        <Link
          href={href}
          onClick={guardNav}
          draggable={false}
          className="flex items-center gap-3 px-3 py-2.5"
        >
          <div
            className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--secondary)" }}
          >
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-2"
                draggable={false}
                onError={() =>
                  setFailedImages((prev) => ({
                    ...prev,
                    [current.matchKey]: true,
                  }))
                }
              />
            ) : (
              <ImageOff
                className="h-6 w-6 opacity-30"
                style={{ color: "var(--muted-foreground)" }}
                aria-hidden
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="mb-0.5 font-mono text-[9px] uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              {current.offerCount} dyqane · {lowest?.providerName}
            </p>
            <h3
              className="mb-1.5 line-clamp-2 text-[13px] font-semibold leading-snug"
              style={{ color: "var(--foreground)" }}
            >
              {current.name}
            </h3>
            <p
              className="font-mono text-lg font-bold tabular-nums tracking-tight"
              style={{ color: "var(--price-highlight)" }}
            >
              {formatPrice(current.lowestPrice, current.currency)}
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            {deals.map((deal, i) => (
              <button
                key={deal.matchKey}
                type="button"
                aria-label={`Shko te oferta ${i + 1}`}
                aria-current={i === index}
                onClick={() => {
                  goTo(i);
                  pauseBriefly();
                }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 14 : 5,
                  backgroundColor:
                    i === index ? "var(--action)" : "var(--border)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Oferta e mëparshme"
              onClick={() => {
                goTo(index - 1);
                pauseBriefly();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full active:bg-[var(--secondary)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Oferta e radhës"
              onClick={() => {
                goTo(index + 1);
                pauseBriefly();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full active:bg-[var(--secondary)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: taller vertical card */}
      <div
        key={`d-${current.matchKey}`}
        className="hidden min-h-[320px] flex-col animate-in fade-in duration-500 md:flex"
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--brand)" }}
          >
            Oferta të mira
          </span>
          {savings >= 10 && (
            <span
              className="rounded-md px-2 py-1 font-mono text-[11px] font-bold tabular-nums"
              style={{
                backgroundColor: "var(--savings-bg)",
                color: "var(--savings)",
              }}
            >
              Kurseni {formatPrice(savings, current.currency)}
            </span>
          )}
        </div>

        <Link
          href={href}
          className="relative mx-4 mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-lg"
          style={{ minHeight: 140, backgroundColor: "var(--secondary)" }}
          onClick={guardNav}
          draggable={false}
        >
          {imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={current.name}
              referrerPolicy="no-referrer"
              className="h-40 w-full object-contain p-4"
              draggable={false}
              onError={() =>
                setFailedImages((prev) => ({
                  ...prev,
                  [current.matchKey]: true,
                }))
              }
            />
          ) : (
            <ImageOff
              className="h-8 w-8 opacity-30"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
          )}
        </Link>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          <p
            className="mb-1 font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nga {current.offerCount} dyqane · {lowest?.providerName}
          </p>
          <Link
            href={href}
            className="mb-2 line-clamp-2 text-sm font-semibold leading-snug hover:underline"
            style={{ color: "var(--foreground)" }}
            onClick={guardNav}
          >
            {current.name}
          </Link>
          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Nga
              </p>
              <p
                className="font-mono text-xl font-bold tabular-nums tracking-tight"
                style={{ color: "var(--price-highlight)" }}
              >
                {formatPrice(current.lowestPrice, current.currency)}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Oferta e mëparshme"
                onClick={() => {
                  goTo(index - 1);
                  pauseBriefly();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Oferta e radhës"
                onClick={() => {
                  goTo(index + 1);
                  pauseBriefly();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--secondary)]"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {deals.map((deal, i) => (
              <button
                key={deal.matchKey}
                type="button"
                aria-label={`Shko te oferta ${i + 1}`}
                aria-current={i === index}
                onClick={() => {
                  goTo(i);
                  pauseBriefly();
                }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 18 : 6,
                  backgroundColor:
                    i === index ? "var(--action)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
