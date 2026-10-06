"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

export type FramerCarouselItem = {
  id: string | number;
  url: string;
  title: string;
  href?: string;
  subtitle?: string;
  badge?: string;
};

export const items: FramerCarouselItem[] = [
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1761882725885-d3d8bd2032d1?auto=format&fit=crop&q=80&w=687",
    title: "AUSIZE MAM",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1661980494567-40a5e01b699b?auto=format&fit=crop&q=80&w=685",
    title: "BOXIEN BAY",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1761775915848-467e41c1c4db?auto=format&fit=crop&q=80&w=689",
    title: "RECLKTIKA",
  },
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1761882835101-02ab45ac0726?auto=format&fit=crop&q=80&w=690",
    title: "MAXX PHAM",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1761078980679-e89e25fe279b?auto=format&fit=crop&q=80&w=687",
    title: "SONYPOO",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1760389005000-bf02bf24f463?auto=format&fit=crop&q=80&w=1123",
    title: "DONM FLY",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1761165307495-56bd564d322f?auto=format&fit=crop&q=80&w=663",
    title: "Snowy Mountain Highway",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1756299792672-157811bf1005?auto=format&fit=crop&q=80&w=1074",
    title: "FOGGY FOLS",
  },
  {
    id: 9,
    url: "https://images.unsplash.com/photo-1572851899646-a1f69c664e1e?auto=format&fit=crop&q=80&w=1170",
    title: "DIM DARKO",
  },
  {
    id: 10,
    url: "https://images.unsplash.com/photo-1759247178379-0e8eba83a4a6?auto=format&fit=crop&q=80&w=687",
    title: "BEALIVE",
  },
  {
    id: 11,
    url: "https://images.unsplash.com/photo-1754968230523-052635c98f99?auto=format&fit=crop&q=80&w=736",
    title: "DOMEDOM ROME",
  },
  {
    id: 12,
    url: "https://images.unsplash.com/photo-1643037508102-46fb319979c5?auto=format&fit=crop&q=80&w=764",
    title: "IKEIMON POVE",
  },
];

type FramerCarouselProps = {
  slides?: FramerCarouselItem[];
  autoPlayMs?: number;
  className?: string;
  heightClassName?: string;
};

export default function FramerCarousel({
  slides = items,
  autoPlayMs = 4500,
  className = "",
  heightClassName = "h-[280px] sm:h-[320px] md:h-[360px]",
}: FramerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate the slide index and translate by percentage. Translating by pixels
  // measured with offsetWidth drifts by a fraction of a pixel per slide (the
  // real width is fractional, offsetWidth is rounded), so later slides end up a
  // few pixels off and the neighbouring slide bleeds in at the edge.
  const progress = useMotionValue(0);
  const x = useTransform(progress, (value) => `${-value * 100}%`);

  const count = slides.length;

  useEffect(() => {
    if (count === 0) return;
    const controls = animate(progress, index, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    return () => controls.stop();
  }, [index, progress, count]);

  const goTo = useEffectEvent((next: number) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  });

  useEffect(() => {
    if (count <= 1 || paused || autoPlayMs <= 0) return;
    const id = window.setInterval(() => goTo(index + 1), autoPlayMs);
    return () => window.clearInterval(id);
  }, [count, paused, autoPlayMs, index]);

  if (count === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-3">
        <div
          className="relative overflow-hidden rounded-xl bg-white"
          ref={containerRef}
          style={{
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,59,113,0.08)",
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
            <span
              className="rounded-md bg-white px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:text-[10px]"
              style={{ color: "var(--brand)" }}
            >
              Produkte me kursim të lartë
            </span>
          </div>

          <motion.div className="flex" style={{ x }}>
            {slides.map((item) => {
              const body = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    // White, not --secondary: retailer photos ship on white, so any other
                    // colour shows the photo's edge as a rectangle around the product
                    className="h-full w-full select-none bg-white object-contain p-6 pointer-events-none sm:p-8"
                    draggable={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16 text-white">
                    {item.badge && (
                      <span
                        className="mb-2 inline-block rounded px-2 py-1 font-mono text-[11px] font-bold shadow-sm"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "var(--savings)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[var(--deal)]">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </>
              );

              return (
                <div
                  key={item.id}
                  className={`relative w-full shrink-0 ${heightClassName}`}
                >
                  {item.href ? (
                    <Link href={item.href} className="relative block h-full w-full">
                      {body}
                    </Link>
                  ) : (
                    <div className="relative h-full w-full">{body}</div>
                  )}
                </div>
              );
            })}
          </motion.div>

          <motion.button
            type="button"
            disabled={index === 0}
            aria-label="Oferta e mëparshme"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform sm:left-4 sm:h-10 sm:w-10 ${
              index === 0
                ? "cursor-not-allowed bg-white/70 opacity-40"
                : "bg-white opacity-80 hover:scale-110 hover:opacity-100"
            }`}
          >
            <ChevronLeft className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </motion.button>

          <motion.button
            type="button"
            disabled={index === count - 1}
            aria-label="Oferta e radhës"
            onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
            className={`absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform sm:right-4 sm:h-10 sm:w-10 ${
              index === count - 1
                ? "cursor-not-allowed bg-white/70 opacity-40"
                : "bg-white opacity-80 hover:scale-110 hover:opacity-100"
            }`}
          >
            <ChevronRight className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </motion.button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Shko te oferta ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-7 bg-white sm:w-8" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
