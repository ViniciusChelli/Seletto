import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../../types/Product';
import { AlertCircle } from 'lucide-react';

interface LowStockProductsProps {
  products: Product[];
}

const LowStockProducts: React.FC<LowStockProductsProps> = ({ products }) => {
  const navigate = useNavigate();
  
  const goToProduct = (id: string) => {
    navigate(`/products/${id}`);
  };
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Produtos com Estoque Baixo</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {products.length} itens
        </span>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tudo em ordem!</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há produtos com estoque baixo no momento.
          </p>
        </div>
      ) : (
        <div className="mt-2 max-h-80 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li
                key={product.id}
                className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded"
                onClick={() => goToProduct(product.id)}
              >
                <div className="flex items-center">
                  {product.stockQuantity === 0 ? (
                    <AlertCircle size={16} className="text-red-500 mr-2" />
                  ) : (
                    <div className="h-2 w-2 bg-orange-500 rounded-full mr-2" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-medium ${
                    product.stockQuantity === 0 ? 'text-red-600' : 'text-orange-500'
                  }`}>
                    {product.stockQuantity} unid.
                  </span>
                  <span className="text-xs text-gray-500">
                    Min: {product.minStockLevel || 5}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={() => navigate('/products')}
          className="w-full btn btn-ghost text-primary-600 hover:text-primary-700 border border-gray-300"
        >
          Ver todos os produtos
        </button>
      </div>
    </div>
  );
};

export default LowStockProducts;