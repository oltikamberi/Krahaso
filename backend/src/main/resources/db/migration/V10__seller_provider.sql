-- Each seller appears as one provider on the public comparison pages.
-- Created lazily the first time they publish a feed.
ALTER TABLE sellers
    ADD COLUMN provider_id BIGINT REFERENCES providers (id) ON DELETE SET NULL;
