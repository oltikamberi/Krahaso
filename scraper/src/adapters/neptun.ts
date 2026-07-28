import { http } from "../http.js";
import { sleep } from "../normalize.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";

const CATEGORY_PAGES: Array<{ url: string; categorySlug: string }> = [
  { url: "https://www.neptun-ks.com/laptop.nspx", categorySlug: "laptope" },
  // Gaming — leaf pages (parent Gaming.nspx embeds empty child Products arrays first)
  { url: "https://www.neptun-ks.com/Laptop_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/PC_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Monitor_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Kufje_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Tastiere_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Maus_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Karrige_Gaming1.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Tavoline_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Mikrofon_Gaming.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/PLAY_STATION2.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/NINTENDO.nspx", categorySlug: "gaming" },
  { url: "https://www.neptun-ks.com/Telefonia.nspx", categorySlug: "telefona" },
  { url: "https://www.neptun-ks.com/tv.nspx", categorySlug: "televizore" },
  // White-goods leaves (parent pages embed empty Products arrays)
  { url: "https://www.neptun-ks.com/Rrobalarese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Rrobatharese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Rrobalarese___Tharese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Frigorifere_SIDE_BY_SIDE_.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Frigorifere_me_Ngrirje_Poshte.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Frigorifere_me_Ngrirje_Larte.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Frigorifere_me_nje_Dere.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Frigorifere_Multidoor.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/frigorifere_montues.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/enelarese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/enelarese_montuese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/mikrovale.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/mikrovale_montuese.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/aspiratore.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/mini_furra___pllaka_gatimi.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/bojler.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Fshese_Robotike.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Fshese_Vertikale.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/fshese_elektrike1.nspx", categorySlug: "pajisje-shtepiake" },
  { url: "https://www.neptun-ks.com/Aparat_per_Kafe.nspx", categorySlug: "pajisje-shtepiake" },
];

interface NeptunProduct {
  Id?: number;
  Title?: string;
  ActualPrice?: number;
  Url?: string;
  Thumbnail?: string;
  AvailableOnline?: boolean;
  AvailableWebshop?: boolean;
  Category?: { Url?: string };
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseProductsAt(decoded: string, arrayStart: number): NeptunProduct[] {
  let i = arrayStart;
  while (i < decoded.length && decoded[i] !== "[") i++;
  if (decoded[i] !== "[") return [];

  let depth = 0;
  const from = i;
  for (; i < decoded.length; i++) {
    const ch = decoded[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(decoded.slice(from, i + 1)) as NeptunProduct[];
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

/**
 * Parent category pages embed empty child `"Products":[]` blobs before the
 * real listing — skip empties and return the first non-empty array.
 */
function extractProductsArray(html: string): NeptunProduct[] {
  const decoded = decodeHtmlEntities(html);
  const marker = '"Products":[';
  let searchFrom = 0;

  while (searchFrom < decoded.length) {
    const start = decoded.indexOf(marker, searchFrom);
    if (start < 0) return [];
    const items = parseProductsAt(decoded, start + '"Products":'.length);
    if (items.length > 0) return items;
    searchFrom = start + marker.length;
  }
  return [];
}

function toScraped(item: NeptunProduct, categorySlug: string): ScrapedProduct | null {
  if (!item.Title || item.ActualPrice == null || !item.Url) return null;
  if (Number(item.ActualPrice) < 5) return null;

  const categoryPath =
    item.Category?.Url ??
    (categorySlug === "laptope"
      ? "laptop"
      : categorySlug === "televizore"
        ? "tv"
        : categorySlug === "telefona"
          ? "Telefonia"
          : categorySlug === "gaming"
            ? "Gaming"
            : "pajisje");
  const productUrl = `https://www.neptun-ks.com/categories/${categoryPath}/${item.Url}`;
  const imageUrl = item.Thumbnail
    ? item.Thumbnail.startsWith("http")
      ? item.Thumbnail
      : `https://www.neptun-ks.com/${item.Thumbnail.replace(/^\//, "")}`
    : null;

  return {
    categorySlug,
    externalId: String(item.Id ?? productUrl),
    name: item.Title.trim(),
    brand: item.Title.trim().split(/\s+/)[0] ?? null,
    imageUrl,
    productUrl,
    price: Number(item.ActualPrice),
    currency: "EUR",
    inStock: Boolean(item.AvailableOnline ?? item.AvailableWebshop ?? true),
    specs: {},
  };
}

export const neptunAdapter: SiteAdapter = {
  provider: {
    slug: "neptun",
    name: "Neptun",
    websiteUrl: "https://www.neptun-ks.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const seenUrls = new Set<string>();

    for (const { url, categorySlug } of CATEGORY_PAGES) {
      let page = 1;
      let firstPageIds = "";

      while (page <= 40) {
        const pageUrl = page === 1 ? url : `${url}?page=${page}`;
        console.log(`  [neptun] ${categorySlug} ${url.split("/").pop()} page ${page}`);
        const html = await http.get(pageUrl).text();
        const items = extractProductsArray(html);
        if (items.length === 0) break;

        const pageIds = items.map((i) => i.Id).join(",");
        // Neptun wraps around and repeats page 1 when past the end
        if (page > 1 && pageIds === firstPageIds) break;
        if (page === 1) firstPageIds = pageIds;

        for (const item of items) {
          const scraped = toScraped(item, categorySlug);
          if (!scraped || seenUrls.has(scraped.productUrl)) continue;
          seenUrls.add(scraped.productUrl);
          products.push(scraped);
        }

        if (items.length < 20) break;
        page++;
        await sleep(400);
      }
    }

    return products;
  },
};
