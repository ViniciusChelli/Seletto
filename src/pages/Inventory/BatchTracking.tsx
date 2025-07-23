import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, Eye, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';

interface Batch {
  id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  supplier_name: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  unit_cost: number;
  quality_grade: 'A' | 'B' | 'C';
  status: 'active' | 'quarantine' | 'expired' | 'recalled';
  storage_location: string;
  created_at: string;
}

const BatchTrackingPage: React.FC = () => {
  const { products } = useProducts();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demonstration
    const mockBatches: Batch[] = [
      {
        id: '1',
        batch_number: 'BT001',
        product_id: '1',
        product_name: 'Produto A',
        supplier_name: 'Fornecedor 1',
        production_date: '2024-01-15',
        expiry_date: '2024-06-15',
        quantity: 100,
        unit_cost: 25.50,
        quality_grade: 'A',
        status: 'active',
        storage_location: 'A1-B2',
        created_at: '2024-01-16T10:00:00Z'
      },
      {
        id: '2',
        batch_number: 'BT002',
        product_id: '2',
        product_name: 'Produto B',
        supplier_name: 'Fornecedor 2',
        production_date: '2024-01-10',
        expiry_date: '2024-02-10',
        quantity: 50,
        unit_cost: 15.75,
        quality_grade: 'B',
        status: 'expired',
        storage_location: 'B1-C3',
        created_at: '2024-01-11T14:30:00Z'
      }
    ];
    
    setBatches(mockBatches);
    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'quarantine':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'recalled':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQualityColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-yellow-100 text-yellow-800';
      case 'C':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = qualityFilter === 'all' || batch.quality_grade === qualityFilter;
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    
    return matchesSearch && matchesQuality && matchesStatus;
  });

  const stats = {
    total: batches.length,
    active: batches.filter(b => b.status === 'active').length,
    expiring: batches.filter(b => {
      const expiryDate = new Date(b.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length,
    quarantine: batches.filter(b => b.status === 'quarantine').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rastreabilidade de Lotes</h1>
        <p className="text-gray-600">Controle completo de lotes com rastreabilidade total</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Lotes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Vencendo (30 dias)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Em Quarentena</p>
              <p className="text-2xl font-bold text-gray-900">{stats.quarantine}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por lote ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Qualidades</option>
              <option value="A">Qualidade A</option>
              <option value="B">Qualidade B</option>
              <option value="C">Qualidade C</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="quarantine">Quarentena</option>
              <option value="expired">Vencido</option>
              <option value="recalled">Recall</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                    <div className="text-sm text-gray-500">{batch.storage_location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{batch.product_name}</div>
                    <div className="text-sm text-gray-500">{batch.supplier_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQualityColor(batch.quality_grade)}`}>
                      Qualidade {batch.quality_grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(batch.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{batch.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(batch.expiry_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {batch.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {(batch.quantity * batch.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lote encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros ou adicionar novos lotes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTrackingPage;