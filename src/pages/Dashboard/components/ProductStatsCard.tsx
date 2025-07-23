import React, { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ProductStatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  change: number;
  changeText: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const ProductStatsCard: React.FC<ProductStatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeText,
  changeType = 'positive',
}) => {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold">{value}</div>
      </div>
      
      {change !== undefined && (
        <div className={`flex items-center text-sm ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {changeType === 'positive' && change > 0 && (
            <ArrowUpRight size={16} className="mr-1" />
          )}
          {changeType === 'negative' && change > 0 && (
            <ArrowDownRight size={16} className="mr-1" />
          )}
          <span>
            {change > 0 ? `+${change}%` : change < 0 ? `${change}%` : `${change}%`} {changeText}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductStatsCard;