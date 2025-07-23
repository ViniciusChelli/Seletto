import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Filter, X, Star, AlertTriangle, Building2, Phone, Mail } from 'lucide-react';
import { useSuppliers } from '../../contexts/SupplierContext';
import { Supplier, SupplierFilter } from '../../types/Supplier';

const Suppliers: React.FC = () => {
  const { suppliers, isLoading } = useSuppliers();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SupplierFilter>({
    status: undefined,
    minRating: undefined,
  });
  
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>(suppliers);
  
  useEffect(() => {
    let result = [...suppliers];
    
    // Apply search
    if (searchQuery) {
      result = result.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filters.status) {
      result = result.filter(supplier => supplier.status === filters.status);
    }
    
    // Apply rating filter
    if (filters.minRating !== undefined) {
      result = result.filter(supplier => supplier.performanceRating >= filters.minRating!);
    }
    
    setFilteredSuppliers(result);
  }, [suppliers, searchQuery, filters]);
  
  const resetFilters = () => {
    setFilters({
      status: undefined,
      minRating: undefined,
    });
    setSearchQuery('');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <button
          onClick={() => navigate('/suppliers/add')}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={18} className="mr-2" />
          Adicionar Fornecedor
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Buscar por nome, email ou contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost border border-gray-300 flex items-center"
          >
            <Filter size={18} className="mr-2" />
            Filtros
          </button>
        </div>
        
        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="form-input"
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as 'active' | 'inactive' | undefined })}
                >
                  <option value="">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avaliação Mínima
                </label>
                <select
                  className="form-input"
                  value={filters.minRating || ''}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Qualquer avaliação</option>
                  <option value="4">4+ estrelas</option>
                  <option value="3">3+ estrelas</option>
                  <option value="2">2+ estrelas</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="btn btn-ghost flex items-center text-gray-700"
              >
                <X size={16} className="mr-1" />
                Limpar filtros
              </button>
            </div>
          </div>
        )}
        
        {/* Applied filters summary */}
        {(searchQuery || filters.status || filters.minRating !== undefined) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Filtros aplicados:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Busca: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Status: {filters.status === 'active' ? 'Ativos' : 'Inativos'}
                <button
                  onClick={() => setFilters({ ...filters, status: undefined })}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.minRating !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Avaliação: {filters.minRating}+ estrelas
                <button
                  onClick={() => setFilters({ ...filters, minRating: undefined })}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Suppliers list */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tente ajustar seus filtros ou adicione um novo fornecedor.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/suppliers/add')}
              className="btn btn-primary inline-flex items-center"
            >
              <PlusCircle size={18} className="mr-2" />
              Adicionar Fornecedor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    {supplier.contactPerson && (
                      <p className="text-sm text-gray-500 mt-1">{supplier.contactPerson}</p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    supplier.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      {supplier.email}
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2 text-gray-400" />
                      {supplier.phone}
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 size={16} className="mr-2 text-gray-400" />
                      {supplier.address}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Star
                        size={16}
                        className={`${
                          supplier.performanceRating >= 4
                            ? 'text-yellow-400'
                            : supplier.performanceRating >= 3
                            ? 'text-green-500'
                            : 'text-red-500'
                        } mr-1`}
                        fill="currentColor"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {supplier.performanceRating.toFixed(1)}
                      </span>
                    </div>
                    
                    {supplier.performanceRating < 3 && (
                      <div className="flex items-center text-red-500 text-sm">
                        <AlertTriangle size={14} className="mr-1" />
                        Avaliação Baixa
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suppliers;