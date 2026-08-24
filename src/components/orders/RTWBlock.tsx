import React, { useState } from 'react';
import { RTWItem, StockItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { MoneyInput } from '../common/MoneyInput';
import { Trash2 } from 'lucide-react';

interface RTWBlockProps {
  item: RTWItem;
  onChange: (updated: RTWItem) => void;
  onRemove: () => void;
}

export const RTWBlock: React.FC<RTWBlockProps> = ({ item, onChange, onRemove }) => {
  const { stockItems } = useApp();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [focusedRtwIdx, setFocusedRtwIdx] = useState<number>(-1);

  const filteredStock = stockItems.filter(s => 
    s.name.toLowerCase().includes(item.desc.toLowerCase().trim()) ||
    s.code.toLowerCase().includes(item.desc.toLowerCase().trim())
  );

  const handleSelectStockItem = (stockItem: StockItem) => {
    const price = stockItem.retailPrice > 0 ? stockItem.retailPrice : stockItem.costPrice;
    onChange({ ...item, desc: stockItem.name, price });
    setShowAutocomplete(false);
    setFocusedRtwIdx(-1);
  };

  const handleRtwKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || filteredStock.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRtwIdx(prev => (prev < filteredStock.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRtwIdx(prev => (prev > 0 ? prev - 1 : filteredStock.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedRtwIdx >= 0 && filteredStock[focusedRtwIdx]) {
        e.preventDefault();
        handleSelectStockItem(filteredStock[focusedRtwIdx]);
      }
    }
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center mb-2 bg-white p-3 border border-ragucci-border rounded shadow-sm">
      <div className="relative flex-2 w-full sm:w-auto">
        <input
          type="text"
          placeholder="Buscar Producto Terminado en Stock..."
          value={item.desc}
          onChange={(e) => {
            onChange({ ...item, desc: e.target.value });
            setShowAutocomplete(true);
            setFocusedRtwIdx(-1);
          }}
          onKeyDown={handleRtwKeydown}
          onFocus={() => setShowAutocomplete(true)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
        />
        {showAutocomplete && item.desc.trim() && filteredStock.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-ragucci-gold-light z-30 max-h-48 overflow-y-auto rounded-b shadow-lg divide-y divide-gray-100">
            {filteredStock.map((stockItem, idx) => {
              const displayPrice = stockItem.retailPrice > 0 ? stockItem.retailPrice : stockItem.costPrice;
              const totalStock = stockItem.sizes && stockItem.sizes.length > 0
                ? stockItem.sizes.reduce((acc, s) => acc + s.quantity, 0)
                : (stockItem.quantity || 0);

              const sizesSummary = stockItem.sizes && stockItem.sizes.length > 0
                ? stockItem.sizes.filter(s => s.quantity > 0).map(s => `${s.size}:${s.quantity}`).join(' ')
                : '';

              return (
                <div
                  key={stockItem.id}
                  onClick={() => handleSelectStockItem(stockItem)}
                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center ${
                    idx === focusedRtwIdx
                      ? 'bg-ragucci-primary text-ragucci-gold'
                      : 'hover:bg-amber-50 text-gray-800'
                  }`}
                >
                  <div>
                    <strong className="block font-bold">{stockItem.name}</strong>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Stock total: {totalStock} u. {sizesSummary && `(${sizesSummary})`}
                    </span>
                  </div>

                  <span className="font-extrabold text-emerald-700">
                    ${displayPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-20">
        <input
          type="number"
          min="1"
          value={item.qty}
          onChange={(e) => onChange({ ...item, qty: parseInt(e.target.value) || 1 })}
          className="w-full p-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-ragucci-gold font-bold"
        />
      </div>

      <div className="flex-1 min-w-[120px]">
        <MoneyInput
          value={item.price}
          onValueChange={(val) => onChange({ ...item, price: val })}
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer"
        title="Quitar producto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
