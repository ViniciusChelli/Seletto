import React, { useState } from 'react';
import { usePromotions } from '../../contexts/PromotionsContext';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Gift, Calendar, Users, TrendingUp } from 'lucide-react';
import { Promotion, PROMOTION_TYPES, PROMOTION_EXAMPLES, DAYS_OF_WEEK } from '../../types/Promotions';
import PermissionGuard from '../../components/Auth/PermissionGuard';
import toast from 'react-hot-toast';

const PromotionsManagement: React.FC = () => {
  const { promotions, activePromotions, createPromotion, updatePromotion, deletePromotion, togglePromotion, isLoading } = usePromotions();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    type: 'percentage' as any,
    discountValue: 0,
    minQuantity: 1,
    maxQuantity: undefined,
    minPurchaseAmount: 0,
    maxDiscountAmount: undefined,
    buyQuantity: undefined,
    getQuantity: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    usageLimit: undefined,
    usagePerCustomer: 1,
    priority: 0,
    stackable: false,
    couponCode: '',
    applicableDays: [0, 1, 2, 3, 4, 5, 6],
  });

  const handleCreatePromotion = async () => {
    try {
      if (!newPromotion.name || !newPromotion.type || newPromotion.discountValue <= 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      await createPromotion({
        ...newPromotion,
        currentUsage: 0,
        startDate: new Date(newPromotion.startDate).toISOString(),
        endDate: new Date(newPromotion.endDate).toISOString(),
        applicableHours: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setShowCreateModal(false);
      setNewPromotion({
        name: '',
        description: '',
        type: 'percentage',
        discountValue: 0,
        minQuantity: 1,
        maxQuantity: undefined,
        minPurchaseAmount: 0,
        maxDiscountAmount: undefined,
        buyQuantity: undefined,
        getQuantity: undefined,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        usageLimit: undefined,
        usagePerCustomer: 1,
        priority: 0,
        stackable: false,
        couponCode: '',
        applicableDays: [0, 1, 2, 3, 4, 5, 6],
      });
    } catch (error) {
      console.error('Error creating promotion:', error);
    }
  };

  const handleDeletePromotion = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a promoção "${name}"?`)) {
      await deletePromotion(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const getPromotionStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) return 'bg-gray-100 text-gray-800';
    if (now < start) return 'bg-blue-100 text-blue-800';
    if (now > end) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getPromotionStatusText = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive) return 'Inativa';
    if (now < start) return 'Agendada';
    if (now > end) return 'Expirada';
    return 'Ativa';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="promotions.view">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Promoções</h1>
            <p className="text-gray-600">Crie e gerencie promoções para aumentar suas vendas</p>
          </div>
          <PermissionGuard permission="promotions.create" showError={false}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Nova Promoção
            </button>
          </PermissionGuard>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Total</h3>
                <p className="text-2xl font-bold text-blue-600">{promotions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Ativas</h3>
                <p className="text-2xl font-bold text-green-600">{activePromotions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800">Agendadas</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {promotions.filter(p => new Date(p.startDate) > new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Usos Hoje</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {promotions.reduce((sum, p) => sum + p.currentUsage, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Promoções */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Promoções Cadastradas</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promoção
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desconto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                        <div className="text-sm text-gray-500">{promotion.description}</div>
                        {promotion.couponCode && (
                          <div className="text-xs text-blue-600 font-mono">
                            Cupom: {promotion.couponCode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {PROMOTION_TYPES[promotion.type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.type === 'percentage' ? `${promotion.discountValue}%` : 
                       promotion.type === 'fixed_amount' ? `R$ ${promotion.discountValue.toFixed(2)}` :
                       promotion.type === 'buy_x_get_y' ? `${promotion.buyQuantity}x${promotion.getQuantity}` :
                       `${promotion.discountValue}%`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(promotion.startDate)}</div>
                      <div>até {formatDate(promotion.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPromotionStatusColor(promotion)}`}>
                        {getPromotionStatusText(promotion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promotion.currentUsage}
                      {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <PermissionGuard permission="promotions.update" showError={false}>
                          <button
                            onClick={() => togglePromotion(promotion.id, !promotion.isActive)}
                            className={`${promotion.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={promotion.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {promotion.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                        </PermissionGuard>
                        
                        <PermissionGuard permission="promotions.update" showError={false}>
                          <button
                            onClick={() => setEditingPromotion(promotion)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        </PermissionGuard>
                        
                        <PermissionGuard permission="promotions.delete" showError={false}>
                          <button
                            onClick={() => handleDeletePromotion(promotion.id, promotion.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Criar Promoção */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <h3 className="text-lg font-semibold mb-4">Criar Nova Promoção</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Promoção *
                  </label>
                  <input
                    type="text"
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Desconto 20% Bebidas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Promoção *
                  </label>
                  <select
                    value={newPromotion.type}
                    onChange={(e) => setNewPromotion({...newPromotion, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.entries(PROMOTION_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor do Desconto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPromotion.discountValue}
                    onChange={(e) => setNewPromotion({...newPromotion, discountValue: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder={newPromotion.type === 'percentage' ? '20' : '10.00'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newPromotion.type === 'percentage' ? 'Porcentagem (%)' : 'Valor em reais (R$)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    value={newPromotion.minQuantity}
                    onChange={(e) => setNewPromotion({...newPromotion, minQuantity: parseInt(e.target.value) || 1})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Fim *
                  </label>
                  <input
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {newPromotion.type === 'coupon' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código do Cupom
                    </label>
                    <input
                      type="text"
                      value={newPromotion.couponCode}
                      onChange={(e) => setNewPromotion({...newPromotion, couponCode: e.target.value.toUpperCase()})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="SAVE20"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Uso
                  </label>
                  <input
                    type="number"
                    value={newPromotion.usageLimit || ''}
                    onChange={(e) => setNewPromotion({...newPromotion, usageLimit: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newPromotion.description}
                  onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Descrição detalhada da promoção..."
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn btn-ghost border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePromotion}
                  className="flex-1 btn btn-primary"
                >
                  Criar Promoção
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PromotionsManagement;