# Krahaso

Price-comparison webapp for the Kosovo market. Compare electronics prices across local retailers.

## Architecture

```
frontend/   Next.js (App Router) + TypeScript + shadcn/ui  — the website
backend/    Spring Boot (Java 21) — REST API, business logic, owns the DB schema (Flyway)
scraper/    Node.js + TypeScript — independent worker that scrapes retailer sites
```

All three services share a single **PostgreSQL** database (the only integration point
between backend and scraper). **Redis** is used by the scraper (BullMQ job queue) and
by the backend (response caching).

```
Next.js frontend ──REST──▶ Spring Boot API ──▶ PostgreSQL ◀── Node.js scraper
                                    │                              │
                                    └────────▶ Redis ◀─────────────┘
                                             (cache)            (queue)
```

## Prerequisites

- Docker (for PostgreSQL + Redis)
- Java 21
- Node.js 20+

## Running locally

### 1. Start infrastructure

```bash
docker compose up -d
```

- PostgreSQL 16 on `localhost:5433` (db `krahaso`, user `krahaso`, password `krahaso`)
- Redis 7 on `localhost:6379`

### 2. Start the backend (runs Flyway migrations + seed data automatically)

```bash
cd backend
./mvnw spring-boot:run
```

API available at `http://localhost:8080/api`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Site available at `http://localhost:3000`.

### 4. Run the scraper (optional — seed data already exists)

```bash
cd scraper
npm install
npm run scrape:once   # single scrape cycle
npm run start         # scheduled mode (cron + queue)
```

## Notes

- The backend **owns the database schema** — all migrations live in
  `backend/src/main/resources/db/migration` (Flyway). The scraper only reads/writes
  rows in existing tables.
- Price history only records rows when a price/availability actually changes, which
  provides price-drop tracking for free.
- TimescaleDB (Postgres extension for time-series data) is deliberately deferred —
  add it to the `price_history` table when row counts grow large.
