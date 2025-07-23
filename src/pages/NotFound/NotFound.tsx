import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderX } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mx-auto h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
          <FolderX size={48} className="text-red-500" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Página não encontrada</h1>
        <p className="mt-3 text-base text-gray-500">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-8 space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Voltar para Dashboard
          </button>
          <button 
            onClick={() => navigate('/products')}
            className="btn btn-ghost border border-gray-300 w-full"
          >
            Ver Produtos
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;