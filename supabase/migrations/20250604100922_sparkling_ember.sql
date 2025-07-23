/*
  # Financial Management Integration

  1. New Tables
    - `invoices`
      - Track customer invoices
      - Payment status
      - Due dates
    
    - `payments`
      - Payment records
      - Multiple payment methods
      - Transaction tracking
    
    - `expenses`
      - Expense tracking
      - Categorization
      - Budget management

  2. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  invoice_number text NOT NULL UNIQUE,
  total_amount numeric NOT NULL,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  due_date timestamptz NOT NULL,
  payment_status text DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id),
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamptz NOT NULL,
  transaction_id text,
  status text DEFAULT 'completed',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamptz NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  receipt_url text,
  status text DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all invoices"
  ON invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage invoices"
  ON invoices FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all payments"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage payments"
  ON payments FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view all expenses"
  ON expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage expenses"
  ON expenses FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON expenses(supplier_id);

-- Add triggers for updating timestamps
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();