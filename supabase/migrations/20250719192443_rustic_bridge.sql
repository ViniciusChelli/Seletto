/*
  # Sistema de Controle de Acesso Baseado em Funções (RBAC)

  1. Novas Tabelas
    - `roles` - Definição de funções do sistema
    - `permissions` - Permissões específicas
    - `role_permissions` - Relacionamento entre funções e permissões
    - `user_roles` - Funções atribuídas aos usuários
    - `access_logs` - Log de acesso às funcionalidades

  2. Funções Padrão
    - `owner` - Dono (acesso total)
    - `manager` - Gerente (quase tudo, exceto configurações críticas)
    - `cashier` - Operador de caixa (vendas e caixa)
    - `stock_clerk` - Estoquista (produtos e estoque)
    - `viewer` - Visualizador (apenas leitura)

  3. Segurança
    - RLS habilitado
    - Políticas baseadas em funções
    - Auditoria de acesso
*/

-- Tabela de funções do sistema
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0, -- Nível hierárquico (maior = mais poder)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  module text NOT NULL, -- products, sales, users, settings, etc.
  action text NOT NULL, -- create, read, update, delete, manage
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Relacionamento entre funções e permissões
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Funções atribuídas aos usuários
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  expires_at timestamptz, -- Função temporária (opcional)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Log de acesso às funcionalidades
CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  permission_name text NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  resource_id uuid, -- ID do recurso acessado (produto, venda, etc.)
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança

-- Roles - Todos podem ver, apenas admins podem gerenciar
CREATE POLICY "Users can view roles"
  ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can manage roles"
  ON roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'owner' 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'owner' 
      AND ur.is_active = true
    )
  );

-- Permissions - Todos podem ver
CREATE POLICY "Users can view permissions"
  ON permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can manage permissions"
  ON permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'owner' 
      AND ur.is_active = true
    )
  );

-- Role permissions - Todos podem ver, owners podem gerenciar
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can manage role permissions"
  ON role_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'owner' 
      AND ur.is_active = true
    )
  );

-- User roles - Usuários podem ver suas próprias funções
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('owner', 'manager') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Managers can assign roles"
  ON user_roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('owner', 'manager') 
      AND ur.is_active = true
    )
  );

-- Access logs - Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own access logs"
  ON access_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('owner', 'manager') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "System can create access logs"
  ON access_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_module ON access_logs(module);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);

-- Triggers para atualizar timestamps
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir funções padrão
INSERT INTO roles (name, display_name, description, level) VALUES
('owner', 'Proprietário', 'Acesso total ao sistema, pode gerenciar usuários e configurações', 100),
('manager', 'Gerente', 'Acesso a relatórios, vendas, produtos e fornecedores', 80),
('cashier', 'Operador de Caixa', 'Pode realizar vendas, abrir/fechar caixa e consultar produtos', 60),
('stock_clerk', 'Estoquista', 'Pode gerenciar produtos, estoque e fornecedores', 40),
('viewer', 'Visualizador', 'Apenas visualização de dados, sem permissões de edição', 20)
ON CONFLICT (name) DO NOTHING;

-- Inserir permissões do sistema
INSERT INTO permissions (name, display_name, description, module, action) VALUES
-- Dashboard
('dashboard.view', 'Ver Dashboard', 'Visualizar dashboard principal', 'dashboard', 'read'),

-- Produtos
('products.view', 'Ver Produtos', 'Visualizar lista de produtos', 'products', 'read'),
('products.create', 'Criar Produtos', 'Adicionar novos produtos', 'products', 'create'),
('products.update', 'Editar Produtos', 'Modificar produtos existentes', 'products', 'update'),
('products.delete', 'Excluir Produtos', 'Remover produtos do sistema', 'products', 'delete'),
('products.import', 'Importar Produtos', 'Importar produtos via arquivo', 'products', 'import'),
('products.expiry', 'Controle de Vencimento', 'Gerenciar vencimento de produtos', 'products', 'manage'),

-- Vendas
('sales.view', 'Ver Vendas', 'Visualizar histórico de vendas', 'sales', 'read'),
('sales.create', 'Realizar Vendas', 'Processar vendas no terminal', 'sales', 'create'),
('sales.refund', 'Estornar Vendas', 'Estornar vendas realizadas', 'sales', 'refund'),
('sales.reports', 'Relatórios de Vendas', 'Gerar relatórios de vendas', 'sales', 'reports'),

-- Caixa
('cashier.open', 'Abrir Caixa', 'Abrir caixa para operação', 'cashier', 'open'),
('cashier.close', 'Fechar Caixa', 'Fechar caixa e conferir valores', 'cashier', 'close'),
('cashier.view', 'Ver Caixa', 'Visualizar status do caixa', 'cashier', 'read'),

