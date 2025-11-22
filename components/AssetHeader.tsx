import React from 'react';
import { AssetData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetHeaderProps {
  asset: AssetData;
}

export const AssetHeader: React.FC<AssetHeaderProps> = ({ asset }) => {
  const isPositive = asset.percentageChange >= 0;

  return (
    <div className="mb-6">
      <div className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">
        {asset.name}
      </div>
      <div className="flex items-baseline gap-4">
        <h1 className="text-5xl font-bold text-teal-900">
          {asset.currency === '$' ? '$' : ''}{asset.currentValue}{asset.currency === '%' ? '%' : ''}
        </h1>
        {asset.percentageChange !== undefined && (
             <div className={`flex items-center text-lg font-bold ${isPositive ? 'text-teal-600' : 'text-red-500'}`}>
             {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
             {Math.abs(asset.percentageChange)}%
           </div>
        )}
      </div>
    </div>
  );
};