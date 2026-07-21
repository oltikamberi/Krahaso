import { adapters } from "./adapters/index.js";
import { pool } from "./db.js";
import { runAdapter } from "./scrape.js";

/** Run every adapter once, directly (no queue) — useful for local testing. */
for (const adapter of adapters) {
  try {
    await runAdapter(adapter);
  } catch (error) {
    console.error(`[${adapter.provider.slug}] failed:`, error);
  }
}

await pool.end();
console.log("Scrape cycle complete");
