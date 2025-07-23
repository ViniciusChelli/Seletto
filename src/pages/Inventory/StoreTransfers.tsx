import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../contexts/ProductContext';
import { ProductTransfer, TransferItem, Store } from '../../types/Inventory';
import { Truck, Plus, Eye, Check, X, Clock, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const StoreTransfers: React.FC = () => {
  const { products } = useProducts();
  const [transfers, setTransfers] = useState<ProductTransfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ProductTransfer | null>(null);
  const [newTransfer, setNewTransfer] = useState({
    fromStoreId: '',
    toStoreId: '',
    priority: 'normal' as any,
    notes: '',
    items: [] as any[]
  });

  useEffect(() => {
    fetchTransfers();
    fetchStores();
  }, []);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_transfers')
        .select(`
          *,
          from_store:stores!product_transfers_from_store_id_fkey(name),
          to_store:stores!product_transfers_to_store_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Erro ao carregar transferências');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const createTransfer = async () => {
    try {
      if (!newTransfer.fromStoreId || !newTransfer.toStoreId) {
        toast.error('Selecione as lojas de origem e destino');
        return;
      }

      if (newTransfer.items.length === 0) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      // Gerar número da transferência
      const transferNumber = await generateTransferNumber();

      const { data: transferData, error: transferError } = await supabase
        .from('product_transfers')
        .insert([{
          transfer_number: transferNumber,
          from_store_id: newTransfer.fromStoreId,
          to_store_id: newTransfer.toStoreId,
          priority: newTransfer.priority,
          notes: newTransfer.notes,
          requested_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (transferError) throw transferError;

      // Inserir itens
      const itemsToInsert = newTransfer.items.map(item => ({
        transfer_id: transferData.id,
        product_id: item.productId,
        quantity_requested: item.quantity,
        unit_cost: item.unitCost
      }));

      const { error: itemsError } = await supabase
        .from('transfer_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Transferência criada com sucesso!');
      setShowCreateModal(false);
      setNewTransfer({
        fromStoreId: '',
        toStoreId: '',
        priority: 'normal',
        notes: '',
        items: []
      });
      fetchTransfers();
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Erro ao criar transferência');
    }
  };

  const generateTransferNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_transfer_number');
    if (error) throw error;
    return data;
  };

  const processTransfer = async (transferId: string, action: string) => {
    try {
      const { data, error } = await supabase.rpc('process_store_transfer', {
        transfer_uuid: transferId,
        action_type: action
      });

      if (error) throw error;

      const actionLabels = {
        approve: 'aprovada',
        ship: 'enviada',
        receive: 'recebida',
        cancel: 'cancelada'
      };

      toast.success(`Transferência ${actionLabels[action as keyof typeof actionLabels]}!`);
      fetchTransfers();
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast.error('Erro ao processar transferência');
    }
  };

  const addItemToTransfer = () => {
    setNewTransfer({
      ...newTransfer,
      items: [...newTransfer.items, {
        productId: '',
        quantity: 1,
        unitCost: 0
      }]
    });
  };

  const removeItemFromTransfer = (index: number) => {
    setNewTransfer({
      ...newTransfer,
      items: newTransfer.items.filter((_, i) => i !== index)
    });
  };

  const updateTransferItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newTransfer.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewTransfer({ ...newTransfer, items: updatedItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovada';
      case 'in_transit': return 'Em Trânsito';
      case 'received': return 'Recebida';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Transferências entre Lojas</h1>
          <p className="text-gray-600">Gerencie transferências de produtos entre suas lojas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Nova Transferência
        </button>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transferências</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transferência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem → Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
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
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Truck size={20} className="text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transfer.transferNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transfer.transferType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">
                        {(transfer as any).from_store?.name || 'N/A'}
                      </span>
                      <ArrowRight size={16} className="mx-2 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {(transfer as any).to_store?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                      {getStatusLabel(transfer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(transfer.priority)}`}>
                      {transfer.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTransfer(transfer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {transfer.status === 'pending' && (
                        <button
                          onClick={() => processTransfer(transfer.id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                          title="Aprovar"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      
                      {transfer.status === 'approved' && (
                        <button
                          onClick={() => processTransfer(transfer.id, 'ship')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Enviar"
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      
                      {transfer.status === 'in_transit' && (
                        <button
                          onClick={() => processTransfer(transfer.id, 'receive')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Receber"
                        >
                          <Package size={16} />
                        </button>
                      )}
                      
                      {['pending', 'approved'].includes(transfer.status) && (
                        <button
                          onClick={() => processTransfer(transfer.id, 'cancel')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancelar"
                        >
                          <X size={16} />
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

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Nova Transferência</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loja de Origem
                </label>
                <select
                  value={newTransfer.fromStoreId}
                  onChange={(e) => setNewTransfer({...newTransfer, fromStoreId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione a loja de origem</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loja de Destino
                </label>
                <select
                  value={newTransfer.toStoreId}
                  onChange={(e) => setNewTransfer({...newTransfer, toStoreId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione a loja de destino</option>
                  {stores.filter(s => s.id !== newTransfer.fromStoreId).map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={newTransfer.priority}
                  onChange={(e) => setNewTransfer({...newTransfer, priority: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({...newTransfer, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Observações sobre a transferência"
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Produtos</h4>
                <button
                  onClick={addItemToTransfer}
                  className="btn btn-secondary text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Produto
                </button>
              </div>

              {newTransfer.items.length === 0 ? (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <Package size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Nenhum produto adicionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newTransfer.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produto
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateTransferItem(index, 'productId', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecione o produto</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} (Estoque: {product.stockQuantity})
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
                            onChange={(e) => updateTransferItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custo Unitário
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateTransferItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => removeItemFromTransfer(index)}
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
                onClick={createTransfer}
                className="flex-1 btn btn-primary"
                disabled={!newTransfer.fromStoreId || !newTransfer.toStoreId || newTransfer.items.length === 0}
              >
                Criar Transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTransfers;