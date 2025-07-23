export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  module: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  role?: Role;
}

export interface AccessLog {
  id: string;
  userId?: string;
  permissionName: string;
  module: string;
  action: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export const ROLE_LEVELS = {
  OWNER: 100,
  MANAGER: 80,
  CASHIER: 60,
  STOCK_CLERK: 40,
  VIEWER: 20,
} as const;

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STOCK_CLERK: 'stock_clerk',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Produtos
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  PRODUCTS_EXPIRY: 'products.expiry',
  
  // Vendas
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_REFUND: 'sales.refund',
  SALES_REPORTS: 'sales.reports',
  
  // Caixa
  CASHIER_OPEN: 'cashier.open',
  CASHIER_CLOSE: 'cashier.close',
  CASHIER_VIEW: 'cashier.view',
  
  // Fornecedores
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',
  
  // Clientes
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_CREDIT: 'customers.credit',
  
  // Financeiro
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_INVOICES: 'financial.invoices',
  FINANCIAL_PAYMENTS: 'financial.payments',
  FINANCIAL_EXPENSES: 'financial.expenses',
  FINANCIAL_REPORTS: 'financial.reports',
  
  // Usuários
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ROLES: 'users.roles',
  
  // Configurações
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_SECURITY: 'settings.security',
  
  // Relatórios
  REPORTS_SALES: 'reports.sales',
  REPORTS_INVENTORY: 'reports.inventory',
  REPORTS_FINANCIAL: 'reports.financial',
  ANALYTICS_VIEW: 'analytics.view',
  
  // Ferramentas
  TOOLS_SHELF_OPTIMIZER: 'tools.shelf_optimizer',
  TOOLS_IMPORT: 'tools.import',
  TOOLS_BACKUP: 'tools.backup',
} as const;

export const ROLE_DESCRIPTIONS = {
  [ROLES.OWNER]: {
    title: 'Proprietário',
    description: 'Acesso total ao sistema, pode gerenciar usuários e configurações críticas',
    permissions: 'Todas as permissões',
    color: 'bg-purple-100 text-purple-800',
  },
  [ROLES.MANAGER]: {
    title: 'Gerente',
    description: 'Acesso a relatórios, vendas, produtos e fornecedores',
    permissions: 'Quase todas, exceto gerenciamento de usuários',
    color: 'bg-blue-100 text-blue-800',
  },
  [ROLES.CASHIER]: {
    title: 'Operador de Caixa',
    description: 'Pode realizar vendas, abrir/fechar caixa e consultar produtos',
    permissions: 'Vendas, caixa e consultas',
    color: 'bg-green-100 text-green-800',
  },
  [ROLES.STOCK_CLERK]: {
    title: 'Estoquista',
    description: 'Pode gerenciar produtos, estoque e fornecedores',
    permissions: 'Produtos, estoque e fornecedores',
    color: 'bg-orange-100 text-orange-800',
  },
  [ROLES.VIEWER]: {
    title: 'Visualizador',
    description: 'Apenas visualização de dados, sem permissões de edição',
    permissions: 'Somente leitura',
    color: 'bg-gray-100 text-gray-800',
  },
} as const;