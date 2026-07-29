-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE POLICY "settings_select_all" ON settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_write_admin" ON settings
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_write_admin" ON categories
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE POLICY "suppliers_select_admin" ON suppliers
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "suppliers_write_admin" ON suppliers
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- INGREDIENTS
-- ============================================================
CREATE POLICY "ingredients_select_all" ON ingredients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ingredients_write_admin" ON ingredients
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE POLICY "inventory_select_admin" ON inventory
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "inventory_insert_all" ON inventory
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "inventory_write_admin" ON inventory
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "inventory_delete_admin" ON inventory
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE POLICY "menu_items_select_all" ON menu_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "menu_items_write_admin" ON menu_items
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- MENU ITEM VARIANTS
-- ============================================================
CREATE POLICY "menu_item_variants_select_all" ON menu_item_variants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "menu_item_variants_write_admin" ON menu_item_variants
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- RECIPES
-- ============================================================
CREATE POLICY "recipes_select_all" ON recipes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipes_write_admin" ON recipes
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- RECIPE ITEMS
-- ============================================================
CREATE POLICY "recipe_items_select_all" ON recipe_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_items_write_admin" ON recipe_items
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "orders_select_all_authenticated" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_insert_all_authenticated" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orders_update_all_authenticated" ON orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE POLICY "order_items_select_all" ON order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_insert_all" ON order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_delete_admin" ON order_items
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================
-- SALES
-- ============================================================
CREATE POLICY "sales_select_admin" ON sales
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "sales_insert_all" ON sales
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sales_write_admin" ON sales
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE POLICY "purchases_select_admin" ON purchases
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "purchases_write_admin" ON purchases
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================
-- REPORTS
-- ============================================================
CREATE POLICY "reports_select_admin" ON reports
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "reports_write_admin" ON reports
  FOR ALL USING (get_user_role() = 'admin');
