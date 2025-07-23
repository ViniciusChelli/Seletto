import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSuppliers } from '../../contexts/SupplierContext';
import SupplierForm from './components/SupplierForm';

const AddSupplier: React.FC = () => {
  const navigate = useNavigate();
  const { addSupplier, isLoading } = useSuppliers();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (formData: any) => {
    try {
      // Validate required fields
      if (!formData.name) {
        setErrorMessage('Nome do fornecedor é obrigatório.');
        return;
      }
      
      // Add the supplier
      await addSupplier({
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        taxId: formData.taxId,
        paymentTerms: formData.paymentTerms,
        notes: formData.notes,
        status: 'active',
        performanceRating: 0,
      });
      
      // Redirect to suppliers list
      navigate('/suppliers');
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao adicionar o fornecedor. Por favor, tente novamente.');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/suppliers')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={20} className="mr-1" />
          <span>Voltar para Fornecedores</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Adicionar Novo Fornecedor</h1>
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
        
        <SupplierForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default AddSupplier;