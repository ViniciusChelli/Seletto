import React, { useState, useEffect } from 'react';

interface SupplierFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialValues?: any;
  isEditMode?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  onSubmit,
  isLoading,
  initialValues,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
    performanceRating: 0,
  });
  
  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name || '',
        contactPerson: initialValues.contactPerson || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        address: initialValues.address || '',
        taxId: initialValues.taxId || '',
        paymentTerms: initialValues.paymentTerms || '',
        notes: initialValues.notes || '',
        status: initialValues.status || 'active',
        performanceRating: initialValues.performanceRating || 0,
      });
    }
  }, [initialValues]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
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
              Nome do Fornecedor <span className="text-red-500">*</span>
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
            <label htmlFor="contactPerson" className="form-label">
              Pessoa de Contato
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="form-label">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="form-label">
              Endereço
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              rows={3}
            />
          </div>
        </div>
        
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Informações Comerciais
          </h3>
          
          <div>
            <label htmlFor="taxId" className="form-label">
              CNPJ/CPF
            </label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="paymentTerms" className="form-label">
              Condições de Pagamento
            </label>
            <input
              type="text"
              id="paymentTerms"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="form-input"
              placeholder="Ex: 30 dias, À vista, etc."
            />
          </div>
          
          {isEditMode && (
            <>
              <div>
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="performanceRating" className="form-label">
                  Avaliação de Performance (0-5)
                </label>
                <input
                  type="number"
                  id="performanceRating"
                  name="performanceRating"
                  value={formData.performanceRating}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="notes" className="form-label">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              rows={4}
              placeholder="Informações adicionais sobre o fornecedor..."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full md:w-auto"
        >
          {isLoading ? 'Salvando...' : isEditMode ? 'Atualizar Fornecedor' : 'Adicionar Fornecedor'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;