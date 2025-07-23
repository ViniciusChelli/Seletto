/*
  # Sistema Google Authenticator + Notificações + Controle de Vencimento

  1. Google Authenticator
    - Geração de QR Code para TOTP
    - Validação de códigos temporais
    - Backup codes seguros

  2. Sistema de Notificações
    - Notificações de vendas expressivas
    - Alertas de recordes de produtos
    - Avisos de vencimento
    - Notificações push

  3. Controle de Vencimento
    - Produtos perecíveis
    - Alertas automáticos
    - Gestão de lotes
    - Relatórios de vencimento
*/

-- Melhorar tabela de notificações
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'general' CHECK (category IN ('sales', 'inventory', 'expiry', 'security', 'system', 'general'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Tabela para configurações de notificação por usuário
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  threshold_value numeric, -- Valor limite para disparar notificação
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Tabela para tokens de push notification
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_type text DEFAULT 'web' CHECK (device_type IN ('web', 'android', 'ios')),
  is_active boolean DEFAULT true,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Melhorar controle de vencimento
ALTER TABLE product_expiry ADD COLUMN IF NOT EXISTS alert_sent boolean DEFAULT false;
ALTER TABLE product_expiry ADD COLUMN IF NOT EXISTS days_before_expiry integer DEFAULT 3;
ALTER TABLE product_expiry ADD COLUMN IF NOT EXISTS disposal_date date;
ALTER TABLE product_expiry ADD COLUMN IF NOT EXISTS disposal_reason text;
ALTER TABLE product_expiry ADD COLUMN IF NOT EXISTS loss_amount numeric DEFAULT 0;

-- Adicionar campos de controle de vencimento aos produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_perishable'
  ) THEN
    ALTER TABLE products ADD COLUMN is_perishable boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN shelf_life_days integer; -- Vida útil em dias
    ALTER TABLE products ADD COLUMN expiry_alert_days integer DEFAULT 3; -- Dias antes do vencimento para alertar
    ALTER TABLE products ADD COLUMN requires_batch_control boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN storage_temperature text; -- Ambiente, Refrigerado, Congelado
    ALTER TABLE products ADD COLUMN storage_instructions text;
  END IF;
END $$;

-- Tabela para recordes e marcos de vendas
CREATE TABLE IF NOT EXISTS sales_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('daily_sales', 'product_sales', 'category_sales', 'monthly_revenue', 'customer_purchases')),
  reference_id uuid, -- product_id, customer_id, etc.
  reference_name text,
  milestone_value numeric NOT NULL,
  previous_record numeric,
  achieved_at timestamptz DEFAULT now(),
  notification_sent boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_milestones ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their push tokens"
  ON push_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view sales milestones"
  ON sales_milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can create sales milestones"
  ON sales_milestones FOR INSERT TO authenticated WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, is_read);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id, category);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_expiry_alert ON product_expiry(expiry_date, alert_sent);
CREATE INDEX IF NOT EXISTS idx_sales_milestones_type ON sales_milestones(type, achieved_at);

-- Função para gerar QR Code para Google Authenticator
CREATE OR REPLACE FUNCTION generate_totp_qr_data(user_email text, secret_key text)
RETURNS text AS $$
DECLARE
    issuer text := 'Minimercado Seletto';
    qr_data text;
BEGIN
    -- Formato padrão do Google Authenticator
    qr_data := 'otpauth://totp/' || 
               encode(issuer || ':' || user_email, 'escape') || 
               '?secret=' || secret_key || 
               '&issuer=' || encode(issuer, 'escape') ||
               '&algorithm=SHA1' ||
               '&digits=6' ||
               '&period=30';
    
    RETURN qr_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar produtos próximos ao vencimento
CREATE OR REPLACE FUNCTION check_expiring_products()
RETURNS void AS $$
DECLARE
    expiring_product RECORD;
    notification_title text;
    notification_message text;
    days_to_expiry integer;
