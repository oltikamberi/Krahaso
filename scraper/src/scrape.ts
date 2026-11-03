import {
  ensureProvider,
  markMissingOutOfStock,
  upsertProducts,
} from "./db.js";
import type { SiteAdapter } from "./types.js";

/** Run one adapter: fetch, normalize, upsert, reconcile stock, and log. */
export async function runAdapter(adapter: SiteAdapter): Promise<void> {
  const label = adapter.provider.slug;
  console.log(`[${label}] scraping...`);

  const started = Date.now();
  const providerId = await ensureProvider(adapter.provider);
  const products = await adapter.fetchProducts();
  const result = await upsertProducts(providerId, products);

  const seenUrls = [...new Set(products.map((p) => p.productUrl))];
  const markedOos = await markMissingOutOfStock(providerId, seenUrls);

  console.log(
    `[${label}] done in ${Date.now() - started}ms — ` +
      `${products.length} scraped, ${result.inserted} new, ` +
      `${result.updated} updated, ${result.priceChanges} price changes, ` +
      `${result.skipped} skipped, ${result.skippedOutOfStock} skipped OOS, ` +
      `${markedOos} marked OOS (missing from scrape)`,
  );
}
