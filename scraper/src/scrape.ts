import { ensureProvider, upsertProducts } from "./db.js";
import type { SiteAdapter } from "./types.js";

/** Run one adapter: fetch, normalize, upsert, and log the result. */
export async function runAdapter(adapter: SiteAdapter): Promise<void> {
  const label = adapter.provider.slug;
  console.log(`[${label}] scraping...`);

  const started = Date.now();
  const providerId = await ensureProvider(adapter.provider);
  const products = await adapter.fetchProducts();
  const result = await upsertProducts(providerId, products);

  console.log(
    `[${label}] done in ${Date.now() - started}ms — ` +
      `${products.length} scraped, ${result.inserted} new, ` +
      `${result.updated} updated, ${result.priceChanges} price changes, ` +
      `${result.skipped} skipped`,
  );
}
