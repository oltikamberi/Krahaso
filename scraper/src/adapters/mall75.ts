import { fetchStatic } from "../http.js";
import { sleep } from "../normalize.js";
import { upgradeScrapedImageUrl } from "../image-url.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";
import type * as cheerio from "cheerio";

/**
 * 75Mall (CS-Cart / Unitheme2) — Kosovo electronics retailer.
 * Prices render as euros + <sup>cents</sup> (e.g. 114<sup>90</sup> → €114.90).
 */
const CATEGORY_PAGES: Array<{ url: string; categorySlug: string }> = [
  // Phones
  {
    url: "https://www.75mall.com/telefone-and-ora-te-mencura/telefone-mobil-al/smart-telefone-al/",
    categorySlug: "telefona",
  },
  {
    url: "https://www.75mall.com/telefone-and-ora-te-mencura/telefone-mobil-al/iphone/",
    categorySlug: "telefona",
  },
  // Laptops (non-gaming)
  {
    url: "https://www.75mall.com/it-and-elektronike/laptop/laptop-standard/",
    categorySlug: "laptope",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/laptop/macbook/",
    categorySlug: "laptope",
  },
  // Gaming
  {
    url: "https://www.75mall.com/it-and-elektronike/laptop/laptop-te-avancuar-gaming/",
    categorySlug: "gaming",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/gaming/",
    categorySlug: "gaming",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/gaming/karrige-gaming/",
    categorySlug: "gaming",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/gaming/tavoline-gaming/",
    categorySlug: "gaming",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/gaming/tepih-gaming/",
    categorySlug: "gaming",
  },
  {
    url: "https://www.75mall.com/it-and-elektronike/monitor/monitor-gaming/",
    categorySlug: "gaming",
  },
  // TVs
  {
    url: "https://www.75mall.com/tv-and-audio/televizore/",
    categorySlug: "televizore",
  },
  {
    url: "https://www.75mall.com/tv-and-audio/televizore/led-tv/",
    categorySlug: "televizore",
  },
  {
    url: "https://www.75mall.com/tv-and-audio/televizore/qled-tv/",
    categorySlug: "televizore",
  },
  {
    url: "https://www.75mall.com/tv-and-audio/televizore/uled-tv/",
    categorySlug: "televizore",
  },
  {
    url: "https://www.75mall.com/tv-and-audio/televizore/miniled/",
    categorySlug: "televizore",
  },
  // Home appliances
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/lavatriqe/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/makina-tharese-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/frigorifer-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/friz-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/enelarese-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/mikrovale-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/aspirator-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/shporet-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/furra-montuese-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/teknike-e-bardhe/pllake-per-zierje-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/bojler-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/fshesa-al/",
    categorySlug: "pajisje-shtepiake",
  },
  {
    url: "https://www.75mall.com/elektro-shtepiake/aparate-te-vogla-shtepiake/",
    categorySlug: "pajisje-shtepiake",
  },
];

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://www.75mall.com${href.startsWith("/") ? href : `/${href}`}`;
}

function pageUrl(base: string, page: number): string {
  if (page === 1) return base;
  return `${base.replace(/\/?$/, "/")}page-${page}/`;
}

/** CS-Cart Unitheme price: 114<sup>90</sup> → 114.90 */
function parse75MallPrice($card: cheerio.Cheerio<any>): number | null {
  const $price = $card.find(".ty-price").first();
  const html =
    $price.find("span.ty-price-num").last().html() ||
    $price.html() ||
    "";
  const withSup = html.match(/(\d+)\s*<sup>(\d{1,2})<\/sup>/i);
  if (withSup) {
    return Number(`${withSup[1]}.${withSup[2].padStart(2, "0")}`);
  }
  // Fallback if text collapsed euros+cents (e.g. "11490")
  const digits = $price.text().replace(/[^\d]/g, "");
  if (digits.length >= 3) return Number(digits) / 100;
  if (digits.length > 0) return Number(digits);
  return null;
}

function parseCards($: cheerio.CheerioAPI, categorySlug: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  for (const card of $(".ut2-gl__item").toArray()) {
    const $card = $(card);
    const $link = $card.find(".ut2-gl__name a").first();
    const href = $link.attr("href");
    const name = $link.text().trim();
    if (!href || !name) continue;

    const price = parse75MallPrice($card);
    if (price === null || price < 5) continue;

    const imageUrl =
      $card.find("img.cm-image").attr("data-src") ||
      $card.find("img.cm-image").attr("src") ||
      $card.find("img").attr("data-src") ||
      $card.find("img").attr("src") ||
      null;

    const productUrl = absoluteUrl(href);
    products.push({
      categorySlug,
      externalId: productUrl,
      name,
      brand: name.split(/\s+/)[0] ?? null,
      imageUrl: upgradeScrapedImageUrl(imageUrl ? absoluteUrl(imageUrl) : null),
      productUrl,
      price,
      currency: "EUR",
      inStock: $card.find(".ty-qty-out-of-stock").length === 0,
      specs: {},
    });
  }
  return products;
}

export const mall75Adapter: SiteAdapter = {
  provider: {
    slug: "75mall",
    name: "75Mall",
    websiteUrl: "https://www.75mall.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const { url, categorySlug } of CATEGORY_PAGES) {
      let page = 1;
      let firstPageFingerprint = "";

      while (page <= 40) {
        console.log(`  [75mall] ${categorySlug} ${url.split("/").filter(Boolean).pop()} page ${page}`);
        let $: cheerio.CheerioAPI;
        try {
          $ = await fetchStatic(pageUrl(url, page));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("404") || message.includes("Not Found")) {
            console.warn(`  [75mall] page ${page} not found — stopping`);
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

        if (batch.length < 8) break;
        page++;
        await sleep(400);
      }
    }

    return products;
  },
};
