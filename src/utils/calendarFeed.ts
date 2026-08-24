import { Order, ProspectAppointment } from '../types';

export const generateCalendarICS = (orders: Order[], prospects: ProspectAppointment[]): string => {
  const events: string[] = [];

  // Add Order Deliveries & Fittings
  orders.forEach((o) => {
    if (o.deliveryDate) {
      const cleanDate = o.deliveryDate.replace(/-/g, '');
      events.push([
        'BEGIN:VEVENT',
        `UID:order-delivery-${o.id || Date.now()}@sastreria-ragucci`,
        `SUMMARY:🚚 Entrega: ${o.client}`,
        `DESCRIPTION:Prendas: ${o.products?.map(p => p.description).join(', ')}. Saldo a cobrar: $${o.saldo}`,
        'LOCATION:Sastrería Ragucci',
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `DTEND;VALUE=DATE:${cleanDate}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n'));
    }

    if (o.status === '🔵 Prueba' && o.date) {
      const cleanDate = o.date.replace(/-/g, '');
      events.push([
        'BEGIN:VEVENT',
        `UID:order-fitting-${o.id || Date.now()}@sastreria-ragucci`,
        `SUMMARY:🔵 Prueba de Calce: ${o.client}`,
        `DESCRIPTION:Prueba de calce de sastrería.`,
        'LOCATION:Sastrería Ragucci',
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `DTEND;VALUE=DATE:${cleanDate}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n'));
    }
  });

  // Add Prospect Appointments
  prospects.forEach((p) => {
    if (p.date) {
      const cleanDate = p.date.replace(/-/g, '');
      const startTime = p.time ? p.time.replace(':', '') + '00' : '100000';
      const endHour = p.time ? (parseInt(p.time.split(':')[0]) + 1).toString().padStart(2, '0') : '11';
      const endTime = p.time ? `${endHour}${p.time.split(':')[1]}00` : '110000';

      events.push([
        'BEGIN:VEVENT',
        `UID:prospect-${p.id || Date.now()}@sastreria-ragucci`,
        `SUMMARY:🟣 Cita Prospecto: ${p.clientName}`,
        `DESCRIPTION:Interés: ${p.interest}. Teléfono: ${p.phone || ''}. Notas: ${p.notes || ''}`,
        'LOCATION:Sastrería Ragucci',
        `DTSTART:${cleanDate}T${startTime}`,
        `DTEND:${cleanDate}T${endTime}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n'));
    }
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sastreria Ragucci//System Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Sastrería Ragucci - Agenda',
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
};

export const downloadFullCalendarICS = (orders: Order[], prospects: ProspectAppointment[]) => {
  const content = generateCalendarICS(orders, prospects);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Agenda_Sastreria_Ragucci.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
