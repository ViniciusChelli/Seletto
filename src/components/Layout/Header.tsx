import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Search, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationCenter from '../Notifications/NotificationCenter';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick }) => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleProfile = () => {
    setShowUserMenu(false);
    navigate('/security');
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    if (hasPermission && hasPermission('settings.view')) {
      toast.success('Funcionalidade de configurações será implementada em breve');
    } else {
      toast.error('Você não tem permissão para acessar configurações');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 z-30 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 lg:hidden focus:outline-none"
              onClick={onMenuButtonClick}
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 lg:ml-0 flex items-center">
              <img 
                src="/selleto-icon.svg"
                alt="Selleto Logo"
                className="h-8 w-8 mr-2"
              />
              <span className="text-xl font-semibold text-primary-500">Seletto</span>
            </div>
          </div>

          <div className="hidden md:block w-full max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                placeholder="Pesquisar produtos..."
              />
            </form>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:text-gray-300 dark:hover:text-gray-200"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="ml-3">
              <NotificationCenter />
            </div>

            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="sr-only">Abrir menu do usuário</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                    <User size={18} />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block dark:text-gray-300">
                    {user?.name}
                  </span>
                </button>
              </div>

              {showUserMenu && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <button
                    onClick={handleProfile}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <User size={16} className="mr-2" />
                      Perfil
                    </div>
                  </button>
                  <button
                    onClick={handleSettings}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <Settings size={16} className="mr-2" />
                      Configurações
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <LogOut size={16} className="mr-2" />
                      Sair
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="block md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            placeholder="Pesquisar produtos..."
          />
        </form>
      </div>
    </header>
  );
};

export default Header;