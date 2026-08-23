import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ProductItem, RTWItem, AviosQuantities } from '../../types';
import { getTodayString, formatMoney, parseMoney } from '../../utils/formatters';
import { ProductBlock } from './ProductBlock';
import { RTWBlock } from './RTWBlock';
import { MoneyInput } from '../common/MoneyInput';
import { Plus, Check, X } from 'lucide-react';

export const OrderForm: React.FC = () => {
  const { orders, config, editingOrderId, setEditingOrderId, saveOrderData, setActiveTab } = useApp();

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
    setProducts([{ description: '', costs: { telas: 0, forreria: 0, sastre: 0, camisero: 0, arreglos: 0 } }]);
    setRtwItems([]);
    setEnvios(0);
    setComisionActive(true);
    setComisionValue(0);
    setAviosQtys({ percha: 0, funda: 0, bolsa: 0, bolsaplastica: 0 });
    setEditingOrderId(null);
  };

  // Client Autocomplete Logic
  const handleClientInput = (val: string) => {
    setClient(val);
    setFocusedClientIdx(-1);
    if (!val.trim()) {
      setShowClientList(false);
      return;
    }

    const uniqueClientsMap = new Map<string, Order>();
    orders.forEach(o => {
      if (o.client && o.client.toLowerCase().includes(val.toLowerCase())) {
        uniqueClientsMap.set(o.client, o);
      }
    });

    const matches = Array.from(uniqueClientsMap.keys());
    setClientAutocomplete(matches);
    setShowClientList(matches.length > 0);
  };

  const selectClient = (clientName: string) => {
    setClient(clientName);
    setShowClientList(false);
    setFocusedClientIdx(-1);
    const lastOrder = orders.find(o => o.client === clientName && (o.phone || o.dni || o.email || o.birthday));
    if (lastOrder) {
      if (lastOrder.phone) setPhone(lastOrder.phone);
      if (lastOrder.dni) setDni(lastOrder.dni);
      if (lastOrder.email) setEmail(lastOrder.email);
      if (lastOrder.birthday) setBirthday(lastOrder.birthday);
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

    const orderPayload: Order = {
      id: existing?.id || Date.now(),
      date,
      deliveryDate: deliveryDate || undefined,
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
      totalCost: totalCostos,
      profit: ganancia
    };

    try {
      await saveOrderData(orderPayload, editingOrderId || undefined);
      alert(editingOrderId ? "Orden actualizada en la nube con éxito." : "Orden guardada en la nube con éxito.");
      resetForm();
      setActiveTab('registro');
    } catch (e) {
      alert("Error al guardar la orden.");
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-ragucci-border">
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
    </div>
  );
};
