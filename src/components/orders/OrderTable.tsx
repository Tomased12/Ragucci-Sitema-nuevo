import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatDate, formatMoney, checkBirthdayToday, parseMoney, getTodayString } from '../../utils/formatters';
import { OrderDetailModal } from './OrderDetailModal';
import { OrderSidePanel } from './OrderSidePanel';
import { PaymentModal } from './PaymentModal';
import { ClientHistoryModal } from '../clients/ClientHistoryModal';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { UserBadge } from '../common/UserBadge';
import { InteractiveMeasuresSheet } from '../common/InteractiveMeasuresSheet';
import { Search, Eye, Edit, Plus, Trash2, MessageCircle, FileSpreadsheet, Clock, AlertTriangle, Ruler, User, FileText, CheckCircle2, ChevronRight, CreditCard } from 'lucide-react';
import { exportOrdersToCSV } from '../../utils/exportCsv';

export const OrderTable: React.FC = () => {
  const { orders, saveOrderData, removeOrderData, setEditingOrderId, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUpcomingOnly, setFilterUpcomingOnly] = useState(false);
  const [filterPago, setFilterPago] = useState('all');
  const [filterTipo, setFilterTipo] = useState<'all' | 'medida' | 'rtw'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'delivery_asc' | 'saldo_desc'>('date_desc');

  // Helper to calculate days until delivery
  const getDeliveryInfo = (order: Order) => {
    const targetDateStr = order.deliveryDate || order.date;
    if (!targetDateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { diffDays, targetDateStr };
  };

  const upcomingOrders = orders.filter((o) => {
    const info = getDeliveryInfo(o);
    if (!info) return false;
    const isNotDelivered = o.status !== '🟢 Entregado';
    return isNotDelivered && info.diffDays >= -2 && info.diffDays <= 7;
  });

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // Side Panel
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sub-Menu Mode inside Registro: Órdenes vs Medidas
  const [registroViewMode, setRegistroViewMode] = useState<'ordenes' | 'medidas'>('ordenes');
  const [measuresSearchTerm, setMeasuresSearchTerm] = useState('');
  const [measuresGarmentFilter, setMeasuresGarmentFilter] = useState<'all' | 'saco' | 'pantalon' | 'camisa' | 'chaleco'>('all');
  const [selectedMeasuresOrder, setSelectedMeasuresOrder] = useState<Order | null>(null);
  const [tempEditedMeasurements, setTempEditedMeasurements] = useState<any>(null);

  // Add Cost Modal state
  const [addCostOrder, setAddCostOrder] = useState<Order | null>(null);
  const [addCostType, setAddCostType] = useState('arreglos');
  const [addCostAmount, setAddCostAmount] = useState(0);

  // Helper to verify if a measurement object has any non-empty measurement values
  const hasAnyMeasurements = (m: any): boolean => {
    if (!m) return false;
    if (m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0) {
      const profilesHaveData = m.profiles.some((p: any) => {
        if (!p.measurements) return false;
        return Object.values(p.measurements).some(val => typeof val === 'string' && val.trim().length > 0);
      });
      if (profilesHaveData) return true;
    }
    return Object.entries(m).some(([key, val]) => {
      if (key === 'profiles' || key === 'history') return false;
      return typeof val === 'string' && val.trim().length > 0;
    });
  };

  // Aggregating Clients with Measurements for the Medidas Sub-Menu
  const clientMeasuresMap: Record<string, {
    client: string;
    phone?: string;
    email?: string;
    latestOrderDate: string;
    orderCount: number;
    latestOrder: Order;
    measurements: any;
    profilesCount: number;
    profileNames: string[];
    hasSaco: boolean;
    hasChaleco: boolean;
    hasPantalon: boolean;
    hasCamisa: boolean;
  }> = {};

  orders.forEach((o) => {
    const rawName = (o.client || '').trim();
    if (!rawName) return;

    const m = o.measurements;
    const hasData = hasAnyMeasurements(m);

    if (!clientMeasuresMap[rawName]) {
      clientMeasuresMap[rawName] = {
        client: rawName,
        phone: o.phone,
        email: o.email,
        latestOrderDate: o.date,
        orderCount: 1,
        latestOrder: o,
        measurements: m || {},
        profilesCount: m?.profiles?.length || 1,
        profileNames: m?.profiles?.map((p: any) => p.profileName) || ['Medidas Principales'],
        hasSaco: false,
        hasChaleco: false,
        hasPantalon: false,
        hasCamisa: false
      };
    } else {
      clientMeasuresMap[rawName].orderCount += 1;
      if (hasData || new Date(o.date + 'T12:00:00').getTime() > new Date(clientMeasuresMap[rawName].latestOrderDate + 'T12:00:00').getTime()) {
        clientMeasuresMap[rawName].latestOrderDate = o.date;
        clientMeasuresMap[rawName].latestOrder = o;
        if (hasData) {
          clientMeasuresMap[rawName].measurements = m;
          clientMeasuresMap[rawName].profilesCount = m?.profiles?.length || 1;
          clientMeasuresMap[rawName].profileNames = m?.profiles?.map((p: any) => p.profileName) || ['Medidas Principales'];
        }
      }
    }

    const activeM = clientMeasuresMap[rawName].measurements || {};
    clientMeasuresMap[rawName].hasSaco = !!(activeM.sacoPecho || activeM.sacoCintura || activeM.sacoLargoMangas || activeM.sacoHombro || activeM.sacoLargoTotal);
    clientMeasuresMap[rawName].hasChaleco = !!(activeM.chalecoPecho || activeM.chalecoLargoDelantero);
    clientMeasuresMap[rawName].hasPantalon = !!(activeM.pantCintura || activeM.pantCadera || activeM.pantLargoConCintura);
    clientMeasuresMap[rawName].hasCamisa = !!(activeM.camisaCuello || activeM.camisaPecho || activeM.camisaEspalda);
  });

  const clientsWithMeasuresList = Object.values(clientMeasuresMap).filter(c => {
    // Strictly require that the client actually has filled measurement data
    if (!hasAnyMeasurements(c.measurements)) return false;

    const matchSearch = !measuresSearchTerm.trim() || c.client.toLowerCase().includes(measuresSearchTerm.toLowerCase());
    let matchGarment = true;
    if (measuresGarmentFilter === 'saco') matchGarment = c.hasSaco;
    if (measuresGarmentFilter === 'pantalon') matchGarment = c.hasPantalon;
    if (measuresGarmentFilter === 'camisa') matchGarment = c.hasCamisa;
    if (measuresGarmentFilter === 'chaleco') matchGarment = c.hasChaleco;

    return matchSearch && matchGarment;
  });

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'delivery_asc') {
      if (a.status === '🟢 Entregado' && b.status !== '🟢 Entregado') return 1;
      if (a.status !== '🟢 Entregado' && b.status === '🟢 Entregado') return -1;

      const dateA = a.deliveryDate || a.date;
      const dateB = b.deliveryDate || b.date;
      return new Date(dateA + 'T00:00:00').getTime() - new Date(dateB + 'T00:00:00').getTime();
    } else if (sortBy === 'saldo_desc') {
      return (b.saldo || 0) - (a.saldo || 0);
    } else {
      return new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime();
    }
  });

  const filteredOrders = sortedOrders.filter((order) => {
    const d = new Date(order.date + 'T12:00:00');
    const matchMonth = filterUpcomingOnly ? true : (filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth);

    let matchStatus = true;
    if (!filterUpcomingOnly && filterStatus !== 'all') {
      const targetSt = filterStatus.toLowerCase();
      const checkStatusMatch = (st: string) => {
        const s = (st || '').toLowerCase();
        if (targetSt.includes('pendiente')) return s.includes('pendiente');
        if (targetSt.includes('pedida')) return s.includes('pedida');
        if (targetSt.includes('local')) return s.includes('local');
        if (targetSt.includes('taller')) return s.includes('taller');
        if (targetSt.includes('prueba')) return s.includes('prueba');
        if (targetSt.includes('entregado')) return s.includes('entregado');
        return s === targetSt;
      };

      const orderMatches = checkStatusMatch(order.status || '');
      const productMatches = order.products?.some(p => checkStatusMatch(p.status || order.status || ''));
      matchStatus = orderMatches || !!productMatches;
    }

    const saldoVal = order.saldo || 0;
    let matchPago = true;
    if (filterPago === 'pendientes') matchPago = saldoVal > 0;
    if (filterPago === 'pagadas') matchPago = saldoVal === 0;

    let matchTipo = true;
    const hasMedida = Boolean(
      order.products &&
      order.products.length > 0 &&
      order.products.some(p => p.description && p.description.trim().length > 0)
    );
    const isOnlyRTW = !hasMedida && Boolean(
      (order.rtwItems && order.rtwItems.length > 0) ||
      (order.costs?.pterminado ? order.costs.pterminado > 0 : false)
    );

    if (filterTipo === 'medida') {
      matchTipo = hasMedida;
    } else if (filterTipo === 'rtw') {
      matchTipo = isOnlyRTW;
    }

      let productListText = order.products
        ? order.products.map((p) => `${p.description}${p.isGift ? ' 🎁[REGALO]' : ''}${p.modista ? ` (${p.modista})` : ''}`).join(' + ')
        : '';
      if (order.rtwItems && order.rtwItems.length > 0) {
        productListText += (productListText ? ' + ' : '') + order.rtwItems.map((rtw) => `${rtw.desc}${rtw.isGift ? ' 🎁[REGALO]' : ''} (x${rtw.qty})${rtw.notes ? ` [${rtw.notes}]` : ''}`).join(' + ');
      }

    const matchSearch =
      !searchTerm.trim() ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productListText.toLowerCase().includes(searchTerm.toLowerCase());

    const isDelivered = order.status === '🟢 Entregado' || (order.status && order.status.toLowerCase().includes('entregado'));
    const matchDeliverySort = sortBy !== 'delivery_asc' || !isDelivered;

    const info = getDeliveryInfo(order);
    const matchUpcoming = !filterUpcomingOnly || (info !== null && !isDelivered && info.diffDays >= -2 && info.diffDays <= 7);

    return matchMonth && matchStatus && matchPago && matchTipo && matchSearch && matchDeliverySort && matchUpcoming;
  });

  const handleStatusChange = async (order: Order, newStatus: string) => {
    try {
      const updatedProducts = (order.products || []).map(p => ({
        ...p,
        status: newStatus
      }));
      const updatedOrder = { ...order, status: newStatus, products: updatedProducts };
      await saveOrderData(updatedOrder, order.firestoreId);
      // Sync the selected order in the side panel if it's the same order
      if (selectedOrder && (selectedOrder.firestoreId === order.firestoreId)) {
        setSelectedOrder(updatedOrder);
      }
    } catch (e) {
      alert("Error al actualizar el estado de la orden.");
    }
  };

  const handleProductStatusChange = async (order: Order, productIndex: number, newStatus: string) => {
    try {
      const updatedProducts = (order.products || []).map((p, idx) => {
        const currentPStatus = p.status || order.status || '🔴 Pendiente';
        if (idx === productIndex) {
          return { ...p, status: newStatus };
        }
        return { ...p, status: currentPStatus };
      });

      const allEntregado = updatedProducts.length > 0 && updatedProducts.every(p => p.status === '🟢 Entregado');
      const anyPrueba = updatedProducts.some(p => p.status === '🔵 Prueba');
      const anyInTaller = updatedProducts.some(p => p.status === '🟡 En Taller');
      const anyTelaLocal = updatedProducts.some(p => p.status === '🟠 Tela en Local');
      const anyTelaPedida = updatedProducts.some(p => p.status === '🟣 Tela Pedida');

      let generalStatus = order.status || '🔴 Pendiente';
      if (allEntregado) {
        generalStatus = '🟢 Entregado';
      } else if (anyPrueba) {
        generalStatus = '🔵 Prueba';
      } else if (anyInTaller) {
        generalStatus = '🟡 En Taller';
      } else if (anyTelaLocal) {
        generalStatus = '🟠 Tela en Local';
      } else if (anyTelaPedida) {
        generalStatus = '🟣 Tela Pedida';
      } else if (updatedProducts.every(p => p.status === '🔴 Pendiente')) {
        generalStatus = '🔴 Pendiente';
      }

      const updatedOrder: Order = {
        ...order,
        products: updatedProducts,
        status: generalStatus
      };

      await saveOrderData(updatedOrder, order.firestoreId);
      if (selectedOrder && (selectedOrder.firestoreId === order.firestoreId)) {
        setSelectedOrder(updatedOrder);
      }
    } catch (e) {
      alert("Error al actualizar el estado de la prenda.");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const STATUS_STAGES = [
    '🔴 Pendiente',
    '🟣 Tela Pedida',
    '🟠 Tela en Local',
    '🟡 En Taller',
    '🔵 Prueba',
    '🟢 Entregado',
  ];

  // Keyboard shortcut: K = advance status, Esc = close panel, P = open payment
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (!selectedOrder) return;

      if (e.key === 'k' || e.key === 'K') {
        const currentIdx = STATUS_STAGES.indexOf(selectedOrder.status || '🔴 Pendiente');
        const nextStatus = STATUS_STAGES[currentIdx + 1];
        if (nextStatus) {
          handleStatusChange(selectedOrder, nextStatus);
          showToast(`${selectedOrder.client} → ${nextStatus}`);
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        setSelectedPaymentOrder(selectedOrder);
      }
      if (e.key === 'Escape') {
        setSidePanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder]);

  const handleDelete = async (order: Order) => {
    if (confirm(`¿Seguro que deseas eliminar la orden de ${order.client} de la nube?`)) {
      if (order.firestoreId) {
        await removeOrderData(order.firestoreId);
      }
    }
  };

  const handleSaveExtraCost = async () => {
    if (!addCostOrder || addCostAmount <= 0) {
      alert("Ingrese un monto válido mayor a 0.");
      return;
    }

    const currentCosts = { ...addCostOrder.costs };
    currentCosts[addCostType as keyof typeof currentCosts] =
      (currentCosts[addCostType as keyof typeof currentCosts] || 0) + addCostAmount;

    const newTotalCost = addCostOrder.totalCost + addCostAmount;
    const newProfit = addCostOrder.profit - addCostAmount;

    const updatedOrder: Order = {
      ...addCostOrder,
      costs: currentCosts,
      totalCost: newTotalCost,
      profit: newProfit
    };

    try {
      await saveOrderData(updatedOrder, addCostOrder.firestoreId);
      alert("Gasto extra guardado en la nube.");
      setAddCostOrder(null);
      setAddCostAmount(0);
    } catch (e) {
      alert("Error al guardar el gasto extra.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-1 mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary inline-block tracking-wide">
          Libro de Órdenes y Flujo de Trabajo
        </h2>
        <button
          onClick={() => exportOrdersToCSV(filteredOrders, `ragucci_ordenes_${filterMonth}.csv`)}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold py-1.5 px-3.5 rounded transition-all cursor-pointer shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📊 Exportar a Excel (.csv)</span>
        </button>
      </div>

      {/* Sub-Menu Switcher inside Registro: Libro de Órdenes vs Fichas de Medidas */}
      <div className="flex rounded-lg shadow-sm mb-5 bg-ragucci-bg p-1.5 border border-ragucci-gold-light">
        <button
          type="button"
          onClick={() => setRegistroViewMode('ordenes')}
          className={`flex-1 py-2.5 px-4 rounded text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            registroViewMode === 'ordenes'
              ? 'bg-ragucci-primary text-ragucci-gold shadow-md'
              : 'text-ragucci-primary hover:bg-ragucci-gold-light/20 font-bold'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📋 Libro de Órdenes y Ventas ({filteredOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setRegistroViewMode('medidas')}
          className={`flex-1 py-2.5 px-4 rounded text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            registroViewMode === 'medidas'
              ? 'bg-ragucci-primary text-ragucci-gold shadow-md'
              : 'text-ragucci-primary hover:bg-ragucci-gold-light/20 font-bold'
          }`}
        >
          <Ruler className="w-4 h-4 text-ragucci-gold" />
          <span>🧵 Directorio de Medidas de Clientes ({clientsWithMeasuresList.length})</span>
        </button>
      </div>

      {registroViewMode === 'medidas' ? (
        <div className="space-y-4">
          {/* Medidas Search & Garment Filters */}
          <div className="bg-ragucci-bg p-4 rounded-lg border border-ragucci-gold-light flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={measuresSearchTerm}
                onChange={(e) => setMeasuresSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-600">Filtrar prenda:</span>
              <select
                value={measuresGarmentFilter}
                onChange={(e: any) => setMeasuresGarmentFilter(e.target.value)}
                className="text-xs p-1.5 border border-gray-300 rounded bg-white font-bold focus:outline-none focus:border-ragucci-gold"
              >
                <option value="all">Todas las prendas</option>
                <option value="saco">🧥 Con Medidas de Saco</option>
                <option value="pantalon">👖 Con Medidas de Pantalón</option>
                <option value="camisa">👔 Con Medidas de Camisa</option>
                <option value="chaleco">🦺 Con Medidas de Chaleco</option>
              </select>
            </div>
          </div>

          {/* Directory Grid / Cards of Client Measurement Sheets */}
          {clientsWithMeasuresList.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-medium italic border border-dashed border-gray-300 rounded-lg">
              No se encontraron fichas de medidas con los filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientsWithMeasuresList.map((item) => {
                const m = item.measurements || {};

                return (
                  <div
                    key={item.client}
                    className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/30 hover:border-ragucci-gold transition-all shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-ragucci-gold/20 pb-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedClientName(item.client)}
                            className="font-extrabold text-sm uppercase text-ragucci-primary hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                            title="Ver historial completo del cliente"
                          >
                            <span>👤 {item.client}</span>
                          </button>

                          {(item.phone || item.email) && (
                            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                              {item.phone && <span>📞 {item.phone}</span>}
                              {item.phone && item.email && <span> • </span>}
                              {item.email && <span>✉️ {item.email}</span>}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-500 block">
                            Última Ficha: <strong>{formatDate(item.latestOrderDate)}</strong>
                          </span>
                          <span className="text-[10px] font-extrabold bg-ragucci-primary/10 text-ragucci-primary px-2 py-0.5 rounded-full inline-block mt-0.5">
                            {item.orderCount} orden(es)
                          </span>
                        </div>
                      </div>

                      {/* Profiles Badges (e.g. Matías Padre, Luca Hijo) */}
                      {item.profileNames && item.profileNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center mt-2.5">
                          <span className="text-[10px] font-bold text-gray-500">Perfiles ({item.profilesCount}):</span>
                          {item.profileNames.map((pName, pIdx) => (
                            <span
                              key={pIdx}
                              className="bg-ragucci-primary text-ragucci-gold text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-ragucci-gold/40 shadow-2xs"
                            >
                              👤 {pName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Measures Quick Breakdown Badges */}
                      <div className="flex flex-wrap gap-1.5 items-center mt-3 text-[11px]">
                        {item.hasSaco && (
                          <span className="bg-amber-50 text-amber-950 font-bold px-2 py-0.5 rounded border border-amber-200">
                            🧥 Saco: {m.sacoPecho ? `Pecho ${m.sacoPecho}` : ''} {m.sacoCintura ? `/ Cint ${m.sacoCintura}` : ''} {m.sacoLargoMangas ? `/ Manga ${m.sacoLargoMangas}` : ''}
                          </span>
                        )}

                        {item.hasPantalon && (
                          <span className="bg-emerald-50 text-emerald-950 font-bold px-2 py-0.5 rounded border border-emerald-200">
                            👖 Pantalón: {m.pantCintura ? `Cint ${m.pantCintura}` : ''} {m.pantCadera ? `/ Cad ${m.pantCadera}` : ''} {m.pantLargoConCintura ? `/ Largo ${m.pantLargoConCintura}` : ''}
                          </span>
                        )}

                        {item.hasCamisa && (
                          <span className="bg-sky-50 text-sky-950 font-bold px-2 py-0.5 rounded border border-sky-200">
                            👔 Camisa: {m.camisaCuello ? `Cuello ${m.camisaCuello}` : ''} {m.camisaPecho ? `/ Pecho ${m.camisaPecho}` : ''}
                          </span>
                        )}

                        {item.hasChaleco && (
                          <span className="bg-purple-50 text-purple-950 font-bold px-2 py-0.5 rounded border border-purple-200">
                            🦺 Chaleco
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMeasuresOrder(item.latestOrder);
                          setTempEditedMeasurements(item.latestOrder.measurements || {});
                        }}
                        className="bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold text-xs font-extrabold py-1.5 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Ruler className="w-4 h-4 text-ragucci-gold" />
                        <span>👁️ Ver / Editar Ficha Completa</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedClientName(item.client)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold py-1.5 px-2.5 rounded-lg border border-gray-300 cursor-pointer"
                        >
                          📜 Historial
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOrderId(item.latestOrder.firestoreId || null);
                            setActiveTab('carga');
                          }}
                          className="bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg cursor-pointer"
                        >
                          ✏️ Editar Orden
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ragucci-primary text-ragucci-gold px-4 py-2 rounded-full text-xs font-black shadow-xl animate-bounce border border-ragucci-gold/30">
              {toastMsg}
            </div>
          )}

          {/* Alert Banner: Próximas Entregas */}
          {upcomingOrders.length > 0 && (
            <div
              onClick={() => setFilterUpcomingOnly(!filterUpcomingOnly)}
              className={`mb-3 px-3 py-2 rounded-lg border flex flex-wrap items-center justify-between cursor-pointer transition-all text-xs ${
                filterUpcomingOnly
                  ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-md ring-1 ring-amber-400'
                  : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
              }`}
            >
              <div className="flex items-center gap-2 font-extrabold">
                <Clock className="w-4 h-4 text-amber-700 animate-pulse shrink-0" />
                <span>⏰ {upcomingOrders.length} entrega(s) esta semana</span>
              </div>
              <span className="text-[10px] font-black bg-amber-800 text-white px-2.5 py-0.5 rounded-full">
                {filterUpcomingOnly ? '✕ Ver todas' : 'Filtrar urgentes →'}
              </span>
            </div>
          )}

          {/* ── COMPACT TOOLBAR ── */}
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
            {/* Search */}
            <div className="relative shrink-0 w-44">
              <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-[11px] font-medium focus:outline-none focus:border-ragucci-gold bg-white"
              />
            </div>

            <div className="w-px h-5 bg-gray-300 shrink-0 hidden sm:block" />

            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { val: 'all',            label: 'Todos',   dot: 'bg-gray-400' },
                { val: '🔴 Pendiente',    label: 'Pend.',   dot: 'bg-red-500' },
                { val: '🟣 Tela Pedida',  label: 'Pedida',  dot: 'bg-purple-500' },
                { val: '🟠 Tela en Local',label: 'En Local',dot: 'bg-orange-400' },
                { val: '🟡 En Taller',    label: 'Taller',  dot: 'bg-yellow-400' },
                { val: '🔵 Prueba',       label: 'Prueba',  dot: 'bg-blue-500' },
                { val: '🟢 Entregado',    label: 'Listo',   dot: 'bg-emerald-500' },
              ].map(({ val, label, dot }) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer whitespace-nowrap border
                    ${filterStatus === val
                      ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-300 shrink-0 hidden md:block" />

            {/* Compact secondary filters */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="py-1.5 px-2 border border-gray-200 rounded text-[11px] font-medium focus:outline-none bg-white cursor-pointer"
            >
              <option value="all">Todos los meses</option>
              <option value="1">Ene</option><option value="2">Feb</option><option value="3">Mar</option>
              <option value="4">Abr</option><option value="5">May</option><option value="6">Jun</option>
              <option value="7">Jul</option><option value="8">Ago</option><option value="9">Sep</option>
              <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dic</option>
            </select>

            <select
              value={filterPago}
              onChange={(e) => setFilterPago(e.target.value)}
              className="py-1.5 px-2 border border-gray-200 rounded text-[11px] font-medium focus:outline-none bg-white cursor-pointer"
            >
              <option value="all">Todos los pagos</option>
              <option value="pendientes">Con Saldo</option>
              <option value="pagadas">Pagadas</option>
            </select>

            {/* Tipo de Trabajo: A Medida vs RTW */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className={`py-1.5 px-2 border rounded text-[11px] font-bold focus:outline-none cursor-pointer transition-colors ${
                filterTipo === 'medida'
                  ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-primary shadow-xs font-black'
                  : filterTipo === 'rtw'
                  ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs font-black'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              <option value="all">✨ Todos los Tipos</option>
              <option value="medida">✂️ Solo A Medida</option>
              <option value="rtw">🛍️ Solo Prod. Terminados (RTW)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2 border border-amber-200 bg-amber-50 text-amber-900 rounded text-[11px] font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="date_desc">📅 Recientes</option>
              <option value="delivery_asc">⏰ Urgentes</option>
              <option value="saldo_desc">💰 Mayor Saldo</option>
            </select>

            {/* Count badge + keyboard hint */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 hidden lg:inline">
                <kbd className="bg-gray-200 px-1 py-0.5 rounded border border-gray-300 font-mono text-gray-500">K</kbd> avanzar estado
                &nbsp;·&nbsp;
                <kbd className="bg-gray-200 px-1 py-0.5 rounded border border-gray-300 font-mono text-gray-500">P</kbd> pago
                &nbsp;·&nbsp;
                <kbd className="bg-gray-200 px-1 py-0.5 rounded border border-gray-300 font-mono text-gray-500">Esc</kbd> cerrar
              </span>
              <span className="text-[10px] bg-ragucci-primary text-ragucci-gold font-black px-2 py-1 rounded-full shrink-0">
                {filteredOrders.length}
              </span>
              <button
                onClick={() => exportOrdersToCSV(filteredOrders, `ragucci_ordenes_${filterMonth}.csv`)}
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold py-1.5 px-2.5 rounded transition-all cursor-pointer shadow-sm shrink-0"
              >
                <FileSpreadsheet className="w-3 h-3" />
                CSV
              </button>
            </div>
          </div>

          {/* ── MASTER-DETAIL LAYOUT ── */}
          <div className={`flex gap-0 transition-all duration-200 ${sidePanelOpen ? 'pr-[344px]' : ''}`}>
            {/* ── DENSE TABLE ── */}
            <div className="flex-1 overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ragucci-primary text-ragucci-gold text-[10px] font-black uppercase tracking-wider border-b border-ragucci-gold">
                    <th className="py-2 px-2">Fecha / Entrega</th>
                    <th className="py-2 px-2">Cliente</th>
                    <th className="py-2 px-2">Prenda(s)</th>
                    <th className="py-2 px-2 text-right">Venta</th>
                    <th className="py-2 px-2 text-right">Saldo</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2 text-center w-[80px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const hasBirthday = checkBirthdayToday(order.birthday);
                    const isSelected = selectedOrder?.firestoreId === order.firestoreId && sidePanelOpen;
                    const saldoPendiente = (order.saldo || 0) > 0;
                    const info = getDeliveryInfo(order);
                    const isOverdue = info && info.diffDays <= 0 && order.status !== '🟢 Entregado';
                    const isUrgent = info && info.diffDays > 0 && info.diffDays <= 7 && order.status !== '🟢 Entregado';
                    let cleanPhone = order.phone?.replace(/\D/g, '') || '';
                    if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

                    const productListText = [
                      ...(order.products || []).map(p => p.description + (p.isGift ? ' 🎁' : '')),
                      ...(order.rtwItems || []).map(r => `${r.desc} ×${r.qty}`),
                    ].join(' · ') || '—';

                    const statusCfg: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                      '🔴 Pendiente':    { label: 'PENDIENTE',   bg: 'bg-red-50',     text: 'text-red-800',    dot: 'bg-red-500' },
                      '🟣 Tela Pedida':  { label: 'TELA PEDIDA', bg: 'bg-purple-50',  text: 'text-purple-800', dot: 'bg-purple-500' },
                      '🟠 Tela en Local':{ label: 'TELA LOCAL',  bg: 'bg-orange-50',  text: 'text-orange-800', dot: 'bg-orange-400' },
                      '🟡 En Taller':    { label: 'EN TALLER',   bg: 'bg-yellow-50',  text: 'text-yellow-800', dot: 'bg-yellow-400' },
                      '🔵 Prueba':       { label: 'PRUEBA',      bg: 'bg-blue-50',    text: 'text-blue-800',   dot: 'bg-blue-500' },
                      '🟢 Entregado':    { label: 'ENTREGADO',   bg: 'bg-emerald-50', text: 'text-emerald-800',dot: 'bg-emerald-500' },
                    };
                    const scfg = statusCfg[order.status || '🔴 Pendiente'] ?? statusCfg['🔴 Pendiente'];

                    const fullGarmentSummaryTooltip = [
                      `👤 CLIENTE: ${order.client?.toUpperCase()}`,
                      `📅 FECHA: ${formatDate(order.date)}${order.deliveryDate ? ` | ENTREGA: ${formatDate(order.deliveryDate)}` : ''}`,
                      `────────────────────────────────────────`,
                      ...(order.products || []).map((p, idx) => {
                        const lines = [
                          `📌 Prenda ${idx + 1}: ${p.description || 'Prenda'}${p.isGift ? ' 🎁 (Regalo / Cortesía)' : ''}`,
                          `🎨 Color: ${p.color || 'No especificado'}`,
                          `🧵 Proveedor Tela: ${p.proveedorTela || 'No especificado'}`,
                          `🪡 Proveedor Forrería: ${p.proveedorForreria || 'No especificado'}`,
                          `✂️ Taller: ${p.modista ? `Modista ${p.modista}` : p.camiseroSelected ? `Camisero ${p.camiseroSelected}` : 'Sastre Santiago'}`,
                          `📊 Estado: ${p.status || order.status || '🔴 Pendiente'}`
                        ];
                        if (p.notes) lines.push(`📝 Notas: ${p.notes}`);
                        if (p.costs) {
                          lines.push(`💰 Costos: Tela $${formatMoney(p.costs.telas || 0)} | Forrería $${formatMoney(p.costs.forreria || 0)} | Confección $${formatMoney((p.costs.sastre || 0) + (p.costs.camisero || 0) + (p.costs.arreglos || 0))}`);
                        }
                        return lines.join('\n');
                      }),
                      ...(order.rtwItems || []).map((r, idx) => `🛍️ RTW ${idx + 1}: ${r.desc} ×${r.qty} ($${formatMoney(r.price * r.qty)})${r.notes ? ` [${r.notes}]` : ''}`)
                    ].join('\n\n');

                    return (
                      <tr
                        key={order.firestoreId || order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setSidePanelOpen(true);
                        }}
                        className={`text-xs md:text-[12.5px] cursor-pointer transition-all group border-b-2 border-gray-200
                          ${isSelected
                            ? 'bg-amber-100/70 border-l-4 border-l-ragucci-gold font-medium shadow-2xs'
                            : isOverdue
                            ? 'bg-red-50/70 hover:bg-red-100/60'
                            : 'odd:bg-white even:bg-[#faf8f5] hover:bg-amber-50/80'
                          }`}
                      >
                        {/* Fecha */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-gray-600">
                          <div className="font-bold text-gray-800">{formatDate(order.date)}</div>
                          {order.deliveryDate && (
                            <div className={`text-[10.5px] font-black mt-0.5
                              ${isOverdue ? 'text-red-600 animate-pulse' : isUrgent ? 'text-amber-800' : 'text-gray-500'}
                            `}>
                              {isOverdue ? '⚠️' : '→'} {formatDate(order.deliveryDate)}
                              {isUrgent && info && ` (${info.diffDays}d)`}
                            </div>
                          )}
                          {hasBirthday && (
                            <span className="text-[9px] font-black text-red-600 bg-red-100 px-1 py-0.5 rounded animate-bounce inline-block mt-0.5">
                              🎂
                            </span>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="py-2.5 px-3 font-black text-ragucci-primary max-w-[130px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedClientName(order.client); }}
                            className="truncate max-w-full text-left hover:underline cursor-pointer block text-xs md:text-[13px] font-extrabold text-ragucci-primary"
                            title={`Ver historial de ${order.client}`}
                          >
                            {order.client?.toUpperCase()}
                          </button>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 text-[10px] font-bold mt-0.5"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </td>

                        {/* Prenda(s) con Hover Tooltip Detallado */}
                        <td
                          className="py-2.5 px-3 text-gray-800 max-w-[220px]"
                          title={fullGarmentSummaryTooltip}
                        >
                          <div
                            className="font-black text-ragucci-primary truncate text-xs cursor-help hover:text-amber-800"
                            title={fullGarmentSummaryTooltip}
                          >
                            {productListText}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {order.products?.some(p => p.color) && (
                              <span className="text-[10px] text-gray-700 font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
                                🎨 {order.products.find(p => p.color)?.color}
                              </span>
                            )}
                            {order.products?.some(p => p.proveedorTela) && (
                              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                🧵 {order.products.find(p => p.proveedorTela)?.proveedorTela}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Venta */}
                        <td className="py-2.5 px-3 text-right font-black tabular-nums text-ragucci-primary whitespace-nowrap text-xs md:text-[13px]">
                          ${formatMoney(order.sale)}
                        </td>

                        {/* Saldo */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {saldoPendiente ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPaymentOrder(order); }}
                              className="text-red-700 font-black tabular-nums hover:underline cursor-pointer text-xs md:text-[13px]"
                              title="Registrar cobro / seña"
                            >
                              ${formatMoney(order.saldo)}
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">✓ Saldado</span>
                          )}
                        </td>

                        {/* Estado — StatusPill individual por prenda o global */}
                        <td className="py-2.5 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {order.products && order.products.length > 1 ? (
                            <div className="flex flex-col gap-1.5">
                              {order.products.map((p, pIdx) => {
                                const pStatus = p.status || order.status || '🔴 Pendiente';
                                const pscfg = statusCfg[pStatus] ?? statusCfg['🔴 Pendiente'];
                                const shortDesc = p.description ? (p.description.length > 15 ? p.description.slice(0, 13) + '…' : p.description) : `P${pIdx + 1}`;
                                
                                const singleGarmentTooltip = [
                                  `📌 Prenda: ${p.description || 'Prenda'}${p.isGift ? ' 🎁' : ''}`,
                                  `🎨 Color: ${p.color || 'No especificado'}`,
                                  `🧵 Proveedor Tela: ${p.proveedorTela || 'No especificado'}`,
                                  `🪡 Proveedor Forrería: ${p.proveedorForreria || 'No especificado'}`,
                                  `✂️ Taller: ${p.modista ? `Modista ${p.modista}` : p.camiseroSelected ? `Camisero ${p.camiseroSelected}` : 'Sastre Santiago'}`,
                                  `📊 Estado: ${pStatus}`,
                                  p.notes ? `📝 Notas: ${p.notes}` : ''
                                ].filter(Boolean).join('\n');

                                return (
                                  <div
                                    key={pIdx}
                                    className="flex items-center gap-1.5"
                                    title={singleGarmentTooltip}
                                  >
                                    <span
                                      className="text-[10px] font-bold text-gray-700 uppercase max-w-[80px] truncate cursor-help hover:text-ragucci-primary hover:underline"
                                      title={singleGarmentTooltip}
                                    >
                                      {shortDesc}:
                                    </span>
                                    <div className="relative inline-flex" title={singleGarmentTooltip}>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer select-none shadow-2xs ${pscfg.bg} ${pscfg.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pscfg.dot}`} />
                                        {pscfg.label}
                                      </span>
                                      <select
                                        value={pStatus}
                                        onChange={(e) => handleProductStatusChange(order, pIdx, e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                      >
                                        <option value="🔴 Pendiente">🔴 Pendiente</option>
                                        <option value="🟣 Tela Pedida">🟣 Tela Pedida</option>
                                        <option value="🟠 Tela en Local">🟠 Tela en Local</option>
                                        <option value="🟡 En Taller">🟡 En Taller</option>
                                        <option value="🔵 Prueba">🔵 Prueba</option>
                                        <option value="🟢 Entregado">🟢 Entregado</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="relative inline-flex" title={fullGarmentSummaryTooltip}>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider cursor-pointer select-none shadow-2xs ${scfg.bg} ${scfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${scfg.dot}`} />
                                {scfg.label}
                              </span>
                              <select
                                value={order.products?.[0]?.status || order.status || '🔴 Pendiente'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (order.products && order.products.length === 1) {
                                    handleProductStatusChange(order, 0, val);
                                  } else {
                                    handleStatusChange(order, val);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                              >
                                <option value="🔴 Pendiente">🔴 Pendiente</option>
                                <option value="🟣 Tela Pedida">🟣 Tela Pedida</option>
                                <option value="🟠 Tela en Local">🟠 Tela en Local</option>
                                <option value="🟡 En Taller">🟡 En Taller</option>
                                <option value="🔵 Prueba">🔵 Prueba</option>
                                <option value="🟢 Entregado">🟢 Entregado</option>
                              </select>
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedDetailOrder(order)}
                              className="p-1.5 text-gray-500 hover:text-ragucci-gold hover:bg-ragucci-primary rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Ver Detalle (modal)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingOrderId(order.firestoreId || null); setActiveTab('carga'); }}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-sky-600 rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Editar Orden"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPaymentOrder(order)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-emerald-600 rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Registrar Pago / Seña"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedMeasuresOrder(order)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-purple-700 rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Ficha de Medidas del Cliente"
                            >
                              <Ruler className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAddCostOrder(order)}
                              className="p-1.5 text-gray-500 hover:text-ragucci-primary hover:bg-ragucci-gold rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Sumar Gasto Extra"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(order)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-red-700 rounded-md transition-colors cursor-pointer border border-gray-200 bg-white"
                              title="Eliminar Orden"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs font-medium italic border-t border-dashed border-gray-200">
                  No se encontraron órdenes con los filtros aplicados.
                </div>
              )}
            </div>
          </div>

          {/* ── SIDE PANEL ── */}
          <OrderSidePanel
            order={selectedOrder}
            isOpen={sidePanelOpen}
            onClose={() => setSidePanelOpen(false)}
            onOpenPayment={(o) => setSelectedPaymentOrder(o)}
            onOpenAddCost={(o) => setAddCostOrder(o)}
            onStatusChange={handleStatusChange}
            onProductStatusChange={handleProductStatusChange}
          />
        </>
      )}

      {/* Modals */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={!!selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <PaymentModal
        order={selectedPaymentOrder ? (orders.find(o => (o.firestoreId && o.firestoreId === selectedPaymentOrder.firestoreId) || o.id === selectedPaymentOrder.id) || selectedPaymentOrder) : null}
        isOpen={!!selectedPaymentOrder}
        onClose={() => setSelectedPaymentOrder(null)}
      />

      <ClientHistoryModal
        clientName={selectedClientName}
        isOpen={!!selectedClientName}
        onClose={() => setSelectedClientName(null)}
      />

      {/* Add Extra Cost Modal */}
      <Modal
        isOpen={!!addCostOrder}
        onClose={() => setAddCostOrder(null)}
        title={`Sumar Gasto Extra: ${addCostOrder?.client}`}
      >
        <div className="mb-4">
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
            Categoría del Gasto
          </label>
          <select
            value={addCostType}
            onChange={(e) => setAddCostType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
          >
            <option value="arreglos">Arreglos</option>
            <option value="telas">Telas</option>
            <option value="forreria">Forrería</option>
            <option value="sastre">Mano de Obra (Modista)</option>
            <option value="camisero">Mano de Obra (Camisero)</option>
            <option value="pterminado">Producto Terminado</option>
            <option value="envios">Envíos</option>
            <option value="avios">Avios / Embalaje</option>
            <option value="comision">Comisión Tomy</option>
            <option value="otros">Otros Gastos</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
            Monto a sumar ($)
          </label>
          <MoneyInput
            value={addCostAmount}
            onValueChange={(val) => setAddCostAmount(val)}
            placeholder="Ej: 15.000"
          />
        </div>

        <button
          onClick={handleSaveExtraCost}
          className="w-full py-2.5 bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase tracking-wider rounded transition-colors"
        >
          Cargar Gasto al Cliente
        </button>
      </Modal>

      {/* Direct Interactive Measurement Modal for Registro -> Medidas Menu */}
      {selectedMeasuresOrder && (
        <Modal
          isOpen={!!selectedMeasuresOrder}
          onClose={() => {
            setSelectedMeasuresOrder(null);
            setTempEditedMeasurements(null);
          }}
          title={`🧵 Ficha de Medidas de Cliente: ${selectedMeasuresOrder.client}`}
        >
          <div className="space-y-4">
            <InteractiveMeasuresSheet
              measurements={tempEditedMeasurements || selectedMeasuresOrder.measurements || {}}
              onChangeMeasurements={(newM) => setTempEditedMeasurements(newM)}
              mode="edit"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedMeasuresOrder(null);
                  setTempEditedMeasurements(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2 px-4 rounded cursor-pointer"
              >
                Cerrar sin guardar
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!selectedMeasuresOrder) return;
                  const updatedOrderPayload: Order = {
                    ...selectedMeasuresOrder,
                    measurements: tempEditedMeasurements || selectedMeasuresOrder.measurements
                  };

                  try {
                    await saveOrderData(updatedOrderPayload, selectedMeasuresOrder.firestoreId);
                    alert("✅ Ficha de medidas del cliente actualizada y guardada en la nube con éxito.");
                    setSelectedMeasuresOrder(null);
                    setTempEditedMeasurements(null);
                  } catch (e) {
                    alert("Error al guardar la ficha de medidas.");
                  }
                }}
                className="bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase tracking-wider py-2.5 px-5 rounded cursor-pointer shadow-sm transition-colors"
              >
                💾 Guardar Medidas en la Nube
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
