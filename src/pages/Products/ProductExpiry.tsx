import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../contexts/ProductContext';
import { useNotifications } from '../../hooks/useNotifications';
import { ProductExpiry } from '../../types/Sales';
import { AlertTriangle, Calendar, Package, Trash2, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductExpiryManagement: React.FC = () => {
  const { products } = useProducts();
  const { createNotification } = useNotifications();
  const [expiryData, setExpiryData] = useState<ProductExpiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState<string | null>(null);
  const [newExpiry, setNewExpiry] = useState({
    productId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    costPrice: 0,
    notes: '',
    daysBeforeExpiry: 3
  });
  const [disposeReason, setDisposeReason] = useState('');

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_expiry')
        .select(`
          *,
          products (
            name,
            category,
            is_perishable,
            expiry_alert_days
          )
        `)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      setExpiryData(data || []);
    } catch (err) {
      console.error('Error fetching expiry data:', err);
      toast.error('Erro ao carregar dados de vencimento');
    } finally {
      setIsLoading(false);
    }
  };

  const addExpiryRecord = async () => {
    try {
      if (!newExpiry.productId || !newExpiry.batchNumber || !newExpiry.expiryDate || newExpiry.quantity <= 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const { error } = await supabase
        .from('product_expiry')
        .insert([{
          product_id: newExpiry.productId,
          batch_number: newExpiry.batchNumber,
          expiry_date: newExpiry.expiryDate,
          quantity: newExpiry.quantity,
          cost_price: newExpiry.costPrice,
          days_before_expiry: newExpiry.daysBeforeExpiry,
          notes: newExpiry.notes,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success('Lote adicionado com sucesso!');
      setShowAddModal(false);
      setNewExpiry({
        productId: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        costPrice: 0,
        notes: '',
        daysBeforeExpiry: 3
      });
      fetchExpiryData();
    } catch (err) {
      console.error('Error adding expiry record:', err);
      toast.error('Erro ao adicionar lote');
    }
  };

  const markAsExpired = async (id: string, reason: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_product_expired', {
        expiry_id: id,
        disposal_reason_text: reason
      });

      if (error) throw error;

      toast.success('Produto marcado como vencido e removido do estoque');
      setShowDisposeModal(null);
      setDisposeReason('');
      fetchExpiryData();
      
      // Criar notificação manual
      await createNotification({
        title: '🗑️ Produto Descartado',
        message: `Produto vencido foi descartado. Motivo: ${reason}`,
        type: 'warning',
        category: 'expiry',
        priority: 'normal'
      });
    } catch (err) {
      console.error('Error marking as expired:', err);
      toast.error('Erro ao marcar como vencido');
    }
  };

  const getDaysToExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (daysToExpiry: number) => {
    if (daysToExpiry < 0) return { color: 'text-red-600 bg-red-50', label: 'Vencido' };
    if (daysToExpiry <= 3) return { color: 'text-red-600 bg-red-50', label: 'Vence hoje/amanhã' };
    if (daysToExpiry <= 7) return { color: 'text-orange-600 bg-orange-50', label: 'Vence em breve' };
    return { color: 'text-green-600 bg-green-50', label: 'OK' };
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const getPerishableProducts = () => {
    return products.filter(p => p.isActive);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const expiredCount = expiryData.filter(item => getDaysToExpiry(item.expiryDate) < 0).length;
  const expiringCount = expiryData.filter(item => {
    const days = getDaysToExpiry(item.expiryDate);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Vencimento</h1>
          <p className="text-gray-600">Gerencie lotes e datas de vencimento dos produtos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Adicionar Lote
        </button>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Vencidos</h3>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Vencem em 7 dias</h3>
              <p className="text-2xl font-bold text-orange-600">{expiringCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Produtos Perecíveis</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.isActive && (p as any).isPerishable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Total de Lotes</h3>
              <p className="text-2xl font-bold text-green-600">{expiryData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Lotes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lotes por Vencimento</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
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
              {expiryData.map((item) => {
                const daysToExpiry = getDaysToExpiry(item.expiryDate);
                const status = getExpiryStatus(daysToExpiry);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(item as any).products?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(item as any).products?.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.expiryDate)}</div>
                      <div className="text-xs text-gray-500">
                        {daysToExpiry >= 0 ? `${daysToExpiry} dias` : `${Math.abs(daysToExpiry)} dias atrás`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {daysToExpiry < 0 && (
                          <button
                            onClick={() => updateExpiryStatus(item.id, 'expired')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Marcar Vencido
                          </button>
                        )}
                        <button
                          onClick={() => updateExpiryStatus(item.id, 'discarded')}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Lote */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adicionar Novo Lote</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <select
                  value={newExpiry.productId}
                  onChange={(e) => setNewExpiry({...newExpiry, productId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione um produto</option>
                  {getPerishableProducts().map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Lote *
                </label>
                <input
                  type="text"
                  value={newExpiry.batchNumber}
                  onChange={(e) => setNewExpiry({...newExpiry, batchNumber: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: L001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={newExpiry.expiryDate}
                  onChange={(e) => setNewExpiry({...newExpiry, expiryDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  value={newExpiry.quantity}
                  onChange={(e) => setNewExpiry({...newExpiry, quantity: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Custo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpiry.costPrice}
                  onChange={(e) => setNewExpiry({...newExpiry, costPrice: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias para Alerta
                </label>
                <input
                  type="number"
                  value={newExpiry.daysBeforeExpiry}
                  onChange={(e) => setNewExpiry({...newExpiry, daysBeforeExpiry: parseInt(e.target.value) || 3})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantos dias antes do vencimento alertar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newExpiry.notes}
                  onChange={(e) => setNewExpiry({...newExpiry, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={addExpiryRecord}
                className="flex-1 btn btn-primary"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Descartar Produto */}
      {showDisposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Descartar Produto Vencido</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <AlertTriangle size={20} className="text-red-500 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Atenção</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Esta ação irá remover o produto do estoque e registrar a perda.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Descarte
              </label>
              <select
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selecione o motivo</option>
                <option value="Vencimento">Vencimento</option>
                <option value="Deterioração">Deterioração</option>
                <option value="Contaminação">Contaminação</option>
                <option value="Dano físico">Dano físico</option>
                <option value="Recall">Recall do fornecedor</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDisposeModal(null);
                  setDisposeReason('');
                }}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => markAsExpired(showDisposeModal, disposeReason)}
                disabled={!disposeReason}
                className="flex-1 btn btn-danger"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductExpiryManagement;