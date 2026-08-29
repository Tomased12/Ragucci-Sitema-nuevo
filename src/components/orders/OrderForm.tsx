import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ProductItem, RTWItem, AviosQuantities, ClientMeasurements } from '../../types';
import { getTodayString, formatMoney, parseMoney } from '../../utils/formatters';
import { ProductBlock } from './ProductBlock';
import { RTWBlock } from './RTWBlock';
import { MoneyInput } from '../common/MoneyInput';
import { InteractiveMeasuresSheet } from '../common/InteractiveMeasuresSheet';
import { Plus, Check, X, Ruler, DollarSign } from 'lucide-react';

export const OrderForm: React.FC = () => {
  const { orders, config, stockItems, saveStockItemData, editingOrderId, setEditingOrderId, saveOrderData, setActiveTab } = useApp();

  const [date, setDate] = useState(getTodayString());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');

  const [sale, setSale] = useState(0);
  const [method, setMethod] = useState('Transferencia');
  const [sena, setSena] = useState(0);
  const [origin, setOrigin] = useState('Local (A Medida)');
  const [status, setStatus] = useState('🔴 Pendiente');

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rtwItems, setRtwItems] = useState<RTWItem[]>([]);

  const [envios, setEnvios] = useState(0);
  const [comisionActive, setComisionActive] = useState(true);
  const [comisionValue, setComisionValue] = useState(0);

  const [aviosQtys, setAviosQtys] = useState<AviosQuantities>({
    percha: 0,
    funda: 0,
    bolsa: 0,
    bolsaplastica: 0
  });

  const [clientAutocomplete, setClientAutocomplete] = useState<string[]>([]);
  const [showClientList, setShowClientList] = useState(false);
  const [focusedClientIdx, setFocusedClientIdx] = useState<number>(-1);
  const dropdownListRef = React.useRef<HTMLDivElement | null>(null);

  // Measurements State
  const [measurements, setMeasurements] = useState<ClientMeasurements>({});
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Fast Cobranza Mode State
  const [formMode, setFormMode] = useState<'nueva_orden' | 'cobranza'>('nueva_orden');
  const [cobranzaOrderId, setCobranzaOrderId] = useState('');
  const [cobranzaAmount, setCobranzaAmount] = useState(0);
  const [cobranzaMethod, setCobranzaMethod] = useState('Transferencia');
  const [cobranzaDate, setCobranzaDate] = useState(getTodayString());

  const pendingOrders = orders.filter(o => (o.saldo || 0) > 0);

  const handleSelectCobranzaOrder = (orderId: string) => {
    setCobranzaOrderId(orderId);
    const targetOrder = orders.find(o => o.firestoreId === orderId || o.id?.toString() === orderId);
    if (targetOrder) {
      setCobranzaAmount(targetOrder.saldo || 0);
    }
  };

  const handleSaveCobranza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cobranzaOrderId) {
      alert("Por favor selecciona un cliente u orden con saldo pendiente.");
      return;
    }
    if (cobranzaAmount <= 0) {
      alert("Por favor ingresa un monto válido a cobrar.");
      return;
    }

    const targetOrder = orders.find(o => o.firestoreId === cobranzaOrderId || o.id?.toString() === cobranzaOrderId);
    if (!targetOrder) {
      alert("No se encontró la orden del cliente.");
      return;
    }

    const newSena = (targetOrder.sena || 0) + cobranzaAmount;
    const newSaldo = Math.max(0, (targetOrder.sale || 0) - newSena);
    const newPaymentHistory = [
      ...(targetOrder.paymentHistory || []),
      { date: cobranzaDate, amount: cobranzaAmount, method: cobranzaMethod }
    ];

    const newStatus = newSaldo <= 0 ? '🟢 Entregado' : targetOrder.status;

    const updatedOrderPayload: Order = {
      ...targetOrder,
      sena: newSena,
      saldo: newSaldo,
      paymentHistory: newPaymentHistory,
      status: newStatus
    };

    try {
      await saveOrderData(updatedOrderPayload, targetOrder.firestoreId);
      alert(`✅ Cobranza de $${formatMoney(cobranzaAmount)} a ${targetOrder.client} registrada con éxito.`);
      setCobranzaOrderId('');
      setCobranzaAmount(0);
      setFormMode('nueva_orden');
    } catch (e) {
      alert("Error al registrar la cobranza.");
    }
  };

  // Auto scroll predictive client list when navigating with arrow keys
  useEffect(() => {
    if (focusedClientIdx >= 0 && dropdownListRef.current) {
      const listEl = dropdownListRef.current;
      const selectedEl = listEl.children[focusedClientIdx] as HTMLElement;
      if (selectedEl) {
        const elTop = selectedEl.offsetTop;
        const elBottom = elTop + selectedEl.offsetHeight;
        const containerTop = listEl.scrollTop;
        const containerBottom = containerTop + listEl.offsetHeight;

        if (elBottom > containerBottom) {
          listEl.scrollTop = elBottom - listEl.offsetHeight;
        } else if (elTop < containerTop) {
          listEl.scrollTop = elTop;
        }
      }
    }
  }, [focusedClientIdx]);

  // Load order data if editing
  useEffect(() => {
    if (editingOrderId) {
      const order = orders.find(o => o.firestoreId === editingOrderId);
      if (order) {
        setDate(order.date || getTodayString());
        setDeliveryDate(order.deliveryDate || '');
        setClient(order.client || '');
        setPhone(order.phone || '');
        setDni(order.dni || '');
        setEmail(order.email || '');
        setBirthday(order.birthday || '');
        setSale(order.sale || 0);
        setMethod(order.method || 'Transferencia');
        setSena(order.sena || 0);
        setOrigin(order.origin || 'Local (A Medida)');
        setStatus(order.status || '🔴 Pendiente');
        setProducts(order.products || []);
        setRtwItems(order.rtwItems || []);
        setEnvios(order.costs?.envios || 0);

        if (order.measurements) {
          setMeasurements(order.measurements);
          setShowMeasurements(true);
        } else {
          setMeasurements({});
        }

        const comVal = order.costs?.comision || 0;
        setComisionValue(comVal);
        setComisionActive(comVal > 0 && Math.abs(comVal - (order.sale * 0.10)) <= 1);

        if (order.aviosQtys) {
          setAviosQtys(order.aviosQtys);
        }
      }
    } else {
      resetForm();
    }
  }, [editingOrderId, orders]);

  // Recalculate Tomy's commission if active
  useEffect(() => {
    if (comisionActive) {
      setComisionValue(sale * 0.10);
    }
  }, [sale, comisionActive]);

  const resetForm = () => {
    setDate(getTodayString());
    setDeliveryDate('');
    setClient('');
    setPhone('');
    setDni('');
    setEmail('');
    setBirthday('');
    setSale(0);
    setMethod('Transferencia');
    setSena(0);
    setOrigin('Local (A Medida)');
    setStatus('🔴 Pendiente');
    setProducts([]);
    setRtwItems([]);
    setEnvios(0);
    setComisionActive(true);
    setComisionValue(0);
    setMeasurements({});
    setShowMeasurements(false);
    setAviosQtys({ percha: 0, funda: 0, bolsa: 0, bolsaplastica: 0 });
    setEditingOrderId(null);
  };

  // Client Autocomplete Logic
  const handleClientInput = (val: string) => {
    setClient(val);
    if (!val.trim()) {
      setClientAutocomplete([]);
      setShowClientList(false);
      return;
    }
    const uniqueClients = Array.from(new Set(orders.map(o => o.client).filter(Boolean)));
    const matches = uniqueClients.filter(cName => cName.toLowerCase().includes(val.toLowerCase()));
    setClientAutocomplete(matches);
    setShowClientList(matches.length > 0);
    setFocusedClientIdx(-1);
  };

  const selectClient = (clientName: string) => {
    setClient(clientName);
    setShowClientList(false);
    setFocusedClientIdx(-1);
    const lastOrder = orders.find(o => o.client === clientName && (o.phone || o.dni || o.email || o.birthday || o.measurements));
    if (lastOrder) {
      if (lastOrder.phone) setPhone(lastOrder.phone);
      if (lastOrder.dni) setDni(lastOrder.dni);
      if (lastOrder.email) setEmail(lastOrder.email);
      if (lastOrder.birthday) setBirthday(lastOrder.birthday);
      if (lastOrder.measurements) {
        setMeasurements(lastOrder.measurements);
        setShowMeasurements(true);
      }
    }
  };

  const handleClientKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showClientList || clientAutocomplete.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedClientIdx(prev => (prev < clientAutocomplete.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedClientIdx(prev => (prev > 0 ? prev - 1 : clientAutocomplete.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedClientIdx >= 0 && clientAutocomplete[focusedClientIdx]) {
        e.preventDefault();
        selectClient(clientAutocomplete[focusedClientIdx]);
      }
    }
  };

  // Calculations
  const calcAviosTotal = () => {
    const prices = config.aviosPrecios || {};
    return (
      (aviosQtys.percha * (prices.percha || 0)) +
      (aviosQtys.funda * (prices.funda || 0)) +
      (aviosQtys.bolsa * (prices.bolsa || 0)) +
      (aviosQtys.bolsaplastica * (prices.bolsaplastica || 0))
    );
  };

  const calcTotalRTW = () => {
    return rtwItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };

  const calcProductsTotalCosts = () => {
    return products.reduce((acc, p) => {
      const c = p.costs || {};
      return acc + (c.telas || 0) + (c.forreria || 0) + (c.sastre || 0) + (c.camisero || 0) + (c.arreglos || 0) + (c.otros || 0);
    }, 0);
  };

  const totalCostos = calcProductsTotalCosts() + calcTotalRTW() + calcAviosTotal() + envios + comisionValue;
  const ganancia = sale - totalCostos;
  const saldo = Math.max(0, sale - sena);
  const margen = sale > 0 ? ((ganancia / sale) * 100).toFixed(1) : '0';

  const handleSaveOrder = async () => {
    if (!client.trim()) {
      alert("Por favor, ingresa el nombre del cliente.");
      return;
    }
    if (sale === 0) {
      alert("Por favor, ingresa el precio de venta total.");
      return;
    }
    if (products.length === 0 && rtwItems.length === 0) {
      alert("Debe agregar al menos un producto a la orden.");
      return;
    }

    const aggregatedCosts = {
      telas: products.reduce((acc, p) => acc + (p.costs?.telas || 0), 0),
      forreria: products.reduce((acc, p) => acc + (p.costs?.forreria || 0), 0),
      sastre: products.reduce((acc, p) => acc + (p.costs?.sastre || 0), 0),
      camisero: products.reduce((acc, p) => acc + (p.costs?.camisero || 0), 0),
      arreglos: products.reduce((acc, p) => acc + (p.costs?.arreglos || 0), 0),
      pterminado: calcTotalRTW(),
      envios,
      avios: calcAviosTotal(),
      comision: comisionValue,
      otros: products.reduce((acc, p) => acc + (p.costs?.otros || 0), 0)
    };

    const existing = editingOrderId ? orders.find(o => o.firestoreId === editingOrderId) : null;
    const paidTalleresMap = existing ? (existing.paidTalleresMap || {}) : {};
    const paymentHistory = existing?.paymentHistory || (sena > 0 ? [{ date, amount: sena, method }] : []);

    const cleanMeasurements: Record<string, any> = {};
    if (measurements) {
      Object.entries(measurements).forEach(([k, v]) => {
        if (k === 'profiles' && Array.isArray(v)) {
          cleanMeasurements.profiles = v;
        } else if (typeof v === 'string' && v.trim()) {
          cleanMeasurements[k] = v.trim();
        } else if (v !== undefined && v !== null && typeof v !== 'string') {
          cleanMeasurements[k] = v;
        }
      });
    }

    const orderPayload: Order = {
      id: existing?.id || Date.now(),
      date,
      deliveryDate: deliveryDate ? deliveryDate.trim() : undefined,
      client,
      phone,
      dni,
      email,
      birthday,
      products,
      rtwItems,
      sale,
      method,
      sena,
      saldo: Math.max(0, sale - sena),
      paymentHistory,
      origin,
      status: (sale - sena <= 0) ? '🟢 Entregado' : status,
      costs: aggregatedCosts,
      aviosQtys,
      paidTalleresMap,
      measurements: Object.keys(cleanMeasurements).length > 0 ? cleanMeasurements : undefined,
      totalCost: totalCostos,
      profit: ganancia
    };

    try {
      await saveOrderData(orderPayload, editingOrderId || undefined);

      // Auto-descontar stock de productos RTW al emitir una venta nueva
      if (!editingOrderId) {
        const itemNamesSold: string[] = [];
        if (products && products.length > 0) {
          products.forEach(p => p.description && itemNamesSold.push(p.description));
        }
        if (rtwItems && rtwItems.length > 0) {
          rtwItems.forEach(r => r.desc && itemNamesSold.push(r.desc));
        }

        for (const soldName of itemNamesSold) {
          if (!soldName) continue;
          const cleanSold = soldName.trim().toLowerCase();
          const matchedStock = stockItems.find(s => 
            s.name.toLowerCase().trim() === cleanSold ||
            cleanSold.includes(s.name.toLowerCase().trim()) ||
            s.code.toLowerCase().trim() === cleanSold
          );

          if (matchedStock && matchedStock.quantity > 0) {
            let updatedSizes = matchedStock.sizes && matchedStock.sizes.length > 0 ? [...matchedStock.sizes] : [];
            if (updatedSizes.length > 0) {
              const sizeWithStockIdx = updatedSizes.findIndex(s => s.quantity > 0);
              if (sizeWithStockIdx >= 0) {
                updatedSizes[sizeWithStockIdx].quantity = Math.max(0, updatedSizes[sizeWithStockIdx].quantity - 1);
              }
            }

            const totalQty = updatedSizes.length > 0
              ? updatedSizes.reduce((acc, s) => acc + s.quantity, 0)
              : Math.max(0, matchedStock.quantity - 1);

            const updatedStock = {
              ...matchedStock,
              sizes: updatedSizes,
              quantity: totalQty,
              lastUpdated: getTodayString()
            };
            try {
              await saveStockItemData(updatedStock, matchedStock.firestoreId);
            } catch (err) {
              console.error("Error descontando stock automático:", err);
            }
          }
        }
      }

      alert(editingOrderId ? "Orden actualizada en la nube con éxito." : "Orden guardada en la nube con éxito y stock descontado.");
      resetForm();
      setActiveTab('registro');
    } catch (e) {
      alert("Error al guardar la orden.");
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-ragucci-border">
      {/* Mode Switcher: Nueva Orden vs Registrar Cobranza */}
      <div className="flex rounded-md shadow-sm mb-6 bg-ragucci-bg p-1.5 border border-ragucci-gold-light">
        <button
          type="button"
          onClick={() => setFormMode('nueva_orden')}
          className={`flex-1 py-2.5 px-4 rounded text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            formMode === 'nueva_orden'
              ? 'bg-ragucci-primary text-ragucci-gold shadow-md'
              : 'text-ragucci-primary hover:bg-ragucci-gold-light/20 font-bold'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>📝 Nueva Orden / Venta</span>
        </button>

        <button
          type="button"
          onClick={() => setFormMode('cobranza')}
          className={`flex-1 py-2.5 px-4 rounded text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            formMode === 'cobranza'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-emerald-800 hover:bg-emerald-50 font-bold'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>💰 Cargar Cobranza Rápida de Cliente ({pendingOrders.length} pendientes)</span>
        </button>
      </div>

      {formMode === 'cobranza' ? (
        <form onSubmit={handleSaveCobranza} className="border-2 border-emerald-600/30 p-5 md:p-6 rounded-lg bg-white shadow-sm space-y-5">
          <div className="border-b border-emerald-600/20 pb-2">
            <h3 className="text-base font-extrabold uppercase text-emerald-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700" />
              <span>Cargar Cobranza Rápida a Cliente</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Registra el pago o seña de un cliente existente. El dinero ingresado se descontará automáticamente de su saldo pendiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                1. Seleccionar Cliente / Orden Pendiente *
              </label>
              {pendingOrders.length === 0 ? (
                <div className="p-3 bg-gray-50 text-gray-500 rounded text-xs font-bold border border-gray-200">
                  🎉 No hay clientes con saldo pendiente de pago.
                </div>
              ) : (
                <select
                  value={cobranzaOrderId}
                  onChange={(e) => handleSelectCobranzaOrder(e.target.value)}
                  className="w-full p-2.5 border-2 border-emerald-600/40 rounded text-xs font-extrabold focus:outline-none focus:border-emerald-700 bg-emerald-50/30 cursor-pointer"
                >
                  <option value="">-- Seleccionar cliente con saldo --</option>
                  {pendingOrders.map((pOrder) => (
                    <option key={pOrder.firestoreId || pOrder.id} value={pOrder.firestoreId || pOrder.id}>
                      {pOrder.client} — Saldo Pendiente: ${formatMoney(pOrder.saldo)} (Venta: ${formatMoney(pOrder.sale)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                2. Fecha del Cobro *
              </label>
              <input
                type="date"
                value={cobranzaDate}
                onChange={(e) => setCobranzaDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                3. Monto Ingresado / Pagado por el Cliente ($ ARS) *
              </label>
              <MoneyInput
                value={cobranzaAmount}
                onValueChange={(val) => setCobranzaAmount(val)}
                placeholder="Ej: 50.000"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                4. Medio de Pago *
              </label>
              <select
                value={cobranzaMethod}
                onChange={(e) => setCobranzaMethod(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-emerald-700 cursor-pointer"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo (Caja)</option>
                <option value="MercadoPago">MercadoPago</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Dólares">Dólares (USD)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            {cobranzaOrderId && (() => {
              const selectedOrd = pendingOrders.find(o => o.firestoreId === cobranzaOrderId || o.id?.toString() === cobranzaOrderId);
              if (!selectedOrd) return null;
              const remainingAfterCobro = Math.max(0, (selectedOrd.saldo || 0) - cobranzaAmount);
              return (
                <div className="text-xs font-bold text-gray-700">
                  <span>Saldo actual: </span>
                  <span className="text-red-700 font-extrabold">${formatMoney(selectedOrd.saldo)}</span>
                  <span className="mx-2">➔</span>
                  <span>Nuevo saldo tras cobrar: </span>
                  <span className={remainingAfterCobro === 0 ? "text-emerald-700 font-black" : "text-amber-800 font-extrabold"}>
                    {remainingAfterCobro === 0 ? "🟢 PAGADO COMPLETO ($0)" : `$${formatMoney(remainingAfterCobro)}`}
                  </span>
                </div>
              );
            })()}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setFormMode('nueva_orden')}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-extrabold rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase rounded shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>💾 Registrar y Descontar Cobranza</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          {/* General Detail & Client Section */}
          <div className="border border-ragucci-gold-light p-4 md:p-5 rounded-md mb-6 bg-white">
        <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
          Detalle General de la Orden y Cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative md:col-span-1">
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Cliente (Nombre y Apellido)
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => handleClientInput(e.target.value)}
              onKeyDown={handleClientKeydown}
              placeholder="Ej: Alvarez Esteban"
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            />
            {showClientList && clientAutocomplete.length > 0 && (
              <div 
                ref={dropdownListRef}
                className="absolute top-full left-0 right-0 bg-white border border-ragucci-gold-light z-30 max-h-60 overflow-y-auto rounded-b shadow-xl"
              >
                {clientAutocomplete.map((cName, idx) => (
                  <div
                    key={cName}
                    onClick={() => selectClient(cName)}
                    className={`p-2.5 cursor-pointer text-xs font-bold transition-colors border-b border-gray-100 ${
                      idx === focusedClientIdx
                        ? 'bg-ragucci-primary text-ragucci-gold'
                        : 'hover:bg-ragucci-primary hover:text-ragucci-gold'
                    }`}
                  >
                    {cName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Fecha de Venta
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Fecha Prometida de Entrega <span className="text-[10px] text-ragucci-gold font-normal">(Taller)</span>
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-2.5 border border-amber-300 bg-amber-50/40 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="Ej: 1123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">DNI</label>
            <input
              type="text"
              placeholder="Ej: 30123456"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Mail</label>
            <input
              type="text"
              placeholder="Ej: mail@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Cumpleaños</label>
            <input
              type="text"
              placeholder="Ej: 19/08"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold"
            />
          </div>
        </div>

        {/* Expandable Section: Ficha de medidas */}
        <div className="mb-4 pt-2 border-t border-dashed border-ragucci-gold-light">
          <button
            type="button"
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="flex items-center justify-between w-full text-xs font-extrabold uppercase text-ragucci-primary bg-ragucci-bg hover:bg-ragucci-gold-light/20 p-2.5 rounded border border-ragucci-gold/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-ragucci-gold shrink-0" />
              <span>🧵 Ficha de medidas</span>
            </div>
            <span className="text-ragucci-gold font-bold text-xs bg-ragucci-primary px-2.5 py-1 rounded text-ragucci-gold-light">
              {showMeasurements ? '▲ Ocultar Medidas' : '▼ Cargar / Ver Medidas'}
            </span>
          </button>

          {showMeasurements && (
            <div className="mt-3 p-3.5 bg-[#fffdfa] border border-ragucci-gold-light rounded-xl text-xs space-y-4 shadow-inner">
              <InteractiveMeasuresSheet
                mode="edit"
                measurements={measurements}
                onChangeMeasurements={setMeasurements}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-dashed border-ragucci-gold-light">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Precio de Venta TOTAL ($)
            </label>
            <MoneyInput value={sale} onValueChange={(val) => setSale(val)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Medio de Pago Principal
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta de Crédito</option>
              <option value="Crypto/USD">USDT / Dólares</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 mt-3 border-t border-dashed border-ragucci-gold-light">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Seña / Pagado Acumulado ($)
            </label>
            <MoneyInput
              value={sena}
              onValueChange={(val) => setSena(val)}
              disabled={!!editingOrderId}
            />
            {editingOrderId && (
              <p className="text-[10px] text-ragucci-red font-bold mt-1">
                * Para editar pagos, ve al Registro y usa el botón "+ Pago"
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Canal de Venta
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            >
              <option value="Local (A Medida)">Local (A Medida)</option>
              <option value="Tienda Nube (RTW)">Tienda Nube (RTW)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">
              Estado Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-medium"
            >
              <option value="🔴 Pendiente">🔴 Pendiente de Tela</option>
              <option value="🟡 En Taller">🟡 En Taller</option>
              <option value="🔵 Prueba">🔵 Prueba</option>
              <option value="🟢 Entregado">🟢 Entregado / Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products A Medida Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
          <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary tracking-wide">
            Productos y Costos Específicos (A Medida)
          </h3>
          <span className="text-xs text-ragucci-primary-light italic">
            * Usa flechas ↑ ↓ y Enter para autocompletar.
          </span>
        </div>

        {products.map((p, i) => (
          <ProductBlock
            key={i}
            index={i}
            product={p}
            onChange={(updated) => {
              const newProds = [...products];
              newProds[i] = updated;
              setProducts(newProds);
            }}
            onRemove={() => {
              setProducts(products.filter((_, idx) => idx !== i));
            }}
          />
        ))}

        <button
          type="button"
          onClick={() =>
            setProducts([
              ...products,
              { description: '', costs: { telas: 0, forreria: 0, sastre: 0, camisero: 0, arreglos: 0 } }
            ])
          }
          className="w-full py-2.5 bg-ragucci-primary-light hover:bg-ragucci-primary text-ragucci-gold-light hover:text-ragucci-gold font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Otro Producto a la Orden</span>
        </button>
      </div>

      {/* RTW & Additional Costs */}
      <div className="border border-ragucci-gold-light p-4 md:p-5 rounded-md mb-6 bg-white">
        <h3 className="text-sm md:text-base font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
          Productos Terminados / RTW y Costos Adicionales
        </h3>

        {rtwItems.map((item, i) => (
          <RTWBlock
            key={i}
            item={item}
            onChange={(updated) => {
              const newRtw = [...rtwItems];
              newRtw[i] = updated;
              setRtwItems(newRtw);
            }}
            onRemove={() => setRtwItems(rtwItems.filter((_, idx) => idx !== i))}
          />
        ))}

        <button
          type="button"
          onClick={() => setRtwItems([...rtwItems, { desc: '', qty: 1, price: 0 }])}
          className="bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light text-xs font-bold py-2 px-3 rounded transition-colors mb-4 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Producto Terminado / RTW</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-ragucci-gold-light mb-4">
          <div>
            <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Envíos ($)</label>
            <MoneyInput value={envios} onValueChange={(val) => setEnvios(val)} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-ragucci-primary-light">Comisión Tomy ($)</label>
              <label className="flex items-center gap-1 text-[11px] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={comisionActive}
                  onChange={(e) => setComisionActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Activa (10%)
              </label>
            </div>
            <MoneyInput
              value={comisionValue}
              onValueChange={(val) => {
                setComisionValue(val);
                if (sale > 0 && Math.abs(val - (sale * 0.10)) > 1) {
                  setComisionActive(false);
                }
              }}
            />
          </div>
        </div>

        <h4 className="text-xs font-bold uppercase text-ragucci-primary-light border-b border-dashed border-ragucci-gold-light pb-1 mb-3">
          Avíos / Embalaje
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {(['percha', 'funda', 'bolsa', 'bolsaplastica'] as const).map((key) => {
            const unitPrice = config.aviosPrecios?.[key] || 0;
            const subtotal = aviosQtys[key] * unitPrice;
            const labelMap = { percha: 'Percha', funda: 'Funda', bolsa: 'Bolsa', bolsaplastica: 'Bolsa Plástica' };

            return (
              <div key={key}>
                <label className="block font-bold text-ragucci-primary-light mb-1 capitalize">
                  {labelMap[key]} (Cant / Subtotal)
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    value={aviosQtys[key]}
                    onChange={(e) =>
                      setAviosQtys({ ...aviosQtys, [key]: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-16 p-2 border border-gray-300 rounded text-center font-bold"
                  />
                  <div className="flex-1 p-2 bg-gray-100 border border-gray-300 rounded text-right font-bold text-ragucci-primary">
                    ${subtotal.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Calculator Panel */}
      <div className="bg-ragucci-primary text-ragucci-gold-light p-4 md:p-5 rounded-lg text-right border-l-8 border-ragucci-gold shadow-lg mb-6">
        <div className="text-sm md:text-lg font-medium mb-1">
          Venta Total: <strong className="text-white">${formatMoney(sale)}</strong> &nbsp;|&nbsp; Ingresado: <strong className="text-emerald-400">${formatMoney(sena)}</strong>
        </div>
        <div className="text-red-400 font-extrabold text-lg md:text-2xl my-2">
          SALDO A COBRAR: ${formatMoney(saldo)}
        </div>
        <div className="text-ragucci-gold-light text-xs md:text-sm">
          Costos de Confección: -${formatMoney(totalCostos)}
        </div>
        <div className="text-ragucci-gold font-extrabold text-xl md:text-3xl mt-2 font-sans tracking-tight">
          Ganancia Teórica: ${formatMoney(ganancia)} ({margen}%)
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSaveOrder}
          className="flex-1 bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-sm md:text-base py-3 px-6 rounded uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-5 h-5" />
          <span>{editingOrderId ? 'Actualizar Orden' : 'Guardar Orden Nueva'}</span>
        </button>

        {editingOrderId && (
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold text-sm py-3 px-6 rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span>Cancelar Edición</span>
          </button>
        )}
      </div>
    </>
  )}
</div>
  );
};
