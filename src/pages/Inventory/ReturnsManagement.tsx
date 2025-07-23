import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../contexts/ProductContext';
import { Return, ReturnItem, RETURN_TYPES } from '../../types/Inventory';
import { RotateCcw, Plus, Eye, Check, X, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const ReturnsManagement: React.FC = () => {
  const { products } = useProducts();
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [newReturn, setNewReturn] = useState({
    customerId: '',
    originalSaleId: '',
    returnType: 'defective' as any,
    returnReason: '',
    refundMethod: 'cash' as any,
    notes: '',
    items: [] as any[]
  });

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('returns')
        .select(`
          *,
          customers (name, email),
          sales (sale_number)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Erro ao carregar devoluções');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReturnItems = async (returnId: string) => {
    try {
      const { data, error } = await supabase
        .from('return_items')
        .select(`
          *,
          products (name, category)
        `)
        .eq('return_id', returnId);

      if (error) throw error;

      setReturnItems(data || []);
    } catch (error) {
      console.error('Error fetching return items:', error);
    }
  };

  const createReturn = async () => {
    try {
      if (!newReturn.returnReason.trim() || newReturn.items.length === 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Gerar número da devolução
      const { data: returnNumber, error: numberError } = await supabase.rpc('generate_return_number');
      if (numberError) throw numberError;

      const totalAmount = newReturn.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert([{
          return_number: returnNumber,
          store_id: 'loja-principal-id', // Substituir pelo ID da loja atual
          original_sale_id: newReturn.originalSaleId || null,
          customer_id: newReturn.customerId || null,
          return_type: newReturn.returnType,
          return_reason: newReturn.returnReason,
          total_amount: totalAmount,
          refund_amount: totalAmount,
          refund_method: newReturn.refundMethod,
          notes: newReturn.notes
        }])
        .select()
        .single();

      if (returnError) throw returnError;

      // Inserir itens
      const itemsToInsert = newReturn.items.map(item => ({
        return_id: returnData.id,
        product_id: item.productId,
        quantity_returned: item.quantity,
        unit_price: item.unitPrice,
        condition_received: item.condition,
        action_taken: item.action,
        can_resell: item.canResell
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Devolução registrada com sucesso!');
      setShowCreateModal(false);
      setNewReturn({
        customerId: '',
        originalSaleId: '',
        returnType: 'defective',
        returnReason: '',
        refundMethod: 'cash',
        notes: '',
        items: []
      });
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Erro ao registrar devolução');
    }
  };

  const processReturn = async (returnId: string, action: string) => {
    try {
      const { data, error } = await supabase.rpc('process_return', {
        return_uuid: returnId,
        action_type: action
      });

      if (error) throw error;

      const actionLabels = {
        approve: 'aprovada',
        reject: 'rejeitada',
        process: 'processada'
      };

      toast.success(`Devolução ${actionLabels[action as keyof typeof actionLabels]}!`);
      fetchReturns();
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Erro ao processar devolução');
    }
  };

  const addItemToReturn = () => {
    setNewReturn({
      ...newReturn,
      items: [...newReturn.items, {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        condition: 'good',
        action: 'restock',
        canResell: true
      }]
    });
  };

  const removeItemFromReturn = (index: number) => {
    setNewReturn({
      ...newReturn,
      items: newReturn.items.filter((_, i) => i !== index)
    });
  };

  const updateReturnItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newReturn.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-set canResell based on condition and action
    if (field === 'condition' || field === 'action') {
      const item = updatedItems[index];
      item.canResell = item.condition === 'perfect' || item.condition === 'good';
      if (item.condition === 'damaged' || item.condition === 'defective' || item.condition === 'expired') {
        item.action = 'discard';
        item.canResell = false;
      }
    }
    
    setNewReturn({ ...newReturn, items: updatedItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovada';
      case 'rejected': return 'Rejeitada';
      case 'processed': return 'Processada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Devoluções</h1>
          <p className="text-gray-600">Controle devoluções e reembolsos de produtos</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovada</option>
            <option value="rejected">Rejeitada</option>
            <option value="processed">Processada</option>
            <option value="completed">Concluída</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Nova Devolução
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <RotateCcw className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Total</h3>
              <p className="text-2xl font-bold text-blue-600">{returns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Pendentes</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {returns.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Processadas</h3>
              <p className="text-2xl font-bold text-green-600">
                {returns.filter(r => r.status === 'processed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Valor Total</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(returns.reduce((sum, r) => sum + r.refundAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Devoluções</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devolução
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map((returnItem) => (
                <tr key={returnItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {returnItem.returnNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(returnItem as any).sales?.sale_number && `Venda: ${(returnItem as any).sales.sale_number}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {(returnItem as any).customers?.name || 'Cliente Avulso'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(returnItem as any).customers?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {RETURN_TYPES[returnItem.returnType]}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {returnItem.returnReason}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(returnItem.refundAmount)}
                    </div>
                    {returnItem.storeCreditAmount > 0 && (
                      <div className="text-sm text-blue-600">
                        + {formatCurrency(returnItem.storeCreditAmount)} crédito
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>
                      {getStatusLabel(returnItem.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(returnItem.requestedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          fetchReturnItems(returnItem.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {returnItem.status === 'pending' && (
                        <>
                          <button
                            onClick={() => processReturn(returnItem.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Aprovar"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => processReturn(returnItem.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                            title="Rejeitar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      
                      {returnItem.status === 'approved' && (
                        <button
                          onClick={() => processReturn(returnItem.id, 'process')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Processar"
                        >
                          <Package size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Nova Devolução</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Devolução
                </label>
                <select
                  value={newReturn.returnType}
                  onChange={(e) => setNewReturn({...newReturn, returnType: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(RETURN_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Reembolso
                </label>
                <select
                  value={newReturn.refundMethod}
                  onChange={(e) => setNewReturn({...newReturn, refundMethod: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="store_credit">Crédito na Loja</option>
                  <option value="exchange">Troca</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Devolução *
                </label>
                <textarea
                  value={newReturn.returnReason}
                  onChange={(e) => setNewReturn({...newReturn, returnReason: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descreva o motivo da devolução..."
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Produtos Devolvidos</h4>
                <button
                  onClick={addItemToReturn}
                  className="btn btn-secondary text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Produto
                </button>
              </div>

              {newReturn.items.length === 0 ? (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Nenhum produto adicionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newReturn.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produto
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateReturnItem(index, 'productId', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecione</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço Unit.
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateReturnItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condição
                          </label>
                          <select
                            value={item.condition}
                            onChange={(e) => updateReturnItem(index, 'condition', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="perfect">Perfeito</option>
                            <option value="good">Bom</option>
                            <option value="damaged">Danificado</option>
                            <option value="defective">Defeituoso</option>
                            <option value="expired">Vencido</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeItemFromReturn(index)}
                            className="w-full btn btn-danger text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={createReturn}
                className="flex-1 btn btn-primary"
                disabled={!newReturn.returnReason.trim() || newReturn.items.length === 0}
              >
                Registrar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;