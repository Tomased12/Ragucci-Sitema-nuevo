import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatDate, formatMoney, getTodayString } from '../../utils/formatters';
import { OrderDetailModal } from '../orders/OrderDetailModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  Eye, 
  Truck, 
  UserCheck, 
  UserX,
  Filter
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarView: React.FC = () => {
  const { orders, saveOrderData } = useApp();
  const todayStr = getTodayString();

  // Current viewed year and month
  const todayDateObj = new Date();
  const [currentYear, setCurrentYear] = useState<number>(todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDateObj.getMonth()); // 0-indexed

  // Selected Day Modal State
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Status Change Handler
  const handleStatusChange = async (order: Order, newStatus: string) => {
    const updatedOrder = { ...order, status: newStatus };
    try {
      await saveOrderData(updatedOrder, order.firestoreId || undefined);
    } catch (e) {
      alert("Error al actualizar el estado de confección.");
    }
  };

  // 1. Calculate Calendar Days Grid Matrix
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Convert JS Sunday=0 to Monday=0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(pMonth + 1).padStart(2, '0');
      const dStr = String(pDay).padStart(2, '0');
      days.push({
        dateStr: `${pYear}-${mStr}-${dStr}`,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: `${pYear}-${mStr}-${dStr}` === todayStr
      });
    }

    // Current month days
    const mStr = String(currentMonth + 1).padStart(2, '0');
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const fullDateStr = `${currentYear}-${mStr}-${dStr}`;
      days.push({
        dateStr: fullDateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: fullDateStr === todayStr
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nMStr = String(nMonth + 1).padStart(2, '0');

    for (let nd = 1; nd <= remainingCells; nd++) {
      const dStr = String(nd).padStart(2, '0');
      const fullDateStr = `${nYear}-${nMStr}-${dStr}`;
      days.push({
        dateStr: fullDateStr,
        dayNumber: nd,
        isCurrentMonth: false,
        isToday: fullDateStr === todayStr
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Map orders to date keys
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Array<{ order: Order; type: 'delivery' | 'prueba' | 'overdue' }>>();

    orders.forEach((o) => {
      // Scheduled Delivery Date Event
      if (o.deliveryDate) {
        if (!map.has(o.deliveryDate)) map.set(o.deliveryDate, []);
        
        const isOverdue = o.deliveryDate < todayStr && o.status !== '🟢 Entregado';
        map.get(o.deliveryDate)!.push({
          order: o,
          type: isOverdue ? 'overdue' : 'delivery'
        });
      }

      // Fitting Date Event (if status === '🔵 Prueba')
      if (o.status === '🔵 Prueba' && o.date) {
        if (!map.has(o.date)) map.set(o.date, []);
        map.get(o.date)!.push({
          order: o,
          type: 'prueba'
        });
      }
    });

    return map;
  }, [orders, todayStr]);

  // Summary KPIs for Top Bar
  const summaryMetrics = useMemo(() => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    let upcomingWeekDeliveries = 0;
    let activePruebas = 0;
    let overdueDeliveries = 0;
    let currentMonthDeliveries = 0;

    const mStr = String(currentMonth + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${mStr}`;

    orders.forEach((o) => {
      if (o.status === '🔵 Prueba') activePruebas++;

      if (o.deliveryDate) {
        if (o.deliveryDate.startsWith(monthPrefix)) currentMonthDeliveries++;

        if (o.deliveryDate >= todayStr && o.deliveryDate <= next7DaysStr && o.status !== '🟢 Entregado') {
          upcomingWeekDeliveries++;
        }

        if (o.deliveryDate < todayStr && o.status !== '🟢 Entregado') {
          overdueDeliveries++;
        }
      }
    });

    return {
      upcomingWeekDeliveries,
      activePruebas,
      overdueDeliveries,
      currentMonthDeliveries
    };
  }, [orders, todayStr, currentMonth, currentYear]);

  // Orders for selected day modal
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayDateStr) return [];
    return eventsByDate.get(selectedDayDateStr) || [];
  }, [selectedDayDateStr, eventsByDate]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border border-ragucci-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-ragucci-gold" />
            <span>Agenda & Calendario de Pruebas y Entregas</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Programación de citas para pruebas de calce y fechas límite de entregas de Sastrería Ragucci.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary font-extrabold px-3.5 py-1.5 rounded text-xs uppercase flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            <span>📅 Ir a Hoy</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-amber-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Entregas de esta Semana</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <strong className="text-lg font-extrabold text-amber-700 block font-sans">
            {summaryMetrics.upcomingWeekDeliveries} entregas
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Próximos 7 días</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-sky-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pruebas de Calce Activas</span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <strong className="text-lg font-extrabold text-sky-700 block font-sans">
            {summaryMetrics.activePruebas} clientes
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">En estado 🔵 Prueba</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-red-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Entregas Vencidas / Alerta</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <strong className="text-lg font-extrabold text-red-600 block font-sans">
            {summaryMetrics.overdueDeliveries} órdenes
          </strong>
          <span className="text-[10px] text-red-500 font-medium block mt-0.5">Fecha pasada sin entregar</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-ragucci-primary mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Programadas este Mes</span>
            <Clock className="w-4 h-4 text-ragucci-gold" />
          </div>
          <strong className="text-lg font-extrabold text-ragucci-primary block font-sans">
            {summaryMetrics.currentMonthDeliveries} entregas
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">En {MONTH_NAMES[currentMonth]} {currentYear}</span>
        </div>
      </div>

      {/* Month Navigation Control */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-border flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 bg-ragucci-bg hover:bg-ragucci-gold-light text-ragucci-primary font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Mes Anterior</span>
        </button>

        <h3 className="font-extrabold text-base md:text-lg uppercase text-ragucci-primary tracking-widest flex items-center gap-2">
          <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 bg-ragucci-bg hover:bg-ragucci-gold-light text-ragucci-primary font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Mes Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-lg shadow-md border border-ragucci-border overflow-hidden">
        {/* Weekday Column Headers */}
        <div className="grid grid-cols-7 bg-ragucci-primary text-ragucci-gold uppercase text-[11px] font-extrabold text-center py-2.5 tracking-wider border-b border-ragucci-gold">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 bg-gray-50 min-h-[480px]">
          {calendarDays.map((d) => {
            const events = eventsByDate.get(d.dateStr) || [];
            const maxVisible = 2;
            const overflowCount = events.length > maxVisible ? events.length - maxVisible : 0;

            return (
              <div
                key={d.dateStr}
                onClick={() => events.length > 0 && setSelectedDayDateStr(d.dateStr)}
                className={`p-1.5 md:p-2 min-h-[90px] md:min-h-[110px] flex flex-col justify-between transition-colors ${
                  !d.isCurrentMonth ? 'bg-gray-100/60 text-gray-400 opacity-60' : 'bg-white'
                } ${d.isToday ? 'ring-2 ring-ragucci-gold bg-amber-50/40' : ''} ${
                  events.length > 0 ? 'cursor-pointer hover:bg-[#fdfaf5]' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs md:text-sm font-extrabold rounded-full w-6 h-6 flex items-center justify-center ${
                    d.isToday ? 'bg-ragucci-gold text-ragucci-primary font-black shadow-sm' : 'text-gray-700'
                  }`}>
                    {d.dayNumber}
                  </span>

                  {events.length > 0 && (
                    <span className="text-[9px] font-extrabold bg-ragucci-primary text-ragucci-gold px-1.5 py-0.2 rounded-full">
                      {events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 overflow-hidden">
                  {events.slice(0, maxVisible).map((evt, idx) => (
                    <div
                      key={idx}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold truncate border leading-tight ${
                        evt.type === 'overdue'
                          ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                          : evt.type === 'prueba'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                      title={`${evt.order.client} - ${evt.order.products?.[0]?.description || 'Orden'}`}
                    >
                      {evt.type === 'overdue' ? '⚠️' : evt.type === 'prueba' ? '🔵' : '🚚'} {evt.order.client}
                    </div>
                  ))}

                  {overflowCount > 0 && (
                    <span className="block text-[9px] font-extrabold text-ragucci-primary text-center bg-amber-50 py-0.5 rounded border border-amber-200">
                      +{overflowCount} citas más...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Appointments Modal */}
      {selectedDayDateStr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-ragucci-gold" />
                <span>Citas del día: {formatDate(selectedDayDateStr)}</span>
              </h3>
              <button
                onClick={() => setSelectedDayDateStr(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayEvents.map((evt, idx) => {
                const order = evt.order;
                let cleanPhone = order.phone?.replace(/\D/g, '') || '';
                if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

                return (
                  <div key={idx} className="bg-[#fffdfa] p-3.5 border border-ragucci-gold-light rounded shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm font-extrabold text-ragucci-primary block">
                          {order.client}
                        </strong>
                        <span className="text-xs text-gray-600 block mt-0.5">
                          Prenda: {order.products?.map((p) => p.description).join(', ') || 'A medida'}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        evt.type === 'overdue'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : evt.type === 'prueba'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {evt.type === 'overdue' ? '⚠️ Entrega Vencida' : evt.type === 'prueba' ? '🔵 Prueba de Calce' : '🚚 Fecha de Entrega'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <div>
                        <span className="text-gray-500">Saldo Pendiente: </span>
                        <strong className={order.saldo > 0 ? 'text-ragucci-red font-extrabold' : 'text-emerald-600 font-extrabold'}>
                          {order.saldo > 0 ? `$${formatMoney(order.saldo)}` : 'Pagado Completo'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={order.status || '🔴 Pendiente'}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className="p-1 border border-gray-300 rounded bg-gray-50 font-bold text-[11px] cursor-pointer focus:outline-none focus:border-ragucci-gold"
                        >
                          <option value="🔴 Pendiente">🔴 Pendiente</option>
                          <option value="🟡 En Taller">🟡 En Taller</option>
                          <option value="🔵 Prueba">🔵 Prueba</option>
                          <option value="🟢 Entregado">🟢 Entregado / Pagado</option>
                        </select>

                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSelectedDetailOrder(order);
                            setSelectedDayDateStr(null);
                          }}
                          className="bg-ragucci-gold text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold p-1 rounded transition-colors text-xs font-bold"
                          title="Ver Detalle de Orden"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedDayDateStr(null)}
              className="w-full py-2 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedDetailOrder && (
        <OrderDetailModal
          order={selectedDetailOrder}
          isOpen={!!selectedDetailOrder}
          onClose={() => setSelectedDetailOrder(null)}
        />
      )}
    </div>
  );
};
