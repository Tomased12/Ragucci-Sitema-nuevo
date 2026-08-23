import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
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
  Trophy
} from 'lucide-react';
import { exportBalanceToCSV } from '../../utils/exportCsv';

interface ExplanationModalData {
  title: string;
  formula: string;
  explanation: string;
  details: { label: string; value: string; color?: string }[];
  note?: string;
}

export const BalanceDashboard: React.FC = () => {
  const { orders, config, dolarBlueVenta, saveConfigData } = useApp();

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [activeExplanation, setActiveExplanation] = useState<ExplanationModalData | null>(null);

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

  // Talleres & Confección (M.O + Telas/Forrería) - Excluye Productos Terminados / RTW
  const costoManoDeObraTalleres = costsBreakdown.sastre + costsBreakdown.camisero + costsBreakdown.arreglos;
  const costoTelasYForreria = costsBreakdown.telas + costsBreakdown.forreria;
  const costoTalleresYConfeccion = costoManoDeObraTalleres + costoTelasYForreria;
  
  // Total a Pagar Mensual (Talleres/Confección + Gastos Fijos + Avíos/Envíos) - SIN RTW
  const totalAPagarMesSinRTW = costoTalleresYConfeccion + totalGastosFijosPeriodo + costsBreakdown.envios + costsBreakdown.avios + costsBreakdown.comision + costsBreakdown.otros;

  const costoTotalConFijos = totals.costo + totalGastosFijosPeriodo;
  const gananciaNetaReal = totals.venta - costoTotalConFijos;

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
      title: '👛 Dinero Real Ingresado (Cash Flow)',
      formula: 'Venta Bruta Total - Pendiente a Cobrar',
      explanation: 'Es la liquidez real o flujo de caja efectivo que ya cobraste e ingresó a tu caja/banco durante el período seleccionado (señas + saldos ya pagados).',
      details: [
        { label: 'Venta Bruta Total:', value: `$${formatMoney(totals.venta)}` },
        { label: 'Menos Pendiente de Cobro:', value: `-$${formatMoney(totals.saldoPendiente)}` },
        { label: 'Efectivo / Transferencias Ingresadas:', value: `$${formatMoney(totals.venta - totals.saldoPendiente)}`, color: 'text-sky-600 font-extrabold' }
      ],
      note: 'Es el dinero real disponible en tu mano para hacer frente a los compromisos de talleres y gastos del mes.'
    });
  };

  const showGananciaNetaExplanation = () => {
    setActiveExplanation({
      title: '🏆 Ganancia Neta Real',
      formula: 'Venta Bruta Total - (Costos Directos de Confección/RTW + Gastos Fijos)',
      explanation: 'Es el resultado económico neto y real de la sastrería. Muestra tu beneficio neto descontando de las ventas todos los costos de producción (Santiago sastre, camiseros, modistas, telas, forrería, RTW, envíos, avíos) y la totalidad de tus gastos fijos de estructura (Alquiler en USD convertido a Dólar Blue, expensas, luz/gas, internet, redes y publicidad).',
      details: [
        { label: 'Venta Bruta del Período:', value: `$${formatMoney(totals.venta)}`, color: 'text-emerald-600' },
        { label: 'Menos Costos Directos de Insumos & Talleres:', value: `-$${formatMoney(totals.costo)}`, color: 'text-amber-800' },
        { label: 'Menos Gastos Fijos Mensuales (Alquiler USD + Servicios):', value: `-$${formatMoney(Math.round(totalGastosFijosPeriodo))}`, color: 'text-red-600' },
        { label: 'Resultado Neto Final:', value: `$${formatMoney(Math.round(gananciaNetaReal))}`, color: gananciaNetaReal >= 0 ? 'text-emerald-600 font-extrabold' : 'text-red-500 font-extrabold' }
      ],
      note: 'Si el resultado figura negativo, se debe a que la facturación de las órdenes de ese mes en particular aún no supera el costo fijo de la estructura del local (por ejemplo, el alquiler de USD 1.500 al valor del Dólar Blue).'
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

  const showCompromisoTotalExplanation = () => {
    setActiveExplanation({
      title: '💼 Total a Pagar en el Mes (Compromiso Operativo)',
      formula: 'Talleres (M.O) + Telas/Forrería + Gastos Fijos (Alquiler, Servicios) + Avíos/Envíos',
      explanation: 'Calcula la suma exacta de dinero que necesitas desembolsar este mes para estar al día con talleres, proveedores de telas y costos fijos de local, EXCLUYENDO compras de stock de productos terminados (RTW) que son inversiones futuras.',
      details: [
        { label: 'Mano de Obra & Talleres:', value: `$${formatMoney(costoManoDeObraTalleres)}` },
        { label: 'Telas & Forrería:', value: `$${formatMoney(costoTelasYForreria)}` },
        { label: 'Gastos Fijos Mensuales (Alquiler + Expensas + Serv.):', value: `$${formatMoney(Math.round(totalGastosFijosPeriodo))}` },
        { label: 'Envíos, Avíos y Comisiones:', value: `$${formatMoney(costsBreakdown.envios + costsBreakdown.avios + costsBreakdown.comision + costsBreakdown.otros)}` },
        { label: 'Compromiso Total a Saldar en el Mes:', value: `$${formatMoney(Math.round(totalAPagarMesSinRTW))}`, color: 'text-ragucci-primary font-extrabold' }
      ],
      note: 'Este número te indica exactamente cuánta liquidez necesitas tener para cubrir la operación mensual sin atrasos.'
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div 
          onClick={showVentaExplanation}
          className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex justify-center text-emerald-600 mb-1">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Venta Bruta Total</h4>
          <div className="text-2xl font-extrabold text-emerald-600 font-sans mt-2">${formatMoney(totals.venta)}</div>
          <span className="text-[10px] text-gray-400 block mt-1">Ver fórmula de cálculo ➔</span>
        </div>

        <div 
          onClick={showPendienteExplanation}
          className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-red-400 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-red-400 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex justify-center text-red-500 mb-1">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Pendiente a Cobrar</h4>
          <div className="text-2xl font-extrabold text-red-500 font-sans mt-2">${formatMoney(totals.saldoPendiente)}</div>
          <span className="text-[10px] text-gray-400 block mt-1">Ver fórmula de cálculo ➔</span>
        </div>

        <div 
          onClick={showIngresadoExplanation}
          className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center cursor-pointer hover:border-sky-500 hover:shadow-md transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-gray-300 group-hover:text-sky-500 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex justify-center text-sky-600 mb-1">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Dinero Real Ingresado</h4>
          <div className="text-2xl font-extrabold text-sky-600 font-sans mt-2">${formatMoney(totals.venta - totals.saldoPendiente)}</div>
          <span className="text-[10px] text-gray-400 block mt-1">Ver fórmula de cálculo ➔</span>
        </div>

        <div 
          onClick={showGananciaNetaExplanation}
          className="bg-ragucci-primary text-ragucci-gold p-5 border-b-4 border-ragucci-gold rounded-lg shadow-md text-center cursor-pointer hover:bg-ragucci-primary-light hover:shadow-lg transition-all group relative"
        >
          <div className="absolute top-2 right-2 text-ragucci-gold/40 group-hover:text-ragucci-gold transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex justify-center text-ragucci-gold mb-1">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-gold-light tracking-wider">Ganancia Neta Real</h4>
          <div className="text-2xl font-extrabold text-ragucci-gold font-sans mt-2">${formatMoney(Math.round(gananciaNetaReal))}</div>
          <span className="text-[10px] text-ragucci-gold-light/60 block mt-1">Ver fórmula de cálculo ➔</span>
        </div>
      </div>

      {/* Subdivisión: Egresos Operativos Mensuales (M.O, Talleres y Telas - Sin RTW) */}
      <div className="border border-ragucci-gold-light bg-[#fffdfa] p-5 rounded-lg mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-2 mb-3">
          <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary tracking-wide flex items-center gap-2">
            <Scissors className="w-4 h-4 text-ragucci-gold" />
            <span>Compromisos de Confección, Talleres y Gastos Mensuales</span>
          </h3>
          <span className="text-[11px] bg-ragucci-primary text-ragucci-gold px-2.5 py-0.5 rounded font-bold">
            Excluye Recompra RTW / Stock
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Calcula exactamente el dinero necesario para cubrir la <strong>mano de obra de talleres</strong> (Santiago sastre, Diego y Guillermo camiseros, modistas), <strong>telas a medida</strong> y <strong>gastos fijos</strong> del período, sin incluir la recompra futura de productos terminados (RTW).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div 
            onClick={showTalleresExplanation}
            className="bg-white p-4 border border-ragucci-gold-light rounded shadow-sm text-center cursor-pointer hover:border-ragucci-gold hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">1. Talleres & Mano de Obra</h4>
            <p className="text-[10px] text-gray-500">Santiago + Camiseros + Modistas</p>
            <div className="text-xl font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoManoDeObraTalleres)}
            </div>
            <span className="text-[9px] text-ragucci-gold block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showTelasExplanation}
            className="bg-white p-4 border border-ragucci-gold-light rounded shadow-sm text-center cursor-pointer hover:border-ragucci-gold hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">2. Telas & Forrería (A Medida)</h4>
            <p className="text-[10px] text-gray-500">Insumos directos de confección</p>
            <div className="text-xl font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoTelasYForreria)}
            </div>
            <span className="text-[9px] text-ragucci-gold block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showCompromisoTotalExplanation}
            className="bg-white p-4 border border-amber-300 bg-amber-50/50 rounded shadow-sm text-center cursor-pointer hover:border-amber-500 hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-amber-900">3. Subtotal Confección & Insumos</h4>
            <p className="text-[10px] text-amber-700">M.O. + Telas + Forrería</p>
            <div className="text-xl font-extrabold text-amber-900 font-sans mt-1">
              ${formatMoney(costoTalleresYConfeccion)}
            </div>
            <span className="text-[9px] text-amber-800 block mt-1">Clic para detalle ➔</span>
          </div>

          <div 
            onClick={showCompromisoTotalExplanation}
            className="bg-ragucci-primary text-white p-4 rounded shadow-sm text-center border-l-4 border-l-ragucci-gold cursor-pointer hover:bg-ragucci-primary-light hover:shadow transition-all"
          >
            <h4 className="text-[11px] uppercase font-bold text-ragucci-gold tracking-wider">Total a Pagar en el Mes</h4>
            <p className="text-[10px] text-ragucci-gold-light">Talleres + Telas + Gastos Fijos</p>
            <div className="text-xl font-extrabold text-ragucci-gold font-sans mt-1">
              ${formatMoney(Math.round(totalAPagarMesSinRTW))}
            </div>
            <span className="text-[9px] text-ragucci-gold-light/70 block mt-1">Clic para detalle ➔</span>
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
    </div>
  );
};
