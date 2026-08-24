import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ProspectAppointment } from '../../types';
import { formatDate, formatMoney, getTodayString } from '../../utils/formatters';
import { OrderDetailModal } from '../orders/OrderDetailModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  Eye, 
  Truck, 
  UserCheck, 
  PlusCircle,
  UserPlus,
  Trash2,
  Tag,
  CheckCircle2
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Helper to generate Google Calendar Deep Link
const getGoogleCalendarUrl = (title: string, dateStr: string, timeStr?: string, details?: string) => {
  const cleanDate = dateStr.replace(/-/g, '');
  const startTime = timeStr ? timeStr.replace(':', '') + '00' : '100000';
  const endHour = timeStr ? (parseInt(timeStr.split(':')[0]) + 1).toString().padStart(2, '0') : '11';
  const endTime = timeStr ? `${endHour}${timeStr.split(':')[1]}00` : '110000';
  
  const startIso = `${cleanDate}T${startTime}`;
  const endIso = `${cleanDate}T${endTime}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details || '')}&location=${encodeURIComponent('Sastrería Ragucci')}`;
};

// Helper to download .ics iCal file for iPhone / Mac / Windows
const downloadIcalFile = (title: string, dateStr: string, timeStr?: string, details?: string) => {
  const cleanDate = dateStr.replace(/-/g, '');
  const startTime = timeStr ? timeStr.replace(':', '') + '00' : '100000';
  const endHour = timeStr ? (parseInt(timeStr.split(':')[0]) + 1).toString().padStart(2, '0') : '11';
  const endTime = timeStr ? `${endHour}${timeStr.split(':')[1]}00` : '110000';
  
  const startIso = `${cleanDate}T${startTime}`;
  const endIso = `${cleanDate}T${endTime}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sastreria Ragucci//Calendar//ES',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${details || ''}`,
    'LOCATION:Sastrería Ragucci',
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const CalendarView: React.FC = () => {
  const { 
    orders, 
    prospectAppointments, 
    saveOrderData, 
    saveProspectAppointmentData, 
    removeProspectAppointmentData,
    setActiveTab 
  } = useApp();
  
  const todayStr = getTodayString();

  // Current viewed year and month
  const todayDateObj = new Date();
  const [currentYear, setCurrentYear] = useState<number>(todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDateObj.getMonth()); // 0-indexed

  // Modal States
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [showNewProspectModal, setShowNewProspectModal] = useState<boolean>(false);

  // New Prospect Form State
  const [prospectName, setProspectName] = useState<string>('');
  const [prospectPhone, setProspectPhone] = useState<string>('');
  const [prospectDate, setProspectDate] = useState<string>(todayStr);
  const [prospectTime, setProspectTime] = useState<string>('16:00');
  const [prospectInterest, setProspectInterest] = useState<string>('');
  const [prospectNotes, setProspectNotes] = useState<string>('');

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

  // Save new prospect appointment
  const handleSaveProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName.trim() || !prospectInterest.trim()) {
      alert("Por favor ingresa el nombre del cliente y el producto o tela de interés.");
      return;
    }

    const newAppt: ProspectAppointment = {
      id: Date.now().toString(),
      clientName: prospectName.trim(),
      phone: prospectPhone.trim(),
      date: prospectDate,
      time: prospectTime,
      interest: prospectInterest.trim(),
      notes: prospectNotes.trim(),
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    try {
      await saveProspectAppointmentData(newAppt);
      setProspectName('');
      setProspectPhone('');
      setProspectInterest('');
      setProspectNotes('');
      setShowNewProspectModal(false);
    } catch (err) {
      alert("Error al guardar la cita del cliente.");
    }
  };

  // Delete prospect appointment
  const handleDeleteProspect = async (appt: ProspectAppointment) => {
    if (!appt.firestoreId) return;
    if (confirm(`¿Deseas eliminar la cita con ${appt.clientName}?`)) {
      try {
        await removeProspectAppointmentData(appt.firestoreId);
      } catch (err) {
        alert("Error al eliminar la cita.");
      }
    }
  };

  // Status Change Handler for Orders
  const handleOrderStatusChange = async (order: Order, newStatus: string) => {
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

    // Next month padding days to complete grid cells
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

  // Map orders & prospect appointments to date keys
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Array<{ 
      kind: 'order' | 'prospect'; 
      order?: Order; 
      prospect?: ProspectAppointment;
      type: 'delivery' | 'prueba' | 'overdue' | 'prospect';
    }>>();

    // 1. Map Orders
    orders.forEach((o) => {
      if (o.deliveryDate) {
        if (!map.has(o.deliveryDate)) map.set(o.deliveryDate, []);
        
        const isOverdue = o.deliveryDate < todayStr && o.status !== '🟢 Entregado';
        map.get(o.deliveryDate)!.push({
          kind: 'order',
          order: o,
          type: isOverdue ? 'overdue' : 'delivery'
        });
      }

      if (o.status === '🔵 Prueba' && o.date) {
        if (!map.has(o.date)) map.set(o.date, []);
        map.get(o.date)!.push({
          kind: 'order',
          order: o,
          type: 'prueba'
        });
      }
    });

    // 2. Map Prospect Appointments
    prospectAppointments.forEach((p) => {
      if (p.date) {
        if (!map.has(p.date)) map.set(p.date, []);
        map.get(p.date)!.push({
          kind: 'prospect',
          prospect: p,
          type: 'prospect'
        });
      }
    });

    return map;
  }, [orders, prospectAppointments, todayStr]);

  // Summary KPIs for Top Bar
  const summaryMetrics = useMemo(() => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    let upcomingWeekDeliveries = 0;
    let activePruebas = 0;
    let overdueDeliveries = 0;
    let totalProspects = prospectAppointments.length;

    orders.forEach((o) => {
      if (o.status === '🔵 Prueba') activePruebas++;

      if (o.deliveryDate) {
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
      totalProspects
    };
  }, [orders, prospectAppointments, todayStr]);

  // Events for selected day modal
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
            <span>Agenda & Calendario de Pruebas, Entregas y Citas</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Citas de posibles clientes, pruebas de calce y entregas prometidas de Sastrería Ragucci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewProspectModal(true)}
            className="bg-purple-800 hover:bg-purple-900 text-white font-extrabold px-3.5 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border border-purple-600"
          >
            <UserPlus className="w-4 h-4 text-purple-300" />
            <span>➕ Agendar Cita Posible Cliente</span>
          </button>

          <button
            onClick={handleToday}
            className="bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary font-extrabold px-3.5 py-2 rounded text-xs uppercase flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
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
          <div className="flex justify-between items-center text-purple-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Citas Posibles Clientes</span>
            <UserPlus className="w-4 h-4 text-purple-600" />
          </div>
          <strong className="text-lg font-extrabold text-purple-700 block font-sans">
            {summaryMetrics.totalProspects} citas
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Consultas y prospectos</span>
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
                  {events.slice(0, maxVisible).map((evt, idx) => {
                    if (evt.kind === 'prospect' && evt.prospect) {
                      return (
                        <div
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-extrabold truncate border leading-tight bg-purple-100 text-purple-900 border-purple-300"
                          title={`Cita Prospecto: ${evt.prospect.clientName} - ${evt.prospect.interest}`}
                        >
                          🟣 {evt.prospect.clientName} ({evt.prospect.interest.split(' ')[0]})
                        </div>
                      );
                    } else if (evt.order) {
                      return (
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
                      );
                    }
                    return null;
                  })}

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

      {/* Modal: Agendar Cita con Posible Cliente */}
      {showNewProspectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProspect} className="bg-white rounded-lg shadow-xl border border-purple-700 max-w-md w-full p-5 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-purple-200 pb-2">
              <h3 className="font-extrabold text-sm uppercase text-purple-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-700" />
                <span>Agendar Cita / Posible Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProspectModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Nombre del Cliente / Posible Cliente *</label>
                <input
                  type="text"
                  placeholder="Ej: Raúl Martínez"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-bold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-gray-800 block mb-1">Fecha de la Cita *</label>
                  <input
                    type="date"
                    value={prospectDate}
                    onChange={(e) => setProspectDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-bold focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-gray-800 block mb-1">Hora de la Cita</label>
                  <input
                    type="time"
                    value={prospectTime}
                    onChange={(e) => setProspectTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej: 11 5566 7788"
                  value={prospectPhone}
                  onChange={(e) => setProspectPhone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Consulta / Interés Principal *</label>
                <input
                  type="text"
                  placeholder="Ej: Consulta por traje a medida de lino"
                  value={prospectInterest}
                  onChange={(e) => setProspectInterest(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-bold text-purple-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-gray-800 block mb-1">Notas / Especificaciones</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Busca telas de lino beige o azul para casamiento en verano..."
                  value={prospectNotes}
                  onChange={(e) => setProspectNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewProspectModal(false)}
                className="w-1/2 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-purple-800 text-white font-extrabold text-xs uppercase rounded hover:bg-purple-900 transition-colors shadow-sm"
              >
                Agendar Cita
              </button>
            </div>
          </form>
        </div>
      )}

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
                if (evt.kind === 'prospect' && evt.prospect) {
                  const p = evt.prospect;
                  let cleanPhone = p.phone?.replace(/\D/g, '') || '';
                  if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

                  return (
                    <div key={idx} className="bg-purple-50 p-3.5 border border-purple-300 rounded shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                            <span>🟣 {p.clientName}</span>
                            {p.time && <span className="text-xs font-bold text-purple-700 bg-purple-200 px-1.5 py-0.2 rounded">⏰ {p.time} hs</span>}
                          </strong>
                          <span className="text-xs font-bold text-purple-800 block mt-0.5">
                            Interés: {p.interest}
                          </span>
                          {p.notes && <span className="text-[11px] text-gray-600 block mt-0.5 italic">"{p.notes}"</span>}
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-200 text-purple-900 border border-purple-400">
                          Posible Cliente / Lead
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-200">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${p.clientName}, te escribimos de Sastrería Ragucci para confirmar tu cita pactada para la consulta de ${p.interest}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <a
                            href={getGoogleCalendarUrl(`Cita: ${p.clientName} (${p.interest})`, p.date, p.time, `Teléfono: ${p.phone || ''}. Notas: ${p.notes || ''}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title="Añadir a Google Calendar"
                          >
                            <CalendarIcon className="w-3 h-3" />
                            <span>Google Cal</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => downloadIcalFile(`Cita: ${p.clientName} (${p.interest})`, p.date, p.time, `Teléfono: ${p.phone || ''}. Notas: ${p.notes || ''}`)}
                            className="bg-gray-800 hover:bg-black text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Descargar para iPhone / Apple Calendar (.ics)"
                          >
                            <span>📱 Apple .ics</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProspect(p)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                            title="Eliminar cita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDayDateStr(null);
                            setActiveTab('carga');
                          }}
                          className="bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light font-extrabold text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <span>➕ Crear Orden</span>
                        </button>
                      </div>
                    </div>
                  );
                } else if (evt.order) {
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
                          <span className="text-gray-500">Saldo: </span>
                          <strong className={order.saldo > 0 ? 'text-ragucci-red font-extrabold' : 'text-emerald-600 font-extrabold'}>
                            {order.saldo > 0 ? `$${formatMoney(order.saldo)}` : 'Pagado'}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1">
                          <select
                            value={order.status || '🔴 Pendiente'}
                            onChange={(e) => handleOrderStatusChange(order, e.target.value)}
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

                          <a
                            href={getGoogleCalendarUrl(
                              evt.type === 'prueba' ? `Prueba de Calce: ${order.client}` : `Entrega de Prenda: ${order.client}`,
                              evt.type === 'prueba' ? order.date : (order.deliveryDate || order.date),
                              '11:00',
                              `Cliente: ${order.client}. Prendas: ${order.products?.map(p => p.description).join(', ')}. Saldo a cobrar: $${formatMoney(order.saldo)}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
                            title="Añadir a Google Calendar en el celular"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => downloadIcalFile(
                              evt.type === 'prueba' ? `Prueba de Calce: ${order.client}` : `Entrega de Prenda: ${order.client}`,
                              evt.type === 'prueba' ? order.date : (order.deliveryDate || order.date),
                              '11:00',
                              `Cliente: ${order.client}. Prendas: ${order.products?.map(p => p.description).join(', ')}. Saldo a cobrar: $${formatMoney(order.saldo)}`
                            )}
                            className="bg-gray-800 hover:bg-black text-white p-1.5 rounded transition-colors cursor-pointer text-[10px] font-bold"
                            title="Guardar en iPhone / Apple Calendar (.ics)"
                          >
                            📱
                          </button>

                          <button
                            onClick={() => {
                              setSelectedDetailOrder(order);
                              setSelectedDayDateStr(null);
                            }}
                            className="bg-ragucci-gold text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold p-1.5 rounded transition-colors text-xs font-bold"
                            title="Ver Detalle de Orden"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
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
