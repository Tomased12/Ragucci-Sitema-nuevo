import React from 'react';
import { ProductItem } from '../../types';
import { getProductCostStatuses } from '../../utils/costStatus';
import { formatMoney } from '../../utils/formatters';

interface ProductCostBadgesProps {
  product: ProductItem;
  onlyPending?: boolean;
  className?: string;
  onPendingClick?: (key: 'telas' | 'forreria' | 'arreglos') => void;
}

export const ProductCostBadges: React.FC<ProductCostBadgesProps> = ({ 
  product, 
  onlyPending = true, 
  className = '',
  onPendingClick
}) => {
  const allStatuses = getProductCostStatuses(product);
  const statuses = onlyPending ? allStatuses.filter(s => s.status === 'pending') : allStatuses;

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
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPendingClick) {
                  onPendingClick(s.key);
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs cursor-pointer hover:scale-105 transition-all group"
              title={`Hacer clic para editar la venta y cargar ${s.label}`}
            >
              <span>⚠️ {s.label}: Pendiente</span>
              <span className="text-[9px] underline font-extrabold ml-0.5 text-amber-950 group-hover:text-black">✏️ Cargar</span>
            </button>
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
