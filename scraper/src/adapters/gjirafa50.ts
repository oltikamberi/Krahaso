import { fetchStatic } from "../http.js";
import { parsePrice } from "../parse-price.js";
import { sleep } from "../normalize.js";
import { upgradeScrapedImageUrl } from "../image-url.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";

const CATEGORY_PAGES: Array<{ url: string; categorySlug: string }> = [
  { url: "https://gjirafa50.com/laptop", categorySlug: "laptope" },
  // Gaming — hub + consoles / peripherals when available
  { url: "https://gjirafa50.com/gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/playstation", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/xbox", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/nintendo", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/monitor-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/karrige-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/tastiere-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/maus-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/kufje-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/desktop-gaming", categorySlug: "gaming" },
  { url: "https://gjirafa50.com/telefon", categorySlug: "telefona" },
  { url: "https://gjirafa50.com/televizor", categorySlug: "televizore" },
  { url: "https://gjirafa50.com/pajisje-shtepiake", categorySlug: "pajisje-shtepiake" },
];

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://gjirafa50.com${href.startsWith("/") ? href : `/${href}`}`;
}

function parseCards(
  $: cheerio.CheerioAPI,
  categorySlug: string,
): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  for (const card of $(".product-item").toArray()) {
    const $card = $(card);
    const $link =
      $card.find("a.product-title-lines").first().length > 0
        ? $card.find("a.product-title-lines").first()
        : $card.find('a[class*="product-title"]').first();
    const href = $link.attr("href");
    const name = $link.text().trim() || $card.find("img").attr("alt")?.trim();
    if (!href || !name) continue;

    const priceText =
      $card.find(".price.main").first().text() ||
      $card.find(".prices .price:not(.old-price)").first().text();
    const price = parsePrice(priceText);
    if (price === null || price < 20) continue;

    const imageUrl =
      $card.find(".picture img").attr("src") ||
      $card.find("img").attr("src") ||
      null;
    const productUrl = absoluteUrl(href);

    // Category listings don't expose OOS badges — presence on the listing
    // means available. Products missing from a full scrape are marked OOS in db.
    products.push({
      categorySlug,
      externalId: productUrl,
      name,
      brand: name.split(/\s+/)[0] ?? null,
      imageUrl: upgradeScrapedImageUrl(imageUrl ? absoluteUrl(imageUrl) : null),
      productUrl,
      price,
      currency: "EUR",
      inStock: true,
      specs: {},
    });
  }
  return products;
}

// cheerio type used only via return of fetchStatic
import type * as cheerio from "cheerio";

export const gjirafa50Adapter: SiteAdapter = {
  provider: {
    slug: "gjirafa50",
    name: "Gjirafa50",
    websiteUrl: "https://gjirafa50.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const { url, categorySlug } of CATEGORY_PAGES) {
      let page = 1;
      let emptyStreak = 0;

      while (page <= 80) {
        const pageUrl = page === 1 ? url : `${url}?pagenumber=${page}`;
        console.log(`  [gjirafa50] ${categorySlug} page ${page}`);
        let $: cheerio.CheerioAPI;
        try {
          $ = await fetchStatic(pageUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (
            message.includes("403") ||
            message.includes("404") ||
            message.includes("Not Found")
          ) {
            console.warn(`  [gjirafa50] ${url} blocked/missing — skipping`);
            break;
          }
          throw error;
        }
        const batch = parseCards($, categorySlug);
        if (batch.length === 0) {
          emptyStreak++;
          if (emptyStreak >= 2) break;
        } else {
          emptyStreak = 0;
          for (const product of batch) {
            if (seen.has(product.productUrl)) continue;
            seen.add(product.productUrl);
            products.push(product);
          }
        }
        // Detect totalPages from nopCommerce infinite-scroll script if present
        const totalMatch = $.html().match(/totalPages\s*=\s*['"](\d+)['"]/);
        const totalPages = totalMatch ? Number(totalMatch[1]) : null;
        if (totalPages != null && page >= totalPages) break;

        page++;
        await sleep(400);
      }
    }

    return products;
  },
};
