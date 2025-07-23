import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Search, Filter, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { Product, ProductFilter, PRODUCT_CATEGORIES } from '../../types/Product';
import ProductCard from './components/ProductCard';
import ProductTable from './components/ProductTable';
import PermissionGuard from '../../components/Auth/PermissionGuard';

const Products: React.FC = () => {
  const { products, isLoading } = useProducts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilter>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
    search: undefined,
  });
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  
  useEffect(() => {
    // Set initial search from URL params
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);
  
  useEffect(() => {
    let result = [...products];
    
    // Apply search
    if (searchQuery) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.barcode && product.barcode.includes(searchQuery))
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(product => product.category === filters.category);
    }
    
    // Apply price filters
    if (filters.minPrice !== undefined) {
      result = result.filter(product => product.price >= (filters.minPrice || 0));
    }
    
    if (filters.maxPrice !== undefined) {
      result = result.filter(product => product.price <= (filters.maxPrice || Infinity));
    }
    
    // Apply stock filter
    if (filters.inStock !== undefined) {
      result = result.filter(product => 
        filters.inStock ? product.stockQuantity > 0 : product.stockQuantity === 0
      );
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, filters]);
  
  const resetFilters = () => {
    setFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      search: undefined,
    });
    setSearchQuery('');
    // Clear URL search params
    navigate('/products', { replace: true });
  };
  
  // Calculate stats
  const totalProducts = filteredProducts.length;
  const outOfStockCount = filteredProducts.filter(p => p.stockQuantity === 0).length;
  const lowStockCount = filteredProducts.filter(
    p => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockLevel || 5)
  ).length;
  
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
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <PermissionGuard permission="products.create" showError={false}>
          <button
            onClick={() => navigate('/products/add')}
            className="btn btn-primary flex items-center"
          >
            <PlusCircle size={18} className="mr-2" />
            Adicionar Produto
          </button>
        </PermissionGuard>
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
              placeholder="Buscar por nome, código ou barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost border border-gray-300 flex items-center"
            >
              <Filter size={18} className="mr-2" />
              Filtros
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="btn btn-ghost border border-gray-300"
            >
              {viewMode === 'grid' ? 'Tabela' : 'Grade'}
            </button>
          </div>
        </div>
        
        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  className="form-input"
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                >
                  <option value="">Todas as categorias</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="form-input w-1/2"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      minPrice: e.target.value ? Number(e.target.value) : undefined,
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="form-input w-1/2"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque
                </label>
                <select
                  className="form-input"
                  value={filters.inStock === undefined ? '' : filters.inStock ? 'in-stock' : 'out-of-stock'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters({
                      ...filters,
                      inStock: value === '' ? undefined : value === 'in-stock'
                    });
                  }}
                >
                  <option value="">Todos</option>
                  <option value="in-stock">Em estoque</option>
                  <option value="out-of-stock">Sem estoque</option>
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
        {(searchQuery || filters.category || filters.minPrice || filters.maxPrice || filters.inStock !== undefined) && (
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
            
            {filters.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Categoria: {filters.category}
                <button
                  onClick={() => setFilters({ ...filters, category: undefined })}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            
            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Preço: {filters.minPrice !== undefined ? `R$${filters.minPrice}` : 'R$0'} - {filters.maxPrice !== undefined ? `R$${filters.maxPrice}` : '∞'}
                <button
                  onClick={() => setFilters({ ...filters, minPrice: undefined, maxPrice: undefined })}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.inStock !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {filters.inStock ? 'Em estoque' : 'Sem estoque'}
                <button
                  onClick={() => setFilters({ ...filters, inStock: undefined })}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <span className="text-blue-600 font-semibold">{totalProducts}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Total de Produtos</h3>
            <p className="text-xs text-gray-500">Em sua base de dados</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-orange-100 mr-4">
            <span className="text-orange-600 font-semibold">{lowStockCount}</span>
          </div>
          <div className="flex items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Estoque Baixo</h3>
              <p className="text-xs text-gray-500">Necessitam reposição</p>
            </div>
            {lowStockCount > 0 && (
              <AlertTriangle size={18} className="ml-2 text-orange-500" />
            )}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-red-100 mr-4">
            <span className="text-red-600 font-semibold">{outOfStockCount}</span>
          </div>
          <div className="flex items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Sem Estoque</h3>
              <p className="text-xs text-gray-500">Esgotados no momento</p>
            </div>
            {outOfStockCount > 0 && (
              <AlertTriangle size={18} className="ml-2 text-red-500" />
            )}
          </div>
        </div>
      </div>
      
      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tente ajustar seus filtros ou adicione um novo produto.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/products/add')}
              className="btn btn-primary inline-flex items-center"
            >
              <PlusCircle size={18} className="mr-2" />
              Adicionar Produto
            </button>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <ProductTable products={filteredProducts} />
          )}
        </>
      )}
    </div>
  );
};

export default Products;