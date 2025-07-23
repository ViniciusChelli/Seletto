/*
  # Comprehensive Database Schema for Minimercado Selleto

  1. New Tables
    - `currencies` - Multi-currency support
    - `categories` - Product categories management
    - `inventory_movements` - Stock movement tracking
    - `price_history` - Price change tracking
    - `customer_loyalty` - Loyalty program
    - `promotions` - Promotional campaigns
    - `sales_reports` - Generated reports storage
    - `user_sessions` - Session management
    - `notifications` - System notifications
    - `settings` - System configuration

  2. Enhanced Tables
    - Update existing tables with additional fields
    - Add proper constraints and indexes
    - Improve relationships

  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies
    - Create proper user roles
*/

-- Currencies table for multi-currency support
CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- BRL, USD, EUR, etc.
  name text NOT NULL,
  symbol text NOT NULL,
  exchange_rate numeric DEFAULT 1.0,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table for better product organization
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory movements for stock tracking
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity integer NOT NULL,
  unit_cost numeric,
  reference_type text, -- 'sale', 'purchase', 'adjustment', 'return'
  reference_id uuid, -- order_id, purchase_order_id, etc.
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Price history for tracking price changes
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric NOT NULL,
  currency_id uuid REFERENCES currencies(id),
  change_reason text,
  effective_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Customer loyalty program
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  points_earned integer DEFAULT 0,
  points_redeemed integer DEFAULT 0,
  points_balance integer DEFAULT 0,
  tier_level text DEFAULT 'bronze', -- bronze, silver, gold, platinum
  last_activity timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promotions and discounts
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
  value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  applicable_products uuid[], -- array of product IDs
  applicable_categories uuid[], -- array of category IDs
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales reports storage
CREATE TABLE IF NOT EXISTS sales_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  report_name text NOT NULL,
  parameters jsonb,
  data jsonb NOT NULL,
  file_url text,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- User sessions for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- System notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- System settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general',
  is_public boolean DEFAULT false, -- whether setting can be read by non-admin users
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing tables
DO $$
BEGIN
  -- Add currency support to products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'currency_id'
  ) THEN
    ALTER TABLE products ADD COLUMN currency_id uuid REFERENCES currencies(id);
  END IF;

  -- Add category reference to products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;

  -- Add more fields to customers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE customers ADD COLUMN date_of_birth date;
    ALTER TABLE customers ADD COLUMN gender text;
    ALTER TABLE customers ADD COLUMN preferred_contact text DEFAULT 'email';
    ALTER TABLE customers ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add more fields to orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency_id uuid REFERENCES currencies(id);
    ALTER TABLE orders ADD COLUMN tax_amount numeric DEFAULT 0;
    ALTER TABLE orders ADD COLUMN discount_amount numeric DEFAULT 0;
    ALTER TABLE orders ADD COLUMN shipping_amount numeric DEFAULT 0;
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
  END IF;

  -- Add more fields to suppliers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'website'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN website text;
    ALTER TABLE suppliers ADD COLUMN preferred_currency_id uuid REFERENCES currencies(id);
    ALTER TABLE suppliers ADD COLUMN credit_limit numeric DEFAULT 0;
    ALTER TABLE suppliers ADD COLUMN current_balance numeric DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies

-- Currencies policies
CREATE POLICY "Users can view currencies"
  ON currencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage currencies"
  ON currencies FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Categories policies
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage categories"
  ON categories FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Inventory movements policies
CREATE POLICY "Users can view inventory movements"
  ON inventory_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create inventory movements"
  ON inventory_movements FOR INSERT TO authenticated
  WITH CHECK (true);

-- Price history policies
CREATE POLICY "Users can view price history"
  ON price_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create price history"
  ON price_history FOR INSERT TO authenticated
  WITH CHECK (true);

-- Customer loyalty policies
CREATE POLICY "Users can view customer loyalty"
  ON customer_loyalty FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage customer loyalty"
  ON customer_loyalty FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Promotions policies
CREATE POLICY "Users can view promotions"
  ON promotions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage promotions"
  ON promotions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Sales reports policies
