import React, { useEffect } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatMoney, getTodayString, isCardPaymentMethod } from '../../utils/formatters';
import { X, Edit, MessageCircle, Plus, CreditCard, Ruler, FileText } from 'lucide-react';
import { detectColorHex } from '../orders/ProductBlock';

const STATUS_STAGES_MEDIDA = [
  { key: '🔴 Pendiente',     short: 'Pend.',   bg: 'bg-red-500'    },
  { key: '🟣 Tela Pedida',   short: 'Pedida',  bg: 'bg-purple-500' },
  { key: '🟠 Tela en Local', short: 'En Local',bg: 'bg-orange-400' },
  { key: '🟡 En Taller',     short: 'Taller',  bg: 'bg-yellow-400' },
  { key: '🔵 Prueba',        short: 'Prueba',  bg: 'bg-blue-500'   },
  { key: '🟢 Entregado',     short: 'Listo',   bg: 'bg-emerald-500'},
];

const STATUS_STAGES_RTW = [
  { key: '🔴 Pendiente',     short: 'Pend.',       bg: 'bg-red-500'    },
  { key: '📦 Despachado',    short: 'Despachado',  bg: 'bg-sky-500'    },
  { key: '🟢 Entregado',     short: 'Listo',       bg: 'bg-emerald-500'},
];

const STATUS_STAGES_ARREGLO = [
  { key: '🟠 En el Local',       short: 'En Local',   bg: 'bg-orange-400' },
  { key: '🟡 En Taller',         short: 'Taller',     bg: 'bg-yellow-400' },
  { key: '🔵 Arreglo Realizado', short: 'Realizado',  bg: 'bg-blue-500'   },
  { key: '🟢 Entregado',         short: 'Listo',      bg: 'bg-emerald-500'},
];

const isArregloProduct = (p?: any): boolean => {
  if (!p) return false;
  const desc = (p.description || '').toUpperCase();
  return desc.includes('ARREGLO') || (Boolean(p.costs?.arreglos && p.costs.arreglos > 0) && !p.costs?.sastre && !p.costs?.camisero && !p.costs?.telas);
};

const isArregloOrder = (order?: Order | null): boolean => {
  if (!order) return false;
  const orderType = (order.type || '').toUpperCase();
  if (orderType.includes('ARREGLO')) return true;
  const prods = order.products || [];
  if (prods.length > 0) {
    const hasMedidaGarments = prods.some(p => {
      const d = (p.description || '').toUpperCase();
      return !d.includes('ARREGLO') && !d.includes('RTW') && ((p.costs?.sastre ?? 0) > 0 || (p.costs?.camisero ?? 0) > 0 || (p.costs?.telas ?? 0) > 0);
    });
    if (!hasMedidaGarments && prods.some(p => isArregloProduct(p))) {
      return true;
    }
  }
  return false;
};

const getArregloStageIndex = (status?: string): number => {
  const s = status || '';
  if (s.includes('Entregado')) return 3;
  if (s.includes('Realizado') || s.includes('Prueba')) return 2;
  if (s.includes('Taller')) return 1;
  return 0; // 'En el Local', 'Tela en Local', 'Pendiente'
};

const COST_LABELS: Record<string, string> = {
  telas: 'Telas',
  forreria: 'Forrería',
  sastre: 'M.Obra Sastre',
  camisero: 'M.Obra Camisero',
  arreglos: 'Arreglos',
  pterminado: 'Prod. Terminado',
  envios: 'Envíos',
  avios: 'Avios',
  comision: 'Comisión Tomy',
  otros: 'Otros',
};

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment: (order: Order) => void;
  onOpenAddCost: (order: Order) => void;
  onStatusChange: (order: Order, newStatus: string) => void;
  onProductStatusChange?: (order: Order, productIndex: number, newStatus: string) => void;
  onRTWItemStatusChange?: (order: Order, rtwIndex: number, newStatus: string) => void;
}

