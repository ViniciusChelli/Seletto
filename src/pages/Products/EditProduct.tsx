import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { PRODUCT_CATEGORIES } from '../../types/Product';
import ProductForm from './components/ProductForm';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, updateProduct, isLoading } = useProducts();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<any>(null);
  
  useEffect(() => {
    if (id) {
      const product = getProduct(id);
      if (product) {
        setInitialValues({
          ...product,
          tags: product.tags || [],
        });
      } else {
        // Product not found, redirect to products list
        navigate('/products');
      }
    }
  }, [id, getProduct, navigate]);
  
  const handleSubmit = (formData: any) => {
    try {
      if (!id) return;
      
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category || formData.price === undefined) {
        setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      // Validate price
      if (formData.price <= 0) {
        setErrorMessage('O preço deve ser maior que zero.');
        return;
      }
      
      // Validate stock quantity
      if (formData.stockQuantity < 0) {
        setErrorMessage('A quantidade em estoque não pode ser negativa.');
        return;
      }
      
      // Update the product
      updateProduct(id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        minStockLevel: formData.minStockLevel ? Number(formData.minStockLevel) : undefined,
        description: formData.description,
        imageUrl: formData.imageUrl,
        supplier: formData.supplier,
        location: formData.location,
        tags: formData.tags,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      });
      
      // Redirect to product detail
      navigate(`/products/${id}`);
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao atualizar o produto. Por favor, tente novamente.');
    }
  };
  
  if (!initialValues) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/products/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} className="mr-1" />
          <span>Voltar para Detalhes do Produto</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
      </div>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          productCategories={PRODUCT_CATEGORIES}
          initialValues={initialValues}
          isEditMode={true}
        />
      </div>
    </div>
  );
};

export default EditProduct;