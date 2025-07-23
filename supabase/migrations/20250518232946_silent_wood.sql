/*
  # Enhanced Features Schema Update

  1. New Tables
    - `suppliers`
      - Supplier management
      - Contact information
      - Performance metrics
    
    - `customers`
      - Customer database
      - Loyalty program
      - Purchase history
    
    - `orders`
      - Order tracking
      - Sales history
      - Customer relations
    
    - `purchase_orders`
      - Supplier orders
      - Stock management
      - Cost tracking

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  payment_terms text,
  notes text,
  status text DEFAULT 'active',
  performance_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  loyalty_points integer DEFAULT 0,
  total_purchases numeric DEFAULT 0,
  last_purchase timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  payment_status text DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id),
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  expected_delivery timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all suppliers"
  ON suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage suppliers"
  ON suppliers FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all customers"
  ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage customers"
  ON customers FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all orders"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage orders"
  ON orders FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all order items"
  ON order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage order items"
  ON order_items FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all purchase orders"
  ON purchase_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage purchase orders"
  ON purchase_orders FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all purchase order items"
  ON purchase_order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage purchase order items"
  ON purchase_order_items FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view activity logs"
  ON activity_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();