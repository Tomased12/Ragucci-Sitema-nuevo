import React, { useState } from 'react';
import { ProductItem, ArregloDetalleItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { STANDARD_PRODUCTS } from '../../utils/constants';
import { MoneyInput } from '../common/MoneyInput';
import { formatMoney } from '../../utils/formatters';
import { Trash2, Gift } from 'lucide-react';

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

  const upperDesc = product.description.toUpperCase();
  const isArreglo = upperDesc.includes('ARREGLO');
  const isRTW = upperDesc.includes('RTW') || upperDesc.includes('TERMINADO');
  const isMedida = !isArreglo && !isRTW;
  const isSastreria = /TRAJE|AMBO|PANTALON|PANTALÓN|SOBRETODO|SMOKING|CHALECO|SACO/.test(upperDesc);
  const isForreriaApplicable = isMedida && /SACO|AMBO|SOBRETODO|SMOKING|TRAJE/.test(upperDesc);
  const isCamiseria = /CAMISA/.test(upperDesc);

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
      e.preventDefault();
      if (focusedProdIdx >= 0 && focusedProdIdx < filteredProducts.length) {
        handleDescChange(filteredProducts[focusedProdIdx]);
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
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

  const productItemTotalCost = (product.costs.sastre || 0) + (product.costs.telas || 0) + (product.costs.forreria || 0) + (product.costs.camisero || 0) + (product.costs.arreglos || 0) + (product.costs.otros || 0);

  return (
    <div className={`bg-white border p-4 rounded-lg mb-4 border-l-4 shadow-sm transition-all ${
      product.isGift ? 'border-purple-300 border-l-purple-700 bg-purple-50/20' : 'border-ragucci-border border-l-ragucci-primary'
    }`}>
      <div className="flex justify-between items-center mb-3 gap-2">
        <h4 className="font-extrabold text-sm uppercase text-ragucci-primary tracking-wide flex items-center gap-2">
          <span>Producto {index + 1}</span>
          {product.isGift && (
            <span className="bg-purple-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs animate-pulse">
              <Gift className="w-3 h-3" />
              <span>Regalo / Cortesía</span>
            </span>
          )}
        </h4>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...product, isGift: !product.isGift })}
            className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded transition-all cursor-pointer border ${
              product.isGift
                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{product.isGift ? '🎁 Es Regalo / Cortesía' : 'Marcar como Regalo'}</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 bg-ragucci-red hover:bg-red-900 text-white text-xs font-bold py-1 px-2.5 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {product.isGift && (
        <div className="bg-purple-100/70 p-2.5 rounded-lg border border-purple-300 mb-3 flex items-center justify-between text-xs text-purple-950 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🎁</span>
            <span>Prenda entregada como <strong>Regalo / Cortesía</strong> (Precio al cliente: $0). Sus costos de producción (<strong>${formatMoney(productItemTotalCost)}</strong>) se sumarán a la tarjeta de <strong>Inversión en Regalos del Balance</strong>.</span>
          </span>
        </div>
      )}

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
              className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="MARIA">María (Modista Arreglos)</option>
              <option value="JESUS">Jesús (Modista Arreglos)</option>
              <option value="ARTURO">Arturo (Modista Arreglos)</option>
            </select>
          </div>
        )}
      </div>

      {/* Color Selector for A Medida Products */}
      {isMedida && (
        <div className="mb-4 bg-ragucci-bg p-3.5 rounded-lg border border-ragucci-gold-light space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ragucci-gold-light/60 pb-2">
            <label className="text-xs font-extrabold uppercase text-ragucci-primary flex items-center gap-1.5">
              <span>🎨 Selección de Color de Tela / Prenda (A Medida)</span>
            </label>
            {product.color && (
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-ragucci-gold-light shadow-2xs">
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: product.colorHex || '#1B2A4A' }}
                />
                <span className="text-xs font-extrabold text-ragucci-primary">{product.color}</span>
              </div>
            )}
          </div>

          {/* Full Spectrum Native Color Picker Button */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2.5 bg-gradient-to-r from-ragucci-primary via-[#3b1212] to-ragucci-primary text-ragucci-gold hover:opacity-95 font-extrabold text-xs py-2 px-3.5 rounded border border-ragucci-gold/50 cursor-pointer transition-all shadow-xs shrink-0">
              <input
                type="color"
                value={product.colorHex || '#1B2A4A'}
                onChange={(e) => {
                  const hex = e.target.value;
                  onChange({
                    ...product,
                    colorHex: hex,
                    color: product.color && !product.color.startsWith('Tono') ? `${product.color} (${hex})` : `Tono Personalizado (${hex})`
                  });
                }}
                className="w-7 h-7 rounded cursor-pointer border border-ragucci-gold p-0.5 bg-white shrink-0"
                title="Hacer clic para abrir la paleta interactiva de color exacto"
              />
              <span>🎨 ABRIR PALETA INTERACTIVA DE COLOR EXACTO</span>
            </label>

            <span className="text-xs text-gray-500 font-medium italic hidden sm:inline">
              (Haz clic en el cuadro para elegir cualquier matiz exacto en el espectro completo)
            </span>
          </div>

          {/* Expanded Presets Palette */}
          <div>
            <span className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
              O seleccionar tono clásico de sastrería / camisería:
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { label: 'Azul Marino', hex: '#1B2A4A', text: '#FFFFFF' },
                { label: 'Azul Noche', hex: '#0D1B2A', text: '#FFFFFF' },
                { label: 'Azul Francia', hex: '#1E3A8A', text: '#FFFFFF' },
                { label: 'Celeste', hex: '#BAE6FD', text: '#0F172A' },
                { label: 'Azul Acero', hex: '#4682B4', text: '#FFFFFF' },
                { label: 'Negro Azabache', hex: '#0F0F10', text: '#FFFFFF' },
                { label: 'Gris Marengo', hex: '#2D3748', text: '#FFFFFF' },
                { label: 'Gris Medio', hex: '#718096', text: '#FFFFFF' },
                { label: 'Gris Plata', hex: '#CBD5E1', text: '#0F172A' },
                { label: 'Blanco', hex: '#FFFFFF', text: '#0F172A', border: true },
                { label: 'Verde Inglés', hex: '#14532D', text: '#FFFFFF' },
                { label: 'Verde Botella', hex: '#064E3B', text: '#FFFFFF' },
                { label: 'Bordó', hex: '#701A75', text: '#FFFFFF' },
                { label: 'Vino', hex: '#4C1D95', text: '#FFFFFF' },
                { label: 'Carmesí', hex: '#991B1B', text: '#FFFFFF' },
                { label: 'Beige / Arena', hex: '#D6C0B3', text: '#1E293B' },
                { label: 'Camel', hex: '#C19A6B', text: '#FFFFFF' },
                { label: 'Marrón', hex: '#4A2E2B', text: '#FFFFFF' },
                { label: 'Tabaco', hex: '#78350F', text: '#FFFFFF' },
                { label: 'Terracota', hex: '#9A3412', text: '#FFFFFF' },
                { label: 'Rayado Diplómatico', hex: '#475569', text: '#FFFFFF' },
                { label: 'Cuadros Galés', hex: '#94A3B8', text: '#0F172A' }
              ].map((c) => {
                const isSelected = (product.color || '').toLowerCase().includes(c.label.toLowerCase()) || product.colorHex === c.hex;

                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => onChange({ ...product, color: c.label, colorHex: c.hex })}
                    className={`relative w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer shadow-xs ${
                      isSelected ? 'ring-2 ring-ragucci-gold scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'
                    } ${c.border ? 'border border-gray-300' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  >
                    {isSelected && (
                      <span style={{ color: c.text }} className="text-xs font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Especificar tono o código de tela (ej: Azul Marino Loro Piana 130s, Gris Galés, etc.)"
              value={product.color || ''}
              onChange={(e) => onChange({ ...product, color: e.target.value })}
              className="w-full text-xs p-2 border border-gray-300 rounded bg-white font-medium focus:outline-none focus:border-ragucci-gold"
            />
          </div>
        </div>
      )}

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
        {isMedida && (
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
              <>
                <MoneyInput
                  value={product.costs.telas}
                  onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, telas: val, noTelas: val > 0 ? false : product.costs.noTelas } })}
                />
                <div className="mt-1.5">
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-0.5">
                    Proveedor de Tela
                  </label>
                  <select
                    value={product.proveedorTela || ''}
                    onChange={(e) => onChange({ ...product, proveedorTela: e.target.value })}
                    className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold bg-white text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {isCamiseria ? (
                      <>
                        <option value="Costa (Perú)">Costa (Perú)</option>
                        <option value="Capetown (Albini)">Capetown (Albini)</option>
                        <option value="Juan Martín (Canclini)">Juan Martín (Canclini)</option>
                      </>
                    ) : (
                      <>
                        <option value="Capetown">Capetown</option>
                        <option value="Juan Martín">Juan Martín</option>
                        <option value="Tesur (Vitale)">Tesur (Vitale)</option>
                        <option value="Scabal">Scabal</option>
                        <option value="Costa (Dourmeuil)">Costa (Dourmeuil)</option>
                      </>
                    )}
                    <option value="Otro / Sin Especificar">Otro / Sin Especificar</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {!isArreglo && isForreriaApplicable && (
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
              <>
                <MoneyInput
                  value={product.costs.forreria}
                  onValueChange={(val) => onChange({ ...product, costs: { ...product.costs, forreria: val, noForreria: val > 0 ? false : product.costs.noForreria } })}
                />
                <div className="mt-1.5">
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-0.5">
                    Proveedor de Forrería
                  </label>
                  <select
                    value={product.proveedorForreria || ''}
                    onChange={(e) => onChange({ ...product, proveedorForreria: e.target.value })}
                    className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold bg-white text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    <option value="Capetown">Capetown</option>
                    <option value="Otro / Sin Especificar">Otro / Sin Especificar</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {!isArreglo && isSastreria && (
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
