import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { MoneyInput } from '../common/MoneyInput';
import { Modal } from '../common/Modal';
import { 
  RefreshCw, 
  Save, 
  TrendingUp, 
  Wallet, 
  ArrowDownRight, 
  Award, 
  Scissors, 
  ShoppingBag, 
  Info,
  HelpCircle,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Trophy,
  Target,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  Gift
} from 'lucide-react';
import { exportBalanceToCSV, exportClientProfitabilityToCSV } from '../../utils/exportCsv';
import { ClientHistoryModal } from '../clients/ClientHistoryModal';
import { getOrderPendingCosts } from '../../utils/costStatus';

interface ExplanationModalData {
  title: string;
  formula: string;
  explanation: string;
  details: { label: string; value: string; color?: string }[];
  note?: string;
}

export const BalanceDashboard: React.FC = () => {
  const { orders, config, cashMovements, dolarBlueVenta, saveConfigData, setEditingOrderId, setActiveTab, financialCommitments } = useApp();

  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [activeExplanation, setActiveExplanation] = useState<ExplanationModalData | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Client Profitability Table State
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientFilterCategory, setClientFilterCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [clientSortBy, setClientSortBy] = useState<'margin_desc' | 'margin_asc' | 'venta_desc' | 'profit_desc' | 'name_asc'>('margin_desc');
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<string | null>(null);

  // Fixed Costs Local Form State
  const [alquilerUsd, setAlquilerUsd] = useState(config.gasto_alquiler_usd !== undefined ? config.gasto_alquiler_usd : 1500);
  const [expensas, setExpensas] = useState(config.gasto_expensas || 0);
  const [internet, setInternet] = useState(config.gasto_internet || 0);
  const [servicios, setServicios] = useState(config.gasto_servicios || 0);
  const [redes, setRedes] = useState(config.gasto_redes || 0);
  const [publicidad, setPublicidad] = useState(config.gasto_publicidad || 0);

  // Sync local inputs when cloud config finishes loading
  useEffect(() => {
    if (config) {
      if (config.gasto_alquiler_usd !== undefined) setAlquilerUsd(config.gasto_alquiler_usd);
      if (config.gasto_expensas !== undefined) setExpensas(config.gasto_expensas);
      if (config.gasto_internet !== undefined) setInternet(config.gasto_internet);
      if (config.gasto_servicios !== undefined) setServicios(config.gasto_servicios);
      if (config.gasto_redes !== undefined) setRedes(config.gasto_redes);
      if (config.gasto_publicidad !== undefined) setPublicidad(config.gasto_publicidad);
    }
  }, [config]);

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    const matchYear = d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
    return matchYear && matchMonth;
  });

  // Buscar los meses que realmente tienen ventas/órdenes cargadas en el año seleccionado
  const yearOrders = orders.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    return d.getFullYear().toString() === filterYear;
  });

  const activeMonthsInYearCount = new Set(
    yearOrders.map((o) => new Date(o.date + 'T12:00:00').getMonth())
  ).size;

  const monthsToMultiply = filterMonth === 'all'
    ? Math.max(1, activeMonthsInYearCount)
    : 1;

  const alquilerPesos = alquilerUsd * dolarBlueVenta;
  const gastosFijosPesos = expensas + internet + servicios + redes + publicidad;
  const gastosFijosMensualesBase = alquilerPesos + gastosFijosPesos;
  const totalGastosFijosPeriodo = gastosFijosMensualesBase * monthsToMultiply;

  const totals = {
    venta: 0,
    costo: 0,
    ganancia: 0,
    saldoPendiente: 0
  };

  const costsBreakdown: Record<string, number> = {
    telas: 0,
    forreria: 0,
    sastre: 0,
    camisero: 0,
    arreglos: 0,
    pterminado: 0,
    envios: 0,
    avios: 0,
    comision: 0,
    otros: 0
  };

  filteredOrders.forEach((o) => {
    totals.venta += o.sale;
    totals.costo += o.totalCost;
    totals.ganancia += o.profit;
    totals.saldoPendiente += o.saldo || 0;
    for (const key in costsBreakdown) {
      costsBreakdown[key] += o.costs?.[key as keyof typeof o.costs] || 0;
    }
  });

  // Regalos & Cortesías Metrics Calculation
  const giftList: {
    orderId: string;
    client: string;
    date: string;
    garmentDesc: string;
    costAmount: number;
  }[] = [];

  let totalGiftInversion = 0;

  filteredOrders.forEach((o) => {
    if (o.products && o.products.length > 0) {
      o.products.forEach((p) => {
        if (p.isGift) {
          const itemCost = (p.costs.sastre || 0) + (p.costs.telas || 0) + (p.costs.forreria || 0) + (p.costs.camisero || 0) + (p.costs.arreglos || 0) + (p.costs.otros || 0);
          totalGiftInversion += itemCost;
          giftList.push({
            orderId: o.firestoreId || o.id?.toString() || '',
            client: o.client,
            date: o.date,
            garmentDesc: p.description || 'Prenda a Medida',
            costAmount: itemCost
          });
        }
      });
    }

    if (o.rtwItems && o.rtwItems.length > 0) {
      o.rtwItems.forEach((rtw) => {
        if (rtw.isGift) {
          const rtwCost = (rtw.price || 0) * (rtw.qty || 1);
          totalGiftInversion += rtwCost;
          giftList.push({
            orderId: o.firestoreId || o.id?.toString() || '',
            client: o.client,
            date: o.date,
            garmentDesc: `${rtw.desc} (x${rtw.qty})`,
            costAmount: rtwCost
          });
        }
      });
    }
  });

  // Financial Commitments (Cheques & Préstamos & Comisión Tomy) Metrics
  let totalPendingCommitmentsDebt = 0;
  let periodCommitmentsObligations = 0;
  let periodCommitmentsDebited = 0;

  // Tomy's net commission pending debt
  const saldoAnteriorTomy = config.saldo_anterior_comision_tomy || 0;
  const totalComisionesVentasTomy = orders.reduce((acc, o) => acc + (o.costs?.comision || 0), 0);
  const totalPagosTomy = cashMovements
    .filter(m => m.type === 'egreso' && (
      m.category === 'Pago Comisión Tomy' ||
      m.category === 'Adelanto Tomy' ||
      m.description.toLowerCase().includes('comision tomy') ||
      m.description.toLowerCase().includes('comisión tomy') ||
      m.description.toLowerCase().includes('pago tomy')
    ))
    .reduce((acc, m) => acc + m.amount, 0);

  const saldoPendienteTomy = Math.max(0, (saldoAnteriorTomy + totalComisionesVentasTomy) - totalPagosTomy);
  totalPendingCommitmentsDebt += saldoPendienteTomy;

  financialCommitments.forEach((c) => {
    c.installments?.forEach((inst) => {
      if (inst.status === 'PENDIENTE') {
        totalPendingCommitmentsDebt += inst.amount;
      }

      if (inst.dueDate) {
        const d = new Date(inst.dueDate + 'T12:00:00');
        const matchYear = d.getFullYear().toString() === filterYear;
        const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;

        if (matchYear && matchMonth) {
          if (inst.status === 'PENDIENTE') {
            periodCommitmentsObligations += inst.amount;
          } else if (inst.status === 'DEBITADO') {
            periodCommitmentsDebited += inst.amount;
          }
        }
      }
    });
  });

  // Talleres & Confección (M.O + Telas/Forrería) - Excluye Productos Terminados / RTW
  const costoManoDeObraTalleres = costsBreakdown.sastre + costsBreakdown.camisero + costsBreakdown.arreglos;
  const costoTelasYForreria = costsBreakdown.telas + costsBreakdown.forreria;
  const costoTalleresYConfeccion = costoManoDeObraTalleres + costoTelasYForreria;

  // Total a Pagar Mensual COMPLETO (Talleres + Telas + Gastos Fijos + Cheques/Préstamos del Mes + Avíos/Envíos/Comisiones)
  const totalAPagarMesCompleto = costoTalleresYConfeccion + totalGastosFijosPeriodo + periodCommitmentsObligations + costsBreakdown.envios + costsBreakdown.avios + costsBreakdown.comision + costsBreakdown.otros;

  // Calculation of Cash Flow Income in Selected Period (Señas + Cobranzas de órdenes anteriores)
  let totalDineroRealRecaudadoEnPeriodo = 0;
  let senasVentasMesInPeriod = 0;
  let cobranzasVentasAnterioresInPeriod = 0;

  orders.forEach(o => {
    if (o.paymentHistory && o.paymentHistory.length > 0) {
      o.paymentHistory.forEach(p => {
        if (p.date) {
          const d = new Date(p.date + 'T12:00:00');
          const matchYear = d.getFullYear().toString() === filterYear;
          const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;

          if (matchYear && matchMonth) {
            totalDineroRealRecaudadoEnPeriodo += p.amount;
            const orderMonthStr = o.date ? o.date.substring(0, 7) : '';
            const pMonthStr = p.date.substring(0, 7);
            if (orderMonthStr === pMonthStr) {
              senasVentasMesInPeriod += p.amount;
            } else {
              cobranzasVentasAnterioresInPeriod += p.amount;
            }
          }
        }
      });
    } else {
      const d = new Date(o.date + 'T12:00:00');
      const matchYear = d.getFullYear().toString() === filterYear;
      const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
      if (matchYear && matchMonth) {
        const paidAmount = (o.sale || 0) - (o.saldo || 0);
        if (paidAmount > 0) {
          totalDineroRealRecaudadoEnPeriodo += paidAmount;
          senasVentasMesInPeriod += paidAmount;
        }
      }
    }
  });

  // Resultado Neto de Caja Real (Cash Flow Efectivo en Mano vs Compromisos Completo Requeridos)
  const resultadoNetoDeCajaReal = totalDineroRealRecaudadoEnPeriodo - totalAPagarMesCompleto;

  const costoTotalConFijos = totalAPagarMesCompleto;
  const gananciaNetaReal = totals.venta - totalAPagarMesCompleto;

  // Monthly Evolution Data for filterYear
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthsData = monthNames.map((name, i) => {
    const monthNum = i + 1;
    const monthOrders = orders.filter(o => {
      const d = new Date(o.date + 'T12:00:00');
      return d.getFullYear().toString() === filterYear && (d.getMonth() + 1) === monthNum;
    });

    const venta = monthOrders.reduce((acc, o) => acc + (o.sale || 0), 0);
    const costoDirecto = monthOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    // Solo restar gastos fijos si el mes tiene órdenes/ventas cargadas
    const gastosFijosEsteMes = monthOrders.length > 0 ? gastosFijosMensualesBase : 0;
    const gananciaMes = Math.max(0, venta - costoDirecto - gastosFijosEsteMes);

    return {
      monthNum,
      name,
      count: monthOrders.length,
      venta,
      costoDirecto,
      gananciaMes
    };
  });

  const maxVentaAnual = Math.max(...monthsData.map(m => m.venta), 1);
  const totalVentaAnual = monthsData.reduce((acc, m) => acc + m.venta, 0);
  const totalGananciaAnual = monthsData.reduce((acc, m) => acc + m.gananciaMes, 0);
  const promedioVentaMensual12 = totalVentaAnual / 12;
  const promedioVentaMensualActivos = activeMonthsInYearCount > 0 ? totalVentaAnual / activeMonthsInYearCount : totalVentaAnual;

  // Find peak sales month
  const recordMonth = [...monthsData].sort((a, b) => b.venta - a.venta)[0];

  // Breakeven / Target Sales Calculations for Selected Period
  const breakevenMetrics = React.useMemo(() => {
    const fixedCostsMonthly = gastosFijosMensualesBase;
    const totalVenta = totals.venta || 0;
    const totalCostoDirecto = totals.costo || 0;
    const totalGananciaDirecta = totalVenta - totalCostoDirecto;

    const marginPct = totalVenta > 0 ? (totalGananciaDirecta / totalVenta) : 0.40;
    const breakevenVentaRequired = marginPct > 0 ? (fixedCostsMonthly / marginPct) : (fixedCostsMonthly * 2.5);

    // Benchmarks reales especificados por Tomy
    const TICKET_TRAJE = 2000000;
    const TICKET_CAMISA = 320000;

    const trajesRequiredTotal = (breakevenVentaRequired / TICKET_TRAJE).toFixed(1);
    const camisasRequiredTotal = (breakevenVentaRequired / TICKET_CAMISA).toFixed(1);

    const shortageVentaAmount = Math.max(0, breakevenVentaRequired - totalVenta);
    const trajesRemainingToBreakeven = (shortageVentaAmount / TICKET_TRAJE).toFixed(1);
    const camisasRemainingToBreakeven = (shortageVentaAmount / TICKET_CAMISA).toFixed(1);

    const averageOrderTicket = filteredOrders.length > 0 ? (totalVenta / filteredOrders.length) : TICKET_TRAJE;

    const fixedCostsCoveredPct = fixedCostsMonthly > 0 ? Math.min(100, Math.round((totalGananciaDirecta / fixedCostsMonthly) * 100)) : 100;
    const isBreakevenReached = totalGananciaDirecta >= fixedCostsMonthly;
    const shortageAmount = Math.max(0, fixedCostsMonthly - totalGananciaDirecta);

    return {
      fixedCostsMonthly,
      marginPct,
      breakevenVentaRequired,
      currentSalesPctOfBreakeven: (totalVenta / (breakevenVentaRequired || 1)) * 100,
      averageOrderTicket,
      trajesRequiredTotal,
      camisasRequiredTotal,
      trajesRemainingToBreakeven,
      camisasRemainingToBreakeven,
      fixedCostsCoveredPct,
      isBreakevenReached,
      shortageAmount,
      shortageVentaAmount
    };
  }, [totals, gastosFijosMensualesBase, filteredOrders]);

  // Aggregating Client Profitability Data
  const clientMap: Record<string, {
    client: string;
    orderCount: number;
    totalVenta: number;
    totalCosto: number;
    totalGanancia: number;
    profitMarginPct: number;
    pendingCosts: { key: string; label: string; orderId: string }[];
    status: 'high' | 'medium' | 'low';
    statusLabel: string;
  }> = {};

  filteredOrders.forEach((o) => {
    const rawName = (o.client || '').trim();
    if (!rawName) return;

    if (!clientMap[rawName]) {
      clientMap[rawName] = {
        client: rawName,
        orderCount: 0,
        totalVenta: 0,
        totalCosto: 0,
        totalGanancia: 0,
        profitMarginPct: 0,
        pendingCosts: [],
        status: 'medium',
        statusLabel: ''
      };
    }

    clientMap[rawName].orderCount += 1;
    clientMap[rawName].totalVenta += o.sale || 0;
    clientMap[rawName].totalCosto += o.totalCost || 0;
    clientMap[rawName].totalGanancia += o.profit || 0;

    const orderPending = getOrderPendingCosts(o);
    orderPending.forEach(pc => {
      const exists = clientMap[rawName].pendingCosts.some(p => p.key === pc.key);
      if (!exists && o.firestoreId) {
        clientMap[rawName].pendingCosts.push({
          key: pc.key,
          label: pc.label,
          orderId: o.firestoreId
        });
      }
    });
  });

  const allClientProfitability = Object.values(clientMap).map(item => {
    const marginPct = item.totalVenta > 0 ? (item.totalGanancia / item.totalVenta) * 100 : 0;
    let status: 'high' | 'medium' | 'low' = 'medium';
    let statusLabel = '🟡 Ganamos Bien (35% - 49%)';

    if (marginPct >= 50) {
      status = 'high';
      statusLabel = '🟢 Ganamos Muy Bien (≥50%)';
    } else if (marginPct < 35) {
      status = 'low';
      statusLabel = '🔴 Ganamos Mal (<35%)';
    }

    return {
      ...item,
      profitMarginPct: marginPct,
      status,
      statusLabel
    };
  });

  const highMarginCount = allClientProfitability.filter(c => c.status === 'high').length;
  const mediumMarginCount = allClientProfitability.filter(c => c.status === 'medium').length;
  const lowMarginCount = allClientProfitability.filter(c => c.status === 'low').length;

  const filteredClients = allClientProfitability.filter(c => {
    const matchSearch = !clientSearchTerm.trim() || c.client.toLowerCase().includes(clientSearchTerm.toLowerCase());
    const matchCategory = clientFilterCategory === 'all' || c.status === clientFilterCategory;
    return matchSearch && matchCategory;
  }).sort((a, b) => {
    if (clientSortBy === 'margin_desc') return b.profitMarginPct - a.profitMarginPct;
    if (clientSortBy === 'margin_asc') return a.profitMarginPct - b.profitMarginPct;
    if (clientSortBy === 'venta_desc') return b.totalVenta - a.totalVenta;
    if (clientSortBy === 'profit_desc') return b.totalGanancia - a.totalGanancia;
    if (clientSortBy === 'name_asc') return a.client.localeCompare(b.client);
    return 0;
  });

  const handleSaveGastosFijos = async () => {
    const updatedConfig = {
      ...config,
      gasto_alquiler_usd: alquilerUsd,
      gasto_expensas: expensas,
      gasto_internet: internet,
      gasto_servicios: servicios,
      gasto_redes: redes,
      gasto_publicidad: publicidad
    };
    try {
      await saveConfigData(updatedConfig);
      alert("✅ Gastos fijos guardados en la nube exitosamente.");
    } catch (e) {
      alert("Error al guardar los gastos fijos.");
    }
  };

  const labels: Record<string, string> = {
    telas: 'Telas',
    forreria: 'Forrería',
    sastre: 'M. Obra (Santiago Sastre)',
    camisero: 'M. Obra (Camisero)',
    arreglos: 'Arreglos',
    pterminado: 'Productos Terminados / RTW',
    envios: 'Envíos',
    avios: 'Avios / Embalaje',
    comision: 'Comisión Tomy',
    otros: 'Otras Categorías / Extras'
  };

  // Card Explanations Data Handlers
  const showVentaExplanation = () => {
    setActiveExplanation({
      title: '📈 Venta Bruta Total',
      formula: 'Suma de (Precio de Venta de cada orden cargada en el período)',
      explanation: 'Es la suma total de todo el dinero contratado y facturado por prendas a medida, arreglos y productos terminados (RTW) durante el período seleccionado, independientemente de si el cliente ya lo pagó todo o dejó saldo pendiente.',
      details: [
        { label: 'Cantidad de Órdenes en el período:', value: `${filteredOrders.length} órdenes` },
        { label: 'Suma Total Facturada (Bruta):', value: `$${formatMoney(totals.venta)}`, color: 'text-emerald-600 font-extrabold' }
      ],
      note: 'Representa el volumen total de ventas generadas por el negocio antes de descontar insumos, talleres o gastos fijos.'
    });
  };

  const showPendienteExplanation = () => {
    setActiveExplanation({
      title: '↘️ Pendiente a Cobrar',
      formula: 'Suma de (Saldos no abonados de órdenes con seña o pago parcial)',
      explanation: 'Es el dinero acumulado de ventas ya pactadas que los clientes aún no han terminado de abonar (por ejemplo, saldos a cobrar contra entrega de la prenda o al finalizar el traje).',
      details: [
        { label: 'Venta Bruta Acordada:', value: `$${formatMoney(totals.venta)}` },
        { label: 'Dinero Cobrado Efectivamente:', value: `$${formatMoney(totals.venta - totals.saldoPendiente)}`, color: 'text-sky-600' },
        { label: 'Saldo Pendiente a Recaudar:', value: `$${formatMoney(totals.saldoPendiente)}`, color: 'text-red-500 font-extrabold' }
      ],
      note: 'A medida que los clientes abonen sus saldos pendientes en el Registro General, este monto disminuirá y pasará automáticamente a Dinero Real Ingresado.'
    });
  };

  const showIngresadoExplanation = () => {
    setActiveExplanation({
      title: '👛 Dinero Real Ingresado (Caja & Banco)',
      formula: 'Señas y Pagos de Órdenes del Mes + Cobranzas de Órdenes Anteriores',
      explanation: 'Es la liquidez real o flujo de caja efectivo que ya ingresó a tu caja o cuenta bancaria durante este período. Incluye tanto las señas ingresadas por ventas del mes como los cobros de saldos pendientes de ventas pasadas.',
      details: [
        { label: 'Señas y Pagos de Órdenes del Período:', value: `$${formatMoney(senasVentasMesInPeriod)}`, color: 'text-sky-600' },
        { label: 'Cobranzas de Saldos de Órdenes Anteriores:', value: `+$${formatMoney(cobranzasVentasAnterioresInPeriod)}`, color: 'text-emerald-600 font-bold' },
        { label: 'TOTAL DINERO REAL INGRESADO:', value: `$${formatMoney(totalDineroRealRecaudadoEnPeriodo)}`, color: 'text-sky-700 font-extrabold text-sm' }
      ],
      note: 'Representa el dinero efectivo en mano disponible en tu caja para afrontar las obligaciones del negocio.'
    });
  };

  const showResultadoCajaExplanation = () => {
    setActiveExplanation({
      title: '💸 Resultado Neto de Caja (Efectivo Real vs Compromisos)',
      formula: 'Dinero Real Ingresado (Caja/Banco) - Total Compromiso Completo a Pagar',
      explanation: 'Muestra el resultado real del flujo de caja en mano. Compara directamente la cantidad de dinero en efectivo que ya ingresó este mes contra los egresos inamovibles a pagar (Talleres, Telas, Alquiler USD, Cheques/Préstamos y Comisiones).',
      details: [
        { label: 'Dinero Real Ingresado en el Período:', value: `$${formatMoney(totalDineroRealRecaudadoEnPeriodo)}`, color: 'text-sky-600 font-bold' },
        { label: '(-) Total Compromiso Completo del Mes:', value: `-$${formatMoney(Math.round(totalAPagarMesCompleto))}`, color: 'text-red-600 font-bold' },
        { label: 'RESULTADO NETO REAL DE CAJA:', value: `$${formatMoney(Math.round(resultadoNetoDeCajaReal))}`, color: resultadoNetoDeCajaReal >= 0 ? 'text-emerald-600 font-black text-sm' : 'text-red-500 font-black text-sm' }
      ],
      note: resultadoNetoDeCajaReal >= 0
        ? '🟢 Superávit de caja: El dinero ingresado alcanza para cubrir el 100% de los compromisos del mes.'
        : '🔴 Déficit de caja: El dinero ingresado hasta hoy no alcanza para saldar todos los compromisos del mes. Se requiere cobrar saldos pendientes o aportar liquidez.'
    });
  };

  const showGananciaNetaExplanation = () => {
    setActiveExplanation({
      title: '🏆 Ganancia Neta Real',
      formula: 'Venta Bruta Total - Total a Pagar en el Mes (Compromiso Operativo Completo)',
      explanation: 'Es el resultado económico neto y real de la sastrería. Descuenta de la facturación total contratada del mes la totalidad de los egresos y compromisos requeridos: talleres de confección, telas, gastos fijos del local (Alquiler USD a Blue + servicios), cuotas de cheques/préstamos con vencimiento en el mes y comisiones.',
      details: [
        { label: 'Venta Bruta Facturada del Período:', value: `$${formatMoney(totals.venta)}`, color: 'text-emerald-600 font-bold' },
        { label: '1. Mano de Obra & Talleres:', value: `-$${formatMoney(costoManoDeObraTalleres)}`, color: 'text-gray-600' },
        { label: '2. Telas & Forrería:', value: `-$${formatMoney(costoTelasYForreria)}`, color: 'text-gray-600' },
        { label: '3. Gastos Fijos (Alquiler USD + Servicios):', value: `-$${formatMoney(Math.round(totalGastosFijosPeriodo))}`, color: 'text-gray-600' },
        { label: '4. Cheques & Préstamos Vencimientos Mes:', value: `-$${formatMoney(periodCommitmentsObligations)}`, color: 'text-amber-900 font-bold' },
        { label: '5. Envíos, Avíos & Comisiones Tomy:', value: `-$${formatMoney(costsBreakdown.envios + costsBreakdown.avios + costsBreakdown.comision + costsBreakdown.otros)}`, color: 'text-gray-600' },
        { label: 'GANANCIA NETA REAL RESULTANTE:', value: `$${formatMoney(Math.round(gananciaNetaReal))}`, color: gananciaNetaReal >= 0 ? 'text-emerald-600 font-black text-sm' : 'text-red-500 font-black text-sm' }
      ],
      note: 'Si el resultado figura en rojo (negativo), indica que la facturación de ese mes en particular no alcanza para cubrir la totalidad de gastos fijos y cheques/cuotas emitidas para ese período.'
    });
  };

  const showRecordMonthExplanation = () => {
    setActiveExplanation({
      title: '🏆 Mes Récord de Ventas',
      formula: 'Mes calendario con mayor volumen de facturación bruta en el año',
      explanation: 'Indica el mes del año en el que Sastrería Ragucci contrató el mayor volumen de facturación. Te permite identificar la temporada alta de mayor demanda (casamientos, eventos o colaciones) para anticipar stock de telas y capacidad de talleres.',
      details: [
        { label: 'Mes de Mayor Venta en ' + filterYear + ':', value: recordMonth ? `${recordMonth.name}` : '-' },
        { label: 'Cantidad de Órdenes Cargadas:', value: recordMonth ? `${recordMonth.count} órdenes` : '0 órdenes' },
        { label: 'Facturación Bruta de ese Mes:', value: recordMonth ? `$${formatMoney(recordMonth.venta)}` : '$0', color: 'text-amber-600 font-extrabold' }
      ],
      note: 'Representa el pico máximo de ventas contratadas alcanzado en un solo mes.'
    });
  };

  const showPromedioMensualExplanation = () => {
    setActiveExplanation({
      title: '📈 Promedio Venta Mensual (Base 12 Meses)',
      formula: '(Suma de Venta Anual Total) ÷ (12 Meses del Año)',
      explanation: 'Es la venta promedio mensual si distribuyeras la facturación acumulada de todo el año en 12 partes iguales. Sirve para proyectar el nivel medio de ingresos requerido por mes para mantener el negocio saludable.',
      details: [
        { label: 'Venta Anual Total Acumulada (' + filterYear + '):', value: `$${formatMoney(totalVentaAnual)}` },
        { label: 'Divisor Calendario:', value: '12 meses del año' },
        { label: 'Promedio Resultante por Mes:', value: `$${formatMoney(Math.round(promedioVentaMensual12))} / mes`, color: 'text-emerald-600 font-extrabold' },
        { label: 'Promedio en Meses Activos con Ventas (' + activeMonthsInYearCount + ' mes):', value: `$${formatMoney(Math.round(promedioVentaMensualActivos))}`, color: 'text-sky-600 font-bold' }
      ],
      note: 'Conforme cargues órdenes en los demás meses del año, el promedio se ajustará progresivamente con mayor representatividad.'
    });
  };

  const showVentaAnualExplanation = () => {
    setActiveExplanation({
      title: '👑 Venta Anual Total y Ganancia Directa',
      formula: 'Suma de todas las ventas contratadas en el año seleccionado',
      explanation: 'Muestra la cifra total bruta facturada por Sastrería Ragucci durante el año y la Ganancia Directa acumulada resultante tras abonar los insumos (telas, forrería) y talleres de confección (sastres y camiseros).',
      details: [
        { label: 'Facturación Anual Bruta Total (' + filterYear + '):', value: `$${formatMoney(totalVentaAnual)}`, color: 'text-ragucci-primary font-extrabold' },
        { label: 'Ganancia Directa de Insumos y Talleres:', value: `$${formatMoney(totalGananciaAnual)}`, color: 'text-emerald-600 font-extrabold' }
      ],
      note: 'No descuenta los gastos fijos del local (alquiler, expensas, luz, etc.), los cuales se calculan sobre el resultado neto final.'
    });
  };

  const showTalleresExplanation = () => {
    setActiveExplanation({
      title: '✂️ Talleres & Mano de Obra (M.O)',
      formula: 'Santiago Sastre + Camiseros (Diego/Guillermo) + Modistas (María/Jesús/Arturo)',
      explanation: 'Es el total que debes liquidar únicamente al personal de talleres por su trabajo artesanal de confección y arreglos en las órdenes de este período.',
      details: [
        { label: 'Santiago (Sastre):', value: `$${formatMoney(costsBreakdown.sastre)}` },
        { label: 'Camiseros (Diego / Guillermo):', value: `$${formatMoney(costsBreakdown.camisero)}` },
        { label: 'Modistas (María / Jesús / Arturo):', value: `$${formatMoney(costsBreakdown.arreglos)}` },
        { label: 'Total Mano de Obra a Pagar:', value: `$${formatMoney(costoManoDeObraTalleres)}`, color: 'text-ragucci-primary font-extrabold' }
      ]
    });
  };

  const showTelasExplanation = () => {
    setActiveExplanation({
      title: '🧵 Telas & Forrería (A Medida)',
      formula: 'Costo de Telas + Costo de Forrería de órdenes a medida',
      explanation: 'Corresponde al gasto en insumos directos comprados para las prendas a medida solicitadas por los clientes en este mes.',
      details: [
        { label: 'Telas:', value: `$${formatMoney(costsBreakdown.telas)}` },
        { label: 'Forrería:', value: `$${formatMoney(costsBreakdown.forreria)}` },
        { label: 'Total Insumos A Medida:', value: `$${formatMoney(costoTelasYForreria)}`, color: 'text-ragucci-primary font-extrabold' }
      ]
    });
  };

  const showGastosFijosExplanation = () => {
    setActiveExplanation({
      title: '🏢 Gastos Fijos Mensuales del Local',
      formula: '(Alquiler USD x Dólar Blue) + Expensas + Internet + Servicios + Redes + Publicidad',
      explanation: 'Suma todos los costos fijos recurrentes necesarios para mantener abierto el local comercial durante el período.',
      details: [
        { label: 'Alquiler (USD convertido):', value: `$${formatMoney(Math.round(alquilerPesos))}` },
        { label: 'Expensas, Servicios & Conexiones:', value: `$${formatMoney(gastosFijosPesos)}` },
        { label: 'Total Gastos Fijos del Período:', value: `$${formatMoney(Math.round(totalGastosFijosPeriodo))}`, color: 'text-ragucci-primary font-extrabold' }
      ]
    });
  };

  const showChequesPrestamosExplanation = () => {
    setActiveExplanation({
      title: '💳 Cheques, Préstamos y Financiamientos del Mes',
      formula: 'Suma de cuotas de cheques a fecha, préstamos y financiamientos con vencimiento en el mes seleccionado',
      explanation: 'Muestra la suma total de cuotas y cheques diferidos que vencen durante este mes y deben ser debitados de la cuenta bancaria o caja.',
      details: [
        { label: 'Cuotas y Cheques con Vencimiento en el Mes:', value: `$${formatMoney(periodCommitmentsObligations)}`, color: 'text-amber-900 font-extrabold' },
        { label: 'Cuotas ya Debitadas en el Mes:', value: `$${formatMoney(periodCommitmentsDebited)}`, color: 'text-emerald-700 font-bold' },
        { label: 'Deuda Total Histórica a Saldar (Cheques/Préstamos + Tomy):', value: `$${formatMoney(totalPendingCommitmentsDebt)}`, color: 'text-red-700 font-black' }
      ],
      note: 'Estos compromisos pasivos están integrados en el cálculo del Total a Pagar en el Mes para reflejar la salida real de dinero.'
    });
  };

  const showCompromisoTotalExplanation = () => {
    setActiveExplanation({
      title: '💼 Total a Pagar en el Mes (Compromiso Operativo Completo)',
      formula: 'Talleres (M.O) + Telas/Forrería + Gastos Fijos + Cheques/Préstamos del Mes + Avíos/Envíos/Comisiones',
      explanation: 'Calcula la suma exacta de dinero que necesitas desembolsar este mes para estar 100% al día con talleres, proveedores de telas, cheques a fecha, cuotas de préstamos y gastos fijos de local (excluyendo únicamente recompra de stock RTW a futuro).',
      details: [
        { label: '1. Mano de Obra & Talleres:', value: `$${formatMoney(costoManoDeObraTalleres)}` },
        { label: '2. Telas & Forrería:', value: `$${formatMoney(costoTelasYForreria)}` },
        { label: '3. Gastos Fijos Mensuales (Alquiler + Expensas + Serv.):', value: `$${formatMoney(Math.round(totalGastosFijosPeriodo))}` },
        { label: '4. Cheques, Préstamos y Cuotas del Mes:', value: `$${formatMoney(periodCommitmentsObligations)}`, color: 'text-amber-900 font-extrabold' },
        { label: '5. Envíos, Avíos y Comisiones (Tomy):', value: `$${formatMoney(costsBreakdown.envios + costsBreakdown.avios + costsBreakdown.comision + costsBreakdown.otros)}` },
        { label: 'TOTAL COMPLETO A PAGAR EN EL MES:', value: `$${formatMoney(Math.round(totalAPagarMesCompleto))}`, color: 'text-ragucci-primary font-black text-sm' }
      ],
      note: 'Este número te indica con 100% de precisión la liquidez total que necesitas generar cada mes para cubrir todos tus compromisos sin mora.'
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-1 mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary inline-block tracking-wide">
          Balance de Rentabilidad Financiera
        </h2>
        <button
          onClick={() => exportBalanceToCSV(filterMonth, filterYear, totals, costsBreakdown, totalGastosFijosPeriodo, gananciaNetaReal)}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold py-1.5 px-3.5 rounded transition-all cursor-pointer shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📊 Exportar Balance a Excel</span>
        </button>
      </div>

      {/* Filter Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-ragucci-gold-light mb-6 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Mes</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          >
            <option value="all">Todos los meses (Balance General)</option>
            <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
            <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
            <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
            <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Año</label>
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

      {/* Fixed Costs Section */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-3 inline-block">
          Gastos Fijos Mensuales (Editables)
        </h3>

        <div className="bg-ragucci-primary text-ragucci-gold p-3 rounded text-xs font-bold mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>💱 Cotización Dólar Blue (Venta): ${formatMoney(dolarBlueVenta)}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Alquiler (USD) <span className="text-[10px] text-ragucci-primary font-normal">(≈ ${formatMoney(Math.round(alquilerPesos))} ARS)</span>
            </label>
            <MoneyInput value={alquilerUsd} onValueChange={(val) => setAlquilerUsd(val)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Expensas ($)</label>
            <MoneyInput value={expensas} onValueChange={(val) => setExpensas(val)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Internet ($)</label>
            <MoneyInput value={internet} onValueChange={(val) => setInternet(val)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Servicios (Luz/Gas) ($)</label>
            <MoneyInput value={servicios} onValueChange={(val) => setServicios(val)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Redes ($)</label>
            <MoneyInput value={redes} onValueChange={(val) => setRedes(val)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Publicidad ($)</label>
            <MoneyInput value={publicidad} onValueChange={(val) => setPublicidad(val)} />
          </div>
        </div>

        <button
          onClick={handleSaveGastosFijos}
          className="bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>💾 Guardar Gastos Fijos</span>
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
        <Info className="w-4 h-4 text-ragucci-gold" />
        <span>💡 <em>Haz clic sobre cualquier tarjeta para ver el desglose detallado y la fórmula de cálculo.</em></span>
      </div>

      {/* Financial Overview Cards (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        <div 
          onClick={showVentaExplanation}
          className="bg-white p-4 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex justify-center text-emerald-600 mb-1">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] uppercase font-extrabold text-ragucci-primary-light tracking-wider">Venta Bruta Total</h4>
          <div className="text-xl font-extrabold text-emerald-600 font-sans mt-1.5">${formatMoney(totals.venta)}</div>
          <span className="text-[9px] text-gray-400 block mt-1">Ver fórmula ➔</span>
        </div>

        <div 
          onClick={showPendienteExplanation}
          className="bg-white p-4 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-red-400 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-red-400 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex justify-center text-red-500 mb-1">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] uppercase font-extrabold text-ragucci-primary-light tracking-wider">Pendiente a Cobrar</h4>
          <div className="text-xl font-extrabold text-red-500 font-sans mt-1.5">${formatMoney(totals.saldoPendiente)}</div>
          <span className="text-[9px] text-gray-400 block mt-1">Ver fórmula ➔</span>
        </div>

        <div 
          onClick={showIngresadoExplanation}
          className="bg-white p-4 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-sky-500 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-sky-500 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex justify-center text-sky-600 mb-1">
            <Wallet className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] uppercase font-extrabold text-ragucci-primary-light tracking-wider">Dinero Real Ingresado</h4>
          <div className="text-xl font-extrabold text-sky-600 font-sans mt-1.5">${formatMoney(totalDineroRealRecaudadoEnPeriodo)}</div>
          <span className="text-[9px] text-sky-800 font-bold block mt-1">Ver desglose cobros ➔</span>
        </div>

        <div 
          onClick={showGananciaNetaExplanation}
          className="bg-ragucci-primary text-ragucci-gold p-4 border-b-4 border-ragucci-gold rounded-lg shadow-md text-center cursor-pointer hover:bg-ragucci-primary-light hover:shadow-lg transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-ragucci-gold/40 group-hover:text-ragucci-gold transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex justify-center text-ragucci-gold mb-1">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] uppercase font-extrabold text-ragucci-gold-light tracking-wider">Ganancia Neta Real</h4>
          <div className="text-xl font-extrabold text-ragucci-gold font-sans mt-1.5">${formatMoney(Math.round(gananciaNetaReal))}</div>
          <span className="text-[9px] text-ragucci-gold-light/60 block mt-1">Ver fórmula devengada ➔</span>
        </div>

        <div 
          onClick={showResultadoCajaExplanation}
          className={`p-4 rounded-lg shadow-md text-center cursor-pointer transition-all group relative border-b-4 ${
            resultadoNetoDeCajaReal >= 0
              ? 'bg-emerald-900 text-emerald-100 border-b-emerald-400 hover:bg-emerald-850'
              : 'bg-red-950 text-red-100 border-b-red-500 hover:bg-red-900'
          }`}
        >
          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex justify-center mb-1">
            <Calculator className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] uppercase font-extrabold tracking-wider">Resultado de Caja (Efectivo)</h4>
          <div className="text-xl font-black font-sans mt-1.5">${formatMoney(Math.round(resultadoNetoDeCajaReal))}</div>
          <span className="text-[9px] opacity-80 block mt-1">Ver caja en mano ➔</span>
        </div>
      </div>

      {/* BANNER DESTACADO: CONTROL DE LIQUIDEZ Y RESULTADO DE CAJA REAL */}
      <div className="bg-gradient-to-r from-slate-900 via-ragucci-primary to-slate-900 text-white p-5 rounded-2xl border-2 border-ragucci-gold shadow-md space-y-3 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ragucci-gold/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-ragucci-gold text-ragucci-primary rounded-xl font-black text-2xl shadow-xs">
              🏦
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black uppercase text-ragucci-gold tracking-wide flex items-center gap-2">
                <span>Control de Liquidez & Flujo Neto de Caja Real</span>
                <span className="text-[10px] bg-ragucci-gold text-ragucci-primary font-black px-2 py-0.5 rounded-full uppercase">
                  Caja Efectiva
                </span>
              </h3>
              <p className="text-xs text-gray-300 font-medium">
                Compara el dinero real en efectivo/banco que ya ingresó este mes contra la totalidad de compromisos inamovibles a pagar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={showResultadoCajaExplanation}
            className="bg-ragucci-gold hover:bg-white text-ragucci-primary font-black text-xs uppercase px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Explicación de Caja Real</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
              💵 Dinero Real Ingresado (Caja / Banco)
            </span>
            <span className="text-base font-black text-sky-300 mt-0.5 block">
              +${formatMoney(totalDineroRealRecaudadoEnPeriodo)}
            </span>
            <span className="text-[10px] text-sky-200 font-medium block">
              Señas del mes (${formatMoney(senasVentasMesInPeriod)}) + Cobranzas anteriores (${formatMoney(cobranzasVentasAnterioresInPeriod)})
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
              💳 Total Compromisos Inamovibles del Mes
            </span>
            <span className="text-base font-black text-red-400 mt-0.5 block">
              -${formatMoney(Math.round(totalAPagarMesCompleto))}
            </span>
            <span className="text-[10px] text-red-300 font-medium block">
              Talleres + Telas + Alquiler USD + Cheques + Comisiones
            </span>
          </div>

          <div className={`p-3 rounded-xl font-extrabold shadow-sm border ${
            resultadoNetoDeCajaReal >= 0 
              ? 'bg-emerald-500 text-slate-950 border-emerald-300' 
              : 'bg-red-950 text-red-200 border-red-500'
          }`}>
            <span className="text-[10px] uppercase font-black tracking-wider block opacity-90">
              {resultadoNetoDeCajaReal >= 0 ? '🟢 Superávit Neto de Caja' : '🔴 Déficit Neto de Caja (Faltante)'}
            </span>
            <span className="text-lg font-black mt-0.5 block">
              ${formatMoney(Math.round(resultadoNetoDeCajaReal))}
            </span>
            <span className="text-[10px] font-bold block opacity-80">
              {resultadoNetoDeCajaReal >= 0 
                ? 'El dinero cobrado cubre el 100% de los compromisos' 
                : 'Faltante de liquidez a recaudar o aportar este mes'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner / Card for Cheques diferidos y Préstamos */}
      <div className="bg-amber-50/90 border-2 border-amber-300 p-4.5 rounded-xl mb-8 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-900 text-amber-100 rounded-xl font-black text-xl shadow-xs">
            💳
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-2">
              <span>Compromisos Pasivos & Cheques a Fecha</span>
              {financialCommitments.filter(c => c.status === 'ACTIVO').length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  {financialCommitments.filter(c => c.status === 'ACTIVO').length} Activos
                </span>
              )}
            </h4>
            <div className="flex flex-wrap items-center gap-3.5 mt-1 text-xs text-amber-900 font-bold">
              <span>Deuda Total a Saldar: <strong className="text-red-700 font-black text-sm">${formatMoney(totalPendingCommitmentsDebt)}</strong></span>
              <span>•</span>
              <span>Cuotas del período seleccionado: <strong className="text-amber-950 font-extrabold">${formatMoney(periodCommitmentsObligations)}</strong></span>
              <span>•</span>
              <span>Cuotas debitadas: <strong className="text-emerald-800 font-bold">${formatMoney(periodCommitmentsDebited)}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('saldos')}
          className="bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold text-xs font-extrabold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <span>💳 Gestionar Cheques & Saldos</span>
          <span>➔</span>
        </button>
      </div>

      {/* Banner / Card for Regalos & Cortesías */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-850 to-purple-900 text-white p-4.5 rounded-xl mb-8 border-2 border-purple-400 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-400 text-purple-950 rounded-xl font-black text-xl shadow-xs">
            🎁
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-purple-200 tracking-wider flex items-center gap-2">
              <span>Inversión en Regalos & Cortesías a Clientes</span>
              {giftList.length > 0 && (
                <span className="bg-purple-400 text-purple-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                  {giftList.length} Regalo(s)
                </span>
              )}
            </h4>
            <div className="flex flex-wrap items-center gap-3.5 mt-1 text-xs text-purple-100 font-bold">
              <span>Costo Total en Telas y Mano de Obra: <strong className="text-purple-300 font-black text-sm">${formatMoney(totalGiftInversion)}</strong></span>
              <span>•</span>
              <span>Prendas Regaladas en el Período: <strong className="text-white font-extrabold">{giftList.length} prendas</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGiftModal(true)}
          className="bg-purple-400 hover:bg-white text-purple-950 font-black text-xs uppercase px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Gift className="w-4 h-4" />
          <span>Ver Desglose de Regalos</span>
        </button>
      </div>

      {/* Subdivisión: Egresos Operativos Mensuales (M.O, Talleres, Telas, Gastos Fijos y Cheques - Sin RTW) */}
      <div className="border border-ragucci-gold-light bg-[#fffdfa] p-5 rounded-lg mb-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-2 mb-1">
          <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary tracking-wide flex items-center gap-2">
            <Scissors className="w-4 h-4 text-ragucci-gold" />
            <span>Compromisos de Confección, Talleres, Cheques y Gastos Mensuales</span>
          </h3>
          <span className="text-[11px] bg-ragucci-primary text-ragucci-gold px-2.5 py-0.5 rounded font-bold">
            Excluye Recompra RTW / Stock
          </span>
        </div>

        <p className="text-xs text-gray-600">
          Calcula exactamente la suma de dinero necesaria para cubrir la <strong>mano de obra de talleres</strong>, <strong>telas a medida</strong>, <strong>gastos fijos del local</strong> y los <strong>vencimientos de cheques/préstamos y comisiones</strong> del período seleccionado.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div 
            onClick={showTalleresExplanation}
            className="bg-white p-3.5 border border-ragucci-gold-light rounded shadow-sm text-center cursor-pointer hover:border-ragucci-gold hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">1. Talleres & M.O</h4>
            <p className="text-[10px] text-gray-500">Santiago + Camiseros</p>
            <div className="text-lg font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoManoDeObraTalleres)}
            </div>
            <span className="text-[9px] text-ragucci-gold block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showTelasExplanation}
            className="bg-white p-3.5 border border-ragucci-gold-light rounded shadow-sm text-center cursor-pointer hover:border-ragucci-gold hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">2. Telas & Forrería</h4>
            <p className="text-[10px] text-gray-500">Insumos confección</p>
            <div className="text-lg font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoTelasYForreria)}
            </div>
            <span className="text-[9px] text-ragucci-gold block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showGastosFijosExplanation}
            className="bg-white p-3.5 border border-ragucci-gold-light rounded shadow-sm text-center cursor-pointer hover:border-ragucci-gold hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">3. Gastos Fijos Local</h4>
            <p className="text-[10px] text-gray-500">Alquiler + Serv + Expensas</p>
            <div className="text-lg font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(Math.round(totalGastosFijosPeriodo))}
            </div>
            <span className="text-[9px] text-ragucci-gold block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showChequesPrestamosExplanation}
            className="bg-white p-3.5 border border-amber-300 bg-amber-50/50 rounded shadow-sm text-center cursor-pointer hover:border-amber-500 hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-amber-900">4. Cheques & Préstamos</h4>
            <p className="text-[10px] text-amber-700">Vencimientos del Mes</p>
            <div className="text-lg font-extrabold text-amber-900 font-sans mt-1">
              ${formatMoney(periodCommitmentsObligations)}
            </div>
            <span className="text-[9px] text-amber-800 block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showCompromisoTotalExplanation}
            className="bg-ragucci-primary text-white p-3.5 rounded shadow-md text-center border-l-4 border-l-ragucci-gold cursor-pointer hover:bg-ragucci-primary-light hover:shadow-lg transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-gold tracking-wider">TOTAL A PAGAR EN EL MES</h4>
            <p className="text-[9px] text-ragucci-gold-light">Talleres + Telas + Fijos + Cheques</p>
            <div className="text-lg md:text-xl font-extrabold text-ragucci-gold font-sans mt-1">
              ${formatMoney(Math.round(totalAPagarMesCompleto))}
            </div>
            <span className="text-[9px] text-ragucci-gold-light/80 block mt-1">Ver compromiso completo ➔</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between bg-white p-3 border border-gray-200 rounded text-xs">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <ShoppingBag className="w-4 h-4 text-ragucci-gold" />
            <span><strong>Costo de Productos Terminados / RTW excluido del compromiso mensual:</strong> (Considerado inversión de stock a futuro)</span>
          </div>
          <span className="font-extrabold text-ragucci-primary font-sans text-sm mt-1 sm:mt-0">
            ${formatMoney(costsBreakdown.pterminado)}
          </span>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Desglose de Costos del Período
      </h3>

      <div className="overflow-x-auto max-w-2xl">
        <table className="w-full text-xs text-left border-collapse border border-ragucci-border">
          <tbody>
            {Object.keys(labels).map((key) => (
              <tr key={key} className={`border-b border-gray-200 ${key === 'pterminado' ? 'bg-amber-50/40' : ''}`}>
                <td className="p-2.5 font-medium flex items-center justify-between">
                  <span>{labels[key]}</span>
                  {key === 'pterminado' && (
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                      Recompra de Stock
                    </span>
                  )}
                </td>
                <td className="p-2.5 text-right font-bold">${formatMoney(costsBreakdown[key])}</td>
              </tr>
            ))}
            <tr className="bg-amber-50 font-bold text-amber-900 border-b border-amber-200">
              <td className="p-2.5">🏠 GASTOS FIJOS ({monthsToMultiply} {monthsToMultiply === 1 ? 'mes' : 'meses activos con ventas cargadas'})</td>
              <td className="p-2.5 text-right">${formatMoney(Math.round(totalGastosFijosPeriodo))}</td>
            </tr>
            <tr className="bg-ragucci-primary text-ragucci-gold font-extrabold text-sm">
              <td className="p-3">TOTAL INVERTIDO EN COSTOS</td>
              <td className="p-3 text-right">${formatMoney(Math.round(costoTotalConFijos))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 📊 EVOLUCIÓN MENSUAL Y GRÁFICOS VISUALES */}
      <div className="mt-10 pt-6 border-t-2 border-dashed border-ragucci-gold-light space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ragucci-gold pb-2">
          <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary tracking-wide flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ragucci-gold" />
            <span>Gráficos Visuales de Evolución Mensual ({filterYear})</span>
          </h3>
          <span className="text-xs bg-ragucci-primary text-ragucci-gold px-3 py-1 rounded-full font-bold shadow-sm">
            Evolución de 12 Meses
          </span>
        </div>

        {/* Annual KPI Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={showRecordMonthExplanation}
            className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-4 rounded-lg shadow-md flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all group relative"
          >
            <div className="absolute top-2 right-2 text-white/40 group-hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white/20 rounded-full shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider block">Mes Récord de Ventas</span>
              <strong className="text-lg font-extrabold">{recordMonth ? `${recordMonth.name} (${recordMonth.count} ord)` : '-'}</strong>
              <span className="block text-xs font-bold text-amber-100">${formatMoney(recordMonth ? recordMonth.venta : 0)}</span>
              <span className="text-[9px] text-amber-200 block mt-0.5">Clic para ver detalle ➔</span>
            </div>
          </div>

          <div 
            onClick={showPromedioMensualExplanation}
            className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-4 rounded-lg shadow-md flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all group relative"
          >
            <div className="absolute top-2 right-2 text-white/40 group-hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white/20 rounded-full shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider block">Promedio Mensual (Base 12 Meses)</span>
              <strong className="text-lg font-extrabold">${formatMoney(Math.round(promedioVentaMensual12))} / mes</strong>
              <span className="block text-[10px] text-emerald-100/90 font-medium mt-0.5">
                Total anual ÷ 12 meses del año
              </span>
              <span className="text-[9px] text-emerald-200 block mt-0.5">Clic para ver detalle ➔</span>
            </div>
          </div>

          <div 
            onClick={showVentaAnualExplanation}
            className="bg-gradient-to-br from-ragucci-primary to-ragucci-primary-light text-ragucci-gold p-4 rounded-lg shadow-md border-l-4 border-ragucci-gold flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all group relative"
          >
            <div className="absolute top-2 right-2 text-ragucci-gold/40 group-hover:text-ragucci-gold transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="p-3 bg-ragucci-gold/20 rounded-full shrink-0">
              <Award className="w-6 h-6 text-ragucci-gold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-ragucci-gold-light tracking-wider block">Venta Anual Total ({filterYear})</span>
              <strong className="text-xl font-extrabold text-white">${formatMoney(totalVentaAnual)}</strong>
              <span className="block text-xs text-ragucci-gold-light">Ganancia Directa: ${formatMoney(totalGananciaAnual)}</span>
              <span className="text-[9px] text-ragucci-gold-light/70 block mt-0.5">Clic para ver detalle ➔</span>
            </div>
          </div>
        </div>

        {/* Dual Bar Chart: Ventas vs Ganancia Neta por Mes */}
        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-ragucci-primary">
                📊 Ventas y Ganancias por Mes (Bruto vs Neta)
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Compara las ventas totales contratadas contra la ganancia directa generada mes a mes. Toca cualquier mes para filtrar.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold mt-2 sm:mt-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-ragucci-gold inline-block"></span>
                <span className="text-gray-700">Venta Bruta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span>
                <span className="text-gray-700">Ganancia Directa</span>
              </div>
            </div>
          </div>

          {/* Chart Graphic Canvas */}
          <div className="h-64 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-gray-200 px-1">
            {monthsData.map((m) => {
              const heightVentaPct = maxVentaAnual > 0 ? (m.venta / maxVentaAnual) * 100 : 0;
              const heightGananciaPct = maxVentaAnual > 0 ? (m.gananciaMes / maxVentaAnual) * 100 : 0;
              const isSelected = filterMonth !== 'all' && parseInt(filterMonth) === m.monthNum;

              return (
                <div key={m.monthNum} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer" onClick={() => setFilterMonth(m.monthNum.toString())}>
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-ragucci-primary text-white text-[10px] p-2 rounded shadow-xl pointer-events-none z-20 whitespace-nowrap text-center font-sans border border-ragucci-gold">
                    <strong className="text-ragucci-gold block font-extrabold">{m.name} {filterYear} ({m.count} órdenes)</strong>
                    <span>Venta: ${formatMoney(m.venta)}</span><br/>
                    <span className="text-emerald-400 font-bold">Ganancia: ${formatMoney(m.gananciaMes)}</span>
                  </div>

                  {/* Dual Bars Container */}
                  <div className={`w-full flex items-end justify-center gap-1 h-full p-1 rounded-t transition-all ${isSelected ? 'bg-ragucci-gold-light/20 border-b-2 border-ragucci-gold' : 'hover:bg-gray-50'}`}>
                    {/* Venta Bar */}
                    <div 
                      style={{ height: `${Math.max(4, heightVentaPct)}%` }}
                      className={`w-1/2 rounded-t transition-all ${m.venta > 0 ? 'bg-ragucci-gold group-hover:bg-ragucci-primary' : 'bg-gray-200'}`}
                      title={`Venta ${m.name}: $${formatMoney(m.venta)}`}
                    ></div>
                    {/* Ganancia Bar */}
                    <div 
                      style={{ height: `${Math.max(4, heightGananciaPct)}%` }}
                      className={`w-1/2 rounded-t transition-all ${m.gananciaMes > 0 ? 'bg-emerald-600 group-hover:bg-emerald-700' : 'bg-gray-200'}`}
                      title={`Ganancia ${m.name}: $${formatMoney(m.gananciaMes)}`}
                    ></div>
                  </div>

                  {/* Month Label */}
                  <span className={`text-[10px] font-extrabold mt-1 uppercase ${isSelected ? 'text-ragucci-primary underline decoration-ragucci-gold' : 'text-gray-600'}`}>
                    {m.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Distribution Progress Bars */}
        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <PieChart className="w-4 h-4 text-ragucci-gold" />
            <h4 className="text-xs font-extrabold uppercase text-ragucci-primary">
              Distribución Porcentual de Costos ({filterMonth === 'all' ? `Todo ${filterYear}` : `Mes ${filterMonth}/${filterYear}`})
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { label: '🧵 Telas & Insumos (A Medida)', val: costsBreakdown.telas + costsBreakdown.forreria, color: 'bg-amber-600' },
              { label: '✂️ Mano de Obra Sastre (Santiago)', val: costsBreakdown.sastre, color: 'bg-emerald-700' },
              { label: '👔 Mano de Obra Camiseros (Diego & Guillermo)', val: costsBreakdown.camisero, color: 'bg-sky-700' },
              { label: '🪡 Modistas & Arreglos (María, Jesús, Arturo)', val: costsBreakdown.arreglos, color: 'bg-purple-700' },
              { label: '🏠 Gastos Fijos (Alquiler, Servicios, Redes)', val: Math.round(totalGastosFijosPeriodo), color: 'bg-rose-700' },
              { label: '🏷️ Productos Terminados / RTW (Inversión Stock)', val: costsBreakdown.pterminado, color: 'bg-slate-700' }
            ].map((cItem, i) => {
              const totalCostBase = Math.max(1, costoTotalConFijos);
              const pct = Math.min(100, Math.round((cItem.val / totalCostBase) * 100));

              return (
                <div key={i}>
                  <div className="flex justify-between font-bold text-gray-700 mb-1">
                    <span>{cItem.label}</span>
                    <span className="font-extrabold font-sans">${formatMoney(cItem.val)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-full ${cItem.color} transition-all duration-500 rounded-full`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla de Rentabilidad por Cliente (% Ganancia Teórica) */}
        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm col-span-1 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-ragucci-gold shrink-0" />
                <h4 className="text-sm font-extrabold uppercase text-ragucci-primary">
                  📈 Tabla de Rentabilidad por Cliente (% Ganancia Teórica)
                </h4>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Analiza con qué clientes obtenemos un margen excelente (≥50%) y con cuáles el margen es bajo (&lt;35%).
              </p>
            </div>

            <button
              onClick={() => exportClientProfitabilityToCSV(filteredClients, `ragucci_rentabilidad_clientes_${filterYear}_${filterMonth}.csv`)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold py-1.5 px-3 rounded transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Rentabilidad (.csv)</span>
            </button>
          </div>

          {/* KPI Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div 
              onClick={() => setClientFilterCategory(clientFilterCategory === 'high' ? 'all' : 'high')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                clientFilterCategory === 'high'
                  ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400'
                  : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-emerald-900">🟢 Ganamos Muy Bien (≥50%)</span>
                <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{highMarginCount} clientes</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">Margen de ganancia directo superior al 50%.</p>
            </div>

            <div 
              onClick={() => setClientFilterCategory(clientFilterCategory === 'medium' ? 'all' : 'medium')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                clientFilterCategory === 'medium'
                  ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-amber-900">🟡 Ganamos Bien (35% - 49%)</span>
                <span className="bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{mediumMarginCount} clientes</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">Margen de ganancia saludable estándar.</p>
            </div>

            <div 
              onClick={() => setClientFilterCategory(clientFilterCategory === 'low' ? 'all' : 'low')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                clientFilterCategory === 'low'
                  ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-400'
                  : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-rose-900">🔴 Ganamos Mal (&lt;35%)</span>
                <span className="bg-rose-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{lowMarginCount} clientes</span>
              </div>
              <p className="text-[11px] text-rose-800 mt-1">Margen bajo o ajustado. Revisar costos de taller.</p>
            </div>
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 bg-gray-50 p-3 rounded border border-gray-200">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold font-medium"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <select
                value={clientFilterCategory}
                onChange={(e) => setClientFilterCategory(e.target.value as any)}
                className="p-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 focus:outline-none focus:border-ragucci-gold"
              >
                <option value="all">🔍 Todos los Clientes</option>
                <option value="high">🟢 Ganamos Muy Bien (≥50%)</option>
                <option value="medium">🟡 Ganamos Bien (35% - 49%)</option>
                <option value="low">🔴 Ganamos Mal (&lt;35%)</option>
              </select>

              <select
                value={clientSortBy}
                onChange={(e) => setClientSortBy(e.target.value as any)}
                className="p-1.5 border border-amber-300 bg-amber-50 text-amber-900 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
              >
                <option value="margin_desc">📉 Margen % (Mayor a Menor)</option>
                <option value="margin_asc">📈 Margen % (Menor a Mayor - Ganamos Mal)</option>
                <option value="venta_desc">💰 Mayor Venta Total ($)</option>
                <option value="profit_desc">💵 Mayor Ganancia ($)</option>
                <option value="name_asc">🔤 Nombre Cliente (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-ragucci-primary text-ragucci-gold uppercase text-[11px] tracking-wider border-b border-ragucci-gold">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-2 text-center">Órdenes</th>
                  <th className="py-2.5 px-3 text-right">Venta Total ($)</th>
                  <th className="py-2.5 px-3 text-right">Costo Directo ($)</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Teórica ($)</th>
                  <th className="py-2.5 px-3 text-center">% Margen Teórico</th>
                  <th className="py-2.5 px-3 text-center">Estado Rentabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-medium italic">
                      No se encontraron clientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((item, idx) => {
                    const isHigh = item.status === 'high';
                    const isLow = item.status === 'low';

                    return (
                      <tr key={idx} className="hover:bg-[#fdfaf5] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-ragucci-primary">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => setSelectedClientForHistory(item.client)}
                              className="hover:underline text-left cursor-pointer flex items-center gap-1 text-ragucci-primary font-extrabold"
                              title="Hacer clic para ver historial completo del cliente"
                            >
                              <span>{item.client}</span>
                            </button>

                            {item.pendingCosts && item.pendingCosts.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                {item.pendingCosts.map((pc, pIdx) => (
                                  <button
                                    key={pIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingOrderId(pc.orderId);
                                      setActiveTab('carga');
                                    }}
                                    className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs transition-all cursor-pointer"
                                    title={`Hacer clic para ir a editar la orden y cargar ${pc.label}`}
                                  >
                                    <span>⚠️ Falta {pc.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center font-semibold text-gray-700">
                          {item.orderCount}
                        </td>

                        <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                          ${formatMoney(item.totalVenta)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-medium text-ragucci-red">
                          -${formatMoney(item.totalCosto)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                          ${formatMoney(item.totalGanancia)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`font-black text-xs ${isHigh ? 'text-emerald-700' : isLow ? 'text-rose-700' : 'text-amber-800'}`}>
                              {item.profitMarginPct.toFixed(1)}%
                            </span>
                            <div className="w-14 h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, item.profitMarginPct))}%` }}
                                className={`h-full ${isHigh ? 'bg-emerald-600' : isLow ? 'bg-rose-600' : 'bg-amber-500'}`}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isHigh && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <span>🟢 Ganamos Muy Bien (≥50%)</span>
                            </span>
                          )}
                          {!isHigh && !isLow && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <span>🟡 Ganamos Bien (35%-49%)</span>
                            </span>
                          )}
                          {isLow && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              <span>🔴 Ganamos Mal (&lt;35%)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Historial del Cliente si se hace clic */}
        {selectedClientForHistory && (
          <ClientHistoryModal
            clientName={selectedClientForHistory}
            isOpen={!!selectedClientForHistory}
            onClose={() => setSelectedClientForHistory(null)}
          />
        )}
      </div>

      {/* Explanation Modal */}
      {activeExplanation && (
        <Modal
          isOpen={!!activeExplanation}
          onClose={() => setActiveExplanation(null)}
          title={activeExplanation.title}
        >
          <div className="space-y-4 text-xs">
            {/* Formula Block */}
            <div className="bg-ragucci-primary text-ragucci-gold p-3 rounded-lg border border-ragucci-gold/30">
              <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider mb-1 text-ragucci-gold-light">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Fórmula de Cálculo:</span>
              </div>
              <div className="font-mono text-xs font-bold text-white bg-ragucci-primary-light/80 p-2 rounded border border-ragucci-gold/20">
                {activeExplanation.formula}
              </div>
            </div>

            {/* Explanation text */}
            <div className="bg-amber-50/60 p-3 rounded border border-amber-200 text-gray-800 leading-relaxed font-medium">
              {activeExplanation.explanation}
            </div>

            {/* Details List */}
            <div className="border border-gray-200 rounded p-3 bg-white space-y-2">
              <h4 className="font-bold text-ragucci-primary uppercase text-[11px] border-b pb-1">Desglose del Período Seleccionado:</h4>
              {activeExplanation.details.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-0.5">
                  <span className="text-gray-600 font-medium">{d.label}</span>
                  <span className={`font-bold font-sans ${d.color || 'text-ragucci-primary'}`}>{d.value}</span>
                </div>
              ))}
            </div>

            {/* Note if present */}
            {activeExplanation.note && (
              <div className="flex items-start gap-2 bg-blue-50 p-2.5 rounded border border-blue-200 text-[11px] text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{activeExplanation.note}</span>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveExplanation(null)}
                className="bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold font-bold py-1.5 px-4 rounded text-xs transition-colors"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: DESGLOSE DE REGALOS & CORTESÍAS */}
      {showGiftModal && (
        <Modal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          title="🎁 Desglose de Inversión en Regalos & Cortesías a Clientes"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Listado de prendas entregadas como cortesía o regalo a clientes VIP en el período seleccionado. Muestra los costos reales asumidos por la sastrería (telas, talleres, camiseros, etc.).
            </p>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 flex justify-between items-center text-xs">
              <span className="font-extrabold text-purple-950">Inversión Total en Regalos ({giftList.length} prendas):</span>
              <span className="text-base font-black text-purple-900">${formatMoney(totalGiftInversion)}</span>
            </div>

            {giftList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">No hay prendas registradas como regalo o cortesía en el período seleccionado.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-900 text-purple-200 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Prenda Entregada</th>
                      <th className="py-2.5 px-3 text-right">Costo Asumido ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {giftList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50">
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{item.client}</td>
                        <td className="py-2.5 px-3 font-extrabold text-purple-950">
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-300">
                            🎁 {item.garmentDesc}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-purple-900 text-right">
                          ${formatMoney(item.costAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowGiftModal(false)}
                className="bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase py-2 px-5 rounded-lg shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
