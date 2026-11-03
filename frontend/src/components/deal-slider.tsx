"use client";

import FramerCarousel, {
  type FramerCarouselItem,
} from "@/components/ui/framer-normal-carousel";
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

function stockOffers(product: GroupedProduct) {
  return product.offers.filter((o) => o.inStock).sort((a, b) => a.price - b.price);
}

function savingsFor(product: GroupedProduct): number {
  const offers = stockOffers(product);
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

function toSlides(deals: GroupedProduct[]): FramerCarouselItem[] {
  return deals.flatMap((product) => {
    const imageUrl = upgradeImageUrl(pickImageUrl(product), "card");
    const lowest = stockOffers(product)[0];
    if (!imageUrl || !lowest) return [];

    const savings = savingsFor(product);
    return [
      {
        id: product.matchKey,
        url: imageUrl,
        title: product.name,
        href: `/produkti/${lowest.id}`,
        subtitle: formatPrice(product.lowestPrice, product.currency),
        badge: `Kurseni ${formatPrice(savings, product.currency)}`,
      },
    ];
  });
}

export function DealSlider({ deals }: { deals: GroupedProduct[] }) {
  const slides = toSlides(deals);
  if (slides.length === 0) return null;

  return (
    <FramerCarousel
      slides={slides}
      autoPlayMs={4500}
      className="p-0"
      heightClassName="h-[280px] sm:h-[300px] md:h-[340px]"
    />
  );
}
