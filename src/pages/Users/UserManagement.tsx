import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Role, UserRole, ROLE_DESCRIPTIONS } from '../../types/Auth';
import { Users, Plus, Edit, Trash2, Shield, UserCheck, UserX, Crown } from 'lucide-react';
import PermissionGuard from '../../components/Auth/PermissionGuard';
import toast from 'react-hot-toast';

interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignIn?: string;
  roles: UserRole[];
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { user: currentUser, refreshUserData } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditRoles, setShowEditRoles] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    roleId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users from auth.users via profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          created_at,
          user_roles (
            id,
            role_id,
            is_active,
            expires_at,
            created_at,
            role:roles (
              id,
              name,
              display_name,
              level
            )
          )
        `);

      if (profilesError) throw profilesError;

      // Get user emails from auth metadata
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const usersWithRoles = profilesData?.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id);
        
        return {
          id: profile.id,
          email: authUser?.email || 'N/A',
          name: profile.name || 'Usuário',
          createdAt: profile.created_at,
          lastSignIn: authUser?.last_sign_in_at,
          isActive: true,
          roles: profile.user_roles?.map((ur: any) => ({
            id: ur.id,
            userId: profile.id,
            roleId: ur.role_id,
            isActive: ur.is_active,
            expiresAt: ur.expires_at,
            createdAt: ur.created_at,
            role: ur.role ? {
              id: ur.role.id,
              name: ur.role.name,
              displayName: ur.role.display_name,
              level: ur.role.level,
            } : undefined,
          })) || [],
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });

      if (error) throw error;

      const transformedRoles = data?.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
      })) || [];

      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.name || !newUser.password || !newUser.roleId) {
        toast.error('Preencha todos os campos');
        return;
      }

      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: {
          name: newUser.name,
        },
        email_confirm: true, // Auto-confirm for admin created users
      });

      if (authError) throw authError;

      if (authData.user) {
        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role_id: newUser.roleId,
            assigned_by: currentUser?.id,
          });

        if (roleError) throw roleError;

        toast.success('Usuário criado com sucesso!');
        setShowAddUser(false);
        setNewUser({ email: '', name: '', password: '', roleId: '' });
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Erro ao criar usuário: ${error.message}`);
    }
  };

  const handleToggleUserRole = async (userId: string, roleId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('role_id', roleId);

        if (error) throw error;
        toast.success('Função removida do usuário');
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role_id: roleId,
            assigned_by: currentUser?.id,
            is_active: true,
          });

        if (error) throw error;
        toast.success('Função atribuída ao usuário');
      }

      fetchUsers();
      if (userId === currentUser?.id) {
        refreshUserData();
      }
    } catch (error) {
      console.error('Error toggling user role:', error);
      toast.error('Erro ao alterar função do usuário');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário "${userEmail}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getUserHighestRole = (userRoles: UserRole[]) => {
    const activeRoles = userRoles.filter(ur => ur.isActive);
    if (activeRoles.length === 0) return null;
    
    return activeRoles.reduce((highest, current) => {
      const currentLevel = current.role?.level || 0;
      const highestLevel = highest.role?.level || 0;
      return currentLevel > highestLevel ? current : highest;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="users.view">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600">Gerencie usuários e suas funções no sistema</p>
          </div>
          <PermissionGuard permission="users.create" showError={false}>
            <button
              onClick={() => setShowAddUser(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Usuário
            </button>
          </PermissionGuard>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acesso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const highestRole = getUserHighestRole(user.roles);
                  const roleInfo = highestRole?.role ? ROLE_DESCRIPTIONS[highestRole.role.name as keyof typeof ROLE_DESCRIPTIONS] : null;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users size={20} className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {user.name}
                              {user.id === currentUser?.id && (
                                <Crown size={14} className="ml-2 text-yellow-500" title="Você" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {roleInfo ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                            {roleInfo.title}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Sem função
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastSignIn ? formatDate(user.lastSignIn) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <PermissionGuard permission="users.roles" showError={false}>
                            <button
                              onClick={() => setShowEditRoles(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar funções"
                            >
                              <Shield size={16} />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="users.delete" showError={false}>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir usuário"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Adicionar Novo Usuário</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Senha temporária"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função *
                  </label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({...newUser, roleId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecione uma função</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 btn btn-ghost border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 btn btn-primary"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Roles Modal */}
        {showEditRoles && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Editar Funções do Usuário</h3>
              
              {(() => {
                const user = users.find(u => u.id === showEditRoles);
                if (!user) return null;

                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>

                    <div className="space-y-3">
                      {roles.map(role => {
                        const userRole = user.roles.find(ur => ur.roleId === role.id && ur.isActive);
                        const roleInfo = ROLE_DESCRIPTIONS[role.name as keyof typeof ROLE_DESCRIPTIONS];
                        
                        return (
                          <div key={role.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                            <div>
                              <div className="font-medium">{role.displayName}</div>
                              <div className="text-sm text-gray-600">{roleInfo?.description}</div>
                            </div>
                            <button
                              onClick={() => handleToggleUserRole(user.id, role.id, !!userRole)}
                              className={`p-2 rounded ${
                                userRole 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {userRole ? <UserCheck size={16} /> : <UserX size={16} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowEditRoles(null)}
                  className="btn btn-primary"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;