BEGIN
    -- Buscar produtos próximos ao vencimento que ainda não foram alertados
    FOR expiring_product IN
        SELECT 
            pe.*,
            p.name as product_name,
            p.expiry_alert_days
        FROM product_expiry pe
        JOIN products p ON pe.product_id = p.id
        WHERE pe.status = 'active'
        AND pe.alert_sent = false
        AND pe.expiry_date <= CURRENT_DATE + INTERVAL '7 days'
        AND p.is_perishable = true
    LOOP
        days_to_expiry := expiring_product.expiry_date - CURRENT_DATE;
        
        -- Definir título e mensagem baseado nos dias restantes
        IF days_to_expiry <= 0 THEN
            notification_title := '🚨 Produto Vencido';
            notification_message := 'O produto "' || expiring_product.product_name || 
                                   '" (Lote: ' || expiring_product.batch_number || 
                                   ') venceu e deve ser retirado imediatamente.';
        ELSIF days_to_expiry <= 1 THEN
            notification_title := '⚠️ Produto Vence Hoje/Amanhã';
            notification_message := 'O produto "' || expiring_product.product_name || 
                                   '" (Lote: ' || expiring_product.batch_number || 
                                   ') vence em ' || days_to_expiry || ' dia(s).';
        ELSE
            notification_title := '📅 Produto Próximo ao Vencimento';
            notification_message := 'O produto "' || expiring_product.product_name || 
                                   '" (Lote: ' || expiring_product.batch_number || 
                                   ') vence em ' || days_to_expiry || ' dias.';
        END IF;
        
        -- Criar notificação para todos os usuários com permissão
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            category,
            priority,
            auto_generated,
            metadata
        )
        SELECT 
            ur.user_id,
            notification_title,
            notification_message,
            CASE WHEN days_to_expiry <= 0 THEN 'error' 
                 WHEN days_to_expiry <= 1 THEN 'warning' 
                 ELSE 'info' END,
            'expiry',
            CASE WHEN days_to_expiry <= 0 THEN 'urgent' 
                 WHEN days_to_expiry <= 1 THEN 'high' 
                 ELSE 'normal' END,
            true,
            jsonb_build_object(
                'product_id', expiring_product.product_id,
                'batch_number', expiring_product.batch_number,
                'expiry_date', expiring_product.expiry_date,
                'days_to_expiry', days_to_expiry,
                'quantity', expiring_product.quantity
            )
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE p.name IN ('products.expiry', 'inventory.manage')
        AND ur.is_active = true;
        
        -- Marcar como alertado
        UPDATE product_expiry 
        SET alert_sent = true 
        WHERE id = expiring_product.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para detectar recordes de vendas
CREATE OR REPLACE FUNCTION check_sales_milestones()
RETURNS void AS $$
DECLARE
    daily_sales numeric;
    previous_daily_record numeric;
    top_product RECORD;
    notification_message text;
