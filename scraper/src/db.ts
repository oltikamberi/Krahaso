import pg from "pg";
import { config } from "./config.js";
import { extractIdentitySpecs, matchKey } from "./normalize.js";
import type { ScrapedProduct, SiteAdapter } from "./types.js";

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

function mergedSpecs(product: ScrapedProduct): Record<string, string | number | boolean> {
  const fromTitle = extractIdentitySpecs(product.name, product.brand);
  // Explicit scraper specs win over title heuristics
  return { ...fromTitle, ...product.specs };
}

export async function ensureProvider(
  provider: SiteAdapter["provider"],
): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO providers (slug, name, website_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [provider.slug, provider.name, provider.websiteUrl],
  );
  return result.rows[0].id;
}

async function categoryId(slug: string): Promise<number | null> {
  const result = await pool.query<{ id: number }>(
    "SELECT id FROM categories WHERE slug = $1",
    [slug],
  );
  return result.rows[0]?.id ?? null;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  priceChanges: number;
  skipped: number;
  skippedOutOfStock: number;
}

export async function upsertProducts(
  providerId: number,
  products: ScrapedProduct[],
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    updated: 0,
    priceChanges: 0,
    skipped: 0,
    skippedOutOfStock: 0,
  };

  for (const product of products) {
    const catId = await categoryId(product.categorySlug);
    if (catId === null) {
      console.warn(
        `Skipping "${product.name}": unknown category "${product.categorySlug}"`,
      );
      result.skipped++;
      continue;
    }

    const key = matchKey(product.name, product.brand);
    const specs = mergedSpecs(product);

    const existing = await pool.query<{
      id: number;
      current_price: string;
      in_stock: boolean;
    }>(
      "SELECT id, current_price, in_stock FROM products WHERE provider_id = $1 AND product_url = $2",
      [providerId, product.productUrl],
    );

    if (existing.rows.length === 0) {
      // Don't seed the catalog with products that are already out of stock
      if (!product.inStock) {
        result.skippedOutOfStock++;
        continue;
      }

      const inserted = await pool.query<{ id: number }>(
        `INSERT INTO products
           (category_id, provider_id, external_id, name, brand, image_url,
            product_url, current_price, currency, in_stock, specs, match_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          catId,
          providerId,
          product.externalId,
          product.name,
          product.brand,
          product.imageUrl,
          product.productUrl,
          product.price,
          product.currency,
          product.inStock,
          JSON.stringify(specs),
          key,
        ],
      );
      await pool.query(
        "INSERT INTO price_history (product_id, price, in_stock) VALUES ($1, $2, $3)",
        [inserted.rows[0].id, product.price, product.inStock],
      );
      result.inserted++;
      result.priceChanges++;
      continue;
    }

    const row = existing.rows[0];
    const priceChanged =
      Number(row.current_price) !== product.price ||
      row.in_stock !== product.inStock;

    await pool.query(
      `UPDATE products
       SET name = $1, brand = $2, image_url = $3, current_price = $4,
           currency = $5, in_stock = $6, specs = $7, match_key = $8, updated_at = now()
       WHERE id = $9`,
      [
        product.name,
        product.brand,
        product.imageUrl,
        product.price,
        product.currency,
        product.inStock,
        JSON.stringify(specs),
        key,
        row.id,
      ],
    );
    result.updated++;

    if (priceChanged) {
      await pool.query(
        "INSERT INTO price_history (product_id, price, in_stock) VALUES ($1, $2, $3)",
        [row.id, product.price, product.inStock],
      );
      result.priceChanges++;
    }
  }

  return result;
}

/**
 * After a full scrape for a provider, mark in-stock products that were not seen
 * as out of stock (delisted / removed from category pages).
 * Skips the update when the scrape looks incomplete vs current catalog size.
 */
export async function markMissingOutOfStock(
  providerId: number,
  seenUrls: string[],
): Promise<number> {
  if (seenUrls.length === 0) {
    console.warn("Skipping mark-missing: scrape returned 0 products");
    return 0;
  }

  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products WHERE provider_id = $1 AND in_stock = true",
    [providerId],
  );
  const inStockCount = Number(countResult.rows[0]?.count ?? 0);

  // Guard against partial scrapes wiping the catalog (e.g. blocked mid-run)
  if (inStockCount > 0 && seenUrls.length < Math.max(20, inStockCount * 0.5)) {
    console.warn(
      `Skipping mark-missing: scraped ${seenUrls.length} urls vs ${inStockCount} in-stock ` +
        `(looks incomplete)`,
    );
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const marked = await client.query<{ id: number; current_price: string }>(
      `UPDATE products
       SET in_stock = false, updated_at = now()
       WHERE provider_id = $1
         AND in_stock = true
         AND NOT (product_url = ANY($2::text[]))
       RETURNING id, current_price`,
      [providerId, seenUrls],
    );

    for (const row of marked.rows) {
      await client.query(
        "INSERT INTO price_history (product_id, price, in_stock) VALUES ($1, $2, false)",
        [row.id, row.current_price],
      );
    }

    await client.query("COMMIT");
    return marked.rowCount ?? marked.rows.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
