import got from "got";
import * as cheerio from "cheerio";

/**
 * Shared HTTP client for static pages. Polite defaults: identifiable
 * user-agent, timeouts and retries.
 */
export const http = got.extend({
  headers: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    accept: "text/html,application/xhtml+xml,application/json",
  },
  timeout: { request: 30_000 },
  retry: { limit: 2 },
});

/** Fetch a static page and return a Cheerio document. */
export async function fetchStatic(url: string): Promise<cheerio.CheerioAPI> {
  const html = await http.get(url).text();
  return cheerio.load(html);
}

/**
 * Fallback for JS-rendered pages: render with headless Chromium (Playwright)
 * and return a Cheerio document over the rendered HTML.
 *
 * Use this only for sites where product data genuinely does not exist in the
 * initial HTML — it is 10-50x heavier than fetchStatic.
 */
export async function fetchRendered(url: string): Promise<cheerio.CheerioAPI> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    const html = await page.content();
    return cheerio.load(html);
  } finally {
    await browser.close();
  }
}

/**
 * Extract schema.org Product/Offer objects from JSON-LD script tags.
 * Far more robust than scraping CSS selectors — prefer this when available.
 */
export function extractJsonLdProducts(
  $: cheerio.CheerioAPI,
): Array<Record<string, unknown>> {
  const products: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).text()) as unknown;
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (
          typeof node === "object" &&
          node !== null &&
          (node as Record<string, unknown>)["@type"] === "Product"
        ) {
          products.push(node as Record<string, unknown>);
        }
      }
    } catch {
      // Malformed JSON-LD on the page — skip it.
    }
  });
  return products;
}
