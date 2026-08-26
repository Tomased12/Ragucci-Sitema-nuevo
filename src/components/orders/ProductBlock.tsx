import React, { useState } from 'react';
import { ProductItem, ArregloDetalleItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { STANDARD_PRODUCTS } from '../../utils/constants';
import { MoneyInput } from '../common/MoneyInput';
import { Trash2 } from 'lucide-react';

interface ProductBlockProps {
  index: number;
  product: ProductItem;
  onChange: (updated: ProductItem) => void;
  onRemove: () => void;
}

export const ProductBlock: React.FC<ProductBlockProps> = ({
  index,
  product,
  onChange,
  onRemove
}) => {
  const { config } = useApp();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [focusedProdIdx, setFocusedProdIdx] = useState<number>(-1);
  const [customArregloName, setCustomArregloName] = useState('');
  const [customArregloPrice, setCustomArregloPrice] = useState(0);

  const isArreglo = product.description.toUpperCase().includes('ARREGLO');
  const isSastreria = /TRAJE|AMBO|PANTALON|PANTALÓN|SOBRETODO|SMOKING|CHALECO|SACO/.test(product.description.toUpperCase());
  const isCamiseria = /CAMISA/.test(product.description.toUpperCase());

  // Filter autocomplete
  const filteredProducts = STANDARD_PRODUCTS.filter(p =>
    p.toLowerCase().startsWith(product.description.toLowerCase().trim())
  );

  const handleDescChange = (val: string) => {
    setFocusedProdIdx(-1);
    const updated = { ...product, description: val };
    const upper = val.toUpperCase();

    let detectedType = '';
    if (upper.includes('TRAJE')) detectedType = 'traje';
    else if (upper.includes('AMBO')) detectedType = 'ambo';
    else if (upper.includes('SOBRETODO')) detectedType = 'sobretodo';
    else if (upper.includes('SMOKING')) detectedType = 'smoking';
    else if (upper.includes('SACO')) detectedType = 'saco';
    else if (upper.includes('PANTALON') || upper.includes('PANTALÓN')) detectedType = 'pantalon';
    else if (upper.includes('CHALECO')) detectedType = 'chaleco';

    if (detectedType && config[detectedType as keyof typeof config]) {
      const basePrice = (config[detectedType as keyof typeof config] as number) || 0;
      updated.costs = { ...updated.costs, sastre: basePrice };
    } else if (!upper.includes('ARREGLO')) {
      updated.costs = { ...updated.costs, sastre: 0 };
    }

    onChange(updated);
  };

  const handleProdKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedProdIdx(prev => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedProdIdx(prev => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedProdIdx >= 0 && filteredProducts[focusedProdIdx]) {
        e.preventDefault();
        handleDescChange(filteredProducts[focusedProdIdx]);
        setShowAutocomplete(false);
      }
    }
  };

  const handleModistaChange = (modista: string) => {
    const updated = { ...product, modista };
    if (updated.arreglosDetalle) {
      let total = 0;
      const modistaPrices = config.arreglosPrecios?.[modista] || config.arreglosPrecios?.["MARIA"] || {};
      updated.arreglosDetalle.forEach(item => {
        if (item.isCustom) {
          total += (item.price || 0) * item.qty;
        } else {
          total += (modistaPrices[item.tipo] || 0) * item.qty;
        }
      });
      updated.costs = { ...updated.costs, arreglos: total };
    }
    onChange(updated);
  };

  const addArregloItem = () => {
    const modistaSelect = product.modista || "MARIA";
    const modistaPrices = config.arreglosPrecios?.[modistaSelect] || config.arreglosPrecios?.["MARIA"] || {};
    const firstKey = Object.keys(modistaPrices)[0] || '';

    const newDetails: ArregloDetalleItem[] = [
      ...(product.arreglosDetalle || []),
      { isCustom: false, tipo: firstKey, qty: 1 }
    ];
    updateArreglosAndNotify(newDetails);
  };

  const addCustomArregloItem = () => {
    if (!customArregloName || customArregloPrice <= 0) return;
    const newDetails: ArregloDetalleItem[] = [
      ...(product.arreglosDetalle || []),
      { isCustom: true, tipo: customArregloName, price: customArregloPrice, qty: 1 }
    ];
    updateArreglosAndNotify(newDetails);
    setCustomArregloName('');
    setCustomArregloPrice(0);
  };

  const removeArregloItem = (idx: number) => {
    const newDetails = (product.arreglosDetalle || []).filter((_, i) => i !== idx);
    updateArreglosAndNotify(newDetails);
  };

  const updateArregloDetail = (idx: number, key: keyof ArregloDetalleItem, val: any) => {
    const newDetails = (product.arreglosDetalle || []).map((item, i) =>
      i === idx ? { ...item, [key]: val } : item
    );
    updateArreglosAndNotify(newDetails);
  };

  const updateArreglosAndNotify = (details: ArregloDetalleItem[]) => {
    const modistaSelect = product.modista || "MARIA";
    const modistaPrices = config.arreglosPrecios?.[modistaSelect] || config.arreglosPrecios?.["MARIA"] || {};
    let total = 0;
    details.forEach(item => {
      if (item.isCustom) {
        total += (item.price || 0) * item.qty;
      } else {
        total += (modistaPrices[item.tipo] || 0) * item.qty;
      }
    });

    onChange({
      ...product,
      arreglosDetalle: details,
      costs: { ...product.costs, arreglos: total }
    });
  };

  const handleTalleEspecial = (checked: boolean) => {
    let detectedType = '';
    const upper = product.description.toUpperCase();
    if (upper.includes('TRAJE')) detectedType = 'traje';
    else if (upper.includes('AMBO')) detectedType = 'ambo';
    else if (upper.includes('SOBRETODO')) detectedType = 'sobretodo';
    else if (upper.includes('SMOKING')) detectedType = 'smoking';
    else if (upper.includes('SACO')) detectedType = 'saco';
    else if (upper.includes('PANTALON') || upper.includes('PANTALÓN')) detectedType = 'pantalon';
    else if (upper.includes('CHALECO')) detectedType = 'chaleco';

    const basePrice = (config[detectedType as keyof typeof config] as number) || product.costs.sastre;
    const finalSastre = checked ? Math.round(basePrice * 1.15) : basePrice;

    onChange({
      ...product,
      costs: { ...product.costs, sastre: finalSastre }
    });
  };

  const handleCamiseroSelect = (camisero: string) => {
    const camiseroCost = camisero === 'diego' ? config.diego : (camisero === 'guillermo' ? config.guillermo : 0);
    onChange({
      ...product,
      camiseroSelected: camisero,
      costs: { ...product.costs, camisero: camiseroCost }
    });
  };

  return (
    <div className="bg-white border border-ragucci-border p-4 rounded-lg mb-4 border-l-4 border-l-ragucci-primary shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-extrabold text-sm uppercase text-ragucci-primary tracking-wide">
          Producto {index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 bg-ragucci-red hover:bg-red-900 text-white text-xs font-bold py-1 px-2.5 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar Producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="relative">
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
            Nombre / Detalle (Autocompletar)
          </label>
          <input
            type="text"
            value={product.description}
            onChange={(e) => handleDescChange(e.target.value)}
            onKeyDown={handleProdKeydown}
            onFocus={() => setShowAutocomplete(true)}
            placeholder="Ej: Ambo Medida o ARREGLO"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold"
          />
          {showAutocomplete && product.description.trim() && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-ragucci-gold-light z-20 max-h-40 overflow-y-auto rounded-b shadow-lg">
              {filteredProducts.map((match, idx) => (
                <div
                  key={match}
                  onClick={() => {
                    handleDescChange(match);
                    setShowAutocomplete(false);
                  }}
                  className={`p-2 cursor-pointer text-xs font-bold ${
                    idx === focusedProdIdx
                      ? 'bg-ragucci-primary text-ragucci-gold'
                      : 'hover:bg-ragucci-primary hover:text-ragucci-gold'
                  }`}
                >
                  {match}
                </div>
              ))}
            </div>
          )}
        </div>

        {isArreglo && (
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Modista de Arreglos
            </label>
            <select
              value={product.modista || ''}
              onChange={(e) => handleModistaChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold"
            >
              <option value="">- Seleccionar Modista -</option>
              <option value="MARIA">MARIA</option>
              <option value="JESUS">JESUS</option>
              <option value="ARTURO">ARTURO</option>
            </select>
          </div>
        )}
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={product.notes || ''}
          onChange={(e) => onChange({ ...product, notes: e.target.value })}
          placeholder="Notas técnicas para el taller (opcional)"
          className="w-full p-2 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:border-ragucci-gold"
        />
      </div>

      {/* Arreglos Detailed Container */}
      {isArreglo && (
        <div className="bg-[#fdfaf5] p-3 border border-ragucci-gold-light rounded mb-4">
          <h5 className="text-xs font-bold text-ragucci-primary mb-2">Detalle de Arreglos y Cantidades</h5>
          
          <div className="space-y-2 mb-3">
            {(product.arreglosDetalle || []).map((item, i) => {
              const modistaSelect = product.modista || "MARIA";
              const modistaPrices = config.arreglosPrecios?.[modistaSelect] || config.arreglosPrecios?.["MARIA"] || {};

              return (
                <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs">
                  {item.isCustom ? (
                    <input
                      type="text"
                      disabled
                      value={`${item.tipo} ($${item.price?.toLocaleString('es-AR')})`}
                      className="flex-2 p-2 bg-gray-50 border border-gray-300 rounded font-medium"
                    />
                  ) : (
                    <select
                      value={item.tipo}
                      onChange={(e) => updateArregloDetail(i, 'tipo', e.target.value)}
                      className="flex-2 p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-ragucci-gold"
                    >
                      {Object.keys(modistaPrices).sort().map((k) => (
                        <option key={k} value={k}>
                          {k} (${modistaPrices[k]?.toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateArregloDetail(i, 'qty', parseInt(e.target.value) || 1)}
                    className="w-16 p-2 border border-gray-300 rounded text-center"
                  />

                  <div className="w-24 p-2 bg-gray-100 border border-gray-300 rounded text-right font-bold text-ragucci-primary">
                    ${((item.isCustom ? (item.price || 0) : (modistaPrices[item.tipo] || 0)) * item.qty).toLocaleString('es-AR')}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeArregloItem(i)}
                    className="bg-ragucci-red text-white p-1 rounded hover:bg-red-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 items-center mb-2">
            <button
              type="button"
              onClick={addArregloItem}
              className="bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light text-xs font-bold py-1.5 px-3 rounded transition-colors"
            >
              + Agregar Otro Arreglo
            </button>
          </div>

          {/* Custom Arreglo Inputs */}
          <div className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 border border-dashed border-ragucci-gold rounded">
            <input
              type="text"
              placeholder="Nombre arreglo custom (ej: Cuello saco)"
              value={customArregloName}
              onChange={(e) => setCustomArregloName(e.target.value)}
              className="w-full sm:flex-2 p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-ragucci-gold"
            />
            <MoneyInput
              value={customArregloPrice}
              onValueChange={(val) => setCustomArregloPrice(val)}
              placeholder="Precio ($)"
              className="w-full sm:flex-1 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={addCustomArregloItem}
              className="w-full sm:w-auto bg-ragucci-primary text-ragucci-gold text-xs font-bold py-1.5 px-3 rounded"
            >
              + Agregar Extra
            </button>
          </div>
        </div>
      )}

      {/* Cost inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {!isArreglo && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-ragucci-primary-light">Telas ($)</label>
              <label className="flex items-center gap-1 text-[10px] font-extrabold cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">
                <input
                  type="checkbox"
                  checked={!!product.costs.noTelas}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    onChange({
                      ...product,
                      costs: {
                        ...product.costs,
                        noTelas: isChecked,
                        telas: isChecked ? 0 : product.costs.telas
                      }
                    });
                  }}
                  className="rounded border-gray-300"
                />
                <span>NO lleva</span>
              </label>
            </div>
            {product.costs.noTelas ? (
              <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-extrabold text-center text-xs">
                🚫 NO (No lleva costo de tela)
              </div>
            ) : (
              <MoneyInput
                value={product.costs.telas}
                onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, telas: val, noTelas: val > 0 ? false : product.costs.noTelas } })}
              />
            )}
          </div>
        )}

        {!isArreglo && isSastreria && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-ragucci-primary-light">Forrería ($)</label>
              <label className="flex items-center gap-1 text-[10px] font-extrabold cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">
                <input
                  type="checkbox"
                  checked={!!product.costs.noForreria}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    onChange({
                      ...product,
                      costs: {
                        ...product.costs,
                        noForreria: isChecked,
                        forreria: isChecked ? 0 : product.costs.forreria
                      }
                    });
                  }}
                  className="rounded border-gray-300"
                />
                <span>NO lleva</span>
              </label>
            </div>
            {product.costs.noForreria ? (
              <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-extrabold text-center text-xs">
                🚫 NO (No lleva forrería)
              </div>
            ) : (
              <MoneyInput
                value={product.costs.forreria}
                onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, forreria: val, noForreria: val > 0 ? false : product.costs.noForreria } })}
              />
            )}
          </div>
        )}

        {!isArreglo && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-ragucci-primary-light">Santiago (Sastre)</label>
              <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => handleTalleEspecial(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Talle Esp. (+15%)
              </label>
            </div>
            <MoneyInput
              value={product.costs.sastre}
              onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, sastre: val } })}
            />
          </div>
        )}

        {!isArreglo && isCamiseria && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-ragucci-primary-light">Camisero</label>
              <select
                value={product.camiseroSelected || ''}
                onChange={(e) => handleCamiseroSelect(e.target.value)}
                className="text-[10px] p-0.5 border border-gray-300 rounded"
              >
                <option value="">- Asignar -</option>
                <option value="diego">Diego</option>
                <option value="guillermo">Guillermo</option>
              </select>
            </div>
            <MoneyInput
              value={product.costs.camisero}
              onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, camisero: val } })}
            />
          </div>
        )}

        {isArreglo && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-ragucci-primary-light">Arreglos Total ($)</label>
              <label className="flex items-center gap-1 text-[10px] font-extrabold cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">
                <input
                  type="checkbox"
                  checked={!!product.costs.noArreglos}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    onChange({
                      ...product,
                      costs: {
                        ...product.costs,
                        noArreglos: isChecked,
                        arreglos: isChecked ? 0 : product.costs.arreglos
                      }
                    });
                  }}
                  className="rounded border-gray-300"
                />
                <span>NO lleva</span>
              </label>
            </div>
            {product.costs.noArreglos ? (
              <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-extrabold text-center text-xs">
                🚫 NO (Sin costo de arreglos)
              </div>
            ) : (
              <MoneyInput
                value={product.costs.arreglos}
                onValueChange={() => {}}
                disabled
                className="bg-gray-100 font-bold"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
