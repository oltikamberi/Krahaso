-- Fingerprint used to group the same product across retailers into one card.
ALTER TABLE products ADD COLUMN IF NOT EXISTS match_key TEXT;

CREATE INDEX IF NOT EXISTS idx_products_match_key ON products (match_key);

-- Backfill existing rows with a simple lowercase normalized name
UPDATE products
SET match_key = lower(regexp_replace(coalesce(brand, '') || ' ' || name, '[^a-zA-Z0-9]+', ' ', 'g'))
WHERE match_key IS NULL OR match_key = '';
