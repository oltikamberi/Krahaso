import { http } from "../http.js";
import { sleep } from "../normalize.js";
import { parsePrice } from "../parse-price.js";
import { upgradeScrapedImageUrl } from "../image-url.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";

const CATEGORIES: Array<{ id: number; categorySlug: string }> = [
  { id: 136, categorySlug: "laptope" },
  { id: 127, categorySlug: "telefona" },
  { id: 63, categorySlug: "televizore" },
  { id: 67, categorySlug: "gaming" }, // Gaming (laptops, gear)
  // White goods — scrape leaves (parent 3 also works but children are cleaner)
  { id: 4, categorySlug: "pajisje-shtepiake" }, // Rrobalarëse
  { id: 5, categorySlug: "pajisje-shtepiake" }, // Frigorifer
  { id: 6, categorySlug: "pajisje-shtepiake" }, // Elemente montuese
  { id: 7, categorySlug: "pajisje-shtepiake" }, // Shporet
  { id: 8, categorySlug: "pajisje-shtepiake" }, // Enëlarëse
  { id: 9, categorySlug: "pajisje-shtepiake" }, // Bojler
  { id: 10, categorySlug: "pajisje-shtepiake" }, // Friz
  { id: 32, categorySlug: "pajisje-shtepiake" }, // Elektroshtëpiake
  { id: 33, categorySlug: "pajisje-shtepiake" }, // Thithëse
  { id: 35, categorySlug: "pajisje-shtepiake" }, // Kuzhinë
];

const PAGE_SIZE = 40;

interface AztechProduct {
  name?: string;
  slug?: string;
  /** Often the regular (pre-discount) list price — do NOT trust alone. */
  price?: string | number;
  /** HTML with .special-price (sale) and/or .regular-price (strikethrough). */
  priceHTML?: string;
  image?: string;
  isSaleable?: boolean;
  galleryImages?: Array<{
    medium_image_url?: string;
    large_image_url?: string;
    original_image_url?: string;
  }>;
}

interface AztechResponse {
  products?: {
    data?: AztechProduct[];
    last_page?: number;
    total?: number;
  };
}

/**
 * Aztech puts the old strikethrough amount in `price` when an item is on sale.
 * The amount customers actually pay is in priceHTML → .special-price.
 */
export function resolveAztechPrice(item: AztechProduct): number | null {
  const html = item.priceHTML ?? "";

  const specialMatch = html.match(/class=["']special-price["'][^>]*>\s*([^<]+)/i);
  if (specialMatch) {
    const special = parsePrice(specialMatch[1]);
    if (special !== null) return special;
  }

  // No sale badge — single price span, or fall back to the numeric field
  const plainMatch = html.match(/<span(?![^>]*regular-price)[^>]*>\s*([^<]*€[^<]*)/i);
  if (plainMatch) {
    const plain = parsePrice(plainMatch[1]);
    if (plain !== null) return plain;
  }

  if (item.price == null) return null;
  const fallback = Number(item.price);
  return Number.isFinite(fallback) ? fallback : null;
}

export const aztechAdapter: SiteAdapter = {
  provider: {
    slug: "aztech",
    name: "Aztech Online",
    websiteUrl: "https://aztechonline.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const { id, categorySlug } of CATEGORIES) {
      let page = 1;
      let lastPage = 1;

      while (page <= lastPage && page <= 50) {
        const url = `https://aztechonline.com/category-products/${id}?limit=${PAGE_SIZE}&page=${page}`;
        console.log(`  [aztech] ${categorySlug}#${id} page ${page}`);
        const data = await http.get(url).json<AztechResponse>();
        const items = data.products?.data ?? [];
        lastPage = data.products?.last_page ?? page;

        for (const item of items) {
          if (!item.name || !item.slug) continue;
          if (seen.has(item.slug)) continue;
          const price = resolveAztechPrice(item);
          if (price === null || price < 5) continue;

          seen.add(item.slug);
          products.push({
            categorySlug,
            externalId: item.slug,
            name: item.name.trim(),
            brand: item.name.trim().split(/\s+/)[0] ?? null,
            imageUrl: upgradeScrapedImageUrl(
              item.galleryImages?.[0]?.large_image_url ||
                item.galleryImages?.[0]?.original_image_url ||
                item.image ||
                item.galleryImages?.[0]?.medium_image_url ||
                null,
            ),
            productUrl: `https://aztechonline.com/${item.slug}`,
            price,
            currency: "EUR",
            inStock: item.isSaleable !== false,
            specs: {},
          });
        }

        if (items.length === 0) break;
        page++;
        await sleep(300);
      }
    }

    return products;
  },
};
