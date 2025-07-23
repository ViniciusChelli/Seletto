import React from 'react';
import { Product } from '../../../types/Product';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../../contexts/ProductContext';
import { useAuth } from '../../../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const navigate = useNavigate();
  const { deleteProduct } = useProducts();
  const { hasPermission } = useAuth();
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/products/edit/${product.id}`);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      deleteProduct(product.id);
    }
  };
  
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.minStockLevel || 5);
  const isOutOfStock = product.stockQuantity === 0;
  
  return (
    <div
      className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 transition-shadow hover:shadow-md cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative">
        <div className="h-40 bg-gray-200 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center justify-center h-full w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7Zm0 3h16M9 4v6"
                />
              </svg>
              <span className="text-sm mt-1">Sem imagem</span>
            </div>
          )}
          
          {/* Status indicator */}
          {(isLowStock || isOutOfStock) && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white ${isOutOfStock ? 'bg-red-500' : 'bg-orange-500'}`}>
              <div className="flex items-center">
                <AlertTriangle size={14} className="mr-1" />
                {isOutOfStock ? 'Sem estoque' : 'Estoque baixo'}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {hasPermission('products.update') && (
              <button
                onClick={handleEdit}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-500 mx-1"
              >
                <Edit size={18} />
              </button>
            )}
            {hasPermission('products.delete') && (
              <button
                onClick={handleDelete}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-red-500 mx-1"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{product.category}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary-600">
              R$ {product.price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {product.stockQuantity} em estoque
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">
            <span className="font-medium">SKU:</span> {product.sku}
          </p>
          {product.barcode && (
            <p className="text-xs text-gray-500 truncate mt-1">
              <span className="font-medium">Código:</span> {product.barcode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;