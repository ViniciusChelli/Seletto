import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash2, Package, Tag, ShoppingCart, Truck, Clock, Info, Ban as Bar } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, deleteProduct } = useProducts();
  const [product, setProduct] = useState(id ? getProduct(id) : undefined);
  
  useEffect(() => {
    if (id) {
      const productData = getProduct(id);
      setProduct(productData);
      
      if (!productData) {
        // Product not found, redirect to products list
        navigate('/products');
      }
    }
  }, [id, getProduct, navigate]);
  
  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      deleteProduct(product.id);
      navigate('/products');
    }
  };
  
  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  const createdAt = formatDate(product.createdAt);
  const updatedAt = formatDate(product.updatedAt);
  const lastSold = product.lastSold ? formatDate(product.lastSold) : 'Não vendido ainda';
  
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.minStockLevel || 5);
  const isOutOfStock = product.stockQuantity === 0;
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} className="mr-1" />
          <span>Voltar para Produtos</span>
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/products/edit/${product.id}`)}
            className="btn btn-primary flex items-center"
          >
            <Edit size={18} className="mr-2" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-danger flex items-center"
          >
            <Trash2 size={18} className="mr-2" />
            Excluir
          </button>
        </div>
      </div>
      
      {/* Product Details */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:w-1/3 bg-gray-200 flex items-center justify-center h-64 md:h-auto">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center justify-center h-full w-full">
                <Package size={64} />
                <span className="text-sm mt-2">Sem imagem</span>
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded text-gray-700 mr-2">
                    SKU: {product.sku}
                  </span>
                  {product.barcode && (
                    <span className="inline-block bg-gray-100 px-2 py-1 rounded text-gray-700">
                      Código: {product.barcode}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary-600">
                  R$ {product.price.toFixed(2)}
                </div>
                {product.costPrice && (
                  <div className="text-sm text-gray-500 mt-1">
                    Custo: R$ {product.costPrice.toFixed(2)}
                  </div>
                )}
                
                {/* Stock status indicator */}
                {isOutOfStock ? (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Trash2 size={14} className="mr-1" />
                    Sem estoque
                  </div>
                ) : isLowStock ? (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Info size={14} className="mr-1" />
                    Estoque baixo
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <ShoppingCart size={14} className="mr-1" />
                    Em estoque
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Tag size={16} className="mr-2 text-gray-500" />
                  Categoria
                </h3>
                <p className="mt-1 text-gray-600">{product.category}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <ShoppingCart size={16} className="mr-2 text-gray-500" />
                  Estoque
                </h3>
                <p className="mt-1 text-gray-600">
                  {product.stockQuantity} unidades{' '}
                  {product.minStockLevel && (
                    <span className="text-sm text-gray-500">
                      (Mínimo: {product.minStockLevel})
                    </span>
                  )}
                </p>
              </div>
              
              {product.supplier && (
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Truck size={16} className="mr-2 text-gray-500" />
                    Fornecedor
                  </h3>
                  <p className="mt-1 text-gray-600">{product.supplier}</p>
                </div>
              )}
              
              {product.location && (
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Package size={16} className="mr-2 text-gray-500" />
                    Localização
                  </h3>
                  <p className="mt-1 text-gray-600">{product.location}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  Última atualização
                </h3>
                <p className="mt-1 text-gray-600">{updatedAt}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  Cadastrado em
                </h3>
                <p className="mt-1 text-gray-600">{createdAt}</p>
              </div>
            </div>
            
            {product.description && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900">Descrição</h3>
                <p className="mt-1 text-gray-600">{product.description}</p>
              </div>
            )}
            
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Sales History */}
      {product.salesCount !== undefined && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Vendas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total de Vendas</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {product.salesCount} unidades
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Última Venda</div>
              <div className="text-lg font-medium text-gray-900 mt-1">
                {lastSold}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Valor Total em Vendas</div>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                R$ {(product.salesCount * product.price).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Placeholder for a sales chart that could be implemented in the future */}
          <div className="mt-6 h-64 bg-gray-50 flex items-center justify-center text-gray-400 rounded-lg">
            <div className="text-center">
              <Bar size={48} className="mx-auto mb-2" />
              <p>Gráfico de vendas detalhado estará disponível em breve</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;