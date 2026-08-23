import { Order } from '../types';

export const exportOrdersToCSV = (orders: Order[], filename = 'ragucci_registro_ordenes.csv') => {
  if (!orders || orders.length === 0) {
    alert("No hay órdenes para exportar.");
    return;
  }

  const headers = [
    "N° Orden",
    "Fecha",
    "Cliente",
    "Teléfono",
    "DNI",
    "Email",
    "Productos / Detalle",
    "Venta Total ($)",
    "Seña / Pagado ($)",
    "Saldo Pendiente ($)",
    "Estado Cobro",
    "Costos Totales ($)",
    "Ganancia ($)"
  ];

  const rows = orders.map((o) => {
    const prodsDesc = (o.products || []).map(p => p.description).join(' + ');
    const rtwDesc = (o.rtwItems || []).map(r => `${r.desc} (x${r.qty})`).join(' + ');
    const fullDesc = [prodsDesc, rtwDesc].filter(Boolean).join(' | ');

    const isPagado = (o.saldo || 0) <= 0;

    return [
      o.id || '',
      o.date || '',
      `"${(o.client || '').replace(/"/g, '""')}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.dni || '').replace(/"/g, '""')}"`,
      `"${(o.email || '').replace(/"/g, '""')}"`,
      `"${fullDesc.replace(/"/g, '""')}"`,
      o.sale || 0,
      (o.sale || 0) - (o.saldo || 0),
      o.saldo || 0,
      isPagado ? 'PAGADO' : 'CON SALDO PENDIENTE',
      o.totalCost || 0,
      o.profit || 0
    ];
  });

  // UTF-8 BOM \uFEFF ensures Excel displays accents and special characters cleanly
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportBalanceToCSV = (
  month: string,
  year: string,
  totals: { venta: number; saldoPendiente: number; costo: number; ganancia: number },
  costsBreakdown: Record<string, number>,
  gastosFijosTotal: number,
  gananciaNetaReal: number,
  filename = `ragucci_balance_${year}_${month}.csv`
) => {
  const headers = ["Concepto Financiero", "Monto ($ ARS)"];

  const rows = [
    ["PERÍODO", `${month === 'all' ? 'Todos los meses' : 'Mes ' + month} / ${year}`],
    ["Venta Bruta Total", totals.venta],
    ["Saldo Pendiente a Cobrar", totals.saldoPendiente],
    ["Dinero Real Ingresado (Efectivo)", totals.venta - totals.saldoPendiente],
    ["--- DESGLOSE DE COSTOS DIRECTOS ---", ""],
    ["Telas (A Medida)", costsBreakdown.telas || 0],
    ["Forrería", costsBreakdown.forreria || 0],
    ["Mano de Obra Santiago (Sastre)", costsBreakdown.sastre || 0],
    ["Mano de Obra Camiseros", costsBreakdown.camisero || 0],
    ["Modistas / Arreglos", costsBreakdown.arreglos || 0],
    ["Productos Terminados (RTW / Stock)", costsBreakdown.pterminado || 0],
    ["Envíos", costsBreakdown.envios || 0],
    ["Avíos / Embalaje", costsBreakdown.avios || 0],
    ["Comisión Tomy", costsBreakdown.comision || 0],
    ["--- GASTOS FIJOS Y RESULTADO ---", ""],
    ["Gastos Fijos Estructura (Alquiler USD + Serv.)", Math.round(gastosFijosTotal)],
    ["GANANCIA NETA REAL FINAL", Math.round(gananciaNetaReal)]
  ];

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
