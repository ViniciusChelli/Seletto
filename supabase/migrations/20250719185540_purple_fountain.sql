/*
  # Sistema Completo de Vendas Brasileiro

  1. Novas Tabelas
    - `sales` - Registro de vendas
    - `sale_items` - Itens da venda
    - `payment_transactions` - Transações de pagamento
    - `product_expiry` - Controle de vencimento
    - `cash_register` - Controle de caixa
    - `installment_payments` - Pagamentos parcelados
    - `customer_credit` - Crédito/fiado de clientes

  2. Atualizações
    - Produtos com controle de validade
    - Sistema de pagamento brasileiro
    - Controle de caixa completo

  3. Segurança
    - RLS habilitado
    - Políticas apropriadas
*/

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  cashier_id uuid REFERENCES auth.users(id) NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  sale_type text DEFAULT 'retail' CHECK (sale_type IN ('retail', 'wholesale', 'return')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Itens da venda
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  total_price numeric NOT NULL,
  expiry_date date, -- Para controle de produtos perecíveis
  batch_number text, -- Lote do produto
  created_at timestamptz DEFAULT now()
);

-- Transações de pagamento
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'pix', 'debit_card', 'credit_card', 'credit_account', 'bank_transfer', 'check')),
  amount numeric NOT NULL,
  installments integer DEFAULT 1,
  card_brand text, -- Visa, Mastercard, etc.
  card_last_digits text,
  pix_key text,
  pix_transaction_id text,
  authorization_code text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Controle de vencimento de produtos
CREATE TABLE IF NOT EXISTS product_expiry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  expiry_date date NOT NULL,
  quantity integer NOT NULL,
  cost_price numeric,
  supplier_id uuid REFERENCES suppliers(id),
  received_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'sold', 'discarded')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Controle de caixa
CREATE TABLE IF NOT EXISTS cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid REFERENCES auth.users(id) NOT NULL,
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  total_sales numeric DEFAULT 0,
  total_cash numeric DEFAULT 0,
  total_pix numeric DEFAULT 0,
  total_cards numeric DEFAULT 0,
  total_credit numeric DEFAULT 0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes text
);

-- Pagamentos parcelados
CREATE TABLE IF NOT EXISTS installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Crédito de clientes (fiado)
CREATE TABLE IF NOT EXISTS customer_credit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES sales(id),
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'payment')), -- crédito ou pagamento
  due_date date,
  paid_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Adicionar campos aos produtos para controle de validade
DO $$
BEGIN
  -- Adicionar campos de controle de validade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_perishable'
  ) THEN
    ALTER TABLE products ADD COLUMN is_perishable boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN shelf_life_days integer; -- Vida útil em dias
    ALTER TABLE products ADD COLUMN min_days_to_expiry integer DEFAULT 3; -- Alerta de vencimento
    ALTER TABLE products ADD COLUMN requires_batch_control boolean DEFAULT false;
  END IF;

  -- Adicionar campos de margem e markup
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'markup_percentage'
  ) THEN
    ALTER TABLE products ADD COLUMN markup_percentage numeric DEFAULT 0;
    ALTER TABLE products ADD COLUMN profit_margin numeric DEFAULT 0;
    ALTER TABLE products ADD COLUMN wholesale_price numeric;
    ALTER TABLE products ADD COLUMN minimum_price numeric; -- Preço mínimo para venda
  END IF;
END $$;

-- Adicionar campos aos clientes para controle de crédito
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE customers ADD COLUMN credit_limit numeric DEFAULT 0;
    ALTER TABLE customers ADD COLUMN current_credit_balance numeric DEFAULT 0;
    ALTER TABLE customers ADD COLUMN credit_status text DEFAULT 'good' CHECK (credit_status IN ('good', 'warning', 'blocked'));
    ALTER TABLE customers ADD COLUMN cpf_cnpj text;
    ALTER TABLE customers ADD COLUMN birth_date date;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_expiry ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view all sales"
  ON sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage sales"
  ON sales FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view all sale items"
  ON sale_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage sale items"
  ON sale_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view all payment transactions"
  ON payment_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage payment transactions"
  ON payment_transactions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view product expiry"
  ON product_expiry FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage product expiry"
  ON product_expiry FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view cash register"
  ON cash_register FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their cash register"
  ON cash_register FOR ALL TO authenticated
  USING (cashier_id = auth.uid()) WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "Users can view installment payments"
  ON installment_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage installment payments"
  ON installment_payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view customer credit"
  ON customer_credit FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage customer credit"
  ON customer_credit FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale_id ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_product_expiry_product_id ON product_expiry(product_id);
CREATE INDEX IF NOT EXISTS idx_product_expiry_expiry_date ON product_expiry(expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_expiry_status ON product_expiry(status);
CREATE INDEX IF NOT EXISTS idx_cash_register_cashier_id ON cash_register(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_status ON cash_register(status);
CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_credit_customer_id ON customer_credit(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_status ON customer_credit(status);

-- Triggers para atualizar timestamps
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_expiry_updated_at
    BEFORE UPDATE ON product_expiry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de venda
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS text AS $$
DECLARE
    next_number integer;
    sale_number text;
BEGIN
    -- Pegar o próximo número sequencial do dia
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 9) AS integer)), 0) + 1
    INTO next_number
    FROM sales
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Formato: YYYYMMDD + número sequencial (4 dígitos)
    sale_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_number::text, 4, '0');
    
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular saldo de crédito do cliente
CREATE OR REPLACE FUNCTION calculate_customer_credit_balance(customer_uuid uuid)
RETURNS numeric AS $$
DECLARE
    credit_balance numeric;
