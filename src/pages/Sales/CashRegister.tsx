import React, { useState, useEffect } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { Calculator, DollarSign, Clock, TrendingUp, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

const CashRegister: React.FC = () => {
  const { currentCashRegister, openCashRegister, closeCashRegister, getCurrentCashRegister } = useSales();
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    getCurrentCashRegister();
  }, []);

  const handleOpenCashRegister = async () => {
    if (openingAmount < 0) {
      toast.error('Valor de abertura deve ser positivo');
      return;
    }

    const success = await openCashRegister(openingAmount);
    if (success) {
      setShowOpenModal(false);
      setOpeningAmount(0);
    }
  };

  const handleCloseCashRegister = async () => {
    if (closingAmount < 0) {
      toast.error('Valor de fechamento deve ser positivo');
      return;
    }

    const success = await closeCashRegister(closingAmount, notes);
    if (success) {
      setShowCloseModal(false);
      setClosingAmount(0);
      setNotes('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (!currentCashRegister) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Caixa Fechado</h2>
          <p className="text-gray-600 mb-6">
            O caixa está fechado. Abra o caixa para começar a realizar vendas.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="btn btn-primary flex items-center mx-auto"
          >
            <Unlock size={20} className="mr-2" />
            Abrir Caixa
          </button>
        </div>

        {/* Modal de Abertura */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Abrir Caixa</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de Abertura
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor em dinheiro disponível no caixa para troco
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 btn btn-ghost border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOpenCashRegister}
                  className="flex-1 btn btn-primary"
                >
                  Abrir Caixa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const difference = currentCashRegister.closingAmount 
    ? currentCashRegister.closingAmount - (currentCashRegister.openingAmount + currentCashRegister.totalCash)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Caixa</h1>
          <p className="text-gray-600">
            Caixa aberto em {formatDateTime(currentCashRegister.openedAt)}
          </p>
        </div>
        <button
          onClick={() => setShowCloseModal(true)}
          className="btn btn-danger flex items-center"
        >
          <Lock size={20} className="mr-2" />
          Fechar Caixa
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Abertura</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentCashRegister.openingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentCashRegister.totalSales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dinheiro</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentCashRegister.totalCash)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Aberto</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor((Date.now() - new Date(currentCashRegister.openedAt).getTime()) / (1000 * 60 * 60))}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por Forma de Pagamento */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detalhamento por Forma de Pagamento</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(currentCashRegister.totalCash)}
              </div>
              <div className="text-sm text-gray-600">Dinheiro</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCurrency(currentCashRegister.totalPix)}
              </div>
              <div className="text-sm text-gray-600">PIX</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {formatCurrency(currentCashRegister.totalCards)}
              </div>
              <div className="text-sm text-gray-600">Cartões</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {formatCurrency(currentCashRegister.totalCredit)}
              </div>
              <div className="text-sm text-gray-600">Fiado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Fechamento */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Fechar Caixa</h3>
            
            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span>Abertura:</span>
                  <span>{formatCurrency(currentCashRegister.openingAmount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Vendas em Dinheiro:</span>
                  <span>{formatCurrency(currentCashRegister.totalCash)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Esperado:</span>
                  <span>{formatCurrency(currentCashRegister.openingAmount + currentCashRegister.totalCash)}</span>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Real no Caixa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                />
              </div>
              
              {closingAmount > 0 && (
                <div className={`mt-2 p-2 rounded text-sm ${
                  difference === 0 ? 'bg-green-50 text-green-700' :
                  difference > 0 ? 'bg-blue-50 text-blue-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {difference === 0 ? 'Caixa confere!' :
                   difference > 0 ? `Sobra: ${formatCurrency(difference)}` :
                   `Falta: ${formatCurrency(Math.abs(difference))}`}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Observações sobre o fechamento do caixa..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCashRegister}
                className="flex-1 btn btn-danger"
              >
                Fechar Caixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;