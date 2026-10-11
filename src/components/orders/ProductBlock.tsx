import React, { useState, useEffect } from 'react';
import { ProductItem, ArregloDetalleItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { STANDARD_PRODUCTS } from '../../utils/constants';
import { MoneyInput } from '../common/MoneyInput';
import { formatMoney, getTodayString } from '../../utils/formatters';
import { REDA_BOOKS, REDA_FABRICS, findRedaFabric, getFabricsForBook, getDefaultTailoringMeters } from '../../data/redaFabrics';
import { Trash2, Gift } from 'lucide-react';

export const detectColorHex = (text: string): string => {
  if (!text) return '#1B2A4A';
  const upper = text.toUpperCase();

  if (upper.includes('AZUL MARINO') || upper.includes('MARINO')) return '#1B2A4A';
  if (upper.includes('AZUL NOCHE') || upper.includes('NOCHE')) return '#0D1B2A';
  if (upper.includes('AZUL FRANCIA') || upper.includes('FRANCIA')) return '#1E3A8A';
  if (upper.includes('AZUL ACERO') || upper.includes('ACERO')) return '#4682B4';
  if (upper.includes('CELESTE')) return '#BAE6FD';
  if (upper.includes('AZUL')) return '#1E3A8A';

  if (upper.includes('NEGRO') || upper.includes('AZABACHE')) return '#0F0F10';

  if (upper.includes('GRIS MARENGO') || upper.includes('MARENGO')) return '#2D3748';
  if (upper.includes('GRIS PLATA') || upper.includes('PLATA')) return '#CBD5E1';
  if (upper.includes('GRIS CLARO')) return '#E2E8F0';
  if (upper.includes('GRIS MEDIO')) return '#718096';
  if (upper.includes('GRIS OSCO') || upper.includes('GRIS OSCURO')) return '#334155';
  if (upper.includes('GRIS')) return '#718096';

  if (upper.includes('VERDE INGLÉS') || upper.includes('INGLES') || upper.includes('INGLÉS')) return '#14532D';
  if (upper.includes('VERDE BOTELLA') || upper.includes('BOTELLA')) return '#064E3B';
  if (upper.includes('VERDE MILITAR') || upper.includes('MILITAR')) return '#3F6212';
  if (upper.includes('VERDE')) return '#14532D';

  if (upper.includes('BORDÓ') || upper.includes('BORDO') || upper.includes('BURGUNDY')) return '#701A75';
  if (upper.includes('VINO')) return '#4C1D95';
  if (upper.includes('CARMESÍ') || upper.includes('CARMESI') || upper.includes('ROJO')) return '#991B1B';
  if (upper.includes('ROSA')) return '#F472B6';

  if (upper.includes('BEIGE') || upper.includes('ARENA')) return '#D6C0B3';
  if (upper.includes('CAMEL')) return '#C19A6B';
  if (upper.includes('MARRÓN') || upper.includes('MARRON') || upper.includes('CHOCOLATE')) return '#4A2E2B';
  if (upper.includes('TABACO')) return '#78350F';
  if (upper.includes('TERRACOTA')) return '#9A3412';

  if (upper.includes('BLANCO') || upper.includes('OFF WHITE')) return '#FFFFFF';
  if (upper.includes('CREMA') || upper.includes('MARFIL') || upper.includes('IVORY')) return '#FEF3C7';

  if (upper.includes('RAYADO') || upper.includes('DIPLOMATICO') || upper.includes('DIPLOMÁTICO')) return '#475569';
  if (upper.includes('GALÉS') || upper.includes('GALES') || upper.includes('CUADROS')) return '#94A3B8';

  return '#1B2A4A';
};

const CLASSIC_COLOR_PRESETS = [
  { label: 'Azul Marino', hex: '#1B2A4A' },
  { label: 'Azul Noche', hex: '#0D1B2A' },
  { label: 'Azul Francia', hex: '#1E3A8A' },
  { label: 'Celeste', hex: '#BAE6FD' },
  { label: 'Negro', hex: '#0F0F10' },
  { label: 'Gris Marengo', hex: '#2D3748' },
  { label: 'Gris Medio', hex: '#718096' },
  { label: 'Gris Plata', hex: '#CBD5E1' },
  { label: 'Verde Inglés', hex: '#14532D' },
  { label: 'Bordó', hex: '#701A75' },
  { label: 'Beige / Arena', hex: '#D6C0B3' },
  { label: 'Camel', hex: '#C19A6B' },
  { label: 'Marrón', hex: '#4A2E2B' },
  { label: 'Blanco', hex: '#FFFFFF' }
];

interface ProductBlockProps {
  index: number;
  product: ProductItem;
  origin?: string;
  clientName?: string;
  onChange: (updated: ProductItem) => void;
  onRemove: () => void;
}

export const ProductBlock: React.FC<ProductBlockProps> = ({
  index,
  product,
  origin,
  clientName,
  onChange,
  onRemove
}) => {
  const { config, dolarBlueVenta, orders } = useApp();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [focusedProdIdx, setFocusedProdIdx] = useState<number>(-1);
  const [customArregloName, setCustomArregloName] = useState('');
  const [customArregloPrice, setCustomArregloPrice] = useState(0);

  const upperDesc = product.description.toUpperCase();
  const isArreglo = upperDesc.includes('ARREGLO') || (origin && origin.toLowerCase().includes('arreglo')) || (Boolean(product.costs?.arreglos && product.costs.arreglos > 0) && !product.costs?.sastre && !product.costs?.camisero && !product.costs?.telas);
  const isRTW = upperDesc.includes('RTW') || upperDesc.includes('TERMINADO');
  const isMedida = !isArreglo && !isRTW;
  const isSastreria = /TRAJE|AMBO|PANTALON|PANTALÓN|SOBRETODO|SMOKING|CHALECO|SACO/.test(upperDesc);
  const isForreriaApplicable = isMedida && /SACO|AMBO|SOBRETODO|SMOKING|TRAJE/.test(upperDesc);
  const isCamiseria = /CAMISA/.test(upperDesc);

  // Buscar precio histórico de referencia para esta prenda
  const pastPriceReference = React.useMemo(() => {
    if (!product.description || product.description.trim().length < 2) return null;
    const cleanDesc = product.description.trim().toUpperCase();

    // 1. Prioridad: ¿Se le cobró previamente esta prenda a este cliente?
    if (clientName && clientName.trim()) {
      const cUpper = clientName.trim().toUpperCase();
      for (const o of orders) {
        if (o.client?.toUpperCase() === cUpper) {
          const matchP = (o.products || []).find(p =>
            p.description &&
            p.price &&
            p.price > 0 &&
            (p.description.toUpperCase().includes(cleanDesc) || cleanDesc.includes(p.description.toUpperCase()))
          );
          if (matchP && matchP.price) {
            return {
              label: `Último cobrado a ${clientName}`,
              price: matchP.price
            };
          }
        }
      }
    }

    // 2. Referencia general: ¿Cuánto se cobró por esta prenda en compras recientes?
    for (const o of orders) {
      const matchP = (o.products || []).find(p =>
        p.description &&
        p.price &&
        p.price > 0 &&
        (p.description.toUpperCase().includes(cleanDesc) || cleanDesc.includes(p.description.toUpperCase()))
      );
      if (matchP && matchP.price) {
        return {
          label: `Último cobrado en sistema (${o.client || 'Cliente'})`,
          price: matchP.price
        };
      }
    }

    return null;
  }, [product.description, clientName, orders]);

  // Auto-sync Cerutti S130 & REDA fabric cost in ARS if it was stored in USD (< 5000) or missing totalARS
  useEffect(() => {
    if (product.catalogoTela === 'Cerutti S130' || (product.proveedorTela === 'Juan Martín' && product.catalogoTela === 'Cerutti S130')) {
      const curM = product.ceruttiCalc?.metros ?? getDefaultTailoringMeters(product.description);
      const curPEUR = product.ceruttiCalc?.precioEUR ?? 94;
      const curCEURUSD = product.ceruttiCalc?.cambioEURUSD ?? 1.16;
      const curDolarBlue = product.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
      const curFleteUSD = Number((curM * 9.60).toFixed(2));
      const curSubtotalEUR = Number((curM * curPEUR).toFixed(2));
      const curSubtotalUSD = Number((curSubtotalEUR * curCEURUSD).toFixed(2));
      const curTotalUSD = Number((curSubtotalUSD + curFleteUSD).toFixed(2));
      const curTotalARS = Math.round(curTotalUSD * curDolarBlue);

      if (product.costs.telas !== curTotalARS && (product.costs.telas < 5000 || product.costs.telas === curTotalUSD || !product.ceruttiCalc?.totalARS)) {
        onChange({
          ...product,
          ceruttiCalc: {
            ...(product.ceruttiCalc || {}),
            metros: curM,
            pesoKg: Number((curM * 0.24).toFixed(3)),
            fleteUSD: curFleteUSD,
            precioEUR: curPEUR,
            cambioEURUSD: curCEURUSD,
            subtotalEUR: curSubtotalEUR,
            subtotalUSD: curSubtotalUSD,
            totalUSD: curTotalUSD,
            dolarBlue: curDolarBlue,
            totalARS: curTotalARS,
            codigoTela: product.ceruttiCalc?.codigoTela || ''
          },
          costs: {
            ...product.costs,
            telas: curTotalARS
          }
        });
      }
    } else if (product.catalogoTela === 'REDA' || (product.proveedorTela === 'Capetown' && product.catalogoTela === 'REDA')) {
      const curM = product.redaCalc?.metros ?? getDefaultTailoringMeters(product.description);
      const curCutUSD = product.redaCalc?.cutlengthUSD ?? 91;
      const curDolar = product.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
      const subUSD = Number((curM * curCutUSD).toFixed(2));
      const subARS = Math.round(subUSD * curDolar);
      const iva = Number((subARS * 0.105).toFixed(2));
      const totARS = Number((subARS * 1.105).toFixed(2));

      if (product.costs.telas !== totARS && (product.costs.telas < 5000 || product.costs.telas === subUSD || !product.redaCalc?.totalARS)) {
        onChange({
          ...product,
          redaCalc: {
            ...(product.redaCalc || {
              book: 'Ceremony Selection',
              itemCode: '50.23',
              description: 'Ceremony / Glamour gabardine'
            }),
            metros: curM,
            cutlengthUSD: curCutUSD,
            subtotalUSD: subUSD,
            dolarRate: curDolar,
            subtotalARS: subARS,
            ivaPercent: 10.5,
            ivaARS: iva,
            totalARS: totARS
          },
          costs: {
            ...product.costs,
            telas: totARS
          }
        });
      }
    }
  }, [product.catalogoTela, product.proveedorTela, product.costs.telas, dolarBlueVenta]);

  // Filter autocomplete
  const filteredProducts = STANDARD_PRODUCTS.filter(p =>
    p.toLowerCase().startsWith(product.description.toLowerCase().trim())
  );

  const handleDescChange = (val: string) => {
    setFocusedProdIdx(-1);
    const updated = { ...product, description: val };
    const upper = val.toUpperCase();

    let detectedType = '';
    if (upper.includes('SMOKING') && (upper.includes('CHALECO') || upper.includes('C/CHALECO') || upper.includes('C/ CHALECO'))) {
      detectedType = 'smoking_chaleco';
    } else if (upper.includes('TRAJE')) detectedType = 'traje';
    else if (upper.includes('AMBO')) detectedType = 'ambo';
    else if (upper.includes('SOBRETODO')) detectedType = 'sobretodo';
    else if (upper.includes('SMOKING')) detectedType = 'smoking';
    else if (upper.includes('SACO')) detectedType = 'saco';
    else if (upper.includes('PANTALON') || upper.includes('PANTALÓN')) detectedType = 'pantalon';
    else if (upper.includes('CHALECO')) detectedType = 'chaleco';

    if (detectedType) {
      const basePrice = (config[detectedType as keyof typeof config] as number) || (detectedType === 'smoking_chaleco' ? 440000 : 0);
      updated.costs = { ...updated.costs, sastre: basePrice };
    } else if (!upper.includes('ARREGLO')) {
      updated.costs = { ...updated.costs, sastre: 0 };
    }

    // Auto-update tailoring fabric meterage if REDA or Cerutti is active
    const newM = getDefaultTailoringMeters(val);
    if (updated.catalogoTela === 'REDA' && updated.redaCalc) {
      const curReda = updated.redaCalc;
      const cutUSD = curReda.cutlengthUSD || 91;
      const dRate = curReda.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
      const subUSD = Number((newM * cutUSD).toFixed(2));
      const subARS = Math.round(subUSD * dRate);
      const iva = Number((subARS * 0.105).toFixed(2));
      const totARS = Number((subARS * 1.105).toFixed(2));

      updated.redaCalc = {
        ...curReda,
        metros: newM,
        subtotalUSD: subUSD,
        dolarRate: dRate,
        subtotalARS: subARS,
        ivaARS: iva,
        totalARS: totARS
      };
      updated.costs = {
        ...updated.costs,
        telas: totARS
      };
    } else if (updated.catalogoTela === 'Cerutti S130' && updated.ceruttiCalc) {
      const curC = updated.ceruttiCalc;
      const curPEUR = curC.precioEUR ?? 94;
      const curCEURUSD = curC.cambioEURUSD ?? 1.16;
      const curDolarBlue = curC.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
      const curFleteUSD = Number((newM * 9.60).toFixed(2));
      const curSubtotalEUR = Number((newM * curPEUR).toFixed(2));
      const curSubtotalUSD = Number((curSubtotalEUR * curCEURUSD).toFixed(2));
      const curTotalUSD = Number((curSubtotalUSD + curFleteUSD).toFixed(2));
      const curTotalARS = Math.round(curTotalUSD * curDolarBlue);

      updated.ceruttiCalc = {
        ...curC,
        metros: newM,
        pesoKg: Number((newM * 0.24).toFixed(3)),
        fleteUSD: curFleteUSD,
        subtotalEUR: curSubtotalEUR,
        subtotalUSD: curSubtotalUSD,
        totalUSD: curTotalUSD,
        totalARS: curTotalARS
      };
      updated.costs = {
        ...updated.costs,
        telas: curTotalARS
      };
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
    if (upper.includes('SMOKING') && (upper.includes('CHALECO') || upper.includes('C/CHALECO') || upper.includes('C/ CHALECO'))) {
      detectedType = 'smoking_chaleco';
    } else if (upper.includes('TRAJE')) detectedType = 'traje';
    else if (upper.includes('AMBO')) detectedType = 'ambo';
    else if (upper.includes('SOBRETODO')) detectedType = 'sobretodo';
    else if (upper.includes('SMOKING')) detectedType = 'smoking';
    else if (upper.includes('SACO')) detectedType = 'saco';
    else if (upper.includes('PANTALON') || upper.includes('PANTALÓN')) detectedType = 'pantalon';
    else if (upper.includes('CHALECO')) detectedType = 'chaleco';

    const basePrice = (config[detectedType as keyof typeof config] as number) || (detectedType === 'smoking_chaleco' ? 440000 : product.costs.sastre);
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Garment Status Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
            <span className="text-[10px] font-black text-gray-500 uppercase">Estado Prenda:</span>
            {(() => {
              if (isArreglo) {
                const getArregloVal = (s?: string) => {
                  if (!s || s.includes('Local') || s.includes('Pendiente')) return '🟠 En el Local';
                  if (s.includes('María')) return '🟡 En Taller (María)';
                  if (s.includes('Jesús')) return '🟡 En Taller (Jesús)';
                  if (s.includes('Arturo')) return '🟡 En Taller (Arturo)';
                  if (s.includes('Raúl') || s.includes('Raul')) return '🟡 En Taller (Raúl)';
                  if (s.includes('Otro')) return '🟡 En Taller (Otro)';
                  if (s.includes('Taller')) return '🟡 En Taller';
                  if (s.includes('Realizado') || s.includes('Prueba')) return '🔵 Arreglo Realizado';
                  if (s.includes('Entregado')) return '🟢 Entregado';
                  return '🟠 En el Local';
                };

                return (
                  <select
                    value={getArregloVal(product.status)}
                    onChange={(e) => {
                      const val = e.target.value;
                      let modistaToSet: string | undefined = undefined;
                      if (val.includes('María')) modistaToSet = 'MARIA';
                      else if (val.includes('Jesús')) modistaToSet = 'JESUS';
                      else if (val.includes('Arturo')) modistaToSet = 'ARTURO';
                      else if (val.includes('Raúl')) modistaToSet = 'RAUL';
                      else if (val.includes('Otro')) modistaToSet = 'OTRO';

                      onChange({
                        ...product,
                        status: val,
                        modista: modistaToSet || product.modista
                      });
                    }}
                    className="text-xs font-black bg-white border border-gray-300 rounded px-2 py-0.5 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                  >
                    <option value="🟠 En el Local">🟠 En el Local</option>
                    <optgroup label="Taller">
                      <option value="🟡 En Taller">🟡 En Taller (General)</option>
                      <option value="🟡 En Taller (María)">🟡 Taller (María)</option>
                      <option value="🟡 En Taller (Jesús)">🟡 Taller (Jesús)</option>
                      <option value="🟡 En Taller (Arturo)">🟡 Taller (Arturo)</option>
                      <option value="🟡 En Taller (Raúl)">🟡 Taller (Raúl)</option>
                      <option value="🟡 En Taller (Otro)">🟡 Taller (Otro)</option>
                    </optgroup>
                    <option value="🔵 Arreglo Realizado">🔵 Arreglo Realizado</option>
                    <option value="🟢 Entregado">🟢 Entregado</option>
                  </select>
                );
              }

              const isRTWItem = isRTW || (Boolean(origin && (origin.includes('Tienda Nube') || origin.includes('RTW'))) && !isSastreria && !isCamiseria);
              if (isRTWItem) {
                return (
                  <select
                    value={product.status || '🔴 Pendiente'}
                    onChange={(e) => onChange({ ...product, status: e.target.value })}
                    className="text-xs font-black bg-white border border-gray-300 rounded px-2 py-0.5 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                  >
                    <option value="🔴 Pendiente">🔴 Pendiente</option>
                    <option value="📦 Despachado">📦 Despachado</option>
                    <option value="🟢 Entregado">🟢 Entregado</option>
                  </select>
                );
              }

              return (
                <select
                  value={product.status || '🔴 Pendiente'}
                  onChange={(e) => onChange({ ...product, status: e.target.value })}
                  className="text-xs font-black bg-white border border-gray-300 rounded px-2 py-0.5 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                >
                  <option value="🔴 Pendiente">🔴 Pendiente de Tela</option>
                  <option value="🟣 Tela Pedida">🟣 Tela Pedida</option>
                  <option value="🟠 Tela en Local">🟠 Tela en Local</option>
                  <option value="🟡 En Taller">🟡 En Taller</option>
                  <option value="🔵 Prueba">🔵 Prueba</option>
                  <option value="🟢 Entregado">🟢 Entregado</option>
                </select>
              );
            })()}
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...product, isGift: !product.isGift, price: !product.isGift ? 0 : product.price })}
            className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded transition-all cursor-pointer border ${
              product.isGift
                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{product.isGift ? '🎁 Es Regalo' : 'Regalo'}</span>
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

        <div>
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>💰 Precio Cobrado al Cliente ($)</span>
            </span>
            <span className="text-[10px] text-gray-500 font-normal">
              {product.isGift ? 'Prenda de Regalo ($0)' : 'Lo que se le cobra por esta prenda'}
            </span>
          </label>
          <MoneyInput
            value={product.price || 0}
            onValueChange={(val) => onChange({ ...product, price: val })}
            disabled={product.isGift}
          />
          {pastPriceReference && !product.isGift && (
            <div className="mt-1 flex items-center justify-between text-[11px] bg-amber-50/90 border border-amber-300 px-2 py-1 rounded shadow-2xs">
              <span className="text-amber-950 font-medium truncate">
                💡 {pastPriceReference.label}: <strong className="text-emerald-800">${formatMoney(pastPriceReference.price)}</strong>
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...product, price: pastPriceReference.price })}
                className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-black px-1.5 py-0.5 rounded shrink-0 ml-1.5 transition-colors cursor-pointer"
                title="Copiar este precio de referencia"
              >
                Usar este precio
              </button>
            </div>
          )}
        </div>
      </div>

      {isArreglo && (
        <div className="mb-3">
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
            Modista de Arreglos
          </label>
          <select
            value={product.modista || ''}
            onChange={(e) => handleModistaChange(e.target.value)}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          >
            <option value="MARIA">María (Modista Arreglos)</option>
            <option value="JESUS">Jesús (Modista Arreglos)</option>
            <option value="ARTURO">Arturo (Modista Arreglos)</option>
            <option value="RAUL">Raúl (Modista Arreglos)</option>
            <option value="OTRO">Otro / Taller externo</option>
          </select>
        </div>
      )}

      {/* Color Selector with Auto-Detect & Live Color Pill */}
      {isMedida && (
        <div className="mb-4 bg-white p-3.5 rounded-lg border border-ragucci-gold-light shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <label className="text-xs font-black uppercase text-ragucci-primary flex items-center gap-1.5">
              <span>🎨 Color de Tela / Prenda (Auto-desplegable)</span>
            </label>

            {/* Live Color Badge */}
            {product.color && (
              <div className="flex items-center gap-2 bg-ragucci-primary text-ragucci-gold px-2.5 py-1 rounded-md shadow-2xs border border-ragucci-gold/30">
                <span
                  className="w-4 h-4 rounded-full border border-white/60 shadow-2xs shrink-0"
                  style={{ backgroundColor: product.colorHex || detectColorHex(product.color) }}
                />
                <span className="text-xs font-black uppercase tracking-wider">{product.color}</span>
              </div>
            )}
          </div>

          {/* Auto-detect Input Field with Integrated Color Circle */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-2.5 top-2.5 flex items-center z-10">
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs inline-block"
                  style={{ backgroundColor: product.colorHex || detectColorHex(product.color || '') }}
                  title="Vista previa del color detectado automáticamente"
                />
              </div>

              <input
                type="text"
                value={product.color || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoHex = detectColorHex(val);
                  onChange({
                    ...product,
                    color: val,
                    colorHex: autoHex
                  });
                }}
                onFocus={() => setShowColorDropdown(true)}
                onBlur={() => setTimeout(() => setShowColorDropdown(false), 200)}
                placeholder="Escribí el color (ej: Azul Marino, Negro, Gris Marengo, Verde Inglés, Beige...)"
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded bg-white font-bold text-ragucci-primary focus:outline-none focus:border-ragucci-gold"
              />

              {/* Predictive Auto-complete Dropdown */}
              {showColorDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-ragucci-gold-light z-30 max-h-52 overflow-y-auto rounded-b-lg shadow-xl mt-1">
                  {CLASSIC_COLOR_PRESETS.filter(c =>
                    !product.color || c.label.toLowerCase().includes(product.color.toLowerCase())
                  ).map((c) => (
                    <div
                      key={c.label}
                      onMouseDown={() => {
                        onChange({
                          ...product,
                          color: c.label,
                          colorHex: c.hex
                        });
                        setShowColorDropdown(false);
                      }}
                      className="p-2 flex items-center justify-between hover:bg-ragucci-primary hover:text-ragucci-gold cursor-pointer border-b border-gray-100 transition-colors text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.label}</span>
                      </div>
                      <span className="text-[10px] opacity-70 font-mono">{c.hex}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtle Color Picker Button */}
            <label className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-2 rounded-md border border-gray-300 cursor-pointer shrink-0 transition-colors" title="Seleccionar matiz exacto manualmente">
              <input
                type="color"
                value={product.colorHex || detectColorHex(product.color || '')}
                onChange={(e) => {
                  const hex = e.target.value;
                  onChange({
                    ...product,
                    colorHex: hex,
                    color: product.color || `Tono (${hex})`
                  });
                }}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <span className="text-[10px] font-extrabold uppercase hidden sm:inline">Ajustar Tono</span>
            </label>
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
                {product.catalogoTela === 'Cerutti S130' && (
                  <div className="mb-1 flex items-center justify-between text-[9.5px] font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                    <span>🇮🇹 Auto-Calculado Cerutti S130</span>
                    <span>$ ARS (Dólar Blue)</span>
                  </div>
                )}
                {product.catalogoTela === 'REDA' && (
                  <div className="mb-1 flex items-center justify-between text-[9.5px] font-black text-blue-900 bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-300">
                    <span>🇮🇹 Auto-Calculado REDA MTM (+10,5% IVA)</span>
                    <span>$ ARS</span>
                  </div>
                )}
                <MoneyInput
                  value={
                    product.catalogoTela === 'Cerutti S130' && product.costs.telas > 0 && product.costs.telas < 5000
                      ? Math.round((product.ceruttiCalc?.totalUSD || product.costs.telas) * (product.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350)))
                      : product.costs.telas
                  }
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
                    <option value="RAGUCCI">🧵 RAGUCCI (Tela Propia)</option>
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
                  {product.proveedorTela === 'RAGUCCI' && (
                    <div className="mt-1 flex items-center justify-between text-[9.5px] font-bold text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                      <span>🏷️ Tela Propia RAGUCCI</span>
                      <span>Costo opcional ($0 o costo interno)</span>
                    </div>
                  )}
                </div>

                {/* Catálogo Juan Martín Selector */}
                {(product.proveedorTela === 'Juan Martín' || product.proveedorTela?.includes('Juan Martín')) && !isCamiseria && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                    <label className="block text-[10px] font-extrabold text-ragucci-primary uppercase mb-1">
                      Catálogo Juan Martín
                    </label>
                    <select
                      value={product.catalogoTela || ''}
                      onChange={(e) => {
                        const cat = e.target.value;
                        const defaultMeters = product.ceruttiCalc?.metros || (
                          product.description.toLowerCase().includes('pantalon') ? 1.5 :
                          product.description.toLowerCase().includes('chaleco') ? 0.9 :
                          product.description.toLowerCase().includes('saco') ? 2.2 : 3.5
                        );
                        const precioEUR = product.ceruttiCalc?.precioEUR ?? 94;
                        const cambioEURUSD = product.ceruttiCalc?.cambioEURUSD ?? 1.16;
                        const dolarBlueRate = product.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
                        const fleteUSD = Number((defaultMeters * 9.60).toFixed(2));
                        const subtotalEUR = Number((defaultMeters * precioEUR).toFixed(2));
                        const subtotalUSD = Number((subtotalEUR * cambioEURUSD).toFixed(2));
                        const totalUSD = Number((subtotalUSD + fleteUSD).toFixed(2));
                        const totalARS = Math.round(totalUSD * dolarBlueRate);

                        onChange({
                          ...product,
                          catalogoTela: cat,
                          ceruttiCalc: cat === 'Cerutti S130' ? {
                            metros: defaultMeters,
                            pesoKg: Number((defaultMeters * 0.24).toFixed(3)),
                            fleteUSD,
                            precioEUR,
                            cambioEURUSD,
                            subtotalEUR,
                            subtotalUSD,
                            totalUSD,
                            dolarBlue: dolarBlueRate,
                            totalARS,
                            codigoTela: product.ceruttiCalc?.codigoTela || ''
                          } : undefined,
                          costs: {
                            ...product.costs,
                            telas: cat === 'Cerutti S130' ? totalARS : product.costs.telas
                          }
                        });
                      }}
                      className="w-full p-1.5 border border-ragucci-gold/60 rounded text-xs font-black bg-amber-50/50 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                    >
                      <option value="">-- Seleccionar Catálogo --</option>
                      <option value="Cerutti S130">🇮🇹 Cerutti S130 (Prestige Super 130'S 240g/m)</option>
                      <option value="Otro">Otro Catálogo</option>
                    </select>

                    {/* Desglose y Calculadora Cerutti Prestige S130 */}
                    {product.catalogoTela === 'Cerutti S130' && (() => {
                      const curM = product.ceruttiCalc?.metros ?? 3.5;
                      const curPEUR = product.ceruttiCalc?.precioEUR ?? 94;
                      const curCEURUSD = product.ceruttiCalc?.cambioEURUSD ?? 1.16;
                      const curDolarBlue = product.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
                      const curFleteUSD = Number((curM * 9.60).toFixed(2));
                      const curSubtotalEUR = Number((curM * curPEUR).toFixed(2));
                      const curSubtotalUSD = Number((curSubtotalEUR * curCEURUSD).toFixed(2));
                      const curTotalUSD = Number((curSubtotalUSD + curFleteUSD).toFixed(2));
                      const curTotalARS = Math.round(curTotalUSD * curDolarBlue);

                      return (
                        <div className="mt-2.5 p-3 bg-gradient-to-br from-amber-50/90 to-stone-50 border border-ragucci-gold rounded-lg shadow-xs text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-ragucci-gold/30 pb-1.5">
                            <span className="font-black text-ragucci-primary text-[11px] uppercase flex items-center gap-1">
                              <span>📦 Regla Flete Cerutti Prestige S130</span>
                            </span>
                            <span className="text-[9px] font-black bg-ragucci-primary text-ragucci-gold px-1.5 py-0.5 rounded">
                              240g/m · $40 USD/kg ($9.60 USD/mt)
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Código Tela
                              </label>
                              <input
                                type="text"
                                value={product.ceruttiCalc?.codigoTela || ''}
                                onChange={(e) => {
                                  const cod = e.target.value;
                                  onChange({
                                    ...product,
                                    ceruttiCalc: {
                                      ...(product.ceruttiCalc || {}),
                                      metros: curM,
                                      pesoKg: Number((curM * 0.24).toFixed(3)),
                                      fleteUSD: curFleteUSD,
                                      precioEUR: curPEUR,
                                      cambioEURUSD: curCEURUSD,
                                      subtotalEUR: curSubtotalEUR,
                                      subtotalUSD: curSubtotalUSD,
                                      totalUSD: curTotalUSD,
                                      dolarBlue: curDolarBlue,
                                      totalARS: curTotalARS,
                                      codigoTela: cod
                                    }
                                  });
                                }}
                                placeholder="Ej: 26A4C2"
                                className="w-full p-1 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-ragucci-gold"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Metros (mt)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={product.ceruttiCalc?.metros ?? 3.5}
                                onChange={(e) => {
                                  const m = parseFloat(e.target.value) || 0;
                                  const fUSD = Number((m * 9.60).toFixed(2));
                                  const sEUR = Number((m * curPEUR).toFixed(2));
                                  const sUSD = Number((sEUR * curCEURUSD).toFixed(2));
                                  const totUSD = Number((sUSD + fUSD).toFixed(2));
                                  const totARS = Math.round(totUSD * curDolarBlue);

                                  onChange({
                                    ...product,
                                    ceruttiCalc: {
                                      ...(product.ceruttiCalc || {}),
                                      metros: m,
                                      pesoKg: Number((m * 0.24).toFixed(3)),
                                      fleteUSD: fUSD,
                                      precioEUR: curPEUR,
                                      cambioEURUSD: curCEURUSD,
                                      subtotalEUR: sEUR,
                                      subtotalUSD: sUSD,
                                      totalUSD: totUSD,
                                      dolarBlue: curDolarBlue,
                                      totalARS: totARS
                                    },
                                    costs: {
                                      ...product.costs,
                                      telas: totARS
                                    }
                                  });
                                }}
                                className="w-full p-1 border border-gray-300 rounded text-xs font-black text-ragucci-primary bg-white focus:outline-none focus:border-ragucci-gold text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Precio (€/mt)
                              </label>
                              <input
                                type="number"
                                step="1"
                                value={product.ceruttiCalc?.precioEUR ?? 94}
                                onChange={(e) => {
                                  const pEUR = parseFloat(e.target.value) || 0;
                                  const sEUR = Number((curM * pEUR).toFixed(2));
                                  const sUSD = Number((sEUR * curCEURUSD).toFixed(2));
                                  const totUSD = Number((sUSD + curFleteUSD).toFixed(2));
                                  const totARS = Math.round(totUSD * curDolarBlue);

                                  onChange({
                                    ...product,
                                    ceruttiCalc: {
                                      ...(product.ceruttiCalc || {}),
                                      metros: curM,
                                      pesoKg: Number((curM * 0.24).toFixed(3)),
                                      fleteUSD: curFleteUSD,
                                      precioEUR: pEUR,
                                      cambioEURUSD: curCEURUSD,
                                      subtotalEUR: sEUR,
                                      subtotalUSD: sUSD,
                                      totalUSD: totUSD,
                                      dolarBlue: curDolarBlue,
                                      totalARS: totARS
                                    },
                                    costs: {
                                      ...product.costs,
                                      telas: totARS
                                    }
                                  });
                                }}
                                className="w-full p-1 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-ragucci-gold text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                EUR/USD
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={product.ceruttiCalc?.cambioEURUSD ?? 1.16}
                                onChange={(e) => {
                                  const cEURUSD = parseFloat(e.target.value) || 0;
                                  const sUSD = Number((curSubtotalEUR * cEURUSD).toFixed(2));
                                  const totUSD = Number((sUSD + curFleteUSD).toFixed(2));
                                  const totARS = Math.round(totUSD * curDolarBlue);

                                  onChange({
                                    ...product,
                                    ceruttiCalc: {
                                      ...(product.ceruttiCalc || {}),
                                      metros: curM,
                                      pesoKg: Number((curM * 0.24).toFixed(3)),
                                      fleteUSD: curFleteUSD,
                                      precioEUR: curPEUR,
                                      cambioEURUSD: cEURUSD,
                                      subtotalEUR: curSubtotalEUR,
                                      subtotalUSD: sUSD,
                                      totalUSD: totUSD,
                                      dolarBlue: curDolarBlue,
                                      totalARS: totARS
                                    },
                                    costs: {
                                      ...product.costs,
                                      telas: totARS
                                    }
                                  });
                                }}
                                className="w-full p-1 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-ragucci-gold text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-blue-800 uppercase mb-0.5">
                                Dólar Blue ($)
                              </label>
                              <input
                                type="number"
                                step="1"
                                value={product.ceruttiCalc?.dolarBlue ?? curDolarBlue}
                                onChange={(e) => {
                                  const dBlue = parseFloat(e.target.value) || 0;
                                  const totARS = Math.round(curTotalUSD * dBlue);

                                  onChange({
                                    ...product,
                                    ceruttiCalc: {
                                      ...(product.ceruttiCalc || {}),
                                      metros: curM,
                                      pesoKg: Number((curM * 0.24).toFixed(3)),
                                      fleteUSD: curFleteUSD,
                                      precioEUR: curPEUR,
                                      cambioEURUSD: curCEURUSD,
                                      subtotalEUR: curSubtotalEUR,
                                      subtotalUSD: curSubtotalUSD,
                                      totalUSD: curTotalUSD,
                                      dolarBlue: dBlue,
                                      totalARS: totARS
                                    },
                                    costs: {
                                      ...product.costs,
                                      telas: totARS
                                    }
                                  });
                                }}
                                className="w-full p-1 border border-blue-300 bg-blue-50/50 rounded text-xs font-black text-blue-900 focus:outline-none focus:border-blue-500 text-center"
                              />
                            </div>
                          </div>

                          {/* Formato de Salida Obligatorio */}
                          <div className="bg-white/95 p-2.5 rounded-md border border-ragucci-gold/40 text-[11px] font-medium space-y-1 shadow-2xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-bold">Metros solicitados:</span>
                              <span className="font-extrabold text-ragucci-primary">{curM} mt</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-bold">Peso estimado:</span>
                              <span className="font-extrabold text-ragucci-primary">{(curM * 0.24).toFixed(3)} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-bold">Flete por peso ($9.60/mt):</span>
                              <span className="font-black text-amber-800">${curFleteUSD.toFixed(2)} USD</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-gray-200 pt-1 text-[10px]">
                              <span className="text-gray-500">Subtotal Tela (€{curPEUR}/mt):</span>
                              <span className="font-bold text-gray-700">
                                €{curSubtotalEUR.toFixed(2)} EUR (${curSubtotalUSD.toFixed(2)} USD)
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-xs text-gray-700">
                              <span>Total USD (Tela + Flete):</span>
                              <span className="font-black text-emerald-800">${curTotalUSD.toFixed(2)} USD</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-600">
                              <span>Cotización Dólar Blue:</span>
                              <span className="font-bold text-blue-800">${curDolarBlue} ARS</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-ragucci-gold pt-1.5 font-black text-sm text-ragucci-primary bg-amber-50/50 -mx-1 px-1 rounded">
                              <span className="uppercase text-xs tracking-wide">Costo Tela en Pesos ($ ARS):</span>
                              <span className="text-sm font-black text-ragucci-primary">${curTotalARS.toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Catálogo / Sub-proveedor Capetown Selector */}
                {(product.proveedorTela === 'Capetown' || product.proveedorTela?.includes('Capetown')) && !isCamiseria && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                    <label className="block text-[10px] font-extrabold text-ragucci-primary uppercase mb-1">
                      Marca / Catálogo Capetown
                    </label>
                    <select
                      value={product.catalogoTela || ''}
                      onChange={(e) => {
                        const cat = e.target.value;
                        const defaultMeters = getDefaultTailoringMeters(product.description);
                        const defaultDolar = dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560;

                        if (cat === 'REDA') {
                          const initialBook = 'Ceremony Selection';
                          const initialFabric = REDA_FABRICS.find(f => f.book === initialBook) || REDA_FABRICS[0];
                          const cutlengthUSD = initialFabric.cutlengthUSD;
                          const subtotalUSD = Number((defaultMeters * cutlengthUSD).toFixed(2));
                          const subtotalARS = Math.round(subtotalUSD * defaultDolar);
                          const ivaARS = Number((subtotalARS * 0.105).toFixed(2));
                          const totalARS = Number((subtotalARS * 1.105).toFixed(2));

                          onChange({
                            ...product,
                            catalogoTela: 'REDA',
                            redaCalc: {
                              book: initialFabric.book,
                              itemCode: initialFabric.code,
                              description: initialFabric.description,
                              cutlengthUSD,
                              metros: defaultMeters,
                              subtotalUSD,
                              dolarRate: defaultDolar,
                              subtotalARS,
                              ivaPercent: 10.5,
                              ivaARS,
                              totalARS
                            },
                            costs: {
                              ...product.costs,
                              telas: totalARS
                            }
                          });
                        } else if (cat === 'BARRINGTON') {
                          onChange({
                            ...product,
                            catalogoTela: 'BARRINGTON',
                            redaCalc: undefined
                          });
                        } else {
                          onChange({
                            ...product,
                            catalogoTela: cat,
                            redaCalc: undefined
                          });
                        }
                      }}
                      className="w-full p-1.5 border border-ragucci-gold/60 rounded text-xs font-black bg-blue-50/50 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
                    >
                      <option value="">-- Seleccionar Marca / Catálogo --</option>
                      <option value="REDA">🇮🇹 REDA (MTM ExtraEU - Automatizado)</option>
                      <option value="BARRINGTON">🏴󠁧󠁢󠁥󠁮󠁧󠁿 BARRINGTON (Manual)</option>
                      <option value="Otro">Otro Catálogo</option>
                    </select>

                    {/* BARRINGTON Manual Banner */}
                    {product.catalogoTela === 'BARRINGTON' && (
                      <div className="mt-2.5 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-md text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-indigo-950 flex items-center gap-1">
                            <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Barrington (Sastrería Capetown)</span>
                          </span>
                          <span className="text-[9.5px] font-bold bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                            Costo Manual
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-800">
                          Todavía sin lista de precios automática. Ingresá el costo final en pesos en el casillero de <strong>Telas ($)</strong>.
                        </p>
                      </div>
                    )}

                    {/* Desglose y Calculadora REDA MTM ExtraEU */}
                    {product.catalogoTela === 'REDA' && (() => {
                      const curM = product.redaCalc?.metros ?? getDefaultTailoringMeters(product.description);
                      const curBook = product.redaCalc?.book || 'Ceremony Selection';
                      const curCode = product.redaCalc?.itemCode || '50.23';
                      const curFabric = findRedaFabric(curBook, curCode);
                      const curCutUSD = product.redaCalc?.cutlengthUSD ?? (curFabric?.cutlengthUSD ?? 91);
                      const curDolar = product.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
                      const curSubtotalUSD = Number((curM * curCutUSD).toFixed(2));
                      const curSubtotalARS = Math.round(curSubtotalUSD * curDolar);
                      const curIvaARS = Number((curSubtotalARS * 0.105).toFixed(2));
                      const curTotalARS = Number((curSubtotalARS * 1.105).toFixed(2));

                      const updateReda = (newM: number, newCutUSD: number, newDolar: number, newBook: string, newCode: string, newDesc: string) => {
                        const sUSD = Number((newM * newCutUSD).toFixed(2));
                        const sARS = Math.round(sUSD * newDolar);
                        const iva = Number((sARS * 0.105).toFixed(2));
                        const totARS = Number((sARS * 1.105).toFixed(2));

                        onChange({
                          ...product,
                          redaCalc: {
                            book: newBook,
                            itemCode: newCode,
                            description: newDesc,
                            cutlengthUSD: newCutUSD,
                            metros: newM,
                            subtotalUSD: sUSD,
                            dolarRate: newDolar,
                            subtotalARS: sARS,
                            ivaPercent: 10.5,
                            ivaARS: iva,
                            totalARS: totARS
                          },
                          costs: {
                            ...product.costs,
                            telas: totARS
                          }
                        });
                      };

                      return (
                        <div className="mt-2.5 p-3 bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-300 rounded-lg shadow-xs text-xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                            <span className="font-black text-blue-950 text-[11px] uppercase flex items-center gap-1">
                              <span>🇮🇹 REDA MTM ExtraEU · Capetown</span>
                            </span>
                            <span className="text-[9px] font-black bg-blue-900 text-blue-100 px-1.5 py-0.5 rounded">
                              Cutlength [US$/mt] + 10,5% IVA
                            </span>
                          </div>

                          {/* Selector de Libro y Código */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Libro (Bunch Book)
                              </label>
                              <select
                                value={curBook}
                                onChange={(e) => {
                                  const b = e.target.value;
                                  const bookFabrics = getFabricsForBook(b);
                                  const firstFab = bookFabrics[0] || curFabric || REDA_FABRICS[0];
                                  updateReda(curM, firstFab.cutlengthUSD, curDolar, b, firstFab.code, firstFab.description);
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                {REDA_BOOKS.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Artículo / Código
                              </label>
                              <select
                                value={curCode}
                                onChange={(e) => {
                                  const code = e.target.value;
                                  const fab = findRedaFabric(curBook, code) || REDA_FABRICS.find(f => f.code === code);
                                  const cutUSD = fab ? fab.cutlengthUSD : curCutUSD;
                                  const desc = fab ? fab.description : (curFabric?.description || '');
                                  updateReda(curM, cutUSD, curDolar, curBook, code, desc);
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                {getFabricsForBook(curBook).map(f => (
                                  <option key={f.code} value={f.code}>
                                    {f.code} - {f.description} (${f.cutlengthUSD} USD/m)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Ficha técnica compacta de la tela */}
                          {curFabric && (
                            <div className="bg-white/90 p-1.5 rounded border border-blue-200 text-[10px] text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                              <span><strong>Comp:</strong> {curFabric.composition}</span>
                              <span><strong>Finura:</strong> {curFabric.fineness}</span>
                              {curFabric.weightGm && <span><strong>Peso:</strong> {curFabric.weightGm} g/m</span>}
                              <span><strong>Teñido:</strong> {curFabric.dyeing}</span>
                              <span><strong>Ancho:</strong> {curFabric.heightCm} cm</span>
                            </div>
                          )}

                          {/* Inputs de cálculo: Metros, Cutlength USD, Cotización Dólar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <div className="flex justify-between items-center mb-0.5">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase">
                                  Metros (mt)
                                </label>
                                <span className="text-[9px] text-blue-700 font-extrabold truncate max-w-[100px]" title={product.description || 'Prenda'}>
                                  {product.description || 'Prenda'}
                                </span>
                              </div>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={curM}
                                onChange={(e) => {
                                  const m = parseFloat(e.target.value) || 0;
                                  updateReda(m, curCutUSD, curDolar, curBook, curCode, curFabric?.description || '');
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-black text-ragucci-primary bg-white focus:outline-none focus:border-blue-500 text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                                Cutlength [US$/m]
                              </label>
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={curCutUSD}
                                onChange={(e) => {
                                  const cutUSD = parseFloat(e.target.value) || 0;
                                  updateReda(curM, cutUSD, curDolar, curBook, curCode, curFabric?.description || '');
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-black text-ragucci-primary bg-white focus:outline-none focus:border-blue-500 text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-blue-800 uppercase mb-0.5">
                                Dólar al Día ($)
                              </label>
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={curDolar}
                                onChange={(e) => {
                                  const d = parseFloat(e.target.value) || 0;
                                  updateReda(curM, curCutUSD, d, curBook, curCode, curFabric?.description || '');
                                }}
                                className="w-full p-1.5 border border-blue-300 bg-blue-50/70 rounded text-xs font-black text-blue-900 focus:outline-none focus:border-blue-500 text-center"
                              />
                            </div>
                          </div>

                          {/* Botones de sugerencia rápida de metros según prenda */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[9.5px] font-bold text-gray-400 mr-1">Metros sugeridos:</span>
                            {[
                              { label: 'Pantalón (1.5 mt)', m: 1.5 },
                              { label: 'Saco (2.2 mt)', m: 2.2 },
                              { label: 'Ambo/Traje (3.5 mt)', m: 3.5 },
                              { label: 'Sobretodo (2.8 mt)', m: 2.8 },
                              { label: 'Chaleco (0.9 mt)', m: 0.9 }
                            ].map(item => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => updateReda(item.m, curCutUSD, curDolar, curBook, curCode, curFabric?.description || '')}
                                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                  curM === item.m
                                    ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>

                          {/* Desglose de Cálculo */}
                          <div className="bg-white/95 p-2.5 rounded-md border border-blue-300 text-[11px] font-medium space-y-1 shadow-2xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-bold">Metros solicitados:</span>
                              <span className="font-extrabold text-ragucci-primary">{curM} mt</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-bold">Precio Cutlength (USD/m):</span>
                              <span className="font-extrabold text-blue-900">${curCutUSD} USD/mt</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-gray-200 pt-1 text-[11px]">
                              <span className="text-gray-600 font-bold">Subtotal Tela (USD):</span>
                              <span className="font-black text-emerald-800">${curSubtotalUSD.toFixed(2)} USD</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-600">
                              <span>Cotización Dólar al día:</span>
                              <span className="font-bold text-blue-800">${curDolar.toLocaleString('es-AR')} ARS</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-700">
                              <span>Subtotal en Pesos (sin IVA):</span>
                              <span className="font-bold">${formatMoney(curSubtotalARS)} ARS</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-amber-800 border-t border-dashed border-gray-200 pt-1">
                              <span className="font-bold">+ IVA Capetown (10,5%):</span>
                              <span className="font-extrabold">+ ${formatMoney(curIvaARS)} ARS</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-ragucci-gold pt-1.5 font-black text-sm text-ragucci-primary bg-amber-50/60 -mx-1 px-1 rounded">
                              <span className="uppercase text-xs tracking-wide">Costo Tela en Pesos ($ ARS):</span>
                              <span className="text-sm font-black text-ragucci-primary">${formatMoney(curTotalARS)} ARS</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 items-center">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-0.5">
                      Proveedor de Forrería
                    </label>
                    <div className="p-1.5 border border-purple-200 bg-purple-50 rounded text-xs font-black text-purple-900 flex items-center gap-1.5">
                      <span>🪡 Capetown</span>
                      <span className="text-[9.5px] font-bold text-purple-700 bg-purple-100 px-1.5 rounded">Único Proveedor</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-0.5">
                      Color / Código Forrería
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Negro, Bordeux 12A..."
                      value={product.colorForreria || product.codigoForreria || ''}
                      onChange={(e) => onChange({ ...product, proveedorForreria: 'Capetown', colorForreria: e.target.value, codigoForreria: e.target.value })}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold text-ragucci-primary bg-white focus:outline-none focus:border-ragucci-gold"
                    />
                  </div>
                </div>

                {/* Estado de Forrería */}
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-extrabold text-purple-900 uppercase">
                      Estado Forrería:
                    </label>
                    <span className="text-[10px] font-black text-purple-950">
                      {product.statusForreria || '🔴 Falta Pedir'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { key: '🔴 Falta Pedir Forrería', label: '🔴 Falta Pedir' },
                      { key: '🟣 Forrería Pedida', label: '🟣 Pedida' },
                      { key: '🟠 Forrería en Local', label: '🟠 En Local' }
                    ].map(st => {
                      const curSt = product.statusForreria || '🔴 Falta Pedir Forrería';
                      const isActive = curSt === st.key || (st.key.startsWith('🔴') && (curSt.startsWith('🔴') || curSt === '🔴 Pendiente'));
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            const todayStr = getTodayString();
                            const updated: ProductItem = {
                              ...product,
                              statusForreria: st.key
                            };
                            if (st.key === '🟣 Forrería Pedida') {
                              updated.fechaForreriaPedida = product.fechaForreriaPedida || todayStr;
                            } else if (st.key === '🟠 Forrería en Local') {
                              updated.fechaForreriaEnLocal = todayStr;
                              updated.postergarForreriaHasta = undefined;
                            } else if (st.key.startsWith('🔴')) {
                              updated.fechaForreriaPedida = undefined;
                              updated.fechaForreriaEnLocal = undefined;
                              updated.postergarForreriaHasta = undefined;
                            }
                            onChange(updated);
                          }}
                          className={`flex-1 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer text-center border ${
                            isActive
                              ? 'bg-purple-800 text-white border-purple-900 shadow-2xs font-extrabold'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-purple-50'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
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
