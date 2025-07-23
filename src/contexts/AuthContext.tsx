import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { Role, Permission, UserRole } from '../types/Auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  userRoles: UserRole[];
  userPermissions: Permission[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  getUserLevel: () => number;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWith2FA: (email: string, password: string, code?: string) => Promise<{ success: boolean; requires2FA?: boolean }>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // For development, we'll be more lenient with email confirmation
        // In production, you should enforce email confirmation
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
          role: session.user.user_metadata.role || 'staff',
        };
        setUser(userData);
        try {
          await fetchUserRolesAndPermissions(session.user.id);
        } catch (error) {
          console.error('Error fetching user roles:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRoles([]);
        setUserPermissions([]);
      } else if (event === 'PASSWORD_RECOVERY') {
        toast.success('Verifique seu email para redefinir sua senha.');
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || 'User',
            role: session.user.user_metadata.role || 'staff',
          };
          setUser(userData);
          try {
            await fetchUserRolesAndPermissions(session.user.id);
          } catch (error) {
            console.error('Error fetching user roles:', error);
          }
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
          role: session.user.user_metadata.role || 'staff',
        };
        setUser(userData);
        try {
          await fetchUserRolesAndPermissions(session.user.id);
        } catch (error) {
          console.error('Error fetching user roles:', error);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchUserRolesAndPermissions = async (userId: string) => {
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setUserRoles([]);
        setUserPermissions([]);
        return;
      }

      const transformedRoles = rolesData?.map(userRole => ({
        id: userRole.id,
        userId: userRole.user_id,
        roleId: userRole.role_id,
        assignedBy: userRole.assigned_by,
        isActive: userRole.is_active,
        expiresAt: userRole.expires_at,
        createdAt: userRole.created_at,
        updatedAt: userRole.updated_at,
        role: userRole.role ? {
          id: userRole.role.id,
          name: userRole.role.name,
          displayName: userRole.role.display_name,
          description: userRole.role.description,
          level: userRole.role.level,
          isActive: userRole.role.is_active,
          createdAt: userRole.role.created_at,
          updatedAt: userRole.role.updated_at,
        } : undefined,
      })) || [];

      setUserRoles(transformedRoles);

      // Fetch user permissions
      try {
        const { data: permissionsData, error: permissionsError } = await supabase
          .rpc('get_user_permissions', { user_uuid: userId });

        if (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);
          setUserPermissions([]);
          return;
        }

        const transformedPermissions = permissionsData?.map((perm: any) => ({
          id: perm.permission_name,
          name: perm.permission_name,
          displayName: perm.permission_name,
          module: perm.module,
          action: perm.action,
          isActive: true,
          createdAt: new Date().toISOString(),
        })) || [];

        setUserPermissions(transformedPermissions);
      } catch (permError) {
        console.error('Error with permissions RPC:', permError);
        // Set empty permissions if RPC doesn't exist
        setUserPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching user roles and permissions:', error);
      setUserRoles([]);
      setUserPermissions([]);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return userPermissions.some(p => p.name === permission);
  };

  const hasRole = (role: string): boolean => {
    return userRoles.some(ur => ur.role?.name === role);
  };

  const getUserLevel = (): number => {
    const levels = userRoles.map(ur => ur.role?.level || 0);
    return Math.max(...levels, 0);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserRolesAndPermissions(user.id);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Email ou senha incorretos');
        } else if (error.message === 'Email not confirmed') {
          toast.error('Por favor, confirme seu email antes de fazer login.');
        } else {
          toast.error('Erro ao fazer login. Por favor, tente novamente.');
        }
        return false;
      }

      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name || 'User',
          role: data.user.user_metadata.role || 'staff',
        };
        setUser(userData);
        await fetchUserRolesAndPermissions(data.user.id);
        toast.success('Login realizado com sucesso!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Erro ao fazer login. Por favor, tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Get the current origin for redirect URL
      const redirectTo = `${window.location.origin}/login?confirmed=true`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'staff',
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Check for specific error codes first
        if (error.message === 'user_already_exists' || error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login ou recuperar sua senha.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('Unable to validate email address')) {
          toast.error('Email inválido. Por favor, verifique o endereço informado.');
        } else if (error.message.includes('Signup is disabled')) {
          toast.error('O cadastro está temporariamente desabilitado. Entre em contato com o administrador.');
        } else {
          toast.error(`Erro ao criar conta: ${error.message}`);
        }
        return false;
      }

      if (data.user) {
        // Check if user already exists (identities array will be empty)
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error('Este email já está cadastrado. Tente fazer login ou recuperar sua senha.');
          return false;
        }

        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          toast.success('Conta criada com sucesso! Verifique seu email para confirmar o cadastro antes de fazer login.');
        } else {
          toast.success('Conta criada e confirmada com sucesso! Você pode fazer login agora.');
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error registering:', error);
      
      // Handle the specific case where the error might be thrown as an exception
      if (error?.message === 'user_already_exists' || error?.message?.includes('User already registered')) {
        toast.error('Este email já está cadastrado. Tente fazer login ou recuperar sua senha.');
      } else {
        toast.error(`Erro ao criar conta: ${error?.message || 'Erro desconhecido'}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('Unable to validate email address')) {
          toast.error('Email inválido. Por favor, verifique o endereço informado.');
        } else {
          toast.error('Erro ao enviar email de recuperação. Tente novamente.');
        }
        return false;
      }

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada e spam.');
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao enviar email de recuperação');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error('Erro ao atualizar senha. Tente novamente.');
        return false;
      }

      toast.success('Senha atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Erro ao atualizar senha');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        toast.error(`Erro ao reenviar email de confirmação: ${error.message}`);
        return false;
      }

      toast.success('Email de confirmação reenviado! Verifique sua caixa de entrada.');
      return true;
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast.error(`Erro ao reenviar confirmação: ${error?.message || 'Erro desconhecido'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserRoles([]);
      setUserPermissions([]);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRoles,
        userPermissions,
        hasPermission,
        hasRole,
        getUserLevel,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        resetPassword,
        updatePassword,
        resendConfirmation,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};