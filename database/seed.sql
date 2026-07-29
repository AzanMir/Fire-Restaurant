-- ============================================================
-- SEED DATA
-- Run AFTER schema, functions, triggers, policies.
-- Replace the admin UUID with your actual Supabase auth user ID.
-- ============================================================

-- Settings (single row)
INSERT INTO settings (restaurant_name, address, phone, email, currency, tax_percentage, opening_time, closing_time)
VALUES ('FIRE Restaurant', '123 Main Street, Karachi', '+92-300-1234567', 'info@firerestaurant.com', 'Rs.', 0.00, '09:00', '23:00')
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (name, description, is_active) VALUES
  ('Burgers',    'Juicy flame-grilled burgers',        TRUE),
  ('Pizza',      'Stone-baked artisan pizzas',          TRUE),
  ('Wraps',      'Fresh and filling wraps',             TRUE),
  ('Beverages',  'Hot and cold drinks',                 TRUE),
  ('Sides',      'Perfect accompaniments',              TRUE),
  ('Desserts',   'Sweet treats to finish your meal',   TRUE)
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, phone, email, address) VALUES
  ('Fresh Farms Co.',     '+92-300-111-0001', 'fresh@farms.pk',     '10 Industrial Area, Karachi'),
  ('Pak Dairy Supplies',  '+92-300-111-0002', 'dairy@pak.pk',       '22 Dairy Road, Lahore'),
  ('Spice World',         '+92-300-111-0003', 'spice@world.pk',     '5 Spice Market, Faisalabad'),
  ('Bakers Choice',       '+92-300-111-0004', 'bakers@choice.pk',   '8 Bakery Lane, Karachi')
ON CONFLICT DO NOTHING;

-- Ingredients
INSERT INTO ingredients (name, unit, current_stock, minimum_stock, purchase_price) VALUES
  ('Burger Bun',       'piece',  200, 50,   15.00),
  ('Chicken Patty',    'piece',  150, 30,   80.00),
  ('Beef Patty',       'piece',  100, 30,   120.00),
  ('Lettuce',          'g',     2000, 500,   0.05),
  ('Tomato',           'g',     3000, 500,   0.03),
  ('Cheese Slice',     'piece',  300, 50,   25.00),
  ('Mayonnaise',       'g',     2000, 300,   0.08),
  ('Ketchup',          'g',     2000, 300,   0.06),
  ('Pizza Dough',      'piece',   80, 20,   60.00),
  ('Tomato Sauce',     'g',     1000, 200,   0.10),
  ('Mozzarella',       'g',     2000, 400,   0.25),
  ('Wrap Tortilla',    'piece',  200, 40,   20.00),
  ('Fries',            'g',     5000, 1000,  0.04),
  ('Soft Drink Can',   'piece',  500, 100,  35.00),
  ('Mineral Water',    'piece',  300, 50,   20.00),
  ('Chocolate Sauce',  'g',      500, 100,   0.15),
  ('Vanilla Ice Cream','g',     2000, 400,   0.12)
ON CONFLICT DO NOTHING;

-- Menu Items (Burgers)
INSERT INTO menu_items (name, description, price, is_available, is_active) VALUES
  ('Classic Chicken Burger', 'Crispy chicken with lettuce, tomato and mayo', 350.00, TRUE, TRUE),
  ('Beef Smash Burger',      'Double smash patty with cheese and ketchup',   550.00, TRUE, TRUE),
  ('Zinger Burger',          'Spicy zinger chicken with special sauce',       420.00, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- One pizza dish with selectable sizes. The parent row owns its recipe; sizes
-- only control price and are recorded on the order item.
INSERT INTO menu_items (name, description, category_id, price, is_available, is_active)
SELECT 'Achari Pizza', 'Spicy achari chicken pizza with mozzarella', categories.id, 0.00, TRUE, TRUE
FROM categories
WHERE categories.name = 'Pizza'
  AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Achari Pizza');

INSERT INTO menu_item_variants (menu_item_id, name, price, sort_order)
SELECT id, size_name, size_price, sort_order
FROM menu_items
CROSS JOIN (VALUES
  ('Small', 650.00, 1),
  ('Medium', 950.00, 2),
  ('Large', 1250.00, 3),
  ('Extra Large', 1550.00, 4)
) AS sizes(size_name, size_price, sort_order)
WHERE menu_items.name = 'Achari Pizza'
ON CONFLICT (menu_item_id, name) DO NOTHING;

-- Menu Items (Beverages)
INSERT INTO menu_items (name, description, price, is_available, is_active) VALUES
  ('Soft Drink',    '330ml chilled soft drink', 120.00, TRUE, TRUE),
  ('Mineral Water', '500ml water',               80.00, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Menu Items (Sides)
INSERT INTO menu_items (name, description, price, is_available, is_active) VALUES
  ('Crispy Fries', 'Golden crispy fries with dipping sauce', 180.00, TRUE, TRUE)
ON CONFLICT DO NOTHING;