-- Fornecedores
('suppliers.view', 'Ver Fornecedores', 'Visualizar lista de fornecedores', 'suppliers', 'read'),
('suppliers.create', 'Criar Fornecedores', 'Adicionar novos fornecedores', 'suppliers', 'create'),
('suppliers.update', 'Editar Fornecedores', 'Modificar fornecedores existentes', 'suppliers', 'update'),
('suppliers.delete', 'Excluir Fornecedores', 'Remover fornecedores', 'suppliers', 'delete'),

-- Clientes
('customers.view', 'Ver Clientes', 'Visualizar lista de clientes', 'customers', 'read'),
('customers.create', 'Criar Clientes', 'Adicionar novos clientes', 'customers', 'create'),
('customers.update', 'Editar Clientes', 'Modificar clientes existentes', 'customers', 'update'),
('customers.credit', 'Gerenciar Crédito', 'Gerenciar crédito/fiado de clientes', 'customers', 'credit'),

-- Financeiro
('financial.view', 'Ver Financeiro', 'Visualizar dados financeiros', 'financial', 'read'),
('financial.invoices', 'Gerenciar Faturas', 'Criar e gerenciar faturas', 'financial', 'invoices'),
('financial.payments', 'Gerenciar Pagamentos', 'Processar pagamentos', 'financial', 'payments'),
('financial.expenses', 'Gerenciar Despesas', 'Controlar despesas da empresa', 'financial', 'expenses'),
('financial.reports', 'Relatórios Financeiros', 'Gerar relatórios financeiros', 'financial', 'reports'),

-- Usuários e Segurança
('users.view', 'Ver Usuários', 'Visualizar lista de usuários', 'users', 'read'),
('users.create', 'Criar Usuários', 'Adicionar novos usuários', 'users', 'create'),
('users.update', 'Editar Usuários', 'Modificar usuários existentes', 'users', 'update'),
('users.delete', 'Excluir Usuários', 'Remover usuários do sistema', 'users', 'delete'),
('users.roles', 'Gerenciar Funções', 'Atribuir funções aos usuários', 'users', 'roles'),

-- Configurações
('settings.view', 'Ver Configurações', 'Visualizar configurações do sistema', 'settings', 'read'),
('settings.update', 'Editar Configurações', 'Modificar configurações do sistema', 'settings', 'update'),
('settings.security', 'Configurações de Segurança', 'Gerenciar configurações de segurança', 'settings', 'security'),

-- Relatórios e Analytics
('reports.sales', 'Relatórios de Vendas', 'Gerar relatórios de vendas', 'reports', 'sales'),
('reports.inventory', 'Relatórios de Estoque', 'Gerar relatórios de estoque', 'reports', 'inventory'),
('reports.financial', 'Relatórios Financeiros', 'Gerar relatórios financeiros', 'reports', 'financial'),
('analytics.view', 'Ver Analytics', 'Visualizar análises e métricas', 'analytics', 'read'),

-- Ferramentas
('tools.shelf_optimizer', 'Otimizador de Prateleiras', 'Usar ferramenta de otimização', 'tools', 'optimizer'),
('tools.import', 'Importar Dados', 'Importar dados via arquivos', 'tools', 'import'),
('tools.backup', 'Backup e Restauração', 'Realizar backup dos dados', 'tools', 'backup')

ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões às funções