CREATE POLICY "Users can view their reports"
  ON sales_reports FOR SELECT TO authenticated
  USING (generated_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create reports"
  ON sales_reports FOR INSERT TO authenticated
  WITH CHECK (generated_by = auth.uid());

-- User sessions policies
CREATE POLICY "Users can view their sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their sessions"
  ON user_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Settings policies
CREATE POLICY "Users can view public settings"
  ON settings FOR SELECT TO authenticated
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_effective_date ON price_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_promotions_start_end_date ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_reports_generated_by ON sales_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_sales_reports_generated_at ON sales_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Add triggers for updating timestamps
CREATE TRIGGER update_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_updated_at
    BEFORE UPDATE ON customer_loyalty
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data

-- Default currency (Brazilian Real)
INSERT INTO currencies (code, name, symbol, is_default, is_active)
VALUES ('BRL', 'Real Brasileiro', 'R$', true, true)
ON CONFLICT (code) DO NOTHING;

-- Default categories
INSERT INTO categories (name, description, sort_order) VALUES
('Bebidas', 'Refrigerantes, sucos, águas e bebidas em geral', 1),
('Laticínios', 'Leite, queijos, iogurtes e derivados', 2),
('Padaria', 'Pães, bolos, biscoitos e produtos de panificação', 3),
('Hortifruti', 'Frutas, verduras e legumes frescos', 4),
('Carnes', 'Carnes bovinas, suínas, aves e peixes', 5),
('Mercearia', 'Arroz, feijão, massas e produtos secos', 6),
('Limpeza', 'Produtos de limpeza doméstica', 7),
('Higiene', 'Produtos de higiene pessoal', 8),
('Congelados', 'Produtos congelados e sorvetes', 9),
('Outros', 'Produtos diversos não categorizados', 10)
ON CONFLICT (name) DO NOTHING;

-- Default system settings
INSERT INTO settings (key, value, description, category, is_public) VALUES
('store_name', '"Minimercado Selleto"', 'Nome da loja', 'general', true),
('store_address', '"Rua Principal, 123 - Centro"', 'Endereço da loja', 'general', true),
('store_phone', '"(11) 99999-9999"', 'Telefone da loja', 'general', true),
('store_email', '"contato@selleto.com"', 'Email da loja', 'general', true),
('default_currency', '"BRL"', 'Moeda padrão do sistema', 'financial', true),
('tax_rate', '0.0', 'Taxa de imposto padrão (%)', 'financial', false),
('low_stock_threshold', '5', 'Limite para estoque baixo', 'inventory', true),
('enable_loyalty_program', 'true', 'Habilitar programa de fidelidade', 'customer', true),
('points_per_real', '1', 'Pontos por real gasto', 'customer', true),
('backup_frequency', '"daily"', 'Frequência de backup automático', 'system', false),
('session_timeout', '24', 'Timeout de sessão em horas', 'security', false)
ON CONFLICT (key) DO NOTHING;

-- Create functions for common operations

-- Function to get current stock of a product
CREATE OR REPLACE FUNCTION get_current_stock(product_uuid uuid)
RETURNS integer AS $$
DECLARE
    current_stock integer;
BEGIN
    SELECT COALESCE(
        (SELECT stock_quantity FROM products WHERE id = product_uuid),
        0
    ) INTO current_stock;
    
    RETURN current_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(
    product_uuid uuid,
    quantity_change integer,
    movement_type text,
    reference_type text DEFAULT NULL,
    reference_uuid uuid DEFAULT NULL,
    notes_text text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    current_stock integer;
    new_stock integer;
BEGIN
    -- Get current stock
    SELECT stock_quantity INTO current_stock
    FROM products WHERE id = product_uuid;
    
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Calculate new stock
    new_stock := current_stock + quantity_change;
    
    -- Prevent negative stock
    IF new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', current_stock, ABS(quantity_change);
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_quantity = new_stock,
        updated_at = now()
    WHERE id = product_uuid;
    
    -- Record inventory movement
    INSERT INTO inventory_movements (
        product_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        product_uuid,
        movement_type,
        quantity_change,
        reference_type,
        reference_uuid,
        notes_text,
        auth.uid()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate loyalty points
CREATE OR REPLACE FUNCTION calculate_loyalty_points(purchase_amount numeric)
RETURNS integer AS $$
DECLARE
    points_per_real numeric;
    calculated_points integer;
BEGIN
    -- Get points per real from settings
    SELECT (value::numeric) INTO points_per_real
    FROM settings WHERE key = 'points_per_real';
    
    IF points_per_real IS NULL THEN
        points_per_real := 1; -- Default fallback
    END IF;
    
    calculated_points := FLOOR(purchase_amount * points_per_real);
    
    RETURN calculated_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
    product_id uuid,
    product_name text,
    current_stock integer,
    min_stock integer,
    category_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock_quantity,
        COALESCE(p.min_stock_level, 5) as min_stock,
        p.category
    FROM products p
    WHERE p.is_active = true
    AND p.stock_quantity <= COALESCE(p.min_stock_level, 5)
    ORDER BY p.stock_quantity ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;