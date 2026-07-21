-- Seed data so the frontend works end-to-end before the scraper has run.

INSERT INTO categories (slug, name, icon)
VALUES ('telefona', 'Telefona', 'smartphone'),
       ('laptope', 'Laptopë', 'laptop'),
       ('televizore', 'Televizorë', 'tv'),
       ('pajisje-shtepiake', 'Pajisje Shtëpiake', 'washing-machine');

INSERT INTO providers (slug, name, website_url)
VALUES ('gjirafa50', 'Gjirafa50', 'https://gjirafa50.com'),
       ('foleja', 'Foleja', 'https://www.foleja.com'),
       ('neptun', 'Neptun', 'https://www.neptun-ks.com');

INSERT INTO products (category_id, provider_id, name, brand, image_url, product_url, current_price, in_stock, specs)
VALUES
-- Telefona
((SELECT id FROM categories WHERE slug = 'telefona'), (SELECT id FROM providers WHERE slug = 'gjirafa50'),
 'iPhone 15 128GB', 'Apple', NULL, 'https://gjirafa50.com/iphone-15-128gb', 799.00, TRUE,
 '{"Memorja": "128 GB", "RAM": "6 GB", "Ekrani": "6.1\"", "Kamera": "48 MP", "Bateria": "3349 mAh"}'),
((SELECT id FROM categories WHERE slug = 'telefona'), (SELECT id FROM providers WHERE slug = 'foleja'),
 'iPhone 15 128GB', 'Apple', NULL, 'https://www.foleja.com/iphone-15-128gb', 819.00, TRUE,
 '{"Memorja": "128 GB", "RAM": "6 GB", "Ekrani": "6.1\"", "Kamera": "48 MP", "Bateria": "3349 mAh"}'),
((SELECT id FROM categories WHERE slug = 'telefona'), (SELECT id FROM providers WHERE slug = 'gjirafa50'),
 'Samsung Galaxy S24 256GB', 'Samsung', NULL, 'https://gjirafa50.com/samsung-galaxy-s24-256gb', 749.00, TRUE,
 '{"Memorja": "256 GB", "RAM": "8 GB", "Ekrani": "6.2\"", "Kamera": "50 MP", "Bateria": "4000 mAh"}'),
((SELECT id FROM categories WHERE slug = 'telefona'), (SELECT id FROM providers WHERE slug = 'neptun'),
 'Samsung Galaxy S24 256GB', 'Samsung', NULL, 'https://www.neptun-ks.com/samsung-galaxy-s24-256gb', 769.00, FALSE,
 '{"Memorja": "256 GB", "RAM": "8 GB", "Ekrani": "6.2\"", "Kamera": "50 MP", "Bateria": "4000 mAh"}'),
((SELECT id FROM categories WHERE slug = 'telefona'), (SELECT id FROM providers WHERE slug = 'foleja'),
 'Xiaomi Redmi Note 13 Pro 256GB', 'Xiaomi', NULL, 'https://www.foleja.com/xiaomi-redmi-note-13-pro', 299.00, TRUE,
 '{"Memorja": "256 GB", "RAM": "8 GB", "Ekrani": "6.67\"", "Kamera": "200 MP", "Bateria": "5100 mAh"}'),
-- Laptopë
((SELECT id FROM categories WHERE slug = 'laptope'), (SELECT id FROM providers WHERE slug = 'gjirafa50'),
 'MacBook Air 13 M3 256GB', 'Apple', NULL, 'https://gjirafa50.com/macbook-air-13-m3', 1249.00, TRUE,
 '{"Procesori": "Apple M3", "RAM": "8 GB", "Disku": "256 GB SSD", "Ekrani": "13.6\""}'),
((SELECT id FROM categories WHERE slug = 'laptope'), (SELECT id FROM providers WHERE slug = 'neptun'),
 'Lenovo IdeaPad Slim 5', 'Lenovo', NULL, 'https://www.neptun-ks.com/lenovo-ideapad-slim-5', 649.00, TRUE,
 '{"Procesori": "Ryzen 7 7730U", "RAM": "16 GB", "Disku": "512 GB SSD", "Ekrani": "14\""}'),
((SELECT id FROM categories WHERE slug = 'laptope'), (SELECT id FROM providers WHERE slug = 'foleja'),
 'ASUS Vivobook 15', 'ASUS', NULL, 'https://www.foleja.com/asus-vivobook-15', 499.00, TRUE,
 '{"Procesori": "Core i5-1235U", "RAM": "8 GB", "Disku": "512 GB SSD", "Ekrani": "15.6\""}'),
-- Televizorë
((SELECT id FROM categories WHERE slug = 'televizore'), (SELECT id FROM providers WHERE slug = 'neptun'),
 'Samsung 55" Crystal UHD 4K', 'Samsung', NULL, 'https://www.neptun-ks.com/samsung-55-crystal-uhd', 479.00, TRUE,
 '{"Ekrani": "55\"", "Rezolucioni": "4K UHD", "Smart TV": "Po", "HDMI": "3"}'),
((SELECT id FROM categories WHERE slug = 'televizore'), (SELECT id FROM providers WHERE slug = 'gjirafa50'),
 'LG 50" UHD 4K', 'LG', NULL, 'https://gjirafa50.com/lg-50-uhd-4k', 399.00, TRUE,
 '{"Ekrani": "50\"", "Rezolucioni": "4K UHD", "Smart TV": "Po", "HDMI": "3"}'),
-- Pajisje Shtëpiake
((SELECT id FROM categories WHERE slug = 'pajisje-shtepiake'), (SELECT id FROM providers WHERE slug = 'foleja'),
 'Beko Lavatriçe 8kg', 'Beko', NULL, 'https://www.foleja.com/beko-lavatrice-8kg', 349.00, TRUE,
 '{"Kapaciteti": "8 kg", "Rrotullime": "1200 rpm", "Klasa energjetike": "A"}');

-- A bit of price history so charts/price-drop info have data
INSERT INTO price_history (product_id, price, in_stock, scraped_at)
SELECT id, current_price + 30, TRUE, now() - INTERVAL '14 days' FROM products;
INSERT INTO price_history (product_id, price, in_stock, scraped_at)
SELECT id, current_price + 10, TRUE, now() - INTERVAL '7 days' FROM products;
INSERT INTO price_history (product_id, price, in_stock, scraped_at)
SELECT id, current_price, in_stock, now() FROM products;
