-- Widen gaming reclassification for consoles, peripherals, and furniture.

UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'gaming')
WHERE category_id IN (
    SELECT id FROM categories WHERE slug IN ('laptope', 'telefona', 'televizore', 'pajisje-shtepiake')
  )
  AND (
    lower(name) ~ 'gaming'
    OR lower(name) ~ 'playstation|play\s*station|xbox|nintendo|ps5|ps4|switch\s*oled|steam\s*deck'
    OR lower(name) ~ 'geforce\s*rtx|rtx\s*40|rtx\s*50|rtx\s*30'
    OR lower(name) ~ 'legion|loq\s|rog\s|tuf\s*gaming|predator|alienware'
    OR lower(name) ~ 'karrige\s*gaming|tavoline\s*gaming|monitor\s*gaming'
    OR lower(name) ~ 'maus\s*gaming|mouse\s*gaming|tastier[eë]?\s*gaming|kufje\s*gaming'
    OR lower(name) ~ 'pc\s*gaming|desktop\s*gaming|gaming\s*pc'
  );
