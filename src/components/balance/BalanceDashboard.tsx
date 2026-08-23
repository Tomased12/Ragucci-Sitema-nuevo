import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import { MoneyInput } from '../common/MoneyInput';
import { RefreshCw, Save, TrendingUp, Wallet, ArrowDownRight, Award, Scissors, ShoppingBag } from 'lucide-react';

export const BalanceDashboard: React.FC = () => {
  const { orders, config, dolarBlueVenta, saveConfigData } = useApp();

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Fixed Costs Local Form State
  const [alquilerUsd, setAlquilerUsd] = useState(config.gasto_alquiler_usd !== undefined ? config.gasto_alquiler_usd : 1500);
  const [expensas, setExpensas] = useState(config.gasto_expensas || 0);
  const [internet, setInternet] = useState(config.gasto_internet || 0);
  const [servicios, setServicios] = useState(config.gasto_servicios || 0);
  const [redes, setRedes] = useState(config.gasto_redes || 0);
  const [publicidad, setPublicidad] = useState(config.gasto_publicidad || 0);

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    const matchYear = d.getFullYear().toString() === filterYear;
    const matchMonth = filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;
    return matchYear && matchMonth;
  });

  const alquilerPesos = alquilerUsd * dolarBlueVenta;
  const gastosFijosPesos = expensas + internet + servicios + redes + publicidad;
  const totalGastosFijosPeriodo = (alquilerPesos + gastosFijosPesos) * (filterMonth === 'all' ? 12 : 1);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Balance de Rentabilidad Financiera
      </h2>

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
          className="bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>💾 Guardar Gastos Fijos</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center">
          <div className="flex justify-center text-emerald-600 mb-1">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Venta Bruta Total</h4>
          <div className="text-2xl font-extrabold text-emerald-600 font-sans mt-2">${formatMoney(totals.venta)}</div>
        </div>

        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center">
          <div className="flex justify-center text-red-500 mb-1">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Pendiente a Cobrar</h4>
          <div className="text-2xl font-extrabold text-red-500 font-sans mt-2">${formatMoney(totals.saldoPendiente)}</div>
        </div>

        <div className="bg-white p-5 border border-ragucci-gold-light rounded-lg shadow-sm text-center">
          <div className="flex justify-center text-sky-600 mb-1">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-primary-light tracking-wider">Dinero Real Ingresado</h4>
          <div className="text-2xl font-extrabold text-sky-600 font-sans mt-2">${formatMoney(totals.venta - totals.saldoPendiente)}</div>
        </div>

        <div className="bg-ragucci-primary text-ragucci-gold p-5 border-b-4 border-ragucci-gold rounded-lg shadow-md text-center">
          <div className="flex justify-center text-ragucci-gold mb-1">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-xs uppercase font-extrabold text-ragucci-gold-light tracking-wider">Ganancia Neta Real</h4>
          <div className="text-2xl font-extrabold text-ragucci-gold font-sans mt-2">${formatMoney(Math.round(gananciaNetaReal))}</div>
        </div>
      </div>

      {/* Nueva Subdivisión: Egresos Operativos Mensuales (M.O, Talleres y Telas - Sin RTW) */}
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
          <div className="bg-white p-4 border border-ragucci-gold-light rounded shadow-sm text-center">
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">1. Talleres & Mano de Obra</h4>
            <p className="text-[10px] text-gray-500">Santiago + Camiseros + Modistas</p>
            <div className="text-xl font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoManoDeObraTalleres)}
            </div>
          </div>

          <div className="bg-white p-4 border border-ragucci-gold-light rounded shadow-sm text-center">
            <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">2. Telas & Forrería (A Medida)</h4>
            <p className="text-[10px] text-gray-500">Insumos directos de confección</p>
            <div className="text-xl font-extrabold text-ragucci-primary font-sans mt-1">
              ${formatMoney(costoTelasYForreria)}
            </div>
          </div>

          <div className="bg-white p-4 border border-amber-300 bg-amber-50/50 rounded shadow-sm text-center">
            <h4 className="text-[11px] uppercase font-bold text-amber-900">3. Subtotal Confección & Insumos</h4>
            <p className="text-[10px] text-amber-700">M.O. + Telas + Forrería</p>
            <div className="text-xl font-extrabold text-amber-900 font-sans mt-1">
              ${formatMoney(costoTalleresYConfeccion)}
            </div>
          </div>

          <div className="bg-ragucci-primary text-white p-4 rounded shadow-sm text-center border-l-4 border-l-ragucci-gold">
            <h4 className="text-[11px] uppercase font-bold text-ragucci-gold tracking-wider">Total a Pagar en el Mes</h4>
            <p className="text-[10px] text-ragucci-gold-light">Talleres + Telas + Gastos Fijos</p>
            <div className="text-xl font-extrabold text-ragucci-gold font-sans mt-1">
              ${formatMoney(Math.round(totalAPagarMesSinRTW))}
            </div>
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
              <td className="p-2.5">🏠 GASTOS FIJOS (Alquiler + Expensas + Serv. + Redes)</td>
              <td className="p-2.5 text-right">${formatMoney(Math.round(totalGastosFijosPeriodo))}</td>
            </tr>
            <tr className="bg-ragucci-primary text-ragucci-gold font-extrabold text-sm">
              <td className="p-3">TOTAL INVERTIDO EN COSTOS</td>
              <td className="p-3 text-right">${formatMoney(Math.round(costoTotalConFijos))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
