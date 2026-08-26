import React from 'react';
import { ProductItem } from '../../types';
import { getProductCostStatuses } from '../../utils/costStatus';
import { formatMoney } from '../../utils/formatters';

interface ProductCostBadgesProps {
  product: ProductItem;
  className?: string;
}

export const ProductCostBadges: React.FC<ProductCostBadgesProps> = ({ product, className = '' }) => {
  const statuses = getProductCostStatuses(product);

  if (statuses.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 mt-1 ${className}`}>
      {statuses.map((s, idx) => {
        if (s.status === 'no') {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300"
              title={`${s.label}: Marcadado como NO (No lleva costo)`}
            >
              <span>{s.label}:</span>
              <span>NO</span>
            </span>
          );
        } else if (s.status === 'pending') {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
              title={`${s.label}: Pendiente de cargar costo`}
            >
              <span>⚠️ {s.label}: Pendiente</span>
            </span>
          );
        } else {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-300"
            >
              <span>{s.label}:</span>
              <span className="font-extrabold text-ragucci-primary">${formatMoney(s.value || 0)}</span>
            </span>
          );
        }
      })}
    </div>
  );
};