-- PROPRIETÁRIO - Todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- GERENTE - Quase todas, exceto gerenciamento de usuários e configurações críticas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
AND p.name NOT IN (
  'users.create', 'users.delete', 'users.roles',
  'settings.security', 'tools.backup'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- OPERADOR DE CAIXA - Vendas, caixa e consultas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'cashier'
AND p.name IN (
  'dashboard.view',
  'products.view',
  'sales.view', 'sales.create',
  'cashier.open', 'cashier.close', 'cashier.view',
  'customers.view', 'customers.create', 'customers.credit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ESTOQUISTA - Produtos, fornecedores e estoque
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'stock_clerk'
AND p.name IN (
  'dashboard.view',
  'products.view', 'products.create', 'products.update', 'products.import', 'products.expiry',
  'suppliers.view', 'suppliers.create', 'suppliers.update',
  'reports.inventory',
  'tools.import'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- VISUALIZADOR - Apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Função para verificar permissão do usuário
CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS boolean AS $$
DECLARE
    has_permission boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
        AND p.name = permission_name
        AND p.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter funções do usuário
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
    role_name text,
    role_display_name text,
    role_level integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.display_name, r.level
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND r.is_active = true
    ORDER BY r.level DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
    permission_name text,
    module text,
    action text
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.module, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND p.is_active = true
    ORDER BY p.module, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar acesso
CREATE OR REPLACE FUNCTION log_access(
    permission_name text,
    module_name text,
    action_name text,
    resource_uuid uuid DEFAULT NULL,
    success_flag boolean DEFAULT true,
    error_msg text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO access_logs (
        user_id,
        permission_name,
        module,
        action,
        resource_id,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        auth.uid(),
        permission_name,
        module_name,
        action_name,
        resource_uuid,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        success_flag,
        error_msg
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas das tabelas existentes para usar o sistema de permissões

-- Produtos - Baseado em permissões
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update their products" ON products;
DROP POLICY IF EXISTS "Users can delete their products" ON products;

CREATE POLICY "Users can view products with permission"
  ON products FOR SELECT TO authenticated
  USING (user_has_permission('products.view'));

CREATE POLICY "Users can create products with permission"
  ON products FOR INSERT TO authenticated
  WITH CHECK (user_has_permission('products.create'));

CREATE POLICY "Users can update products with permission"
  ON products FOR UPDATE TO authenticated
  USING (user_has_permission('products.update'));

CREATE POLICY "Users can delete products with permission"
  ON products FOR DELETE TO authenticated
  USING (user_has_permission('products.delete'));

-- Fornecedores - Baseado em permissões
DROP POLICY IF EXISTS "Users can view all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can manage suppliers" ON suppliers;

CREATE POLICY "Users can view suppliers with permission"
  ON suppliers FOR SELECT TO authenticated
  USING (user_has_permission('suppliers.view'));

CREATE POLICY "Users can create suppliers with permission"
  ON suppliers FOR INSERT TO authenticated
  WITH CHECK (user_has_permission('suppliers.create'));

CREATE POLICY "Users can update suppliers with permission"
  ON suppliers FOR UPDATE TO authenticated
  USING (user_has_permission('suppliers.update'));

CREATE POLICY "Users can delete suppliers with permission"
  ON suppliers FOR DELETE TO authenticated
  USING (user_has_permission('suppliers.delete'));

-- Vendas - Baseado em permissões
DROP POLICY IF EXISTS "Users can view all sales" ON sales;
DROP POLICY IF EXISTS "Users can manage sales" ON sales;

CREATE POLICY "Users can view sales with permission"
  ON sales FOR SELECT TO authenticated
  USING (user_has_permission('sales.view'));

CREATE POLICY "Users can create sales with permission"
  ON sales FOR INSERT TO authenticated
  WITH CHECK (user_has_permission('sales.create'));

CREATE POLICY "Users can update sales with permission"
  ON sales FOR UPDATE TO authenticated
  USING (user_has_permission('sales.refund'));

-- Caixa - Baseado em permissões e usuário
DROP POLICY IF EXISTS "Users can view cash register" ON cash_register;
DROP POLICY IF EXISTS "Users can manage their cash register" ON cash_register;

CREATE POLICY "Users can view cash register with permission"
  ON cash_register FOR SELECT TO authenticated
  USING (
    user_has_permission('cashier.view') OR 
    (cashier_id = auth.uid() AND user_has_permission('cashier.open'))
  );

CREATE POLICY "Users can manage cash register with permission"
  ON cash_register FOR ALL TO authenticated
  USING (
    (cashier_id = auth.uid() AND user_has_permission('cashier.open')) OR
    user_has_permission('cashier.close')
  )
  WITH CHECK (
    (cashier_id = auth.uid() AND user_has_permission('cashier.open')) OR
    user_has_permission('cashier.close')
  );

-- Configurações do sistema para controle de acesso
INSERT INTO settings (key, value, description, category, is_public) VALUES
('default_user_role', '"viewer"', 'Função padrão para novos usuários', 'security', false),
('require_role_assignment', 'true', 'Exigir atribuição de função para novos usuários', 'security', false),
('max_failed_login_attempts', '5', 'Máximo de tentativas de login falhadas', 'security', false),
('session_timeout_minutes', '480', 'Timeout de sessão em minutos (8 horas)', 'security', false),
('enable_access_logging', 'true', 'Habilitar log de acesso às funcionalidades', 'security', false),
('role_hierarchy_enabled', 'true', 'Habilitar hierarquia de funções', 'security', false)
ON CONFLICT (key) DO NOTHING;

-- Trigger para atribuir função padrão a novos usuários
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS trigger AS $$
DECLARE
    default_role_name text;
    default_role_id uuid;
BEGIN
    -- Buscar função padrão nas configurações
    SELECT value::text INTO default_role_name
    FROM settings 
    WHERE key = 'default_user_role';
    
    -- Se não encontrou, usar 'viewer'
    IF default_role_name IS NULL THEN
        default_role_name := 'viewer';
    END IF;
    
    -- Remover aspas da string JSON
    default_role_name := trim(both '"' from default_role_name);
    
    -- Buscar ID da função
    SELECT id INTO default_role_id
    FROM roles 
    WHERE name = default_role_name AND is_active = true;
    
    -- Atribuir função ao usuário
    IF default_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (NEW.id, default_role_id, NEW.id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_default_role();