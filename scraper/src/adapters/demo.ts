import * as cheerio from "cheerio";
import { extractJsonLdProducts } from "../http.js";
import type { ScrapedProduct, SiteAdapter } from "../types.js";

/**
 * Demo adapter — works fully offline so the whole pipeline (adapter →
 * normalizer → database upsert → price history) can be verified end-to-end
 * without depending on any live site.
 *
 * It parses an embedded HTML fixture with JSON-LD product data, exactly the
 * way a real adapter parses a live page.
 */
const FIXTURE_HTML = `
<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
[
  {
    "@type": "Product",
    "name": "Google Pixel 9 128GB",
    "brand": { "name": "Google" },
    "image": null,
    "url": "https://demo.krahaso.com/google-pixel-9",
    "sku": "demo-pixel-9",
    "offers": { "price": "649.00", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" }
  },
  {
    "@type": "Product",
    "name": "OnePlus 12R 256GB",
    "brand": { "name": "OnePlus" },
    "image": null,
    "url": "https://demo.krahaso.com/oneplus-12r",
    "sku": "demo-oneplus-12r",
    "offers": { "price": "499.00", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" }
  }
]
</script>
</head>
<body></body>
</html>
`;

export const demoAdapter: SiteAdapter = {
  provider: {
    slug: "demo",
    name: "Demo Store",
    websiteUrl: "https://demo.krahaso.com",
  },

  async fetchProducts(): Promise<ScrapedProduct[]> {
    // A real adapter would call fetchStatic(url) here instead.
    const $ = cheerio.load(FIXTURE_HTML);
    const jsonLd = extractJsonLdProducts($);

    return jsonLd.map((node) => {
      const offers = node.offers as Record<string, unknown>;
      const brand = node.brand as Record<string, unknown> | undefined;
      return {
        categorySlug: "telefona",
        externalId: String(node.sku ?? node.url),
        name: String(node.name),
        brand: brand ? String(brand.name) : null,
        imageUrl: node.image ? String(node.image) : null,
        productUrl: String(node.url),
        price: Number(offers.price),
        currency: String(offers.priceCurrency ?? "EUR"),
        inStock: String(offers.availability ?? "").includes("InStock"),
        specs: {},
      };
    });
  },
};
