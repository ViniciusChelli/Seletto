import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface ProductFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  productCategories: string[];
  initialValues?: any;
  isEditMode?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  isLoading,
  productCategories,
  initialValues,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    minStockLevel: '',
    description: '',
    imageUrl: '',
    supplier: '',
    location: '',
    tags: [] as string[],
    isActive: true,
    isPerishable: false,
    shelfLifeDays: '',
    expiryAlertDays: '3',
    storageTemperature: 'ambiente',
    storageInstructions: '',
  });
  
  const [newTag, setNewTag] = useState('');
  
  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name || '',
        sku: initialValues.sku || '',
        barcode: initialValues.barcode || '',
        category: initialValues.category || '',
        price: initialValues.price?.toString() || '',
        costPrice: initialValues.costPrice?.toString() || '',
        stockQuantity: initialValues.stockQuantity?.toString() || '',
        minStockLevel: initialValues.minStockLevel?.toString() || '',
        description: initialValues.description || '',
        imageUrl: initialValues.imageUrl || '',
        supplier: initialValues.supplier || '',
        location: initialValues.location || '',
        tags: initialValues.tags || [],
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
        isPerishable: initialValues.isPerishable || false,
        shelfLifeDays: initialValues.shelfLifeDays?.toString() || '',
        expiryAlertDays: initialValues.expiryAlertDays?.toString() || '3',
        storageTemperature: initialValues.storageTemperature || 'ambiente',
        storageInstructions: initialValues.storageInstructions || '',
      });
    }
  }, [initialValues]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value,
    }));
  };
  
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Informações Básicas
          </h3>
          
          <div>
            <label htmlFor="name" className="form-label">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="sku" className="form-label">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="barcode" className="form-label">
              Código de Barras
            </label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="form-label">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Selecione uma categoria</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="description" className="form-label">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="imageUrl" className="form-label">
              URL da Imagem
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
        </div>
        
        {/* Pricing and Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Preços e Estoque
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="form-label">
                Preço de Venda <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="costPrice" className="form-label">
                Preço de Custo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="costPrice"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  className="form-input pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stockQuantity" className="form-label">
                Quantidade em Estoque <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="minStockLevel" className="form-label">
                Estoque Mínimo
              </label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="supplier" className="form-label">
              Fornecedor
            </label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="form-label">
              Localização na Prateleira
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Ex: Corredor 3, Prateleira B"
            />
          </div>
          
          <div>
            <label className="form-label">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="form-input rounded-r-none"
                placeholder="Adicionar tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 focus:outline-none"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          {/* Controle de Vencimento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Controle de Vencimento
            </h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPerishable"
                name="isPerishable"
                checked={formData.isPerishable}
                onChange={(e) => setFormData({ ...formData, isPerishable: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPerishable" className="ml-2 block text-sm text-gray-900">
                Produto perecível (tem data de vencimento)
              </label>
            </div>
            
            {formData.isPerishable && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shelfLifeDays" className="form-label">
                      Vida Útil (dias)
                    </label>
                    <input
                      type="number"
                      id="shelfLifeDays"
                      name="shelfLifeDays"
                      value={formData.shelfLifeDays}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantos dias o produto dura após fabricação
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="expiryAlertDays" className="form-label">
                      Alerta (dias antes)
                    </label>
                    <input
                      type="number"
                      id="expiryAlertDays"
                      name="expiryAlertDays"
                      value={formData.expiryAlertDays}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantos dias antes alertar sobre vencimento
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="storageTemperature" className="form-label">
                    Temperatura de Armazenamento
                  </label>
                  <select
                    id="storageTemperature"
                    name="storageTemperature"
                    value={formData.storageTemperature}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="ambiente">Temperatura Ambiente</option>
                    <option value="refrigerado">Refrigerado (2-8°C)</option>
                    <option value="congelado">Congelado (-18°C)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="storageInstructions" className="form-label">
                    Instruções de Armazenamento
                  </label>
                  <textarea
                    id="storageInstructions"
                    name="storageInstructions"
                    value={formData.storageInstructions}
                    onChange={handleChange}
                    className="form-input"
                    rows={2}
                    placeholder="Ex: Manter em local seco e arejado, protegido da luz solar"
                  />
                </div>
              </>
            )}
          </div>
          
          {isEditMode && (
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => 
                  setFormData({
                    ...formData,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Produto ativo
              </label>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full md:w-auto"
        >
          {isLoading ? 'Salvando...' : isEditMode ? 'Atualizar Produto' : 'Adicionar Produto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;