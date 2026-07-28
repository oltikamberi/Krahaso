import { fetchStatic } from "../http.js";
import { parsePrice } from "../parse-price.js";
import { sleep } from "../normalize.js";
import { upgradeScrapedImageUrl } from "../image-url.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";
import type * as cheerio from "cheerio";

const CATEGORY_PAGES: Array<{ url: string; categorySlug: string }> = [
  { url: "https://butonks.com/laptop/laptop/", categorySlug: "laptope" },
  // Gaming — parent + leaves for consoles, PCs, peripherals, furniture
  { url: "https://butonks.com/gaming/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-laptops/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-desktops/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-monitors/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-console/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-mouse/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-keyboard/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-mouse-pad/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-headphones/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/gaming-chairs-desks/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/streaming-webcams/", categorySlug: "gaming" },
  { url: "https://butonks.com/gaming/streaming-microphones/", categorySlug: "gaming" },
  { url: "https://butonks.com/electronics-tv/celulare/", categorySlug: "telefona" },
  { url: "https://butonks.com/electronics-tv/tv-audio/televizor/", categorySlug: "televizore" },
  { url: "https://butonks.com/shtepiake-kuzhine/", categorySlug: "pajisje-shtepiake" },
];

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://butonks.com${href.startsWith("/") ? href : `/${href}`}`;
}

function pageUrl(base: string, page: number): string {
  if (page === 1) return base;
  return `${base.replace(/\/?$/, "/") }page-${page}/`;
}

function parseCards($: cheerio.CheerioAPI, categorySlug: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  for (const card of $(".ty-grid-list__item").toArray()) {
    const $card = $(card);
    const $link = $card.find(".ty-grid-list__item-name a").first();
    const href = $link.attr("href");
    const name = $link.text().trim();
    if (!href || !name) continue;

    const priceText =
      $card.find(".ty-price").first().text() ||
      $card.find(".ty-price-num").map((_, el) => $(el).text()).get().join("");
    const price = parsePrice(priceText);
    if (price === null || price < 5) continue;

    const imageUrl =
      $card.find(".ty-grid-list__image img.cm-image").attr("src") ||
      $card.find(".ty-grid-list__image img").attr("src") ||
      null;

    products.push({
      categorySlug,
      externalId: absoluteUrl(href),
      name,
      brand: name.split(/\s+/)[0] ?? null,
      imageUrl: upgradeScrapedImageUrl(imageUrl ? absoluteUrl(imageUrl) : null),
      productUrl: absoluteUrl(href),
      price,
      currency: "EUR",
      inStock: true,
      specs: {},
    });
  }
  return products;
}

export const butonAdapter: SiteAdapter = {
  provider: {
    slug: "buton",
    name: "Buton",
    websiteUrl: "https://butonks.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const { url, categorySlug } of CATEGORY_PAGES) {
      let page = 1;
      let firstPageFingerprint = "";

      while (page <= 40) {
        console.log(`  [buton] ${categorySlug} page ${page}`);
        let $: cheerio.CheerioAPI;
        try {
          $ = await fetchStatic(pageUrl(url, page));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("404") || message.includes("Not Found")) {
            console.warn(`  [buton] page ${page} not found — stopping ${categorySlug}`);
            break;
          }
          throw error;
        }
        const batch = parseCards($, categorySlug);
        if (batch.length === 0) break;

        const fingerprint = batch.map((p) => p.productUrl).join("|");
        if (page > 1 && fingerprint === firstPageFingerprint) break;
        if (page === 1) firstPageFingerprint = fingerprint;

        for (const product of batch) {
          if (seen.has(product.productUrl)) continue;
          seen.add(product.productUrl);
          products.push(product);
        }

        // Stop only when we get a short last page (partial page = end of category)
        if (batch.length < 8) break;
        page++;
        await sleep(400);
      }
    }

    return products;
  },
};
