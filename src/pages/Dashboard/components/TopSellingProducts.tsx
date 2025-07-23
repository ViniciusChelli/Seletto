import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../../types/Product';
import { TrendingUp } from 'lucide-react';

interface TopSellingProductsProps {
  products: Product[];
}

const TopSellingProducts: React.FC<TopSellingProductsProps> = ({ products }) => {
  const navigate = useNavigate();
  
  // Sort products by salesCount (if available) and take top 5
  const topProducts = [...products]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5);
  
  const goToProduct = (id: string) => {
    navigate(`/products/${id}`);
  };
  
  // Mock data if no sales data available
  const mockTopProducts = [
    { id: '1', name: 'Água Mineral 1.5L', category: 'Bebidas', salesCount: 127 },
    { id: '2', name: 'Pão Francês', category: 'Padaria', salesCount: 98 },
    { id: '3', name: 'Leite Integral 1L', category: 'Laticínios', salesCount: 85 },
    { id: '4', name: 'Arroz 5kg', category: 'Mercearia', salesCount: 72 },
    { id: '5', name: 'Papel Higiênico 12un', category: 'Higiene', salesCount: 65 }
  ];
  
  const displayProducts = topProducts.length > 0 ? topProducts : mockTopProducts;
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Produtos Mais Vendidos</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Top 5
        </span>
      </div>
      
      <div className="mt-2 max-h-80 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {displayProducts.map((product, index) => (
            <li
              key={product.id}
              className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded"
              onClick={() => goToProduct(product.id)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-6 text-center mr-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp size={14} className="text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">
                  {product.salesCount || 0} vendas
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => navigate('/products')}
          className="w-full btn btn-ghost text-primary-600 hover:text-primary-700 border border-gray-300"
        >
          Ver estatísticas completas
        </button>
      </div>
    </div>
  );
};

export default TopSellingProducts;