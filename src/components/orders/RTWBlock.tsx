import React, { useState } from 'react';
import { RTWItem, StockItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { MoneyInput } from '../common/MoneyInput';
import { formatMoney } from '../../utils/formatters';
import { Trash2, Gift } from 'lucide-react';

interface RTWBlockProps {
  item: RTWItem;
  clientName?: string;
  onChange: (updated: RTWItem) => void;
  onRemove: () => void;
}

export const RTWBlock: React.FC<RTWBlockProps> = ({ item, clientName, onChange, onRemove }) => {
  const { stockItems, orders } = useApp();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [focusedRtwIdx, setFocusedRtwIdx] = useState<number>(-1);

  const filteredStock = stockItems.filter(s => 
    s.name.toLowerCase().includes(item.desc.toLowerCase().trim()) ||
    s.code.toLowerCase().includes(item.desc.toLowerCase().trim())
  );

  const handleSelectStockItem = (stockItem: StockItem) => {
    const saleVal = stockItem.retailPrice > 0 ? stockItem.retailPrice : (stockItem.costPrice || 0);
    const costVal = stockItem.costPrice || 0;
    onChange({ 
      ...item, 
      desc: stockItem.name, 
      salePrice: item.isGift ? 0 : saleVal,
      costPrice: costVal,
      price: costVal // Mantiene compatibilidad con costs.pterminado
    });
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

  // Buscar precio histórico cobrado por este producto terminado
  const pastRtwReference = React.useMemo(() => {
    if (!item.desc || item.desc.trim().length < 2) return null;
    const cleanDesc = item.desc.trim().toUpperCase();

    // 1. Prioridad: ¿Se le cobró previamente este RTW a este cliente?
    if (clientName && clientName.trim()) {
      const cUpper = clientName.trim().toUpperCase();
      for (const o of orders) {
        if (o.client?.toUpperCase() === cUpper) {
          const matchR = (o.rtwItems || []).find(r => 
            r.desc && 
            (r.salePrice || r.price) && 
            (r.desc.toUpperCase().includes(cleanDesc) || cleanDesc.includes(r.desc.toUpperCase()))
          );
          if (matchR) {
            const p = matchR.salePrice !== undefined ? matchR.salePrice : matchR.price;
            if (p > 0) {
              return { label: `Último cobrado a ${clientName}`, price: p };
            }
          }
        }
      }
    }

    // 2. Referencia general de compras recientes
    for (const o of orders) {
      const matchR = (o.rtwItems || []).find(r => 
        r.desc && 
        (r.salePrice || r.price) && 
        (r.desc.toUpperCase().includes(cleanDesc) || cleanDesc.includes(r.desc.toUpperCase()))
      );
      if (matchR) {
        const p = matchR.salePrice !== undefined ? matchR.salePrice : matchR.price;
        if (p > 0) {
          return { label: `Último cobrado en sistema (${o.client || 'Cliente'})`, price: p };
        }
      }
    }

    return null;
  }, [item.desc, clientName, orders]);

  return (
    <div className={`p-3 border rounded shadow-sm mb-3 space-y-2.5 transition-all ${
      item.isGift ? 'bg-purple-50/40 border-purple-300' : 'bg-white border-ragucci-border'
    }`}>
      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
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
          <label className="block text-[10px] font-bold text-gray-400 uppercase text-center mb-0.5">Cant.</label>
          <input
            type="number"
            min="1"
            value={item.qty}
            onChange={(e) => onChange({ ...item, qty: parseInt(e.target.value) || 1 })}
            className="w-full p-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-ragucci-gold font-bold"
          />
        </div>

        {/* Estado Prenda RTW */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 px-2 py-1.5 rounded shrink-0 self-end mb-0.5">
          <span className="text-[10px] font-black text-gray-500 uppercase">Estado:</span>
          <select
            value={item.status || '🔴 Pendiente'}
            onChange={(e) => onChange({ ...item, status: e.target.value })}
            className="text-xs font-black bg-white border border-gray-300 rounded px-1.5 py-0.5 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
          >
            <option value="🔴 Pendiente">🔴 Pendiente</option>
            <option value="📦 Despachado">📦 Despachado</option>
            <option value="🟢 Entregado">🟢 Entregado</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextGift = !item.isGift;
            onChange({
              ...item,
              isGift: nextGift,
              salePrice: nextGift ? 0 : (item.salePrice !== undefined ? item.salePrice : item.price)
            });
          }}
          className={`p-2 rounded text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 self-end mb-0.5 ${
            item.isGift
              ? 'bg-purple-700 text-white border-purple-800'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
          }`}
          title="Marcar como Regalo / Cortesía"
        >
          <Gift className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{item.isGift ? '🎁 Regalo' : 'Regalo'}</span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer self-end mb-0.5"
          title="Quitar producto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Precios: Venta y Costo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dashed border-gray-200">
        <div>
          <label className="block text-[11px] font-bold text-ragucci-primary-light mb-0.5 flex justify-between">
            <span>💰 Precio Cobrado al Cliente ($)</span>
            <span className="text-[10px] text-gray-400 font-normal">
              {item.isGift ? 'Regalo ($0)' : 'Venta x unidad'}
            </span>
          </label>
          <MoneyInput
            value={item.salePrice !== undefined ? item.salePrice : (item.price || 0)}
            onValueChange={(val) => onChange({ ...item, salePrice: val })}
            disabled={item.isGift}
          />
          {pastRtwReference && !item.isGift && (
            <div className="mt-1 flex items-center justify-between text-[10px] bg-amber-50 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
              <span className="text-amber-950 font-medium truncate">
                💡 {pastRtwReference.label}: <strong className="text-emerald-800">${formatMoney(pastRtwReference.price)}</strong>
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...item, salePrice: pastRtwReference.price })}
                className="text-[9.5px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-black px-1.5 py-0.2 rounded shrink-0 ml-1.5 transition-colors cursor-pointer"
                title="Copiar precio de referencia"
              >
                Usar precio
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-0.5 flex justify-between">
            <span>🏷️ Costo Reposición / Inversión ($)</span>
            <span className="text-[10px] text-gray-400 font-normal">Costo x unidad</span>
          </label>
          <MoneyInput
            value={item.costPrice !== undefined ? item.costPrice : item.price}
            onValueChange={(val) => onChange({ ...item, costPrice: val, price: val })}
          />
        </div>
      </div>

      <div>
        <input
          type="text"
          placeholder="Detalle u observaciones opcionales (ej: Talle M, Color Azul, Modista María...)"
          value={item.notes || ''}
          onChange={(e) => onChange({ ...item, notes: e.target.value })}
          className="w-full p-1.5 border border-gray-200 rounded text-xs text-gray-700 bg-gray-50 focus:outline-none focus:border-ragucci-gold font-medium"
        />
      </div>
    </div>
  );
};
