import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Lock } from 'lucide-react';

interface RoleGuardProps {
  role: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
  requireAll?: boolean; // Se true, requer todas as funções; se false, requer pelo menos uma
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  children,
  fallback,
  showError = true,
  requireAll = false,
}) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const roles = Array.isArray(role) ? role : [role];
  
  const hasAccess = requireAll 
    ? roles.every(r => hasRole(r))
    : roles.some(r => hasRole(r));

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <Lock size={24} className="text-red-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem a função necessária para acessar esta funcionalidade.
          </p>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <AlertTriangle size={14} className="mr-1" />
            Função necessária: {roles.join(requireAll ? ' e ' : ' ou ')}
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;