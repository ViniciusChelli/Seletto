import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../contexts/ProductContext';
import { useSuppliers } from '../../contexts/SupplierContext';
import { ProductLoss, LOSS_TYPES } from '../../types/Inventory';
import { AlertTriangle, Plus, TrendingDown, DollarSign, Package, Calendar, Download, Filter, BarChart3, FileText, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const LossControl: React.FC = () => {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const [losses, setLosses] = useState<ProductLoss[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [lossTypeFilter, setLossTypeFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [newLoss, setNewLoss] = useState({
    productId: '',
    batchNumber: '',
    lossType: 'damage' as any,
    quantity: 1,
    reason: '',
    preventionNotes: '',
    photos: [] as string[],
    insuranceClaim: false,
    insuranceAmount: 0
  });

  const [stats, setStats] = useState({
    totalLosses: 0,
    totalValue: 0,
    byType: {} as Record<string, { count: number; value: number }>,
    trend: 0,
    avgLossPerDay: 0,
    topLossType: '',
    preventableLosses: 0
  });

  useEffect(() => {
    fetchLosses();
  }, [selectedPeriod]);

  const fetchLosses = async () => {
    try {
      setIsLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('product_losses')
        .select(`
          *,
          products (name, category),
          suppliers (name),
          discovered_by_user:auth.users!product_losses_discovered_by_fkey (
            raw_user_meta_data
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLosses(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching losses:', error);
      toast.error('Erro ao carregar perdas');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (lossesData: any[]) => {
    const totalLosses = lossesData.length;
    const totalValue = lossesData.reduce((sum, loss) => sum + (loss.total_loss_value || 0), 0);
    
    const byType = lossesData.reduce((acc, loss) => {
      const type = loss.loss_type;
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0 };
      }
      acc[type].count += 1;
      acc[type].value += loss.total_loss_value || 0;
      return acc;
    }, {});

    // Calculate trend (compare with previous period)
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (parseInt(selectedPeriod) * 2));
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - parseInt(selectedPeriod));

    const currentPeriodLosses = lossesData.filter(loss => 
      new Date(loss.created_at) >= currentPeriodStart
    );
    const previousPeriodLosses = lossesData.filter(loss => 
      new Date(loss.created_at) >= previousPeriodStart && 
      new Date(loss.created_at) < currentPeriodStart
    );

    const currentValue = currentPeriodLosses.reduce((sum, loss) => sum + (loss.total_loss_value || 0), 0);
    const previousValue = previousPeriodLosses.reduce((sum, loss) => sum + (loss.total_loss_value || 0), 0);
    
    const trend = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    
    // Additional stats
    const avgLossPerDay = totalValue / parseInt(selectedPeriod);
    const topLossType = Object.keys(byType).reduce((a, b) => byType[a]?.count > byType[b]?.count ? a : b, '');
    const preventableLosses = lossesData.filter(loss => 
      ['damage', 'spoilage', 'breakage'].includes(loss.loss_type)
    ).length;

    setStats({ 
      totalLosses, 
      totalValue, 
      byType, 
      trend, 
      avgLossPerDay,
      topLossType,
      preventableLosses
    });
  };

  const registerLoss = async () => {
    try {
      if (!newLoss.productId || !newLoss.reason.trim()) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const { data, error } = await supabase.rpc('register_product_loss', {
        store_uuid: 'loja-principal-id', // Substituir pelo ID da loja atual
        product_uuid: newLoss.productId,
        batch_number_param: newLoss.batchNumber || null,
        quantity_param: newLoss.quantity,
        loss_type_param: newLoss.lossType,
        reason_param: newLoss.reason,
        unit_cost_param: null // Será calculado automaticamente
      });

      if (error) throw error;

      toast.success('Perda registrada com sucesso!');
      setShowRegisterModal(false);
      setNewLoss({
        productId: '',
        batchNumber: '',
        lossType: 'damage',
        quantity: 1,
        reason: '',
        preventionNotes: '',
        photos: [],
        insuranceClaim: false,
        insuranceAmount: 0
      });
      fetchLosses();
    } catch (error) {
      console.error('Error registering loss:', error);
      toast.error('Erro ao registrar perda');
    }
  };

  const approveLoss = async (lossId: string) => {
    try {
      const { error } = await supabase
        .from('product_losses')
        .update({
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', lossId);

      if (error) throw error;

      toast.success('Perda aprovada!');
      fetchLosses();
    } catch (error) {
      console.error('Error approving loss:', error);
      toast.error('Erro ao aprovar perda');
    }
  };

  const exportLossReport = () => {
    const csvContent = [
      ['Data', 'Produto', 'Tipo', 'Quantidade', 'Valor', 'Motivo', 'Status'],
      ...filteredLosses.map(loss => [
        formatDate(loss.discoveredAt),
        (loss as any).products?.name || '',
        LOSS_TYPES[loss.lossType],
        loss.quantityLost.toString(),
        formatCurrency(loss.totalLossValue),
        loss.lossReason,
        loss.approvedAt ? 'Aprovada' : 'Pendente'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-perdas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const filteredLosses = losses.filter(loss => {
    const matchesType = lossTypeFilter === 'all' || loss.lossType === lossTypeFilter;
    const matchesSupplier = supplierFilter === 'all' || loss.supplierId === supplierFilter;
    const matchesApproval = approvalFilter === 'all' || 
      (approvalFilter === 'approved' && loss.approvedAt) ||
      (approvalFilter === 'pending' && !loss.approvedAt);
    
    return matchesType && matchesSupplier && matchesApproval;
  });

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

  const getLossTypeColor = (type: string) => {
    switch (type) {
      case 'expiry': return 'bg-red-100 text-red-800';
      case 'damage': return 'bg-orange-100 text-orange-800';
      case 'theft': return 'bg-purple-100 text-purple-800';
      case 'spoilage': return 'bg-yellow-100 text-yellow-800';
      case 'breakage': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Controle de Perdas</h1>
          <p className="text-gray-600">Monitore e analise perdas de produtos</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportLossReport}
            className="btn btn-secondary flex items-center"
          >
            <Download size={20} className="mr-2" />
            Exportar
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-select text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Registrar Perda
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Total de Perdas</h3>
              <p className="text-2xl font-bold text-red-600">{stats.totalLosses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Valor Total</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Média Diária</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.avgLossPerDay)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-purple-800">Tendência</h3>
              <p className={`text-2xl font-bold ${stats.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Preveníveis</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.preventableLosses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost border border-gray-300 flex items-center"
          >
            <Filter size={18} className="mr-2" />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Perda
              </label>
              <select
                value={lossTypeFilter}
                onChange={(e) => setLossTypeFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">Todos os Tipos</option>
                {Object.entries(LOSS_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">Todos os Fornecedores</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status de Aprovação
              </label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">Todos</option>
                <option value="approved">Aprovadas</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loss by Type Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Perdas por Tipo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.byType).map(([type, data]) => (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{LOSS_TYPES[type as keyof typeof LOSS_TYPES]}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLossTypeColor(type)}`}>
                  {data.count}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(data.value)}
              </div>
              <div className="text-sm text-gray-500">
                Média: {formatCurrency(data.value / data.count)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(data.value / stats.totalValue) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Losses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Perdas</h2>
            <span className="text-sm text-gray-500">
              {filteredLosses.length} de {losses.length} registros
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prevenção
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLosses.map((loss) => (
                <tr key={loss.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {(loss as any).products?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {loss.batchNumber && `Lote: ${loss.batchNumber}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLossTypeColor(loss.lossType)}`}>
                      {LOSS_TYPES[loss.lossType]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {loss.quantityLost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(loss.totalLossValue)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {loss.lossReason}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {loss.preventionNotes || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(loss.discoveredAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {loss.approvedAt ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Aprovada
                      </span>
                    ) : (
                      <button
                        onClick={() => approveLoss(loss.id)}
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        Pendente
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Loss Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Registrar Perda</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <select
                  value={newLoss.productId}
                  onChange={(e) => setNewLoss({...newLoss, productId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
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
                  Número do Lote
                </label>
                <input
                  type="text"
                  value={newLoss.batchNumber}
                  onChange={(e) => setNewLoss({...newLoss, batchNumber: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Perda *
                  </label>
                  <select
                    value={newLoss.lossType}
                    onChange={(e) => setNewLoss({...newLoss, lossType: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {Object.entries(LOSS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={newLoss.quantity}
                    onChange={(e) => setNewLoss({...newLoss, quantity: parseInt(e.target.value) || 1})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Perda *
                </label>
                <textarea
                  value={newLoss.reason}
                  onChange={(e) => setNewLoss({...newLoss, reason: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descreva o motivo da perda..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Como Prevenir no Futuro
                </label>
                <textarea
                  value={newLoss.preventionNotes}
                  onChange={(e) => setNewLoss({...newLoss, preventionNotes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Medidas preventivas..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="insuranceClaim"
                    checked={newLoss.insuranceClaim}
                    onChange={(e) => setNewLoss({...newLoss, insuranceClaim: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="insuranceClaim" className="ml-2 block text-sm text-gray-900">
                    Acionar seguro
                  </label>
                </div>
                
                {newLoss.insuranceClaim && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor do Seguro
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLoss.insuranceAmount}
                      onChange={(e) => setNewLoss({...newLoss, insuranceAmount: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0,00"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={registerLoss}
                className="flex-1 btn btn-primary"
                disabled={!newLoss.productId || !newLoss.reason.trim()}
              >
                Registrar Perda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LossControl;