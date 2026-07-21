export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://krahaso:krahaso@localhost:5433/krahaso",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  scrapeCron: process.env.SCRAPE_CRON ?? "0 */6 * * *",
};
