import React, { useEffect } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatMoney } from '../../utils/formatters';
import { X, Edit, MessageCircle, Plus, CreditCard, Ruler } from 'lucide-react';
import { detectColorHex } from '../orders/ProductBlock';

const STATUS_STAGES = [
  { key: '🔴 Pendiente',     short: 'Pend.',   bg: 'bg-red-500'    },
  { key: '🟣 Tela Pedida',   short: 'Pedida',  bg: 'bg-purple-500' },
  { key: '🟠 Tela en Local', short: 'En Local',bg: 'bg-orange-400' },
  { key: '🟡 En Taller',     short: 'Taller',  bg: 'bg-yellow-400' },
  { key: '🔵 Prueba',        short: 'Prueba',  bg: 'bg-blue-500'   },
  { key: '🟢 Entregado',     short: 'Listo',   bg: 'bg-emerald-500'},
];

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
}

export const OrderSidePanel: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onOpenPayment,
  onOpenAddCost,
  onStatusChange,
  onProductStatusChange,
}) => {
  const { setEditingOrderId, setActiveTab } = useApp();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeIdx = order ? STATUS_STAGES.findIndex(s => s.key === order.status) : 0;
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
                  {STATUS_STAGES.map((stage, i) => (
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

              {/* Products & Fabrics with Individual Stages */}
              {order.products && order.products.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Prendas & Estados Individuales</p>
                  <div className="space-y-2">
                    {order.products.map((p, i) => {
                      const pStatus = p.status || order.status || '🔴 Pendiente';
                      const pActiveIdx = STATUS_STAGES.findIndex(s => s.key === pStatus);

                      return (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2 shadow-2xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-ragucci-primary text-[11px]">{p.description}</p>
                              {p.modista && (
                                <p className="text-[10px] text-gray-500 font-bold">Modista: {p.modista}</p>
                              )}
                            </div>
                            {p.costs?.telas > 0 && (
                              <span className="text-[10px] font-bold text-gray-500 tabular-nums">${formatMoney(p.costs.telas)}</span>
                            )}
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
                              <span className="text-[9px] font-black text-ragucci-primary">{pStatus}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {STATUS_STAGES.map((stage, sIdx) => (
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
                          </div>

                          {p.notes && (
                            <p className="text-[10px] text-gray-400 italic mt-1">📝 {p.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RTW Items */}
              {order.rtwItems && order.rtwItems.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-1.5">Productos RTW</p>
                  <div className="space-y-1">
                    {order.rtwItems.map((rtw, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
                        <span className="font-bold text-ragucci-primary">{rtw.desc} <span className="text-gray-400">×{rtw.qty}</span></span>
                        <span className="tabular-nums font-bold">${formatMoney(rtw.price * rtw.qty)}</span>
                      </div>
                    ))}
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
                        <span className="text-gray-500">{formatDate(ph.date)} · {ph.method}</span>
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
