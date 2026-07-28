import { pool } from "./db.js";
import { extractIdentitySpecs, matchKey } from "./normalize.js";

/**
 * Recompute match_key and backfill identity specs extracted from titles
 * so the backend merge gate has RAM/storage/CPU/model to compare.
 */
const { rows } = await pool.query<{
  id: number;
  name: string;
  brand: string | null;
  specs: Record<string, unknown> | null;
}>("SELECT id, name, brand, specs FROM products");

let updated = 0;
for (const row of rows) {
  const key = matchKey(row.name, row.brand);
  const fromTitle = extractIdentitySpecs(row.name, row.brand);
  const existing =
    row.specs && typeof row.specs === "object" && !Array.isArray(row.specs)
      ? (row.specs as Record<string, unknown>)
      : {};
  // Keep richer existing values; fill gaps from title
  const merged: Record<string, unknown> = { ...fromTitle, ...existing };
  // If existing was empty {}, prefer title-extracted
  if (Object.keys(existing).length === 0) {
    Object.assign(merged, fromTitle);
  }

  await pool.query("UPDATE products SET match_key = $1, specs = $2 WHERE id = $3", [
    key,
    JSON.stringify(merged),
    row.id,
  ]);
  updated++;
  if (updated % 500 === 0) console.log(`updated ${updated}/${rows.length}`);
}

console.log(`Recomputed match_key + specs for ${updated} products`);

const multi = await pool.query(
  `SELECT count(*)::int AS multi_store
   FROM (
     SELECT match_key FROM products
     WHERE match_key IS NOT NULL AND match_key <> '' AND match_key NOT LIKE 'weak %'
     GROUP BY match_key
     HAVING count(DISTINCT provider_id) > 1
   ) t`,
);
console.log("Strong multi-store match_keys:", multi.rows[0].multi_store);

const withSpecs = await pool.query(
  `SELECT count(*)::int AS n FROM products
   WHERE specs IS NOT NULL AND specs::text NOT IN ('{}', 'null')`,
);
console.log("Products with specs:", withSpecs.rows[0].n);

await pool.end();
