import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';

interface AnalyticsSummaryProps {
  data: {
    totalRevenue: number;
    revenueChange: number;
    totalProducts: number;
    productsChange: number;
    totalCustomers: number;
    customersChange: number;
    totalOrders: number;
    ordersChange: number;
  };
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Receita Total',
      value: formatCurrency(data.totalRevenue),
      change: data.revenueChange,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total de Produtos',
      value: data.totalProducts,
      change: data.productsChange,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clientes',
      value: data.totalCustomers,
      change: data.customersChange,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pedidos',
      value: data.totalOrders,
      change: data.ordersChange,
      icon: ShoppingCart,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div className="flex items-center">
              {card.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={card.change > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(card.change)}
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{card.value}</h3>
          <p className="text-sm text-gray-500">{card.title}</p>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsSummary;