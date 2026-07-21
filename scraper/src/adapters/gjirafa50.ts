import { extractJsonLdProducts, fetchStatic } from "../http.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";

/**
 * Adapter skeleton for Gjirafa50 (https://gjirafa50.com).
 *
 * Strategy (verify against the live site before enabling):
 *   1. Discover product URLs from category listing pages (or /sitemap.xml).
 *   2. For each product page, prefer JSON-LD structured data; fall back to
 *      CSS selectors only if JSON-LD is missing.
 *   3. If the data turns out to be JS-rendered, swap fetchStatic for
 *      fetchRendered (Playwright).
 *
 * NOTE: selectors/paths below are a starting point, not verified — check
 * robots.txt and the site's terms before scraping commercially.
 */

// Map Gjirafa50 category listing pages to Krahaso category slugs.
const CATEGORY_PAGES: Array<{ url: string; categorySlug: string }> = [
  { url: "https://gjirafa50.com/telefona-mobil", categorySlug: "telefona" },
  { url: "https://gjirafa50.com/laptop", categorySlug: "laptope" },
];

const MAX_PRODUCTS_PER_CATEGORY = 20;
const DELAY_BETWEEN_REQUESTS_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const gjirafa50Adapter: SiteAdapter = {
  provider: {
    slug: "gjirafa50",
    name: "Gjirafa50",
    websiteUrl: "https://gjirafa50.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    for (const { url, categorySlug } of CATEGORY_PAGES) {
      const $listing = await fetchStatic(url);

      // TODO: verify this selector against the live listing page.
      const productUrls = $listing('a[href*="/"]')
        .map((_, element) => $listing(element).attr("href"))
        .get()
        .filter((href): href is string => Boolean(href))
        .filter((href) => href.includes("gjirafa50.com") || href.startsWith("/"))
        .slice(0, MAX_PRODUCTS_PER_CATEGORY);

      for (const productUrl of productUrls) {
        const absoluteUrl = productUrl.startsWith("http")
          ? productUrl
          : `https://gjirafa50.com${productUrl}`;

        try {
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          const $page = await fetchStatic(absoluteUrl);
          const [jsonLd] = extractJsonLdProducts($page);
          if (!jsonLd) continue;

          const offers = (
            Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers
          ) as Record<string, unknown> | undefined;
          if (!offers?.price) continue;

          const brand = jsonLd.brand as Record<string, unknown> | undefined;
          products.push({
            categorySlug,
            externalId: String(jsonLd.sku ?? absoluteUrl),
            name: String(jsonLd.name),
            brand: brand ? String(brand.name ?? brand) : null,
            imageUrl: jsonLd.image ? String(jsonLd.image) : null,
            productUrl: absoluteUrl,
            price: Number(offers.price),
            currency: String(offers.priceCurrency ?? "EUR"),
            inStock: String(offers.availability ?? "").includes("InStock"),
            specs: {},
          });
        } catch (error) {
          console.warn(`Failed to scrape ${absoluteUrl}:`, error);
        }
      }
    }

    return products;
  },
};
