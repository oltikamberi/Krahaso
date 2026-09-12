-- Bookkeeping for polled feed URLs. `feed_url` and `schedule_minutes` already
-- exist from V7; what is missing is the state needed to poll safely.
ALTER TABLE seller_feeds
    -- When the next poll is due. Tracked explicitly rather than derived from
    -- last_synced_at, so a failing feed can be backed off instead of retried
    -- on every scheduler tick.
    ADD COLUMN next_poll_at         TIMESTAMPTZ,
    -- Last attempt, successful or not. last_synced_at only moves on success.
    ADD COLUMN last_attempt_at      TIMESTAMPTZ,
    ADD COLUMN consecutive_failures INT NOT NULL DEFAULT 0,
    -- Lets an unchanged feed skip re-parsing: hash of the last body we ingested,
    -- plus the validators needed for a conditional request.
    ADD COLUMN content_hash         TEXT,
    ADD COLUMN http_etag            TEXT,
    ADD COLUMN http_last_modified   TEXT;

CREATE INDEX idx_seller_feeds_due ON seller_feeds (next_poll_at) WHERE type = 'url';
