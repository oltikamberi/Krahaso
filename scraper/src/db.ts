import pg from "pg";
import { config } from "./config.js";
import type { ScrapedProduct, SiteAdapter } from "./types.js";

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

/** Insert the provider row if it doesn't exist yet, and return its id. */
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
}

/**
 * Upsert scraped products. A price_history row is only written when the
 * price or availability actually changed (or the product is new) — this is
 * the change detection that powers price-drop tracking.
 */
export async function upsertProducts(
  providerId: number,
  products: ScrapedProduct[],
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    updated: 0,
    priceChanges: 0,
    skipped: 0,
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

    const existing = await pool.query<{
      id: number;
      current_price: string;
      in_stock: boolean;
    }>(
      "SELECT id, current_price, in_stock FROM products WHERE provider_id = $1 AND product_url = $2",
      [providerId, product.productUrl],
    );

    if (existing.rows.length === 0) {
      const inserted = await pool.query<{ id: number }>(
        `INSERT INTO products
           (category_id, provider_id, external_id, name, brand, image_url,
            product_url, current_price, currency, in_stock, specs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
          JSON.stringify(product.specs),
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
           currency = $5, in_stock = $6, specs = $7, updated_at = now()
       WHERE id = $8`,
      [
        product.name,
        product.brand,
        product.imageUrl,
        product.price,
        product.currency,
        product.inStock,
        JSON.stringify(product.specs),
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