BEGIN
    -- Verificar recorde de vendas diárias
    SELECT COALESCE(SUM(final_amount), 0) INTO daily_sales
    FROM sales 
    WHERE DATE(created_at) = CURRENT_DATE
    AND status = 'completed';
    
    -- Buscar recorde anterior
    SELECT COALESCE(MAX(milestone_value), 0) INTO previous_daily_record
    FROM sales_milestones 
    WHERE type = 'daily_sales';
    
    -- Se bateu recorde
    IF daily_sales > previous_daily_record AND daily_sales > 1000 THEN
        INSERT INTO sales_milestones (type, milestone_value, previous_record)
        VALUES ('daily_sales', daily_sales, previous_daily_record);
        
        notification_message := '🎉 Novo recorde de vendas diárias! R$ ' || 
                               daily_sales::text || ' (anterior: R$ ' || 
                               previous_daily_record::text || ')';
        
        -- Notificar gerentes e proprietários
        INSERT INTO notifications (
            user_id, title, message, type, category, priority, auto_generated, metadata
        )
        SELECT 
            ur.user_id,
            '🏆 Recorde de Vendas!',
            notification_message,
            'success',
            'sales',
            'high',
            true,
            jsonb_build_object(
                'milestone_type', 'daily_sales',
                'new_record', daily_sales,
                'previous_record', previous_daily_record
            )
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('owner', 'manager')
        AND ur.is_active = true;
    END IF;
    
    -- Verificar produto mais vendido do dia
    SELECT 
        p.id,
        p.name,
        SUM(si.quantity) as total_sold
    INTO top_product
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.created_at) = CURRENT_DATE
    AND s.status = 'completed'
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 1;
    
    -- Se vendeu mais de 50 unidades de um produto
    IF top_product.total_sold >= 50 THEN
        notification_message := '⭐ Produto destaque hoje: "' || top_product.name || 
                               '" com ' || top_product.total_sold || ' unidades vendidas!';
        
        INSERT INTO notifications (
            user_id, title, message, type, category, auto_generated, metadata
        )
        SELECT 
            ur.user_id,
            '🌟 Produto em Destaque',
            notification_message,
            'success',
            'sales',
            'normal',
            true,
            jsonb_build_object(
                'product_id', top_product.id,
                'product_name', top_product.name,
                'quantity_sold', top_product.total_sold
            )
        FROM user_roles ur
        WHERE ur.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação de venda expressiva
CREATE OR REPLACE FUNCTION check_significant_sale(sale_amount numeric)
RETURNS void AS $$
DECLARE
    avg_sale_amount numeric;
    notification_message text;
BEGIN
    -- Calcular média de vendas dos últimos 30 dias
    SELECT COALESCE(AVG(final_amount), 0) INTO avg_sale_amount
    FROM sales 
    WHERE created_at > now() - INTERVAL '30 days'
    AND status = 'completed';
    
    -- Se a venda é 3x maior que a média ou acima de R$ 500
    IF sale_amount > (avg_sale_amount * 3) OR sale_amount > 500 THEN
        notification_message := '💰 Venda expressiva realizada: R$ ' || 
                               sale_amount::text || 
                               ' (média: R$ ' || ROUND(avg_sale_amount, 2)::text || ')';
        
        -- Notificar gerentes
        INSERT INTO notifications (
            user_id, title, message, type, category, priority, auto_generated, metadata
        )
        SELECT 
            ur.user_id,
            '🎯 Venda Expressiva',
            notification_message,
            'success',
            'sales',
            'high',
            true,
            jsonb_build_object(
                'sale_amount', sale_amount,
                'average_amount', avg_sale_amount,
                'multiplier', ROUND(sale_amount / NULLIF(avg_sale_amount, 0), 2)
            )
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('owner', 'manager')
        AND ur.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para verificar vendas expressivas
CREATE OR REPLACE FUNCTION trigger_check_significant_sale()
RETURNS trigger AS $$
BEGIN
    -- Verificar apenas vendas completadas
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM check_significant_sale(NEW.final_amount);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS check_significant_sale_trigger ON sales;
CREATE TRIGGER check_significant_sale_trigger
    AFTER INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_significant_sale();

-- Função para marcar produto como vencido
CREATE OR REPLACE FUNCTION mark_product_expired(expiry_id uuid, disposal_reason_text text DEFAULT 'Vencimento')
RETURNS boolean AS $$
DECLARE
    expiry_record RECORD;