BEGIN
    SELECT COALESCE(
        SUM(CASE 
            WHEN type = 'credit' THEN amount 
            WHEN type = 'payment' THEN -amount 
            ELSE 0 
        END), 0
    ) INTO credit_balance
    FROM customer_credit
    WHERE customer_id = customer_uuid
    AND status != 'cancelled';
    
    RETURN credit_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar produtos próximos ao vencimento
CREATE OR REPLACE FUNCTION get_expiring_products(days_ahead integer DEFAULT 7)
RETURNS TABLE (
    product_id uuid,
    product_name text,
    batch_number text,
    expiry_date date,
    days_to_expiry integer,
    quantity integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.product_id,
        p.name,
        pe.batch_number,
        pe.expiry_date,
        (pe.expiry_date - CURRENT_DATE)::integer as days_to_expiry,
        pe.quantity
    FROM product_expiry pe
    JOIN products p ON pe.product_id = p.id
    WHERE pe.status = 'active'
    AND pe.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    ORDER BY pe.expiry_date ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar venda
CREATE OR REPLACE FUNCTION process_sale(
    sale_data jsonb,
    items_data jsonb,
    payments_data jsonb
)
RETURNS uuid AS $$
DECLARE
    new_sale_id uuid;
    sale_number text;
    item jsonb;
    payment jsonb;
    total_amount numeric := 0;
    payment_total numeric := 0;
BEGIN
    -- Gerar número da venda
    sale_number := generate_sale_number();
    
    -- Criar a venda
    INSERT INTO sales (
        sale_number,
        customer_id,
        cashier_id,
        total_amount,
        discount_amount,
        tax_amount,
        final_amount,
        status,
        sale_type,
        notes
    ) VALUES (
        sale_number,
        (sale_data->>'customer_id')::uuid,
        auth.uid(),
        (sale_data->>'total_amount')::numeric,
        COALESCE((sale_data->>'discount_amount')::numeric, 0),
        COALESCE((sale_data->>'tax_amount')::numeric, 0),
        (sale_data->>'final_amount')::numeric,
        COALESCE(sale_data->>'status', 'completed'),
        COALESCE(sale_data->>'sale_type', 'retail'),
        sale_data->>'notes'
    ) RETURNING id INTO new_sale_id;
    
    -- Adicionar itens da venda
    FOR item IN SELECT * FROM jsonb_array_elements(items_data)
    LOOP
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            discount_amount,
            total_price,
            expiry_date,
            batch_number
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::uuid,
            (item->>'quantity')::numeric,
            (item->>'unit_price')::numeric,
            COALESCE((item->>'discount_amount')::numeric, 0),
            (item->>'total_price')::numeric,
            (item->>'expiry_date')::date,
            item->>'batch_number'
        );
        
        -- Atualizar estoque do produto
        PERFORM update_product_stock(
            (item->>'product_id')::uuid,
            -(item->>'quantity')::integer,
            'out',
            'sale',
            new_sale_id,
            'Venda: ' || sale_number
        );
    END LOOP;
    
    -- Processar pagamentos
    FOR payment IN SELECT * FROM jsonb_array_elements(payments_data)
    LOOP
        INSERT INTO payment_transactions (
            sale_id,
            payment_method,
            amount,
            installments,
            card_brand,
            card_last_digits,
            pix_key,
            pix_transaction_id,
            authorization_code,
            status
        ) VALUES (
            new_sale_id,
            payment->>'payment_method',
            (payment->>'amount')::numeric,
            COALESCE((payment->>'installments')::integer, 1),
            payment->>'card_brand',
            payment->>'card_last_digits',
            payment->>'pix_key',
            payment->>'pix_transaction_id',
            payment->>'authorization_code',
            COALESCE(payment->>'status', 'completed')
        );
        
        payment_total := payment_total + (payment->>'amount')::numeric;
    END LOOP;
    
    -- Se há crédito (fiado), criar registro
    IF payment_total < (sale_data->>'final_amount')::numeric THEN
        INSERT INTO customer_credit (
            customer_id,
            sale_id,
            amount,
            type,
            due_date,
            status
        ) VALUES (
            (sale_data->>'customer_id')::uuid,
            new_sale_id,
            (sale_data->>'final_amount')::numeric - payment_total,
            'credit',
            CURRENT_DATE + INTERVAL '30 days',
            'pending'
        );
    END IF;
    
    RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir configurações do sistema brasileiro
INSERT INTO settings (key, value, description, category, is_public) VALUES
('enable_pix_payments', 'true', 'Habilitar pagamentos via PIX', 'payment', true),
('pix_key', '""', 'Chave PIX da loja', 'payment', false),
('enable_credit_sales', 'true', 'Habilitar vendas fiado', 'payment', true),
('default_credit_days', '30', 'Prazo padrão para pagamento fiado (dias)', 'payment', true),
('tax_rate_icms', '18.0', 'Alíquota ICMS (%)', 'tax', false),
('tax_rate_pis', '1.65', 'Alíquota PIS (%)', 'tax', false),
('tax_rate_cofins', '7.6', 'Alíquota COFINS (%)', 'tax', false),
('enable_batch_control', 'true', 'Habilitar controle de lotes', 'inventory', true),
('expiry_alert_days', '7', 'Dias de antecedência para alerta de vencimento', 'inventory', true),
('enable_wholesale_prices', 'true', 'Habilitar preços de atacado', 'pricing', true),
('wholesale_min_quantity', '10', 'Quantidade mínima para preço de atacado', 'pricing', true)
ON CONFLICT (key) DO NOTHING;