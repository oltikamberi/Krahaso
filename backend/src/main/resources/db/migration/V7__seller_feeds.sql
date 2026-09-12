-- Seller-supplied product feeds. All three integration types (file upload, polled
-- URL, webhook/API) share this table and the same ingestion pipeline; the columns
-- for the later types are nullable until those phases are wired up.
CREATE TABLE seller_feeds (
    id               BIGSERIAL PRIMARY KEY,
    seller_id        BIGINT NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
    type             TEXT NOT NULL CHECK (type IN ('upload', 'url', 'api')),
    label            TEXT,
    -- type = 'url': where to poll, and how often
    feed_url         TEXT,
    schedule_minutes INT,
    -- type = 'api': hashed key, never stored in plaintext
    api_key_hash     TEXT,
    status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'pending_review', 'live', 'disabled')),
    last_synced_at   TIMESTAMPTZ,
    last_status      TEXT CHECK (last_status IN ('ok', 'partial', 'failed')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seller_feeds_seller ON seller_feeds (seller_id);

-- One row per ingestion attempt, whatever the source was.
CREATE TABLE feed_sync_logs (
    id             BIGSERIAL PRIMARY KEY,
    feed_id        BIGINT NOT NULL REFERENCES seller_feeds (id) ON DELETE CASCADE,
    -- Object storage key for uploads, the URL for polled feeds
    source_ref     TEXT,
    state          TEXT NOT NULL DEFAULT 'parsing'
                   CHECK (state IN ('parsing', 'parsed', 'applied', 'failed', 'discarded')),
    rows_processed INT NOT NULL DEFAULT 0,
    rows_failed    INT NOT NULL DEFAULT 0,
    error_summary  TEXT,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ
);

CREATE INDEX idx_feed_sync_logs_feed_time ON feed_sync_logs (feed_id, started_at DESC);

-- Parsed rows are staged here so the seller can preview them before the feed goes
-- live. Rows that failed validation keep their error message for the preview.
CREATE TABLE feed_staging_rows (
    id            BIGSERIAL PRIMARY KEY,
    sync_id       BIGINT NOT NULL REFERENCES feed_sync_logs (id) ON DELETE CASCADE,
    row_number    INT NOT NULL,
    sku           TEXT,
    name          TEXT,
    brand         TEXT,
    category_id   BIGINT REFERENCES categories (id),
    -- The seller's own category text, kept even when it maps to nothing we know
    raw_category  TEXT,
    price         NUMERIC(10, 2),
    currency      TEXT,
    in_stock      BOOLEAN,
    availability  TEXT,
    product_url   TEXT,
    image_url     TEXT,
    error         TEXT
);

CREATE INDEX idx_feed_staging_rows_sync ON feed_staging_rows (sync_id, row_number);

-- Live seller offers. Deliberately separate from `products` (the scraped public
-- catalog) — nothing here is surfaced on the public comparison pages yet.
CREATE TABLE seller_offers (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
    feed_id         BIGINT NOT NULL REFERENCES seller_feeds (id) ON DELETE CASCADE,
    -- Which sync, and which row inside it, produced the current values
    source_sync_id  BIGINT REFERENCES feed_sync_logs (id) ON DELETE SET NULL,
    source_row      INT,
    sku             TEXT,
    name            TEXT NOT NULL,
    brand           TEXT,
    category_id     BIGINT REFERENCES categories (id),
    raw_category    TEXT,
    price           NUMERIC(10, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'EUR',
    in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
    availability    TEXT,
    product_url     TEXT NOT NULL,
    image_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (feed_id, product_url)
);

CREATE INDEX idx_seller_offers_seller ON seller_offers (seller_id);
CREATE INDEX idx_seller_offers_feed ON seller_offers (feed_id);
