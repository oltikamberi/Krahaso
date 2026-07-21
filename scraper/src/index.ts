import cron from "node-cron";
import { config } from "./config.js";
import { enqueueAllAdapters, startWorker } from "./queue.js";

/**
 * Scheduled mode: a BullMQ worker processes scrape jobs, and a cron schedule
 * enqueues a job per adapter (default: every 6 hours, see SCRAPE_CRON).
 */
startWorker();
console.log("Scrape worker started");

cron.schedule(config.scrapeCron, () => {
  void enqueueAllAdapters();
});
console.log(`Cron schedule active: ${config.scrapeCron}`);

// Also run once at startup so a fresh deployment gets data immediately.
void enqueueAllAdapters();
