-- Webhook integration: sellers push price and stock updates to us.
-- `api_key_hash` already exists from V7; what is missing is the display prefix and
-- the signing secret.
ALTER TABLE seller_feeds
    -- Shown in the dashboard so a seller can recognise which key is configured.
    -- The key itself only ever exists as a hash.
    ADD COLUMN api_key_prefix     TEXT,
    -- Unlike the key, this has to be recoverable: verifying an HMAC signature
    -- means recomputing it. It is never sent in a request, only used to sign one.
    ADD COLUMN api_signing_secret TEXT;

CREATE UNIQUE INDEX idx_seller_feeds_api_key ON seller_feeds (api_key_hash)
    WHERE api_key_hash IS NOT NULL;

ALTER TABLE seller_offers
    -- Timestamp of the event that last touched this offer. Webhook calls arrive out
    -- of order, so an update older than this one is dropped instead of overwriting
    -- a newer price.
    ADD COLUMN last_event_at TIMESTAMPTZ;

-- Webhook updates address products by SKU across all of a seller's feeds
CREATE INDEX idx_seller_offers_seller_sku ON seller_offers (seller_id, sku);

-- Ledger of events we have already processed. The unique constraint is what makes
-- idempotency correct rather than merely likely: two concurrent retries of the same
-- event cannot both get through.
CREATE TABLE webhook_events (
    id          BIGSERIAL PRIMARY KEY,
    feed_id     BIGINT NOT NULL REFERENCES seller_feeds (id) ON DELETE CASCADE,
    event_id    TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (feed_id, event_id)
);

CREATE INDEX idx_webhook_events_feed_time ON webhook_events (feed_id, received_at DESC);
