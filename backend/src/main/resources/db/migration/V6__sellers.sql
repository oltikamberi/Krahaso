-- Seller accounts for the merchant-facing dashboard. Sellers register themselves
-- and start unverified; `verified` is flipped manually by an admin for now.
CREATE TABLE sellers (
    id            BIGSERIAL PRIMARY KEY,
    business_name TEXT NOT NULL,
    -- Tax ID or business registration number, as issued in Kosovo
    tax_id        TEXT NOT NULL,
    -- Stored lowercased so the unique constraint is effectively case-insensitive
    contact_email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