export const OrderSidePanel: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onOpenPayment,
  onOpenAddCost,
  onStatusChange,
  onProductStatusChange,
  onRTWItemStatusChange,
}) => {
  const { setEditingOrderId, setActiveTab, saveOrderData } = useApp();

  const handleTogglePaymentAccreditation = async (index: number) => {
    if (!order || !order.paymentHistory) return;
    const currentHistory = [...order.paymentHistory];
    const target = currentHistory[index];
    const newStatus = target.acreditado !== true;
    currentHistory[index] = {
      ...target,
      acreditado: newStatus
    };

    const allCardsAccredited = currentHistory
      .filter(p => isCardPaymentMethod(p.method))
      .every(p => p.acreditado === true);

    const updatedOrder: Order = {
      ...order,
      paymentHistory: currentHistory,
      acreditado: allCardsAccredited
    };

    try {
      await saveOrderData(updatedOrder, order.firestoreId);
    } catch (e) {
      console.error(e);
      alert("Error al actualizar la acreditación.");
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const hasMedidaGarments = (order?.products || []).some(p => {
    const d = (p.description || '').toUpperCase();
    return !d.includes('ARREGLO') && !d.includes('RTW') && !d.includes('TERMINADO');
  });
  const isArreglo = isArregloOrder(order);
  const isOnlyRTW = !hasMedidaGarments && !isArreglo && Boolean(
    (order?.origin || '').toLowerCase().includes('tienda nube') ||
    (order?.origin || '').toLowerCase().includes('rtw') ||
    (order?.rtwItems && order.rtwItems.length > 0)
  );

  const stages = isOnlyRTW
    ? STATUS_STAGES_RTW
    : isArreglo && !hasMedidaGarments
    ? STATUS_STAGES_ARREGLO
    : STATUS_STAGES_MEDIDA;

  const activeIdx = order
    ? isOnlyRTW
      ? STATUS_STAGES_RTW.findIndex(s => s.key === order.status)
      : (isArreglo && !hasMedidaGarments)
      ? getArregloStageIndex(order.status)
      : STATUS_STAGES_MEDIDA.findIndex(s => s.key === order.status)
    : 0;
  const saldoPendiente = (order?.saldo || 0) > 0;

  let cleanPhone = order?.phone?.replace(/\D/g, '') || '';
  if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

  const costEntries = order?.costs
    ? Object.entries(order.costs).filter(([, v]) => (v as number) > 0)
    : [];

  return (
    <>
      {/* Overlay for mobile / dimming */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl border-l border-gray-200 z-40
          transition-transform duration-200 ease-in-out overflow-y-auto flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {!order ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xs p-6 text-center">
            <div>
              <p className="text-3xl mb-2">👈</p>
              <p className="font-medium">Seleccioná una orden de la tabla para ver su detalle aquí</p>
              <p className="text-[10px] mt-1 opacity-60">También podés usar la tecla <kbd className="bg-gray-100 px-1 py-0.5 rounded border border-gray-300 font-mono">K</kbd> para avanzar el estado</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="sticky top-0 bg-ragucci-primary text-ragucci-gold px-4 py-3 flex justify-between items-start z-10 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Detalle de Orden</p>
                <h3 className="text-sm font-black uppercase tracking-wide truncate">{order.client}</h3>
                <p className="text-[10px] opacity-70 mt-0.5">{formatDate(order.date)}</p>
              </div>
              <button
                onClick={onClose}
                className="text-ragucci-gold hover:opacity-70 cursor-pointer shrink-0 ml-2 mt-0.5"
                title="Cerrar panel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── CONTENT ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[11px]">

              {/* KPIs row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Venta</p>
                  <p className="text-sm font-black text-ragucci-primary tabular-nums">${formatMoney(order.sale)}</p>
                </div>
                <div className={`border rounded-lg p-2 text-center ${saldoPendiente ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[9px] uppercase font-black tracking-wider text-gray-400">Saldo</p>
                  <p className={`text-sm font-black tabular-nums ${saldoPendiente ? 'text-red-700' : 'text-emerald-700'}`}>
                    {saldoPendiente ? `$${formatMoney(order.saldo)}` : '✓ OK'}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Margen</p>
                  <p className="text-sm font-black text-ragucci-primary">
                    {order.sale > 0 ? `${((order.profit / order.sale) * 100).toFixed(0)}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Stage Timeline General */}
              <div>
                <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Estado General de la Orden</p>
                <div className="flex items-center gap-0.5">
                  {stages.map((stage, i) => (
                    <button
                      key={stage.key}
                      onClick={() => onStatusChange(order, stage.key)}
                      className={`flex-1 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer text-center border
                        ${i < activeIdx
                          ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-primary'
                          : i === activeIdx
                          ? 'bg-ragucci-gold text-ragucci-primary border-ragucci-gold ring-1 ring-ragucci-primary'
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                      title={stage.key}
                    >
                      {stage.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Date */}
              {order.deliveryDate && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-800">⏰ Fecha de Entrega</span>
                  <span className="text-[11px] font-black text-amber-900">{formatDate(order.deliveryDate)}</span>
                </div>
              )}

              {/* Facturación Fiscal (si aplica) */}
              {(order.hasInvoice || order.invoiceNumber) && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Factura Emitida</span>
                    </span>
                    <span className="text-[11px] font-mono font-black text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-300">
                      {order.invoiceNumber ? `#${order.invoiceNumber}` : 'S/N'}
                    </span>
                  </div>
                  {order.invoiceDetails && (
                    <p className="text-[10.5px] text-blue-950 font-medium pt-1 border-t border-blue-100">
                      <strong>Detalle:</strong> {order.invoiceDetails}
                    </p>
                  )}
                </div>
              )}

              {/* Products & Fabrics with Individual Stages */}
              {order.products && order.products.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Prendas & Estados Individuales</p>
                  <div className="space-y-2">
                    {order.products.map((p, i) => {
                      const isPArr = isArregloProduct(p);
                      const isPRtw = (p.description || '').toUpperCase().includes('RTW') || (p.description || '').toUpperCase().includes('TERMINADO');
                      const pStages = isPArr ? STATUS_STAGES_ARREGLO : isPRtw ? STATUS_STAGES_RTW : STATUS_STAGES_MEDIDA;
                      const pStatus = p.status || order.status || (isPArr ? '🟠 En el Local' : '🔴 Pendiente');
                      const pActiveIdx = isPArr
                        ? getArregloStageIndex(pStatus)
                        : pStages.findIndex(s => s.key === pStatus);
                      const displayPStatus = isPArr
                        ? ((pStatus.includes('Local') || pStatus.includes('Pendiente'))
                            ? '🟠 En el Local'
                            : (pStatus.includes('Realizado') || pStatus.includes('Prueba'))
                            ? '🔵 Arreglo Realizado'
                            : pStatus)
                        : pStatus;

                      return (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2 shadow-2xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-ragucci-primary text-[11px]">{p.description}</p>
                              {p.modista && (
                                <p className="text-[10px] text-gray-500 font-bold">Modista: {p.modista}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {p.price !== undefined && p.price > 0 && (
                                <span className="block text-[10.5px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded tabular-nums mb-0.5 shadow-2xs">
                                  Cobrado: ${formatMoney(p.price)}
                                </span>
                              )}
                              {p.costs?.telas > 0 && (
                                <span className="text-[10px] font-bold text-gray-400 tabular-nums">Tela: ${formatMoney(p.costs.telas)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {p.color && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                                  style={{ backgroundColor: p.colorHex || detectColorHex(p.color) }}
                                />
                                {p.color}
                              </span>
                            )}
                            {p.proveedorTela && (
                              <span className="text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                                🧵 {p.proveedorTela}
                              </span>
                            )}
                            {p.catalogoTela === 'Cerutti S130' && (
                              <span className="text-[10px] font-bold bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded" title={p.ceruttiCalc ? `Metros: ${p.ceruttiCalc.metros} mt · Peso: ${p.ceruttiCalc.pesoKg} kg · Flete: $${p.ceruttiCalc.fleteUSD} USD` : ''}>
                                🇮🇹 Cerutti S130 {p.ceruttiCalc?.metros ? `(${p.ceruttiCalc.metros} mt · Flete $${p.ceruttiCalc.fleteUSD} USD)` : ''}
                              </span>
                            )}
                            {p.catalogoTela === 'REDA' && (
                              <span className="text-[10px] font-bold bg-blue-100 border border-blue-300 text-blue-900 px-1.5 py-0.5 rounded" title={p.redaCalc ? `Libro: ${p.redaCalc.book} · Art: ${p.redaCalc.itemCode} · ${p.redaCalc.metros} mt · $${p.redaCalc.cutlengthUSD} USD/mt (+10,5% IVA)` : ''}>
                                🇮🇹 REDA {p.redaCalc?.itemCode ? `(${p.redaCalc.itemCode} · ${p.redaCalc.metros} mt)` : ''}
                              </span>
                            )}
                            {p.catalogoTela === 'BARRINGTON' && (
                              <span className="text-[10px] font-bold bg-indigo-100 border border-indigo-300 text-indigo-900 px-1.5 py-0.5 rounded">
                                🏴󠁧󠁢󠁥󠁮󠁧󠁿 Barrington
                              </span>
                            )}
                            {p.proveedorForreria && (
                              <span className="text-[10px] font-bold bg-purple-50 border border-purple-200 text-purple-800 px-1.5 py-0.5 rounded">
                                🪡 {p.proveedorForreria}
                              </span>
                            )}
                          </div>

                          {/* Individual Garment Stage Selector */}
                          <div className="pt-1.5 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black uppercase text-gray-400">Estado Prenda:</span>
                              <span className="text-[9px] font-black text-ragucci-primary">{displayPStatus}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {pStages.map((stage, sIdx) => (
                                <button
                                  key={stage.key}
                                  type="button"
                                  onClick={() => {
                                    if (onProductStatusChange) {
                                      onProductStatusChange(order, i, stage.key);
                                    } else {
                                      onStatusChange(order, stage.key);
                                    }
                                  }}
                                  className={`flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all cursor-pointer text-center border ${
                                    sIdx === pActiveIdx
                                      ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-primary shadow-2xs font-extrabold'
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title={stage.key}
                                >
                                  {stage.short}
                                </button>
                              ))}
                            </div>

                            {/* Modista selector if Arreglo */}
                            {isPArr && (
                              <div className="mt-2 pt-1.5 border-t border-dashed border-gray-200 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-gray-500">✂️ Modista/Taller:</span>
                                <select
                                  value={p.modista || ''}
                                  onChange={(e) => {
                                    const modistaVal = e.target.value;
                                    const targetStatus = modistaVal ? `🟡 En Taller (${modistaVal})` : '🟡 En Taller';
                                    if (onProductStatusChange) {
                                      onProductStatusChange(order, i, targetStatus);
                                    } else {
                                      onStatusChange(order, targetStatus);
                                    }
                                  }}
                                  className="text-[10px] font-bold bg-white text-ragucci-primary border border-gray-300 rounded px-1.5 py-0.5"
                                >
                                  <option value="">Sin asignar</option>
                                  <option value="María">María</option>
                                  <option value="Jesús">Jesús</option>
                                  <option value="Arturo">Arturo</option>
                                  <option value="Raúl">Raúl</option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Individual Forreria Stage Selector if applicable */}
                          {!isPRtw && !isPArr && !p.costs?.noForreria && (/SACO|AMBO|SOBRETODO|SMOKING|TRAJE|CHALECO|TAPADO/.test((p.description || '').toUpperCase()) || (p.costs?.forreria && p.costs.forreria > 0)) && (
                            <div className="pt-1.5 border-t border-purple-100">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black uppercase text-purple-700 flex items-center gap-1">
                                  <span>🪡 Estado Forrería:</span>
                                </span>
                                <span className="text-[9px] font-black text-purple-950">
                                  {p.statusForreria || '🔴 Falta Pedir'}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[
                                  { key: '🔴 Falta Pedir Forrería', label: '🔴 Falta Pedir', short: 'Falta' },
                                  { key: '🟣 Forrería Pedida', label: '🟣 Pedida', short: 'Pedida' },
                                  { key: '🟠 Forrería en Local', label: '🟠 En Local', short: 'En Local' }
                                ].map(fStage => {
                                  const curFSt = p.statusForreria || '🔴 Falta Pedir Forrería';
                                  const isFActive = curFSt === fStage.key || (fStage.key.startsWith('🔴') && (curFSt.startsWith('🔴') || curFSt === '🔴 Pendiente'));
                                  return (
                                    <button
                                      key={fStage.key}
                                      type="button"
                                      onClick={async () => {
                                        const todayStr = getTodayString();
                                        const updatedProducts = (order.products || []).map((item, idx) => {
                                          if (idx === i) {
                                            const updatedItem = { ...item, statusForreria: fStage.key };
                                            if (fStage.key === '🟣 Forrería Pedida') {
                                              updatedItem.fechaForreriaPedida = item.fechaForreriaPedida || todayStr;
                                            } else if (fStage.key === '🟠 Forrería en Local') {
                                              updatedItem.fechaForreriaEnLocal = todayStr;
                                              updatedItem.postergarForreriaHasta = undefined;
                                            } else if (fStage.key.startsWith('🔴')) {
                                              updatedItem.fechaForreriaPedida = undefined;
                                              updatedItem.fechaForreriaEnLocal = undefined;
                                              updatedItem.postergarForreriaHasta = undefined;
                                            }
                                            return updatedItem;
                                          }
                                          return item;
                                        });
                                        if (order.firestoreId) {
                                          const { saveOrderData } = useApp as any;
                                        }
                                        if (onProductStatusChange) {
                                          // Update product
                                          const updatedOrder = { ...order, products: updatedProducts };
                                          onStatusChange(updatedOrder, order.status || '🔴 Pendiente');
                                        }
                                      }}
                                      className={`flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all cursor-pointer text-center border ${
                                        isFActive
                                          ? 'bg-purple-800 text-white border-purple-900 shadow-2xs font-extrabold'
                                          : 'bg-white text-gray-600 border-purple-200 hover:bg-purple-50'
                                      }`}
                                    >
                                      {fStage.short}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {p.notes && (
                            <p className="text-[10px] text-gray-400 italic mt-1">📝 {p.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RTW Items with Individual Stages */}
              {order.rtwItems && order.rtwItems.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Productos RTW & Estados Individuales</p>
                  <div className="space-y-2">
                    {order.rtwItems.map((rtw, i) => {
                      const rStatus = rtw.status || '🔴 Pendiente';
                      const rActiveIdx = STATUS_STAGES_RTW.findIndex(s => s.key === rStatus);
                      return (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2 shadow-2xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-ragucci-primary text-[11px]">{rtw.desc} <span className="text-gray-400">×{rtw.qty}</span></p>
                              {rtw.notes && (
                                <p className="text-[10px] text-gray-500 italic mt-0.5">📝 {rtw.notes}</p>
                              )}
                            </div>
                            <span className="text-[10.5px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded tabular-nums shadow-2xs">
                              ${formatMoney((rtw.salePrice !== undefined ? rtw.salePrice : rtw.price) * rtw.qty)}
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black uppercase text-gray-400">Estado RTW:</span>
                              <span className="text-[9px] font-black text-ragucci-primary">{rStatus}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {STATUS_STAGES_RTW.map((stage, sIdx) => (
                                <button
                                  key={stage.key}
                                  type="button"
                                  onClick={() => {
                                    if (onRTWItemStatusChange) {
                                      onRTWItemStatusChange(order, i, stage.key);
                                    } else {
                                      onStatusChange(order, stage.key);
                                    }
                                  }}
                                  className={`flex-1 py-0.5 text-[8px] font-black uppercase rounded transition-all cursor-pointer text-center border ${
                                    sIdx === rActiveIdx
                                      ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-primary shadow-2xs font-extrabold'
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  title={stage.key}
                                >
                                  {stage.short}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cost breakdown */}
              {costEntries.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Desglose de Costos</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg divide-y divide-gray-100">
                    {costEntries.map(([key, val]) => (
                      <div key={key} className="flex justify-between px-2.5 py-1.5">
                        <span className="text-gray-600">{COST_LABELS[key] || key}</span>
                        <span className="font-bold tabular-nums text-ragucci-primary">${formatMoney(val as number)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-2.5 py-1.5 bg-ragucci-primary/5 rounded-b-lg">
                      <span className="font-black text-ragucci-primary">Total Costo</span>
                      <span className="font-black tabular-nums text-ragucci-primary">${formatMoney(order.totalCost)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {order.paymentHistory && order.paymentHistory.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Historial de Pagos</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg divide-y divide-gray-100">
                    {order.paymentHistory.map((ph, i) => (
                      <div key={i} className="flex justify-between items-center px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600 font-medium">{formatDate(ph.date)} · {ph.method}</span>
                          {isCardPaymentMethod(ph.method) && (
                            ph.acreditado === true ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentAccreditation(i)}
                                className="text-[9px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                                title="Acreditado. Clic para volver a Falta Acreditar."
                              >
                                ✓ Acreditado
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentAccreditation(i)}
                                className="text-[9px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs animate-pulse"
                                title="Falta acreditar. Clic para marcar como Acreditado."
                              >
                                💳 Falta acreditar
                              </button>
                            )
                          )}
                        </div>
                        <span className="font-black text-emerald-700 tabular-nums">${formatMoney(ph.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minimal measurements indicator */}
              {order.measurements && Object.keys(order.measurements).length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[10px] font-bold text-blue-800">Tiene ficha de medidas cargada</span>
                </div>
              )}

              {/* Notes */}
              {order.products?.some(p => p.notes) && (
                <div className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-100 rounded px-2.5 py-2">
                  Notas en prendas — ver en el formulario de edición
                </div>
              )}

            </div>

            {/* ── QUICK ACTIONS FOOTER ── */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 grid grid-cols-2 gap-2 shrink-0">
              <button
                onClick={() => onOpenPayment(order)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Registrar Pago</span>
              </button>

              <button
                onClick={() => {
                  setEditingOrderId(order.firestoreId || null);
                  setActiveTab('carga');
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar Orden</span>
              </button>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[11px] font-black uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => onOpenAddCost(order)}
                className={`flex items-center justify-center gap-1.5 bg-ragucci-primary-light hover:bg-ragucci-primary text-ragucci-gold text-[11px] font-black uppercase py-2 px-3 rounded-lg transition-colors cursor-pointer ${cleanPhone ? '' : 'col-span-2'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sumar Gasto</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
