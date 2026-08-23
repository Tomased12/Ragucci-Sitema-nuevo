import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface WorkshopItem {
  firestoreId?: string;
  key: string;
  client: string;
  detail: string;
  amount: number;
  isPaid: boolean;
  order: Order;
}

export const WorkshopPayments: React.FC = () => {
  const { orders, config, saveOrderData } = useApp();

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    const matchYear = d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
    return matchYear && matchMonth;
  });

  const dataTalleres: Record<string, { total: number; items: WorkshopItem[] }> = {
    'SANTIAGO (Sastre)': { total: 0, items: [] },
    'DIEGO (Camisero)': { total: 0, items: [] },
    'GUILLERMO (Camisero)': { total: 0, items: [] },
    'MARÍA (Modista Arreglos)': { total: 0, items: [] },
    'JESÚS (Modista Arreglos)': { total: 0, items: [] },
    'ARTURO (Modista Arreglos)': { total: 0, items: [] }
  };

  filteredOrders.forEach((o) => {
    const clientName = o.client || 'Cliente sin nombre';
    const paidMap = o.paidTalleresMap || {};

    if (o.products && o.products.length > 0) {
      o.products.forEach((p, pIdx) => {
        const desc = p.description || '';
        const c = p.costs || {};

        // 1. Sastre Santiago
        if (c.sastre && c.sastre > 0) {
          const itemKey = `${o.firestoreId}_p${pIdx}_sastre`;
          const isPaid = !!paidMap[itemKey];
          dataTalleres['SANTIAGO (Sastre)'].total += c.sastre;
          dataTalleres['SANTIAGO (Sastre)'].items.push({
            firestoreId: o.firestoreId,
            key: itemKey,
            client: clientName,
            detail: desc,
            amount: c.sastre,
            isPaid,
            order: o
          });
        }

        // 2. Camiseros Diego / Guillermo
        if (c.camisero && c.camisero > 0) {
          let targetCamisero = 'DIEGO (Camisero)';
          if (
            p.camiseroSelected === 'guillermo' ||
            desc.toUpperCase().includes('GUILLERMO') ||
            p.notes?.toLowerCase().includes('guillermo')
          ) {
            targetCamisero = 'GUILLERMO (Camisero)';
          }
          const itemKey = `${o.firestoreId}_p${pIdx}_camisero`;
          const isPaid = !!paidMap[itemKey];
          dataTalleres[targetCamisero].total += c.camisero;
          dataTalleres[targetCamisero].items.push({
            firestoreId: o.firestoreId,
            key: itemKey,
            client: clientName,
            detail: desc,
            amount: c.camisero,
            isPaid,
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
              dataTalleres[targetModistaKey].total += sub;
              dataTalleres[targetModistaKey].items.push({
                firestoreId: o.firestoreId,
                key: itemKey,
                client: clientName,
                detail: `Arreglo: ${ad.tipo} (x${ad.qty})`,
                amount: sub,
                isPaid,
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-xl font-bold font-bodoni uppercase text-ragucci-primary mb-2 border-b-2 border-ragucci-gold pb-2">
        Control de Pagos a Talleres y Personal
      </h2>
      <p className="text-xs text-ragucci-primary-light mb-6">
        Aquí puedes marcar como pagadas o pendientes las boletas de cada trabajo.
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
              <div className="flex flex-wrap justify-between items-center border-b-2 border-ragucci-gold pb-2 mb-3">
                <h3 className="text-base font-extrabold text-ragucci-primary uppercase">{persona}</h3>
                <span className="text-lg font-bold text-ragucci-primary">
                  Total a Pagar: <span className="text-emerald-600 font-extrabold">${formatMoney(info.total)}</span>
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {info.items.length > 0 ? (
                  info.items.map((it) => (
                    <div
                      key={it.key}
                      className="flex justify-between items-center text-xs py-2 px-3 border-b border-gray-100 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={it.isPaid}
                          onChange={(e) => handleTogglePaid(it, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-ragucci-primary focus:ring-ragucci-gold cursor-pointer"
                        />
                        <span className={it.isPaid ? 'line-through text-gray-400' : 'text-gray-800'}>
                          <strong>{it.client}</strong> — <em>{it.detail}</em>
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        ${formatMoney(it.amount)}
                      </span>
                    </div>
                  ))
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