BEGIN
    -- Buscar registro de vencimento
    SELECT * INTO expiry_record FROM product_expiry WHERE id = expiry_id;
    
    IF expiry_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Marcar como vencido
    UPDATE product_expiry 
    SET 
        status = 'expired',
        disposal_date = CURRENT_DATE,
        disposal_reason = disposal_reason_text,
        loss_amount = quantity * COALESCE(cost_price, 0),
        updated_at = now()
    WHERE id = expiry_id;
    
    -- Ajustar estoque do produto
    PERFORM update_product_stock(
        expiry_record.product_id,
        -expiry_record.quantity,
        'out',
        'expiry',
        expiry_id,
        'Produto vencido - ' || disposal_reason_text
    );
    
    -- Criar notificação de perda
    INSERT INTO notifications (
        user_id, title, message, type, category, priority, auto_generated, metadata
    )
    SELECT 
        ur.user_id,
        '💸 Perda por Vencimento',
        'Produto vencido descartado: ' || expiry_record.quantity || ' unidades. Perda estimada: R$ ' || 
        COALESCE(expiry_record.loss_amount, 0)::text,
        'warning',
        'expiry',
        'normal',
        true,
        jsonb_build_object(
            'product_id', expiry_record.product_id,
            'batch_number', expiry_record.batch_number,
            'quantity_lost', expiry_record.quantity,
            'loss_amount', COALESCE(expiry_record.loss_amount, 0)
        )
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN ('owner', 'manager', 'stock_clerk')
    AND ur.is_active = true;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir preferências padrão de notificação
INSERT INTO settings (key, value, description, category, is_public) VALUES
('notifications_enabled', 'true', 'Habilitar sistema de notificações', 'notifications', true),
('expiry_check_frequency', '4', 'Frequência de verificação de vencimento (horas)', 'notifications', false),
('sales_milestone_check', 'true', 'Verificar recordes de vendas', 'notifications', true),
('significant_sale_threshold', '500', 'Valor mínimo para venda expressiva', 'notifications', false),
('significant_sale_multiplier', '3', 'Multiplicador da média para venda expressiva', 'notifications', false),
('expiry_alert_days_default', '3', 'Dias padrão para alerta de vencimento', 'inventory', true),
('auto_mark_expired', 'false', 'Marcar automaticamente produtos vencidos', 'inventory', false),
('push_notifications_enabled', 'true', 'Habilitar notificações push', 'notifications', true)
ON CONFLICT (key) DO NOTHING;

-- Inserir preferências padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
    -- Inserir preferências padrão para o novo usuário
    INSERT INTO notification_preferences (user_id, category, enabled, email_enabled, push_enabled, threshold_value) VALUES
    (NEW.id, 'sales', true, true, true, 500),
    (NEW.id, 'inventory', true, true, true, 5),
    (NEW.id, 'expiry', true, true, true, 3),
    (NEW.id, 'security', true, true, true, null),
    (NEW.id, 'system', true, true, false, null)
    ON CONFLICT (user_id, category) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar preferências padrão
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Função para executar verificações periódicas
CREATE OR REPLACE FUNCTION run_periodic_checks()
RETURNS void AS $$
BEGIN
    -- Verificar produtos vencendo
    PERFORM check_expiring_products();
    
    -- Verificar recordes de vendas
    PERFORM check_sales_milestones();
    
    -- Log da execução
    INSERT INTO activity_logs (user_id, action, entity_type, details)
    VALUES (
        NULL,
        'periodic_checks_executed',
        'system',
        jsonb_build_object('execution_time', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar permissões para notificações
INSERT INTO permissions (name, display_name, description, module, action) VALUES
('notifications.view', 'Ver Notificações', 'Visualizar notificações do sistema', 'notifications', 'read'),
('notifications.manage', 'Gerenciar Notificações', 'Configurar preferências de notificação', 'notifications', 'manage'),
('expiry.manage', 'Gerenciar Vencimentos', 'Controlar produtos vencidos', 'expiry', 'manage'),
('expiry.dispose', 'Descartar Produtos', 'Marcar produtos como descartados', 'expiry', 'dispose')
ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões às funções
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'owner'
AND p.name LIKE 'notifications.%' OR p.name LIKE 'expiry.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('manager', 'stock_clerk')
AND p.name IN ('notifications.view', 'expiry.manage', 'expiry.dispose')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();