import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatDate, formatMoney } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Maximize2, Search, Filter, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkshopSubDetail {
  tipo: string;
  qty: number;
  amount: number;
}

interface WorkshopItem {
  firestoreId?: string;
  key: string;
  subKeys?: string[];
  client: string;
  detail: string;
  productNotes?: string;
  subDetails?: WorkshopSubDetail[];
  date: string;
  amount: number;
  isPaid: boolean;
  note: string;
  order: Order;
}

interface WorkshopGroup {
  totalPending: number;
  totalPaid: number;
  totalAccumulated: number;
  items: WorkshopItem[];
}

export const WorkshopPayments: React.FC = () => {
  const { orders, config, saveOrderData } = useApp();

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'pending' | 'paid'>('all');
  
  const [selectedWorkshopModal, setSelectedWorkshopModal] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders = orders.filter((o) => {
    // Las órdenes en "🔴 Pendiente" o "🟠 Tela en Local" no ingresan a talleres hasta ser enviadas al taller (al pasar a "En Taller", "Prueba" o "Entregado")
    const isNotInWorkshop = !o.status || o.status.includes('Pendiente') || o.status.includes('Tela en Local');
    if (isNotInWorkshop) return false;

    const d = new Date(o.date + 'T12:00:00');
    const matchYear = d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
    return matchYear && matchMonth;
  });

  const dataTalleres: Record<string, WorkshopGroup> = {
    'SANTIAGO (Sastre)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'DIEGO (Camisero)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'GUILLERMO (Camisero)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'MARÍA (Modista Arreglos)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'JESÚS (Modista Arreglos)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'ARTURO (Modista Arreglos)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] }
  };

  filteredOrders.forEach((o) => {
    const clientName = o.client || 'Cliente sin nombre';
    const paidMap = o.paidTalleresMap || {};
    const notesMap = o.tallerNotesMap || {};
    const orderDate = o.date;

    if (o.products && o.products.length > 0) {
      o.products.forEach((p, pIdx) => {
        const desc = p.description || '';
        const c = p.costs || {};
        const pNotes = p.notes || '';

        // 1. Sastre Santiago
        if (c.sastre && c.sastre > 0) {
          const itemKey = `${o.firestoreId}_p${pIdx}_sastre`;
          const isPaid = !!paidMap[itemKey];
          const itemNote = notesMap[itemKey] || '';
          const group = dataTalleres['SANTIAGO (Sastre)'];

          group.totalAccumulated += c.sastre;
          if (isPaid) {
            group.totalPaid += c.sastre;
          } else {
            group.totalPending += c.sastre;
          }

          group.items.push({
            firestoreId: o.firestoreId,
            key: itemKey,
            client: clientName,
            detail: desc,
            productNotes: pNotes,
            date: orderDate,
            amount: c.sastre,
            isPaid,
            note: itemNote,
            order: o
          });
        }

        // 2. Camiseros Diego / Guillermo
        if (c.camisero && c.camisero > 0) {
          let targetCamisero = 'DIEGO (Camisero)';
          if (
            p.camiseroSelected === 'guillermo' ||
            desc.toUpperCase().includes('GUILLERMO') ||
            pNotes.toLowerCase().includes('guillermo')
          ) {
            targetCamisero = 'GUILLERMO (Camisero)';
          }
          const itemKey = `${o.firestoreId}_p${pIdx}_camisero`;
          const isPaid = !!paidMap[itemKey];
          const itemNote = notesMap[itemKey] || '';
          const group = dataTalleres[targetCamisero];

          group.totalAccumulated += c.camisero;
          if (isPaid) {
            group.totalPaid += c.camisero;
          } else {
            group.totalPending += c.camisero;
          }

          group.items.push({
            firestoreId: o.firestoreId,
            key: itemKey,
            client: clientName,
            detail: desc,
            productNotes: pNotes,
            date: orderDate,
            amount: c.camisero,
            isPaid,
            note: itemNote,
            order: o
          });
        }

        // 3. Modistas por Arreglos (Agrupados por Cliente y Producto)
        if (c.arreglos && c.arreglos > 0 && p.arreglosDetalle && p.arreglosDetalle.length > 0) {
          const modistaKey = p.modista ? p.modista.toUpperCase() : 'MARIA';
          let targetModistaKey = 'MARÍA (Modista Arreglos)';
          if (modistaKey === 'JESUS') targetModistaKey = 'JESÚS (Modista Arreglos)';
          if (modistaKey === 'ARTURO') targetModistaKey = 'ARTURO (Modista Arreglos)';

          const preciosModista = config.arreglosPrecios?.[modistaKey] || config.arreglosPrecios?.['MARIA'] || {};

          let totalSub = 0;
          const subDetails: WorkshopSubDetail[] = [];
          const subKeys: string[] = [];

          p.arreglosDetalle.forEach((ad, adIdx) => {
            let sub = 0;
            if (ad.isCustom) {
              sub = (ad.price || 0) * (ad.qty || 1);
            } else {
              const pUnit = preciosModista[ad.tipo] || 0;
              sub = pUnit * (ad.qty || 1);
            }
            if (sub > 0) {
              totalSub += sub;
              subDetails.push({
                tipo: ad.tipo,
                qty: ad.qty || 1,
                amount: sub
              });
              subKeys.push(`${o.firestoreId}_p${pIdx}_arr${adIdx}`);
            }
          });

          if (totalSub > 0) {
            const itemKey = `${o.firestoreId}_p${pIdx}_arreglos`;
            const isPaid = !!paidMap[itemKey] || (subKeys.length > 0 && subKeys.every(sk => !!paidMap[sk]));
            const itemNote = notesMap[itemKey] || (subKeys.length > 0 ? notesMap[subKeys[0]] : '') || '';
            const group = dataTalleres[targetModistaKey];

            group.totalAccumulated += totalSub;
            if (isPaid) {
              group.totalPaid += totalSub;
            } else {
              group.totalPending += totalSub;
            }

            const detailSummary = desc
              ? `${desc} (${subDetails.length} arreglo${subDetails.length > 1 ? 's' : ''})`
              : `Arreglos (${subDetails.length})`;

            group.items.push({
              firestoreId: o.firestoreId,
              key: itemKey,
              subKeys,
              client: clientName,
              detail: detailSummary,
              productNotes: pNotes,
              subDetails,
              date: orderDate,
              amount: totalSub,
              isPaid,
              note: itemNote,
              order: o
            });
          }
        }
      });
    }
  });

  // Sort items for each workshop person from most recent order date to oldest
  Object.keys(dataTalleres).forEach((persona) => {
    dataTalleres[persona].items.sort((a, b) => {
      return new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime();
    });
  });

  const handleTogglePaid = async (item: WorkshopItem, isChecked: boolean) => {
    const updatedMap = { ...(item.order.paidTalleresMap || {}), [item.key]: isChecked };
    if (item.subKeys && item.subKeys.length > 0) {
      item.subKeys.forEach(sk => {
        updatedMap[sk] = isChecked;
      });
    }
    const updatedOrder = { ...item.order, paidTalleresMap: updatedMap };
    try {
      await saveOrderData(updatedOrder, item.firestoreId);
    } catch (e) {
      alert("Error al actualizar el estado de pago del taller.");
    }
  };

  const handleSaveNote = async (item: WorkshopItem, newNote: string) => {
    const updatedNotes = { ...(item.order.tallerNotesMap || {}), [item.key]: newNote };
    if (item.subKeys && item.subKeys.length > 0) {
      item.subKeys.forEach(sk => {
        updatedNotes[sk] = newNote;
      });
    }
    const updatedOrder = { ...item.order, tallerNotesMap: updatedNotes };
    try {
      await saveOrderData(updatedOrder, item.firestoreId);
    } catch (e) {
      console.error("Error al guardar la nota de taller:", e);
    }
  };

  // Helper to render an item row
  const renderItemRow = (it: WorkshopItem) => {
    const currentNoteValue = localNotes[it.key] !== undefined ? localNotes[it.key] : it.note;
    const isExpanded = !!expandedKeys[it.key];
    const hasSubDetails = it.subDetails && it.subDetails.length > 0;

    return (
      <div
        key={it.key}
        className={`p-3 border rounded transition-all ${
          it.isPaid 
            ? 'bg-gray-50/80 border-gray-200' 
            : 'bg-white border-gray-200 hover:border-ragucci-gold-light hover:shadow-xs'
        }`}
      >
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            <input
              type="checkbox"
              checked={it.isPaid}
              onChange={(e) => handleTogglePaid(it, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-ragucci-primary focus:ring-ragucci-gold cursor-pointer shrink-0"
            />
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                🗓️ {formatDate(it.date)}
              </span>

              <span className={it.isPaid ? 'line-through text-gray-400 font-medium' : 'text-gray-900 font-bold'}>
                <strong>{it.client}</strong> — <em>{it.detail}</em>
              </span>

              {hasSubDetails && (
                <button
                  type="button"
                  onClick={() => toggleExpand(it.key)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <span>Ocultar detalle</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Ver {it.subDetails!.length} arreglos</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}

              {it.productNotes && (
                <span className="text-[10px] text-gray-500 italic bg-gray-100 px-1.5 py-0.5 rounded">
                  {it.productNotes}
                </span>
              )}
            </div>
          </div>

          <span className={`font-extrabold text-sm shrink-0 ${it.isPaid ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
            ${formatMoney(it.amount)}
          </span>
        </div>

        {/* Collapsible Sub-Details for Arreglos */}
        {isExpanded && hasSubDetails && (
          <div className="mt-2.5 ml-6 bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex justify-between items-center border-b border-amber-200 pb-1 mb-1.5">
              <span className="font-extrabold text-ragucci-primary text-[11px] uppercase tracking-wide">
                ✂️ Detalle de Arreglos de {it.client} ({it.subDetails!.length}):
              </span>
              <span className="text-[10px] font-extrabold text-amber-900">Total Arreglos: ${formatMoney(it.amount)}</span>
            </div>

            {it.subDetails!.map((sd, sdIdx) => (
              <div key={sdIdx} className="flex justify-between items-center text-gray-800 text-xs font-medium py-0.5">
                <span>• <strong>{sd.tipo}</strong> (Cantidad: x{sd.qty})</span>
                <span className="font-extrabold text-emerald-700">${formatMoney(sd.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Workshop Note / Detail Input */}
        <div className="mt-2 flex items-center gap-2 pl-6">
          <span className="text-[10px] text-ragucci-primary-light font-extrabold uppercase shrink-0">
            ✏️ Nota / Detalle:
          </span>
          <input
            type="text"
            placeholder="Agregar observación o detalle de pago (ej: Pagado 15/08 transf, entrega parcial, etc.)"
            value={currentNoteValue}
            onChange={(e) => setLocalNotes({ ...localNotes, [it.key]: e.target.value })}
            onBlur={(e) => handleSaveNote(it, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-full text-xs p-1.5 border border-gray-200 rounded text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:border-ragucci-gold font-medium"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Control de Pagos a Talleres y Personal
      </h2>
      <p className="text-xs text-ragucci-primary-light mb-6">
        Aquí puedes gestionar las boletas abonadas y pendientes de cada trabajo. Las órdenes en estado <strong>🔴 Pendiente</strong> no ingresan al taller hasta que la tela haya entrado (al cambiar a <strong>🟡 En Taller</strong>, <strong>🔵 Prueba</strong> o <strong>🟢 Entregado</strong>).
      </p>

      {/* Period & Payment Status Filters */}
      <div className="bg-ragucci-bg p-4 rounded-lg border border-ragucci-gold-light mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Filtrar Período (Mes)
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="all">Todos los meses (Histórico)</option>
              <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
              <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
              <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
              <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Filtrar Período (Año)
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Filtrar por Estado de Pago
            </label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
              className="w-full p-2 border border-amber-300 bg-amber-50 text-amber-900 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
            >
              <option value="all">🔍 Todos los trabajos (Pendientes y Pagados)</option>
              <option value="pending">⏳ Solo Pendientes de Pago</option>
              <option value="paid">✅ Solo Pagados / Liquidados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Talleres List */}
      <div className="space-y-6">
        {Object.keys(dataTalleres).map((persona) => {
          const info = dataTalleres[persona];

          // Filter items based on selected payment status
          const displayItems = info.items.filter(it => {
            if (filterPaymentStatus === 'pending') return !it.isPaid;
            if (filterPaymentStatus === 'paid') return it.isPaid;
            return true;
          });

          return (
            <div key={persona} className="border border-ragucci-border p-4 rounded-lg bg-white shadow-sm hover:border-ragucci-gold transition-all">
              {/* Header - Click to open modal */}
              <div 
                onClick={() => setSelectedWorkshopModal(persona)}
                className="flex flex-wrap justify-between items-center border-b-2 border-ragucci-gold pb-2 mb-3 gap-2 cursor-pointer group hover:bg-ragucci-gold-light/20 p-1 rounded transition-colors"
                title="Hacer clic para abrir en pantalla completa"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-ragucci-primary uppercase group-hover:text-ragucci-primary-light transition-colors">
                    {persona}
                  </h3>
                  <span className="text-[10px] font-bold bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light px-2 py-0.5 rounded flex items-center gap-1 shadow-xs transition-colors">
                    <Maximize2 className="w-3 h-3" />
                    <span>Ver Pantalla Completa</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm md:text-lg font-bold text-ragucci-primary">
                    Total a Pagar (Pendiente):{' '}
                    <span className={`font-extrabold ${info.totalPending > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      ${formatMoney(info.totalPending)}
                    </span>
                  </span>
                  {info.totalPaid > 0 && (
                    <div className="text-[11px] font-semibold text-gray-500">
                      Liquidado: <span className="text-gray-700 font-extrabold">${formatMoney(info.totalPaid)}</span>
                      <span className="mx-1">|</span>
                      Acumulado: <span className="text-ragucci-primary font-bold">${formatMoney(info.totalAccumulated)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {displayItems.length > 0 ? (
                  displayItems.map((it) => renderItemRow(it))
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">
                    {filterPaymentStatus === 'pending'
                      ? 'No hay trabajos pendientes de pago para este taller.'
                      : filterPaymentStatus === 'paid'
                      ? 'No hay trabajos pagados/liquidados en este período.'
                      : 'Sin trabajos registrados para este período.'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Workshop Modal */}
      {selectedWorkshopModal && dataTalleres[selectedWorkshopModal] && (
        <Modal
          isOpen={!!selectedWorkshopModal}
          onClose={() => {
            setSelectedWorkshopModal(null);
            setModalSearchTerm('');
          }}
          title={`📋 Boletas y Trabajos: ${selectedWorkshopModal}`}
        >
          {(() => {
            const currentGroup = dataTalleres[selectedWorkshopModal];
            
            const modalFilteredItems = currentGroup.items.filter(it => {
              const matchSearch = !modalSearchTerm.trim() || 
                it.client.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
                it.detail.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                (it.note && it.note.toLowerCase().includes(modalSearchTerm.toLowerCase()));

              const matchStatus = 
                filterPaymentStatus === 'all' ||
                (filterPaymentStatus === 'pending' && !it.isPaid) ||
                (filterPaymentStatus === 'paid' && it.isPaid);

              return matchSearch && matchStatus;
            });

            return (
              <div className="space-y-4">
                {/* Summary Banner in Modal */}
                <div className="bg-ragucci-bg p-3.5 rounded-lg border border-ragucci-gold-light flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-ragucci-primary uppercase block">Resumen del Taller</span>
                    <span className="text-xs text-gray-600 font-medium">
                      Total Boletas: <strong>{currentGroup.items.length} trabajos</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <div className="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1.5 rounded">
                      <span>Pendiente a Pagar: </span>
                      <strong className="text-emerald-700 font-extrabold text-sm">${formatMoney(currentGroup.totalPending)}</strong>
                    </div>
                    <div className="bg-gray-100 border border-gray-300 text-gray-800 px-3 py-1.5 rounded">
                      <span>Liquidado: </span>
                      <strong className="font-extrabold text-sm">${formatMoney(currentGroup.totalPaid)}</strong>
                    </div>
                    <div className="bg-ragucci-primary text-ragucci-gold px-3 py-1.5 rounded">
                      <span>Total Acumulado: </span>
                      <strong className="font-extrabold text-sm">${formatMoney(currentGroup.totalAccumulated)}</strong>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar in Modal */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente o producto..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-gray-600">Estado:</span>
                    <select
                      value={filterPaymentStatus}
                      onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
                      className="p-1.5 border border-amber-300 bg-white text-gray-800 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold cursor-pointer"
                    >
                      <option value="all">🔍 Todos ({currentGroup.items.length})</option>
                      <option value="pending">⏳ Pendientes ({currentGroup.items.filter(i => !i.isPaid).length})</option>
                      <option value="paid">✅ Pagados ({currentGroup.items.filter(i => i.isPaid).length})</option>
                    </select>
                  </div>
                </div>

                {/* Full List Container in Modal */}
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                  {modalFilteredItems.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 font-medium italic">
                      No se encontraron boletas con los filtros aplicados.
                    </div>
                  ) : (
                    modalFilteredItems.map(it => renderItemRow(it))
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
