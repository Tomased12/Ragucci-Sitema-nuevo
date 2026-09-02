import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ExpensePaymentDetail, CashMovement } from '../../types';
import { formatDate, formatMoney } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ExpensePaymentModal, ExpensePaymentModalItem, ExpensePaymentConfirmData } from '../common/ExpensePaymentModal';
import { Maximize2, Search, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Layers, Scissors } from 'lucide-react';

interface FabricItem {
  firestoreId?: string;
  key: string;
  client: string;
  garmentDesc: string;
  fabricCategory: 'Tela' | 'Forrería';
  colorOrCode?: string;
  provider: string;
  date: string;
  amount: number;
  isPaid: boolean;
  note: string;
  order: Order;
  paymentDetails?: ExpensePaymentDetail;
  status?: string;
}

interface FabricGroup {
  totalPending: number;
  totalPaid: number;
  totalAccumulated: number;
  items: FabricItem[];
}

export const TelasDashboard: React.FC = () => {
  const { orders, saveOrderData, saveCashMovementData, removeCashMovementData } = useApp();

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'pending' | 'paid'>('all');

  const [selectedProviderModal, setSelectedProviderModal] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Payment Modal State
  const [paymentModalItem, setPaymentModalItem] = useState<ExpensePaymentModalItem | null>(null);
  const [activeFabricItemForPayment, setActiveFabricItemForPayment] = useState<FabricItem | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders = orders.filter((o) => {
    const isPendienteStatus = !o.status || o.status.includes('Pendiente');
    if (isPendienteStatus) return false;

    const d = new Date(o.date + 'T12:00:00');
    const matchYear = d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
    return matchYear && matchMonth;
  });

  const dataProveedores: Record<string, FabricGroup> = {
    'Capetown': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Juan Martín': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Tesur (Vitale)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Scabal': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Costa (Dourmeuil)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Costa (Perú)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Capetown (Albini)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Juan Martín (Canclini)': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] },
    'Otros Proveedores': { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] }
  };

  filteredOrders.forEach((o) => {
    const clientName = o.client || 'Cliente sin nombre';
    const paidMap = o.paidTelasMap || {};
    const notesMap = o.telaNotesMap || {};
    const paymentDetailsMap = o.telaPaymentDetailsMap || {};
    const orderDate = o.date;

    if (o.products && o.products.length > 0) {
      o.products.forEach((p, pIdx) => {
        const desc = p.description || 'Prenda';
        const color = p.color || '';

        // 1. Costo de Tela
        if (p.costs && p.costs.telas > 0 && !p.costs.noTelas) {
          const provName = p.proveedorTela || 'Otros Proveedores';
          const key = `${o.firestoreId || o.id}_p${pIdx}_tela`;
          const isPaid = !!paidMap[key];
          const note = notesMap[key] || '';
          const amount = p.costs.telas;

          const fabricItem: FabricItem = {
            firestoreId: o.firestoreId,
            key,
            client: clientName,
            garmentDesc: desc,
            fabricCategory: 'Tela',
            colorOrCode: color,
            provider: provName,
            date: orderDate,
            amount,
            isPaid,
            note,
            order: o,
            paymentDetails: paymentDetailsMap[key],
            status: p.status || o.status || '🔴 Pendiente'
          };

          const targetGroup = dataProveedores[provName] || dataProveedores['Otros Proveedores'];
          targetGroup.items.push(fabricItem);
          targetGroup.totalAccumulated += amount;
          if (isPaid) {
            targetGroup.totalPaid += amount;
          } else {
            targetGroup.totalPending += amount;
          }
        }

        // 2. Costo de Forrería
        if (p.costs && p.costs.forreria > 0 && !p.costs.noForreria) {
          const provName = p.proveedorForreria || 'Capetown';
          const key = `${o.firestoreId || o.id}_p${pIdx}_forreria`;
          const isPaid = !!paidMap[key];
          const note = notesMap[key] || '';
          const amount = p.costs.forreria;

          const fabricItem: FabricItem = {
            firestoreId: o.firestoreId,
            key,
            client: clientName,
            garmentDesc: `${desc} (Forrería)`,
            fabricCategory: 'Forrería',
            colorOrCode: color,
            provider: provName,
            date: orderDate,
            amount,
            isPaid,
            note,
            order: o,
            paymentDetails: paymentDetailsMap[key],
            status: p.status || o.status || '🔴 Pendiente'
          };

          const targetGroup = dataProveedores[provName] || dataProveedores['Otros Proveedores'];
          targetGroup.items.push(fabricItem);
          targetGroup.totalAccumulated += amount;
          if (isPaid) {
            targetGroup.totalPaid += amount;
          } else {
            targetGroup.totalPending += amount;
          }
        }
      });
    }
  });

  const togglePaymentStatus = async (item: FabricItem) => {
    if (!item.isPaid) {
      // Abre el modal para solicitar fecha y medio de pago y descontar de caja
      setPaymentModalItem({
        title: `Pago a Proveedor: ${item.provider}`,
        client: item.client,
        detail: `${item.garmentDesc} - ${item.fabricCategory}`,
        providerOrWorkshop: item.provider,
        amount: item.amount,
        categoryType: 'tela'
      });
      setActiveFabricItemForPayment(item);
    } else {
      // Uncheck / Anular pago
      if (confirm(`¿Deseas anular el pago de $${formatMoney(item.amount)} de tela a ${item.provider} para ${item.client}? Se reintegrará el dinero a la caja.`)) {
        const details = item.order.telaPaymentDetailsMap?.[item.key];
        if (details?.movementId) {
          try {
            await removeCashMovementData(details.movementId);
          } catch (e) {
            console.warn("No se pudo borrar el movimiento de caja:", e);
          }
        }

        const currentPaidMap = item.order.paidTelasMap || {};
        const newPaidMap = { ...currentPaidMap, [item.key]: false };

        const currentDetailsMap = { ...(item.order.telaPaymentDetailsMap || {}) };
        delete currentDetailsMap[item.key];

        const updatedOrder: Order = {
          ...item.order,
          paidTelasMap: newPaidMap,
          telaPaymentDetailsMap: currentDetailsMap
        };

        try {
          await saveOrderData(updatedOrder, item.order.firestoreId);
        } catch (e) {
          alert("Error al anular el pago de la tela.");
        }
      }
    }
  };

  const handleConfirmFabricPayment = async (data: ExpensePaymentConfirmData) => {
    if (!activeFabricItemForPayment) return;
    const it = activeFabricItemForPayment;
    let movementId: string | undefined = undefined;

    try {
      // 1. Crear egreso en CashMovement solo si descontarDeCaja es true
      if (data.descontarDeCaja) {
        movementId = Date.now().toString();
        const newMov: CashMovement = {
          id: movementId,
          date: data.date,
          createdAt: Date.now(),
          type: 'egreso',
          amount: it.amount,
          account: data.account,
          category: `🧵 Telas: ${it.provider}`,
          description: `Pago Telas (${it.provider}): ${it.client} - ${it.garmentDesc}${data.note ? ` [${data.note}]` : ''}`,
          clientOrRef: it.client
        };
        await saveCashMovementData(newMov);
      }

      // 2. Actualizar la orden
      const currentPaidMap = it.order.paidTelasMap || {};
      const newPaidMap = { ...currentPaidMap, [it.key]: true };

      const currentDetailsMap = {
        ...(it.order.telaPaymentDetailsMap || {}),
        [it.key]: {
          date: data.date,
          account: data.account,
          movementId,
          amount: it.amount,
          note: data.note,
          descontarDeCaja: data.descontarDeCaja
        }
      };

      let currentNotesMap = { ...(it.order.telaNotesMap || {}) };
      if (data.note) {
        currentNotesMap[it.key] = data.note;
      }

      const updatedOrder: Order = {
        ...it.order,
        paidTelasMap: newPaidMap,
        telaPaymentDetailsMap: currentDetailsMap,
        telaNotesMap: currentNotesMap
      };

      await saveOrderData(updatedOrder, it.order.firestoreId);
      setActiveFabricItemForPayment(null);
      setPaymentModalItem(null);
    } catch (e) {
      alert("Error al guardar el pago de la tela.");
    }
  };

  const handleSaveNote = async (item: FabricItem, newNote: string) => {
    const { order, key } = item;
    const currentNotesMap = order.telaNotesMap || {};
    const newNotesMap = { ...currentNotesMap, [key]: newNote };

    const updatedOrder: Order = {
      ...order,
      telaNotesMap: newNotesMap
    };

    try {
      await saveOrderData(updatedOrder, order.firestoreId);
    } catch (e) {
      console.error("Error al guardar la nota:", e);
    }
  };

  let globalPending = 0;
  let globalPaid = 0;
  let globalTotal = 0;

  Object.values(dataProveedores).forEach((g) => {
    globalPending += g.totalPending;
    globalPaid += g.totalPaid;
    globalTotal += g.totalAccumulated;
  });

  const activeProviderKeys = Object.keys(dataProveedores).filter(
    (prov) => dataProveedores[prov].items.length > 0
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border space-y-6">
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-2 gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-ragucci-gold" />
            <span>Gestión de Pagos a Proveedores de Telas y Forrerías</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Control de insumos de telas encargado a proveedores de Sastrería, Camisería y Forrerías.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] font-black uppercase text-red-700 block">Total Pendiente Telas</span>
            <span className="text-sm font-black text-red-700">${formatMoney(globalPending)}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] font-black uppercase text-emerald-700 block">Total Pagado Telas</span>
            <span className="text-sm font-black text-emerald-700">${formatMoney(globalPaid)}</span>
          </div>
        </div>
      </div>

      {/* Filter Period & Payment Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-ragucci-primary-light mb-1">Filtrar por Mes</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded font-semibold bg-white focus:outline-none focus:border-ragucci-gold"
          >
            <option value="all">Todos los meses (Año completo)</option>
            <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
            <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
            <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
            <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ragucci-primary-light mb-1">Filtrar por Año</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded font-semibold bg-white focus:outline-none focus:border-ragucci-gold"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ragucci-primary-light mb-1">Estado de Pago Telas</label>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded font-bold bg-white focus:outline-none focus:border-ragucci-gold text-ragucci-primary cursor-pointer"
          >
            <option value="all">🔍 Mostrar Compras Pendientes y Pagadas</option>
            <option value="pending">🔴 Solo Pendientes de Pago</option>
            <option value="paid">🟢 Solo Telas Pagadas</option>
          </select>
        </div>
      </div>

      {/* Grid Cards of Fabric Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(dataProveedores).map((provName) => {
          const group = dataProveedores[provName];
          const hasItems = group.items.length > 0;
          const displayItems = group.items.filter((item) => {
            if (filterPaymentStatus === 'pending') return !item.isPaid;
            if (filterPaymentStatus === 'paid') return item.isPaid;
            return true;
          });

          return (
            <div
              key={provName}
              className={`border-2 rounded-xl p-4 transition-all shadow-xs flex flex-col justify-between ${
                hasItems
                  ? group.totalPending > 0
                    ? 'border-amber-300 bg-white hover:shadow-md'
                    : 'border-emerald-300 bg-emerald-50/20'
                  : 'border-gray-200 bg-gray-50/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                  <h3 className="font-extrabold text-sm uppercase text-ragucci-primary tracking-wide flex items-center gap-1.5">
                    <span>🧵 {provName}</span>
                  </h3>
                  <span className="text-[10px] font-extrabold bg-ragucci-primary text-ragucci-gold px-2 py-0.5 rounded-full">
                    {group.items.length} ítem(s)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between items-center bg-red-50 p-2 rounded border border-red-100 font-extrabold">
                    <span className="text-red-900 text-[11px] uppercase">Pendiente de Pago:</span>
                    <span className="text-red-700 text-sm font-black">${formatMoney(group.totalPending)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-emerald-50 p-2 rounded border border-emerald-100 font-extrabold">
                    <span className="text-emerald-900 text-[11px] uppercase">Saldado / Pagado:</span>
                    <span className="text-emerald-700 text-xs font-black">${formatMoney(group.totalPaid)}</span>
                  </div>

                  <div className="flex justify-between items-center px-2 py-1 text-[11px] text-gray-500 font-medium">
                    <span>Total Encargo en Período:</span>
                    <span className="font-bold text-ragucci-primary">${formatMoney(group.totalAccumulated)}</span>
                  </div>
                </div>
              </div>

              {hasItems ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProviderModal(provName);
                    setModalSearchTerm('');
                  }}
                  className="w-full bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold text-xs font-black py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ver Detalle y Saldar ({displayItems.length})</span>
                </button>
              ) : (
                <div className="text-[11px] text-center text-gray-400 italic py-1">
                  Sin compras asignadas en este período
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: DETALLE Y GESTION POR PROVEEDOR DE TELAS */}
      {selectedProviderModal && (
        <Modal
          isOpen={!!selectedProviderModal}
          onClose={() => setSelectedProviderModal(null)}
          title={`🧵 Proveedor de Telas: ${selectedProviderModal}`}
          maxWidth="max-w-4xl"
        >
          {(() => {
            const group = dataProveedores[selectedProviderModal] || { totalPending: 0, totalPaid: 0, totalAccumulated: 0, items: [] };
            const modalItems = group.items.filter((item) => {
              const matchesStatus =
                filterPaymentStatus === 'pending'
                  ? !item.isPaid
                  : filterPaymentStatus === 'paid'
                  ? item.isPaid
                  : true;

              const search = modalSearchTerm.toLowerCase().trim();
              const matchesSearch =
                !search ||
                item.client.toLowerCase().includes(search) ||
                item.garmentDesc.toLowerCase().includes(search) ||
                (item.colorOrCode && item.colorOrCode.toLowerCase().includes(search));

              return matchesStatus && matchesSearch;
            });

            return (
              <div className="space-y-4 text-xs">
                {/* Modal KPI Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-ragucci-primary text-white p-3.5 rounded-xl border border-ragucci-gold">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ragucci-gold-light block">Pendiente a Pagar</span>
                    <strong className="text-lg font-black text-red-400">${formatMoney(group.totalPending)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ragucci-gold-light block">Total Saldado</span>
                    <strong className="text-lg font-black text-emerald-400">${formatMoney(group.totalPaid)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ragucci-gold-light block">Total Compras del Período</span>
                    <strong className="text-lg font-black text-ragucci-gold">${formatMoney(group.totalAccumulated)}</strong>
                  </div>
                </div>

                {/* Search Bar inside Modal */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, prenda o código de tela..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-ragucci-gold"
                  />
                </div>

                {/* Table of Fabric Purchases */}
                {modalItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 italic">
                    No se encontraron telas encargadas con los filtros seleccionados.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[60vh]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-ragucci-primary text-ragucci-gold font-extrabold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Prenda & Insumo</th>
                          <th className="py-2.5 px-3">Tono / Código Tela</th>
                          <th className="py-2.5 px-3 text-right">Costo Tela ($)</th>
                          <th className="py-2.5 px-3 text-center">Estado de Pago</th>
                          <th className="py-2.5 px-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {modalItems.map((item) => (
                          <tr key={item.key} className="hover:bg-amber-50/50 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap font-medium text-gray-600">
                              {formatDate(item.date)}
                            </td>

                            <td className="py-2.5 px-3 font-extrabold text-ragucci-primary whitespace-nowrap">
                              {item.client}
                            </td>

                            <td className="py-2.5 px-3 font-bold text-gray-800">
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-1 bg-ragucci-primary/10 text-ragucci-primary px-2 py-0.5 rounded font-extrabold text-xs">
                                  {item.garmentDesc}
                                </span>
                                {item.status && (
                                  <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full uppercase">
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-gray-700 font-medium">
                              {item.colorOrCode || <span className="text-gray-400 italic">Sin código</span>}
                            </td>

                            <td className="py-2.5 px-3 font-black text-right text-ragucci-primary text-sm whitespace-nowrap">
                              ${formatMoney(item.amount)}
                            </td>

                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => togglePaymentStatus(item)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                                  item.isPaid
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                }`}
                              >
                                {item.isPaid ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>🟢 PAGADO</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>🔴 PENDIENTE</span>
                                  </>
                                )}
                              </button>
                              {item.isPaid && item.paymentDetails && (
                                <div className="text-[10px] text-emerald-800 font-bold mt-1 text-center">
                                  <span>{formatDate(item.paymentDetails.date)}</span>
                                  <span className="block text-[9px] text-gray-600 font-medium">
                                    {item.paymentDetails.descontarDeCaja === false ? 'Histórico · ' : ''}
                                    {item.paymentDetails.account === 'efectivo' ? '💵 Efectivo' : item.paymentDetails.account === 'banco' ? '🏦 Banco' : '💵 USD'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                defaultValue={item.note}
                                onBlur={(e) => handleSaveNote(item, e.target.value)}
                                placeholder="Añadir nota / nro fardo..."
                                className="w-full p-1 border border-gray-300 rounded text-[11px] focus:outline-none focus:border-ragucci-gold"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 flex justify-end border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderModal(null)}
                    className="bg-ragucci-primary text-ragucci-gold font-black text-xs uppercase px-5 py-2 rounded-lg cursor-pointer hover:bg-ragucci-primary-light"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Expense Payment Confirmation Modal */}
      <ExpensePaymentModal
        isOpen={!!paymentModalItem}
        onClose={() => {
          setPaymentModalItem(null);
          setActiveFabricItemForPayment(null);
        }}
        item={paymentModalItem}
        onConfirm={handleConfirmFabricPayment}
      />
    </div>
  );
};
