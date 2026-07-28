import { neptunAdapter } from "./adapters/neptun.js";
import { pool } from "./db.js";
import { runAdapter } from "./scrape.js";

await runAdapter(neptunAdapter);
await pool.end();
