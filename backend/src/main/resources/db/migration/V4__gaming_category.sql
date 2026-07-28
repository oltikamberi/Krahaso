-- Gaming category for consoles, gaming laptops, and related gear.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 100;

UPDATE categories SET sort_order = 10 WHERE slug = 'telefona';
UPDATE categories SET sort_order = 20 WHERE slug = 'laptope';
UPDATE categories SET sort_order = 30 WHERE slug = 'gaming';
UPDATE categories SET sort_order = 40 WHERE slug = 'televizore';
UPDATE categories SET sort_order = 50 WHERE slug = 'pajisje-shtepiake';

INSERT INTO categories (slug, name, icon, sort_order)
VALUES ('gaming', 'Gaming', 'gamepad', 30)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Move clear gaming titles out of general laptop/TV/phone buckets
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'gaming')
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('laptope', 'telefona', 'televizore', 'pajisje-shtepiake'))
  AND (
    lower(name) ~ 'gaming'
    OR lower(name) ~ 'playstation|xbox|nintendo|ps5|ps4'
    OR lower(name) ~ 'geforce\s*rtx|rtx\s*40|rtx\s*50|rtx\s*30'
    OR lower(name) ~ 'legion|loq\s|rog\s|tuf\s*gaming|predator|alienware'
  );
