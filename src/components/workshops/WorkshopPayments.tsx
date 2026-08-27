import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatDate, formatMoney } from '../../utils/formatters';

interface WorkshopItem {
  firestoreId?: string;
  key: string;
  client: string;
  detail: string;
  productNotes?: string;
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
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const filteredOrders = orders.filter((o) => {
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

        // 3. Modistas por Arreglos
        if (c.arreglos && c.arreglos > 0 && p.arreglosDetalle && p.arreglosDetalle.length > 0) {
          const modistaKey = p.modista ? p.modista.toUpperCase() : 'MARIA';
          let targetModistaKey = 'MARÍA (Modista Arreglos)';
          if (modistaKey === 'JESUS') targetModistaKey = 'JESÚS (Modista Arreglos)';
          if (modistaKey === 'ARTURO') targetModistaKey = 'ARTURO (Modista Arreglos)';

          const preciosModista = config.arreglosPrecios?.[modistaKey] || config.arreglosPrecios?.['MARIA'] || {};

          p.arreglosDetalle.forEach((ad, adIdx) => {
            let sub = 0;
            if (ad.isCustom) {
              sub = (ad.price || 0) * (ad.qty || 1);
            } else {
              const pUnit = preciosModista[ad.tipo] || 0;
              sub = pUnit * (ad.qty || 1);
            }
            if (sub > 0) {
              const itemKey = `${o.firestoreId}_p${pIdx}_arr${adIdx}`;
              const isPaid = !!paidMap[itemKey];
              const itemNote = notesMap[itemKey] || '';
              const group = dataTalleres[targetModistaKey];

              group.totalAccumulated += sub;
              if (isPaid) {
                group.totalPaid += sub;
              } else {
                group.totalPending += sub;
              }

              group.items.push({
                firestoreId: o.firestoreId,
                key: itemKey,
                client: clientName,
                detail: `Arreglo: ${ad.tipo} (x${ad.qty})`,
                productNotes: pNotes,
                date: orderDate,
                amount: sub,
                isPaid,
                note: itemNote,
                order: o
              });
            }
          });
        }
      });
    }
  });

  const handleTogglePaid = async (item: WorkshopItem, isChecked: boolean) => {
    const updatedMap = { ...(item.order.paidTalleresMap || {}), [item.key]: isChecked };
    const updatedOrder = { ...item.order, paidTalleresMap: updatedMap };
    try {
      await saveOrderData(updatedOrder, item.firestoreId);
    } catch (e) {
      alert("Error al actualizar el estado de pago del taller.");
    }
  };

  const handleSaveNote = async (item: WorkshopItem, newNote: string) => {
    const updatedNotes = { ...(item.order.tallerNotesMap || {}), [item.key]: newNote };
    const updatedOrder = { ...item.order, tallerNotesMap: updatedNotes };
    try {
      await saveOrderData(updatedOrder, item.firestoreId);
    } catch (e) {
      console.error("Error al guardar la nota de taller:", e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Control de Pagos a Talleres y Personal
      </h2>
      <p className="text-xs text-ragucci-primary-light mb-6">
        Aquí puedes marcar las boletas abonadas (se descuentan automáticamente del Total a Pagar) y agregar notas o fechas a cada trabajo.
      </p>

      {/* Period Filter */}
      <div className="bg-ragucci-bg p-4 rounded-lg border border-ragucci-gold-light mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Talleres List */}
      <div className="space-y-6">
        {Object.keys(dataTalleres).map((persona) => {
          const info = dataTalleres[persona];
          return (
            <div key={persona} className="border border-ragucci-border p-4 rounded-lg bg-white shadow-sm">
              <div className="flex flex-wrap justify-between items-center border-b-2 border-ragucci-gold pb-2 mb-3 gap-2">
                <h3 className="text-base font-extrabold text-ragucci-primary uppercase">{persona}</h3>
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
                {info.items.length > 0 ? (
                  info.items.map((it) => {
                    const currentNoteValue = localNotes[it.key] !== undefined ? localNotes[it.key] : it.note;

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
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">
                    Sin trabajos registrados para este período.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
