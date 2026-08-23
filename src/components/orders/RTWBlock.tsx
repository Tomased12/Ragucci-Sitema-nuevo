import React, { useState } from 'react';
import { RTWItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { MoneyInput } from '../common/MoneyInput';
import { Trash2 } from 'lucide-react';

interface RTWBlockProps {
  item: RTWItem;
  onChange: (updated: RTWItem) => void;
  onRemove: () => void;
}

export const RTWBlock: React.FC<RTWBlockProps> = ({ item, onChange, onRemove }) => {
  const { config } = useApp();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [focusedRtwIdx, setFocusedRtwIdx] = useState<number>(-1);

  const rtwCatalog = config.rtwPrecios || {};
  const catalogNames = Object.keys(rtwCatalog);
  const filtered = catalogNames.filter(n => n.toLowerCase().includes(item.desc.toLowerCase().trim()));

  const handleSelectCatalog = (name: string) => {
    const price = rtwCatalog[name] || 0;
    onChange({ ...item, desc: name, price });
    setShowAutocomplete(false);
    setFocusedRtwIdx(-1);
  };

  const handleRtwKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRtwIdx(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRtwIdx(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedRtwIdx >= 0 && filtered[focusedRtwIdx]) {
        e.preventDefault();
        handleSelectCatalog(filtered[focusedRtwIdx]);
      }
    }
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center mb-2 bg-white p-3 border border-ragucci-border rounded shadow-sm">
      <div className="relative flex-2 w-full sm:w-auto">
        <input
          type="text"
          placeholder="Producto Terminado (ej: Camisa Ragu)"
          value={item.desc}
          onChange={(e) => {
            onChange({ ...item, desc: e.target.value });
            setShowAutocomplete(true);
            setFocusedRtwIdx(-1);
          }}
          onKeyDown={handleRtwKeydown}
          onFocus={() => setShowAutocomplete(true)}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold"
        />
        {showAutocomplete && item.desc.trim() && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-ragucci-gold-light z-20 max-h-40 overflow-y-auto rounded-b shadow-lg">
            {filtered.map((name, idx) => (
              <div
                key={name}
                onClick={() => handleSelectCatalog(name)}
                className={`p-2 cursor-pointer text-xs font-bold flex justify-between ${
                  idx === focusedRtwIdx
                    ? 'bg-ragucci-primary text-ragucci-gold'
                    : 'hover:bg-ragucci-primary hover:text-ragucci-gold'
                }`}
              >
                <span>{name}</span>
                <span>${rtwCatalog[name]?.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-20">
        <input
          type="number"
          min="1"
          value={item.qty}
          onChange={(e) => onChange({ ...item, qty: parseInt(e.target.value) || 1 })}
          className="w-full p-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-ragucci-gold"
        />
      </div>

      <div className="w-32">
        <MoneyInput
          value={item.price}
          onValueChange={(val) => onChange({ ...item, price: val })}
        />
      </div>

      <div className="w-32 bg-gray-100 p-2 border border-gray-300 rounded text-right font-bold text-sm text-ragucci-primary">
        ${(item.qty * item.price).toLocaleString('es-AR')}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="bg-ragucci-red text-white p-2 rounded hover:bg-red-900 font-bold transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
