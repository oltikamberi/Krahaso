import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { adapters } from "./adapters/index.js";
import { config } from "./config.js";
import { runAdapter } from "./scrape.js";

const QUEUE_NAME = "krahaso-scrape";

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const scrapeQueue = new Queue(QUEUE_NAME, { connection });

/** Enqueue one job per adapter (each retailer scraped independently). */
export async function enqueueAllAdapters(): Promise<void> {
  for (const adapter of adapters) {
    await scrapeQueue.add(
      adapter.provider.slug,
      { providerSlug: adapter.provider.slug },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }
  console.log(`Enqueued ${adapters.length} scrape job(s)`);
}

/** Process scrape jobs one at a time (be polite to the target sites). */
export function startWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const adapter = adapters.find(
        (entry) => entry.provider.slug === job.data.providerSlug,
      );
      if (!adapter) {
        throw new Error(`Unknown adapter: ${job.data.providerSlug}`);
      }
      await runAdapter(adapter);
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, error) => {
    console.error(`Job ${job?.name} failed:`, error.message);
  });

  return worker;
}
