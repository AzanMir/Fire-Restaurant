-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deduct inventory when order is completed. This is deliberately defensive:
-- the application validates stock before placing/completing an order, and this
-- function repeats the check while holding ingredient row locks so concurrent
-- completions cannot oversell the same stock.
CREATE OR REPLACE FUNCTION deduct_inventory_for_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_missing_recipes TEXT;
  v_shortages TEXT;
BEGIN
  -- Do not deduct stock twice if a completed order is saved again.
  IF EXISTS (
    SELECT 1 FROM inventory
    WHERE reference_id = p_order_id AND type = 'usage'
  ) THEN
    RETURN;
  END IF;

  SELECT string_agg(menu_item.name, ', ')
  INTO v_missing_recipes
  FROM order_items order_item
  JOIN menu_items menu_item ON menu_item.id = order_item.menu_item_id
  WHERE order_item.order_id = p_order_id
    AND NOT EXISTS (
      SELECT 1
      FROM recipes recipe
      JOIN recipe_items recipe_item ON recipe_item.recipe_id = recipe.id
      WHERE recipe.menu_item_id = order_item.menu_item_id
    );

  IF v_missing_recipes IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot complete order: missing recipe for %', v_missing_recipes;
  END IF;

  -- Lock every affected ingredient before comparing stock quantities.
  PERFORM 1
  FROM ingredients ingredient
  WHERE ingredient.id IN (
    SELECT recipe_item.ingredient_id
    FROM order_items order_item
    JOIN recipes recipe ON recipe.menu_item_id = order_item.menu_item_id
    JOIN recipe_items recipe_item ON recipe_item.recipe_id = recipe.id
    WHERE order_item.order_id = p_order_id
  )
  ORDER BY ingredient.id
  FOR UPDATE;

  SELECT string_agg(
    format('%s: need %s %s, have %s %s', name, required, unit, current_stock, unit),
    '; '
  )
  INTO v_shortages
  FROM (
    SELECT
      ingredient.name,
      ingredient.unit,
      ingredient.current_stock,
      SUM(recipe_item.quantity * order_item.quantity) AS required
    FROM order_items order_item
    JOIN recipes recipe ON recipe.menu_item_id = order_item.menu_item_id
    JOIN recipe_items recipe_item ON recipe_item.recipe_id = recipe.id
    JOIN ingredients ingredient ON ingredient.id = recipe_item.ingredient_id
    WHERE order_item.order_id = p_order_id
    GROUP BY ingredient.id, ingredient.name, ingredient.unit, ingredient.current_stock
    HAVING ingredient.current_stock < SUM(recipe_item.quantity * order_item.quantity)
  ) shortages;

  IF v_shortages IS NOT NULL THEN
    RAISE EXCEPTION 'Insufficient inventory: %', v_shortages;
  END IF;

  UPDATE ingredients ingredient
  SET current_stock = ingredient.current_stock - required.required
  FROM (
    SELECT recipe_item.ingredient_id, SUM(recipe_item.quantity * order_item.quantity) AS required
    FROM order_items order_item
    JOIN recipes recipe ON recipe.menu_item_id = order_item.menu_item_id
    JOIN recipe_items recipe_item ON recipe_item.recipe_id = recipe.id
    WHERE order_item.order_id = p_order_id
    GROUP BY recipe_item.ingredient_id
  ) required
  WHERE ingredient.id = required.ingredient_id;

  INSERT INTO inventory (ingredient_id, type, quantity, note, reference_id)
  SELECT
    recipe_item.ingredient_id,
    'usage',
    SUM(recipe_item.quantity * order_item.quantity),
    'Order deduction',
    p_order_id
  FROM order_items order_item
  JOIN recipes recipe ON recipe.menu_item_id = order_item.menu_item_id
  JOIN recipe_items recipe_item ON recipe_item.recipe_id = recipe.id
  WHERE order_item.order_id = p_order_id
  GROUP BY recipe_item.ingredient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record sale when order completes
CREATE OR REPLACE FUNCTION record_sale_for_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order.status = 'Completed' THEN
    INSERT INTO sales (order_id, date, total, tax, discount, payment_method)
    VALUES (
      p_order_id,
      DATE(v_order.updated_at),
      v_order.total,
      v_order.tax,
      v_order.discount,
      v_order.payment_method
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'today_orders',       (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = v_today),
    'today_sales',        (SELECT COALESCE(SUM(total),0) FROM sales WHERE date = v_today),
    'pending_orders',     (SELECT COUNT(*) FROM orders WHERE status = 'Pending'),
    'completed_orders',   (SELECT COUNT(*) FROM orders WHERE status = 'Completed' AND DATE(created_at) = v_today),
    'low_stock_count',    (SELECT COUNT(*) FROM ingredients WHERE current_stock <= minimum_stock AND is_active = TRUE),
    'month_revenue',      (SELECT COALESCE(SUM(total),0) FROM sales WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', v_today)),
    'total_menu_items',   (SELECT COUNT(*) FROM menu_items WHERE is_active = TRUE),
    'total_staff',        (SELECT COUNT(*) FROM profiles WHERE role = 'staff' AND is_active = TRUE)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get sales by date range
CREATE OR REPLACE FUNCTION get_sales_summary(p_start DATE, p_end DATE)
RETURNS TABLE(
  sale_date DATE,
  total_sales NUMERIC,
  total_tax NUMERIC,
  total_discount NUMERIC,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.date AS sale_date,
    COALESCE(SUM(s.total), 0) AS total_sales,
    COALESCE(SUM(s.tax), 0) AS total_tax,
    COALESCE(SUM(s.discount), 0) AS total_discount,
    COUNT(*) AS order_count
  FROM sales s
  WHERE s.date BETWEEN p_start AND p_end
  GROUP BY s.date
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get best-selling items
CREATE OR REPLACE FUNCTION get_best_selling_items(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  menu_item_id UUID,
  item_name TEXT,
  total_quantity BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.menu_item_id,
    oi.name AS item_name,
    SUM(oi.quantity)::BIGINT AS total_quantity,
    SUM(oi.subtotal) AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'Completed'
  GROUP BY oi.menu_item_id, oi.name
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle new user profile creation
--
-- SECURITY DEFINER switches the *role* but NOT the search_path. GoTrue inserts
-- into auth.users as `supabase_auth_admin`, whose search_path does not
-- necessarily include `public` -- an unqualified `profiles` then fails with
-- "relation profiles does not exist", which GoTrue surfaces to the client as
-- a 500 "Database error saving new user". Hence the explicit search_path and
-- the fully-qualified table name.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
