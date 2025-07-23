import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard,
  ShoppingBasket,
  ShoppingCart,
  Calculator,
  Calendar,
  Truck,
  Upload, 
  BarChart3,
  Users,
  Settings,
  Shield,
  Gift,
  HelpCircle,
  Smartphone,
  ArrowRightLeft,
  TrendingDown,
  Package2,
  RotateCcw,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../Auth/PermissionGuard';
import RoleGuard from '../Auth/RoleGuard';
import toast from 'react-hot-toast';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center px-4 py-3 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100"
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-primary-500 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user, hasPermission } = useAuth();
  
  const handleUsersClick = () => {
    toast.success('Funcionalidade de usuários será implementada em breve');
  };

  const handleSettingsClick = () => {
    toast.success('Funcionalidade de configurações será implementada em breve');
  };

  const handleHelpClick = () => {
    toast.success('Funcionalidade de ajuda será implementada em breve');
  };
  
  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src="/selleto-icon.svg"
                alt="Selleto Logo"
                className="h-8 w-8 mr-2"
              />
              <span className="text-xl font-semibold text-primary-500">
                Seletto
              </span>
            </div>
            <button
              type="button"
              className="lg:hidden text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={() => setOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <nav className="space-y-1">
              <PermissionGuard permission="dashboard.view" showError={false}>
                <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              </PermissionGuard>
              
              <PermissionGuard permission="sales.create" showError={false}>
                <NavItem to="/sales" icon={<ShoppingCart size={20} />} label="Terminal de Vendas" />
              </PermissionGuard>
              
              <PermissionGuard permission="cashier.view" showError={false}>
                <NavItem to="/cash-register" icon={<Calculator size={20} />} label="Controle de Caixa" />
              </PermissionGuard>
              
              <PermissionGuard permission="products.view" showError={false}>
                <NavItem to="/products" icon={<ShoppingBasket size={20} />} label="Produtos" />
              </PermissionGuard>
              
              <PermissionGuard permission="products.expiry" showError={false}>
                <NavItem to="/products/expiry" icon={<Calendar size={20} />} label="Controle de Vencimento" />
              </PermissionGuard>
              
              <PermissionGuard permission="suppliers.view" showError={false}>
                <NavItem to="/suppliers" icon={<Truck size={20} />} label="Fornecedores" />
              </PermissionGuard>
              
              <PermissionGuard permission="tools.import" showError={false}>
                <NavItem to="/upload" icon={<Upload size={20} />} label="Importar Dados" />
              </PermissionGuard>
              
              <PermissionGuard permission="tools.shelf_optimizer" showError={false}>
                <NavItem to="/shelf-optimizer" icon={<BarChart3 size={20} />} label="Otimizador de Prateleiras" />
              </PermissionGuard>
              
              <PermissionGuard permission="promotions.view" showError={false}>
                <NavItem to="/promotions" icon={<Gift size={20} />} label="Promoções" />
              </PermissionGuard>
              
              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Controle Avançado
                </h3>
              </div>
              
              <PermissionGuard permission="inventory.count" showError={false}>
                <NavItem to="/inventory/mobile" icon={<Smartphone size={20} />} label="Inventário Mobile" />
              </PermissionGuard>
              
              <PermissionGuard permission="transfers.view" showError={false}>
                <NavItem to="/inventory/transfers" icon={<ArrowRightLeft size={20} />} label="Transferências" />
              </PermissionGuard>
              
              <PermissionGuard permission="losses.view" showError={false}>
                <NavItem to="/inventory/losses" icon={<TrendingDown size={20} />} label="Controle de Perdas" />
              </PermissionGuard>
              
              <PermissionGuard permission="batches.view" showError={false}>
                <NavItem to="/inventory/batches" icon={<Package2 size={20} />} label="Rastreabilidade" />
              </PermissionGuard>
              
              <PermissionGuard permission="returns.view" showError={false}>
                <NavItem to="/inventory/returns" icon={<RotateCcw size={20} />} label="Devoluções" />
              </PermissionGuard>
              
              <div className="pt-2 pb-1">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Relatórios
                </h3>
              </div>
              
              <PermissionGuard permission="reports.inventory" showError={false}>
                <NavItem 
                  to="#" 
                  icon={<FileText size={20} />} 
                  label="Relatório de Perdas" 
                  onClick={() => toast.success('Funcionalidade de relatórios será implementada em breve')}
                />
              </PermissionGuard>
              
              <PermissionGuard permission="reports.inventory" showError={false}>
                <NavItem 
                  to="#" 
                  icon={<BarChart3 size={20} />} 
                  label="Analytics de Lotes" 
                  onClick={() => toast.success('Funcionalidade de analytics será implementada em breve')}
                />
              </PermissionGuard>
              
              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Segurança
                </h3>
              </div>
              <NavItem to="/security" icon={<Shield size={20} />} label="Configurações de Segurança" />
              
              <PermissionGuard permission="security.admin" showError={false}>
                <NavItem to="/security/advanced" icon={<Shield size={20} />} label="Segurança Avançada" />
              </PermissionGuard>
              
              {(hasPermission('users.view') || hasPermission('settings.view')) && (
                <Fragment>
                  <div className="pt-4 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administração
                    </h3>
                  </div>
                  
                  <PermissionGuard permission="users.view" showError={false}>
                    <NavItem to="/users" icon={<Users size={20} />} label="Usuários" />
                  </PermissionGuard>
                  
                  <PermissionGuard permission="settings.view" showError={false}>
                    <NavItem 
                      to="#" 
                      icon={<Settings size={20} />} 
                      label="Configurações" 
                      onClick={handleSettingsClick}
                    />
                  </PermissionGuard>
                </Fragment>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleHelpClick}
              className="w-full flex items-center text-sm text-gray-700 hover:text-primary-500"
            >
              <HelpCircle size={20} className="mr-3" />
              <span>Ajuda & Suporte</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;