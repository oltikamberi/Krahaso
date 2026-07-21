-- Krahaso initial schema. The backend (Flyway) owns this schema;
-- the scraper only reads/writes rows in these tables.

CREATE TABLE categories (
    id   BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    icon TEXT
);

CREATE TABLE providers (
    id          BIGSERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    website_url TEXT NOT NULL,
    logo_url    TEXT
);

CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    category_id   BIGINT NOT NULL REFERENCES categories (id),
    provider_id   BIGINT NOT NULL REFERENCES providers (id),
    external_id   TEXT,
    name          TEXT NOT NULL,
    brand         TEXT,
    image_url     TEXT,
    product_url   TEXT NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'EUR',
    in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
    specs         JSONB NOT NULL DEFAULT '{}',
    -- Full-text search over name + brand ('simple' config works well for Albanian)
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', name || ' ' || coalesce(brand, ''))
    ) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider_id, product_url)
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_price ON products (current_price);
CREATE INDEX idx_products_search ON products USING GIN (search_vector);
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- Time-series of price changes. A row is only written when price or
-- availability actually changes (change detection lives in the scraper).
-- Candidate for the TimescaleDB extension once row counts grow large.
CREATE TABLE price_history (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    price      NUMERIC(10, 2) NOT NULL,
    in_stock   BOOLEAN NOT NULL,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_product_time ON price_history (product_id, scraped_at DESC);
