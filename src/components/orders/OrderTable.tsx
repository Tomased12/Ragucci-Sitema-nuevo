import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatDate, formatMoney, checkBirthdayToday, parseMoney } from '../../utils/formatters';
import { OrderDetailModal } from './OrderDetailModal';
import { PaymentModal } from './PaymentModal';
import { ClientHistoryModal } from '../clients/ClientHistoryModal';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { UserBadge } from '../common/UserBadge';
import { ProductCostBadges } from '../common/ProductCostBadges';
import { Search, Eye, Edit, Plus, Trash2, MessageCircle, FileSpreadsheet, Clock, AlertTriangle } from 'lucide-react';
import { exportOrdersToCSV } from '../../utils/exportCsv';

export const OrderTable: React.FC = () => {
  const { orders, saveOrderData, removeOrderData, setEditingOrderId, setActiveTab } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUpcomingOnly, setFilterUpcomingOnly] = useState(false);
  const [filterPago, setFilterPago] = useState('all');
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

  // Add Cost Modal state
  const [addCostOrder, setAddCostOrder] = useState<Order | null>(null);
  const [addCostType, setAddCostType] = useState('arreglos');
  const [addCostAmount, setAddCostAmount] = useState(0);

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
    const matchYear = filterUpcomingOnly ? true : (filterYear === 'all' || d.getFullYear().toString() === filterYear);
    const matchMonth = filterUpcomingOnly ? true : (filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth);

    const saldoVal = order.saldo || 0;
    let matchPago = true;
    if (filterPago === 'pendientes') matchPago = saldoVal > 0;
    if (filterPago === 'pagadas') matchPago = saldoVal === 0;

    let productListText = order.products
      ? order.products.map((p) => `${p.description}${p.modista ? ` (${p.modista})` : ''}`).join(' + ')
      : '';
    if (order.rtwItems && order.rtwItems.length > 0) {
      productListText += (productListText ? ' + ' : '') + order.rtwItems.map((rtw) => `${rtw.desc} (x${rtw.qty})${rtw.notes ? ` [${rtw.notes}]` : ''}`).join(' + ');
    }

    const matchSearch =
      !searchTerm.trim() ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productListText.toLowerCase().includes(searchTerm.toLowerCase());

    const isDelivered = order.status === '🟢 Entregado' || (order.status && order.status.toLowerCase().includes('entregado'));
    const matchDeliverySort = sortBy !== 'delivery_asc' || !isDelivered;

    const info = getDeliveryInfo(order);
    const matchUpcoming = !filterUpcomingOnly || (info !== null && !isDelivered && info.diffDays >= -2 && info.diffDays <= 7);

    return matchYear && matchMonth && matchPago && matchSearch && matchDeliverySort && matchUpcoming;
  });

  const handleStatusChange = async (order: Order, newStatus: string) => {
    try {
      await saveOrderData({ ...order, status: newStatus }, order.firestoreId);
    } catch (e) {
      alert("Error al actualizar el estado de la orden.");
    }
  };

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
          onClick={() => exportOrdersToCSV(filteredOrders, `ragucci_ordenes_${filterYear}_${filterMonth}.csv`)}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold py-1.5 px-3.5 rounded transition-all cursor-pointer shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📊 Exportar a Excel (.csv)</span>
        </button>
      </div>

      {/* Alert Banner: Próximas Entregas de la Semana */}
      {upcomingOrders.length > 0 && (
        <div 
          onClick={() => setFilterUpcomingOnly(!filterUpcomingOnly)}
          className={`mb-4 p-3.5 rounded-lg border flex flex-wrap items-center justify-between cursor-pointer transition-all ${
            filterUpcomingOnly 
              ? 'bg-amber-100 dark:bg-amber-900/80 border-amber-500 text-amber-950 dark:text-amber-100 shadow-md ring-2 ring-amber-400'
              : 'bg-amber-50 dark:bg-[#200b05] border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-[#2b0f07] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold">
            <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 animate-pulse shrink-0" />
            <span>⏰ Próximas Entregas de la Semana: {upcomingOrders.length} orden(es) pendiente(s) de entrega</span>
          </div>
          <span className="text-xs font-extrabold bg-amber-800 dark:bg-amber-600 text-white px-3 py-1 rounded shadow-sm hover:bg-amber-900 dark:hover:bg-amber-500 transition-colors mt-2 sm:mt-0">
            {filterUpcomingOnly ? '✕ Ver Todas las Órdenes' : '🔍 Filtrar Solo Entregas de la Semana'}
          </span>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-ragucci-bg p-4 rounded-lg border border-ragucci-gold-light mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Buscar (Cliente / Producto)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Filtrar por Mes
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="all">Todos los meses</option>
              <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
              <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
              <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
              <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Filtrar por Año
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="all">Todos los años</option>
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
              value={filterPago}
              onChange={(e) => setFilterPago(e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            >
              <option value="all">Todas las órdenes</option>
              <option value="pendientes">Con Saldo Pendiente</option>
              <option value="pagadas">Pagadas Completas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-1.5 border border-amber-300 bg-amber-50/60 text-amber-900 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
            >
              <option value="date_desc">📅 Fecha Venta (Recientes)</option>
              <option value="delivery_asc">⏰ Entregas (Más Urgentes)</option>
              <option value="saldo_desc">💰 Saldo Pendiente (Mayor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-ragucci-primary text-ragucci-gold uppercase text-[11px] tracking-wider border-b border-ragucci-gold">
              <th className="py-2.5 px-2">Fecha</th>
              <th className="py-2.5 px-2">Cliente</th>
              <th className="py-2.5 px-2">Productos</th>
              <th className="py-2.5 px-2">Finanzas ($)</th>
              <th className="py-2.5 px-2">Estado</th>
              <th className="py-2.5 px-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const hasBirthday = checkBirthdayToday(order.birthday);
              let cleanPhone = order.phone?.replace(/\D/g, '') || '';
              if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

              let productListText = order.products
                ? order.products.map((p) => `${p.description}${p.modista ? ` (${p.modista})` : ''}`).join(' + ')
                : '';
              if (order.rtwItems && order.rtwItems.length > 0) {
                productListText += (productListText ? ' + ' : '') + order.rtwItems.map((rtw) => `${rtw.desc} (x${rtw.qty})${rtw.notes ? ` [${rtw.notes}]` : ''}`).join(' + ');
              }

              return (
                <tr key={order.firestoreId || order.id} className="hover:bg-[#fdfaf5] transition-colors">
                  <td className="py-2.5 px-2 font-medium whitespace-nowrap">
                    <div className="text-xs">Venta: {formatDate(order.date)}</div>
                    {order.deliveryDate && (
                      <div className="text-[10px] font-extrabold text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-300 mt-0.5 inline-block">
                        ⏰ Entrega: {formatDate(order.deliveryDate)}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">{order.origin || 'A Medida'}</div>
                    {(order.createdBy || order.updatedBy) && (
                      <div className="mt-1">
                        <UserBadge initial={order.updatedBy || order.createdBy} size="xs" showFullName={true} />
                      </div>
                    )}
                    {(() => {
                      const info = getDeliveryInfo(order);
                      if (!info || order.status === '🟢 Entregado') return null;
                      if (info.diffDays <= 0) {
                        return (
                          <span className="block mt-1 text-[10px] font-black text-red-700 bg-red-100 px-1 py-0.5 rounded border border-red-300 text-center animate-pulse">
                            ⚠️ Entrega HOY / Vencida
                          </span>
                        );
                      } else if (info.diffDays <= 7) {
                        return (
                          <span className="block mt-1 text-[10px] font-extrabold text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 text-center">
                            ⏰ Entrega en {info.diffDays}d
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </td>

                  <td className="py-2.5 px-2 font-bold whitespace-nowrap">
                    <button
                      onClick={() => setSelectedClientName(order.client)}
                      className="text-ragucci-primary hover:text-ragucci-gold underline decoration-dashed transition-colors text-left"
                    >
                      {order.client}
                    </button>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-emerald-600 hover:text-emerald-800 inline-block align-middle"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 inline" />
                      </a>
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-gray-700 max-w-[180px] md:max-w-[240px]">
                    <div className="font-semibold text-xs text-ragucci-primary">{productListText}</div>
                    {order.products && order.products.map((p, pIdx) => (
                      <ProductCostBadges 
                        key={pIdx} 
                        product={p} 
                        onPendingClick={() => {
                          setEditingOrderId(order.firestoreId || null);
                          setActiveTab('carga');
                        }}
                      />
                    ))}
                  </td>

                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div>Venta: ${formatMoney(order.sale)}</div>
                    {order.saldo > 0 ? (
                      <div className="text-ragucci-red font-bold flex items-center gap-1 mt-0.5">
                        <span>Saldo: ${formatMoney(order.saldo)}</span>
                        <button
                          onClick={() => setSelectedPaymentOrder(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-0.5 px-1.5 rounded transition-colors cursor-pointer"
                          title="Agregar pago o anular cobros anteriores"
                        >
                          💳 Pagos
                        </button>
                      </div>
                    ) : (
                      <div className="text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <span>Pagado Completo</span>
                        <button
                          onClick={() => setSelectedPaymentOrder(order)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-extrabold text-[10px] py-0.5 px-1.5 rounded transition-colors cursor-pointer"
                          title="Ver o anular/borrar cobros registrados por error"
                        >
                          💳 Ver Pagos
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-2">
                    <select
                      value={order.status || '🔴 Pendiente'}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="p-1 border border-gray-300 rounded bg-gray-50 font-bold text-xs focus:outline-none focus:border-ragucci-gold cursor-pointer"
                    >
                      <option value="🔴 Pendiente">🔴 Pendiente</option>
                      <option value="🟡 En Taller">🟡 En Taller</option>
                      <option value="🔵 Prueba">🔵 Prueba</option>
                      <option value="🟢 Entregado">🟢 Entregado / Pagado</option>
                    </select>
                    {hasBirthday && (
                      <div className="bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded mt-1 text-center animate-bounce">
                        🎂 ¡CUMPLEAÑOS HOY!
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedDetailOrder(order)}
                        className="bg-ragucci-gold text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold font-bold px-1.5 py-1 rounded transition-colors text-[10px] cursor-pointer"
                        title="Ver Detalle"
                      >
                        Detalle
                      </button>
                      <button
                        onClick={() => {
                          setEditingOrderId(order.firestoreId || null);
                          setActiveTab('carga');
                        }}
                        className="bg-sky-600 text-white hover:bg-sky-700 font-bold px-1.5 py-1 rounded transition-colors text-[10px] cursor-pointer"
                        title="Editar Orden"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setAddCostOrder(order)}
                        className="bg-ragucci-primary-light text-ragucci-gold-light hover:bg-ragucci-primary font-bold px-1.5 py-1 rounded transition-colors text-[10px] cursor-pointer"
                        title="Sumar Gasto Extra"
                      >
                        + Gasto
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="bg-ragucci-red text-white hover:bg-red-900 font-bold p-1 rounded transition-colors cursor-pointer"
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
      </div>

      {/* Modals */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={!!selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      <PaymentModal
        order={selectedPaymentOrder}
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
    </div>
  );
};
