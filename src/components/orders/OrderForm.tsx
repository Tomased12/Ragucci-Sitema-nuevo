import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ProductItem, RTWItem, AviosQuantities, ClientMeasurements } from '../../types';
import { getTodayString, formatMoney, parseMoney, isCardPaymentMethod, formatDate } from '../../utils/formatters';
import { ProductBlock } from './ProductBlock';
import { RTWBlock } from './RTWBlock';
import { MoneyInput } from '../common/MoneyInput';
import { InteractiveMeasuresSheet } from '../common/InteractiveMeasuresSheet';
import { Plus, Check, X, Ruler, DollarSign, FileText, History } from 'lucide-react';

export const OrderForm: React.FC = () => {
  const { orders, config, stockItems, saveStockItemData, editingOrderId, setEditingOrderId, saveOrderData, setActiveTab, dolarBlueVenta } = useApp();

  const [date, setDate] = useState(getTodayString());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showClientHistory, setShowClientHistory] = useState(false);

  const [sale, setSale] = useState(0);
  const [method, setMethod] = useState('Transferencia');
  const [sena, setSena] = useState(0);
  const [origin, setOrigin] = useState('Local (A Medida)');
  const [status, setStatus] = useState('🔴 Pendiente');
  const [hasInvoice, setHasInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState('');

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rtwItems, setRtwItems] = useState<RTWItem[]>([]);

  const [envios, setEnvios] = useState(0);
  const [comisionActive, setComisionActive] = useState(true);
  const [comisionValue, setComisionValue] = useState(0);

  const [aviosQtys, setAviosQtys] = useState<AviosQuantities>({
    percha: 0,
    funda: 0,
    bolsa: 0,
    bolsaplastica: 0,
    bolsa_ecom_chica: 0,
    bolsa_ecom_grande: 0
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
    const isCard = isCardPaymentMethod(cobranzaMethod);
    const newPaymentHistory = [
      ...(targetOrder.paymentHistory || []),
      { date: cobranzaDate, amount: cobranzaAmount, method: cobranzaMethod, acreditado: !isCard }
    ];

    const newStatus = newSaldo <= 0 ? '🟢 Entregado' : targetOrder.status;

    const updatedOrderPayload: Order = {
      ...targetOrder,
      sena: newSena,
      saldo: newSaldo,
      paymentHistory: newPaymentHistory,
      acreditado: isCard ? false : targetOrder.acreditado,
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
        setClient((order.client || '').toUpperCase());
        setPhone(order.phone || '');
        setDni(order.dni || '');
        setEmail(order.email || '');
        setBirthday(order.birthday || '');
        setSale(order.sale || 0);
        setMethod(order.method || 'Transferencia');
        setSena(order.sena || 0);
        setOrigin(order.origin || 'Local (A Medida)');
        setStatus(order.status || '🔴 Pendiente');
        const sanitizedProds = (order.products || []).map(p => {
          const isCerutti = p.catalogoTela === 'Cerutti S130' || !!p.ceruttiCalc;
          const isReda = p.catalogoTela === 'REDA' || !!p.redaCalc;
          let pCosts = p.costs;
          let pCerutti = p.ceruttiCalc;
          let pReda = p.redaCalc;

          if (isCerutti && p.costs?.telas > 0 && p.costs.telas < 5000) {
            const dBlue = p.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
            const totUSD = p.ceruttiCalc?.totalUSD || p.costs.telas;
            const totARS = Math.round(totUSD * dBlue);
            pCerutti = {
              ...(p.ceruttiCalc || {}),
              totalUSD: totUSD,
              dolarBlue: dBlue,
              totalARS: totARS
            };
            pCosts = {
              ...p.costs,
              telas: totARS
            };
          } else if (isReda && p.costs?.telas > 0 && p.costs.telas < 5000) {
            const dRate = p.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
            const totUSD = p.redaCalc?.subtotalUSD || p.costs.telas;
            const subARS = Math.round(totUSD * dRate);
            const totARS = Number((subARS * 1.105).toFixed(2));
            pReda = {
              ...(p.redaCalc || {}),
              subtotalUSD: totUSD,
              dolarRate: dRate,
              subtotalARS: subARS,
              totalARS: totARS
            };
            pCosts = {
              ...p.costs,
              telas: totARS
            };
          }

          return {
            ...p,
            price: p.price || 0,
            status: p.status || order.status || '🔴 Pendiente',
            costs: pCosts,
            ceruttiCalc: pCerutti,
            redaCalc: pReda
          };
        });
        setProducts(sanitizedProds);
        setRtwItems((order.rtwItems || []).map(r => ({
          ...r,
          price: r.price || 0,
          salePrice: r.salePrice !== undefined ? r.salePrice : r.price,
          costPrice: r.costPrice !== undefined ? r.costPrice : r.price
        })));
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

        const orderHasInvoice = Boolean(order.hasInvoice || order.invoiceNumber);
        setHasInvoice(orderHasInvoice);
        setInvoiceNumber(order.invoiceNumber || '');
        setInvoiceDetails(order.invoiceDetails || '');
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
    setHasInvoice(false);
    setInvoiceNumber('');
    setInvoiceDetails('');
    setProducts([]);
    setRtwItems([]);
    setEnvios(0);
    setComisionActive(true);
    setComisionValue(0);
    setMeasurements({});
    setShowMeasurements(false);
    setAviosQtys({ percha: 0, funda: 0, bolsa: 0, bolsaplastica: 0, bolsa_ecom_chica: 0, bolsa_ecom_grande: 0 });
    setEditingOrderId(null);
  };

  // Client Autocomplete Logic
  const handleClientInput = (val: string) => {
    const upperVal = val.toUpperCase();
    setClient(upperVal);
    if (!upperVal.trim()) {
      setClientAutocomplete([]);
      setShowClientList(false);
      return;
    }
    const uniqueClients = Array.from(new Set(orders.map(o => o.client?.toUpperCase()).filter(Boolean) as string[]));
    const matches = uniqueClients.filter(cName => cName.includes(upperVal));
    setClientAutocomplete(matches);
    setShowClientList(matches.length > 0);
    setFocusedClientIdx(-1);
  };

  const selectClient = (clientName: string) => {
    const upperName = clientName.toUpperCase();
    setClient(upperName);
    setShowClientList(false);
    setFocusedClientIdx(-1);
    const lastOrder = orders.find(o => o.client?.toUpperCase() === upperName && (o.phone || o.dni || o.email || o.birthday || o.measurements));
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
      ((aviosQtys.percha || 0) * (prices.percha || 0)) +
      ((aviosQtys.funda || 0) * (prices.funda || 0)) +
      ((aviosQtys.bolsa || 0) * (prices.bolsa || 0)) +
      ((aviosQtys.bolsaplastica || 0) * (prices.bolsaplastica || 0)) +
      ((aviosQtys.bolsa_ecom_chica || 0) * (prices.bolsa_ecom_chica || 0)) +
      ((aviosQtys.bolsa_ecom_grande || 0) * (prices.bolsa_ecom_grande || 0))
    );
  };

  const calcTotalRTW = () => {
    return rtwItems.reduce((acc, item) => {
      const unitCost = item.costPrice !== undefined ? item.costPrice : (item.price || 0);
      return acc + (item.qty * unitCost);
    }, 0);
  };

  const calcTotalItemsSale = () => {
    const prodsTotal = products.reduce((acc, p) => acc + (p.isGift ? 0 : (p.price || 0)), 0);
    const rtwTotal = rtwItems.reduce((acc, r) => {
      if (r.isGift) return acc;
      const sPrice = r.salePrice !== undefined ? r.salePrice : r.price;
      return acc + (sPrice * (r.qty || 1));
    }, 0);
    return prodsTotal + rtwTotal;
  };

  const clientPastOrders = useMemo(() => {
    if (!client || !client.trim()) return [];
    const upper = client.trim().toUpperCase();
    return orders
      .filter(o => o.client?.toUpperCase() === upper)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client, orders]);

  const calcProductsTotalCosts = () => {
    return products.reduce((acc, p) => {
      const c = p.costs || {};
      let telaCost = c.telas || 0;
      if ((p.catalogoTela === 'Cerutti S130' || p.ceruttiCalc) && telaCost > 0 && telaCost < 5000) {
        const dBlue = p.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
        const totUSD = p.ceruttiCalc?.totalUSD || telaCost;
        telaCost = Math.round(totUSD * dBlue);
      } else if ((p.catalogoTela === 'REDA' || p.redaCalc) && telaCost > 0 && telaCost < 5000) {
        const dRate = p.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
        const totUSD = p.redaCalc?.subtotalUSD || telaCost;
        const subARS = Math.round(totUSD * dRate);
        telaCost = Number((subARS * 1.105).toFixed(2));
      }
      return acc + (c.noTelas ? 0 : telaCost) + (c.noForreria ? 0 : (c.forreria || 0)) + (c.sastre || 0) + (c.camisero || 0) + (c.noArreglos ? 0 : (c.arreglos || 0)) + (c.otros || 0);
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
      telas: products.reduce((acc, p) => {
        if (p.costs?.noTelas) return acc;
        let telaCost = p.costs?.telas || 0;
        if ((p.catalogoTela === 'Cerutti S130' || p.ceruttiCalc) && telaCost > 0 && telaCost < 5000) {
          const dBlue = p.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
          const totUSD = p.ceruttiCalc?.totalUSD || telaCost;
          telaCost = Math.round(totUSD * dBlue);
        } else if ((p.catalogoTela === 'REDA' || p.redaCalc) && telaCost > 0 && telaCost < 5000) {
          const dRate = p.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
          const totUSD = p.redaCalc?.subtotalUSD || telaCost;
          const subARS = Math.round(totUSD * dRate);
          telaCost = Number((subARS * 1.105).toFixed(2));
        }
        return acc + telaCost;
      }, 0),
      forreria: products.reduce((acc, p) => acc + (p.costs?.noForreria ? 0 : (p.costs?.forreria || 0)), 0),
      sastre: products.reduce((acc, p) => acc + (p.costs?.sastre || 0), 0),
      camisero: products.reduce((acc, p) => acc + (p.costs?.camisero || 0), 0),
      arreglos: products.reduce((acc, p) => acc + (p.costs?.noArreglos ? 0 : (p.costs?.arreglos || 0)), 0),
      pterminado: calcTotalRTW(),
      envios,
      avios: calcAviosTotal(),
      comision: comisionValue,
      otros: products.reduce((acc, p) => acc + (p.costs?.otros || 0), 0)
    };

    const existing = editingOrderId ? orders.find(o => o.firestoreId === editingOrderId) : null;
    const paidTalleresMap = existing ? (existing.paidTalleresMap || {}) : {};
    const isCard = isCardPaymentMethod(method);
    const paymentHistory = existing?.paymentHistory || (sena > 0 ? [{ 
      date, 
      amount: sena, 
      method, 
      acreditado: !isCard 
    }] : []);

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

    const isArregloProd = (p: any) => {
      const desc = (p.description || '').toUpperCase();
      return desc.includes('ARREGLO') || (Boolean(p.costs?.arreglos && p.costs.arreglos > 0) && !p.costs?.sastre && !p.costs?.camisero && !p.costs?.telas);
    };

    const isRTWProd = (p: any) => {
      const desc = (p.description || '').toUpperCase();
      return desc.includes('RTW') || desc.includes('TERMINADO');
    };

    const hasMedidaGarments = products.some(p => {
      const d = (p.description || '').toUpperCase();
      return !d.includes('ARREGLO') && !d.includes('RTW') && !d.includes('TERMINADO') && ((p.costs?.sastre ?? 0) > 0 || (p.costs?.camisero ?? 0) > 0 || (p.costs?.telas ?? 0) > 0);
    });

    const isOrderArreglo = (origin && origin.toLowerCase().includes('arreglo')) ||
                           (!hasMedidaGarments && products.length > 0 && products.some(p => isArregloProd(p)));

    const sanitizedProducts = products.map(p => {
      let updatedCosts = { ...p.costs };
      let updatedCeruttiCalc = p.ceruttiCalc;
      let updatedRedaCalc = p.redaCalc;

      if ((p.catalogoTela === 'Cerutti S130' || p.ceruttiCalc) && updatedCosts.telas > 0 && updatedCosts.telas < 5000) {
        const dBlue = p.ceruttiCalc?.dolarBlue || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1350);
        const totUSD = p.ceruttiCalc?.totalUSD || updatedCosts.telas;
        const totARS = Math.round(totUSD * dBlue);
        updatedCosts.telas = totARS;
        updatedCeruttiCalc = {
          ...(p.ceruttiCalc || {}),
          totalUSD: totUSD,
          dolarBlue: dBlue,
          totalARS: totARS
        };
      } else if ((p.catalogoTela === 'REDA' || p.redaCalc) && updatedCosts.telas > 0 && updatedCosts.telas < 5000) {
        const dRate = p.redaCalc?.dolarRate || (dolarBlueVenta ? Math.round(dolarBlueVenta) : 1560);
        const totUSD = p.redaCalc?.subtotalUSD || updatedCosts.telas;
        const subARS = Math.round(totUSD * dRate);
        const totARS = Number((subARS * 1.105).toFixed(2));
        updatedCosts.telas = totARS;
        updatedRedaCalc = {
          ...(p.redaCalc || {}),
          subtotalUSD: totUSD,
          dolarRate: dRate,
          subtotalARS: subARS,
          totalARS: totARS
        };
      }

      const isThisArr = isArregloProd(p);
      return {
        ...p,
        price: p.isGift ? 0 : (p.price || 0),
        costs: updatedCosts,
        ceruttiCalc: updatedCeruttiCalc,
        redaCalc: updatedRedaCalc,
        status: p.status || (isThisArr ? '🟠 En el Local' : '🔴 Pendiente')
      };
    });

    const sanitizedRtwItems = (rtwItems || []).map(r => {
      const unitCost = r.costPrice !== undefined ? r.costPrice : (r.price || 0);
      const unitSale = r.isGift ? 0 : (r.salePrice !== undefined ? r.salePrice : r.price);
      return {
        ...r,
        price: unitCost,
        salePrice: unitSale,
        costPrice: unitCost,
        status: r.status || '🔴 Pendiente'
      };
    });

    let derivedStatus = '🔴 Pendiente';
    const totalItems = sanitizedProducts.length + sanitizedRtwItems.length;

    if (totalItems > 0) {
      const allProdsDelivered = sanitizedProducts.length === 0 || sanitizedProducts.every(p => (p.status || '').includes('Entregado'));
      const allRtwDelivered = sanitizedRtwItems.length === 0 || sanitizedRtwItems.every(r => (r.status || '').includes('Entregado'));

      if (allProdsDelivered && allRtwDelivered) {
        derivedStatus = '🟢 Entregado';
      } else if (hasMedidaGarments) {
        const anyPrueba = sanitizedProducts.some(p => (p.status || '') === '🔵 Prueba' || (p.status || '').includes('Realizado'));
        const anyInTaller = sanitizedProducts.find(p => (p.status || '').includes('Taller'));
        const anyTelaLocal = sanitizedProducts.some(p => (p.status || '').includes('Tela en Local') || (p.status || '').includes('En el Local'));
        const anyTelaPedida = sanitizedProducts.some(p => (p.status || '').includes('Tela Pedida'));
        const anyDespachado = sanitizedRtwItems.some(r => (r.status || '').includes('Despachado'));

        if (anyPrueba) derivedStatus = '🔵 Prueba';
        else if (anyInTaller) derivedStatus = anyInTaller.status || '🟡 En Taller';
        else if (anyTelaLocal) derivedStatus = '🟠 Tela en Local';
        else if (anyTelaPedida) derivedStatus = '🟣 Tela Pedida';
        else if (anyDespachado) derivedStatus = '📦 Despachado';
        else derivedStatus = '🔴 Pendiente';
      } else if (isOrderArreglo) {
        const anyRealizado = sanitizedProducts.some(p => (p.status || '').includes('Realizado') || (p.status || '').includes('Prueba'));
        const anyInTaller = sanitizedProducts.find(p => (p.status || '').includes('Taller'));
        const anyEnLocal = sanitizedProducts.some(p => (p.status || '').includes('Local') || (p.status || '').includes('Pendiente'));

        if (anyRealizado) derivedStatus = '🔵 Arreglo Realizado';
        else if (anyInTaller) derivedStatus = anyInTaller.status || '🟡 En Taller';
        else if (anyEnLocal) derivedStatus = '🟠 En el Local';
        else if (sanitizedRtwItems.some(r => (r.status || '').includes('Despachado'))) derivedStatus = '📦 Despachado';
        else derivedStatus = '🟠 En el Local';
      } else {
        const anyDespachado = sanitizedRtwItems.some(r => (r.status || '').includes('Despachado')) || sanitizedProducts.some(p => (p.status || '').includes('Despachado'));
        derivedStatus = anyDespachado ? '📦 Despachado' : '🔴 Pendiente';
      }
    } else if (sale - sena <= 0) {
      derivedStatus = '🟢 Entregado';
    }

    const orderPayload: Order = {
      id: existing?.id || Date.now(),
      date,
      deliveryDate: deliveryDate ? deliveryDate.trim() : undefined,
      client: client.toUpperCase().trim(),
      phone,
      dni,
      email,
      birthday,
      products: sanitizedProducts,
      rtwItems: sanitizedRtwItems,
      sale,
      method,
      sena,
      saldo: Math.max(0, sale - sena),
      paymentHistory,
      origin,
      status: derivedStatus,
      costs: aggregatedCosts,
      aviosQtys,
      paidTalleresMap,
      measurements: Object.keys(cleanMeasurements).length > 0 ? cleanMeasurements : undefined,
      totalCost: totalCostos,
      profit: ganancia,
      acreditado: existing?.acreditado !== undefined ? existing.acreditado : !isCard,
      hasInvoice,
      invoiceNumber: hasInvoice ? (invoiceNumber.trim() || undefined) : undefined,
      invoiceDetails: hasInvoice ? (invoiceDetails.trim() || undefined) : undefined
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
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
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
              value={client.toUpperCase()}
              onChange={(e) => handleClientInput(e.target.value)}
              onKeyDown={handleClientKeydown}
              placeholder=""
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-ragucci-gold font-bold uppercase"
              style={{ textTransform: 'uppercase' }}
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

        {/* Historial de Compras y Precios Anteriores del Cliente */}
        {clientPastOrders.length > 0 && (
          <div className="mb-4 pt-2 border-t border-dashed border-ragucci-gold-light">
            <button
              type="button"
              onClick={() => setShowClientHistory(!showClientHistory)}
              className="flex items-center justify-between w-full text-xs font-extrabold uppercase text-ragucci-primary bg-amber-50 hover:bg-amber-100/80 p-2.5 rounded border border-amber-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700 shrink-0" />
                <span>📜 Historial de Precios y Prendas Anteriores ({clientPastOrders.length} {clientPastOrders.length === 1 ? 'orden' : 'órdenes'})</span>
              </div>
              <span className="text-amber-950 font-bold text-xs bg-amber-200/80 px-2 py-0.5 rounded">
                {showClientHistory ? '▲ Ocultar Historial' : '▼ Ver qué le cobramos antes'}
              </span>
            </button>

            {showClientHistory && (
              <div className="mt-2.5 p-3 bg-white border border-amber-200 rounded-lg text-xs space-y-3 max-h-64 overflow-y-auto">
                {clientPastOrders.map((pastOrd, oIdx) => (
                  <div key={oIdx} className="border-b border-gray-100 pb-2.5 last:border-none">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-ragucci-primary flex items-center gap-1.5">
                        <span>🗓️ {formatDate(pastOrd.date)}</span>
                        {pastOrd.status && (
                          <span className="text-[10px] text-gray-500 font-bold">({pastOrd.status})</span>
                        )}
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        Total Venta: ${formatMoney(pastOrd.sale)}
                      </span>
                    </div>

                    {pastOrd.products && pastOrd.products.length > 0 && (
                      <div className="space-y-1 ml-1 mt-1">
                        {pastOrd.products.map((pp, ppIdx) => {
                          const itemChargedPrice = pp.price && pp.price > 0 
                            ? pp.price 
                            : (pastOrd.products.length === 1 && pastOrd.sale > 0 ? pastOrd.sale : 0);

                          return (
                            <div key={ppIdx} className="flex items-center justify-between text-[11px] bg-gray-50/80 border border-gray-200 p-1.5 rounded">
                              <div>
                                <strong className="text-gray-800">• {pp.description || 'Prenda a Medida'}</strong>
                                {pp.color && <span className="text-gray-600 ml-1">🎨 {pp.color}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-emerald-700">
                                  {itemChargedPrice > 0 
                                    ? `Cobrado: $${formatMoney(itemChargedPrice)}` 
                                    : 'Sin precio unitario'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProducts([
                                      ...products,
                                      {
                                        ...pp,
                                        price: itemChargedPrice,
                                        status: '🔴 Pendiente'
                                      }
                                    ]);
                                  }}
                                  className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                  title="Copiar esta prenda y precio a la orden actual"
                                >
                                  + Cargar prenda
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {pastOrd.rtwItems && pastOrd.rtwItems.length > 0 && (
                      <div className="space-y-1 ml-1 mt-1">
                        {pastOrd.rtwItems.map((rr, rrIdx) => {
                          const rtwChargedPrice = (rr.salePrice || rr.price || 0) * (rr.qty || 1);
                          return (
                            <div key={rrIdx} className="flex items-center justify-between text-[11px] bg-gray-50/80 border border-gray-200 p-1.5 rounded">
                              <div>
                                <strong className="text-gray-800">📦 {rr.desc} (x{rr.qty})</strong>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-emerald-700">
                                  {rtwChargedPrice > 0 ? `Cobrado: $${formatMoney(rtwChargedPrice)}` : 'Sin precio'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRtwItems([
                                      ...rtwItems,
                                      {
                                        ...rr,
                                        salePrice: rr.salePrice || rr.price,
                                        status: '🔴 Pendiente'
                                      }
                                    ]);
                                  }}
                                  className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                  title="Copiar este producto RTW a la orden actual"
                                >
                                  + Cargar RTW
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-dashed border-ragucci-gold-light">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-ragucci-primary-light">
                Precio de Venta TOTAL ($)
              </label>
              {calcTotalItemsSale() > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-gray-500 font-medium">
                    Suma prendas: <strong>${formatMoney(calcTotalItemsSale())}</strong>
                  </span>
                  {sale !== calcTotalItemsSale() && (
                    <button
                      type="button"
                      onClick={() => setSale(calcTotalItemsSale())}
                      className="text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Copiar la suma de prendas individuales al total de la venta"
                    >
                      ⚡ Copiar suma
                    </button>
                  )}
                </div>
              )}
            </div>
            <MoneyInput value={sale} onValueChange={(val) => setSale(val)} />
            {calcTotalItemsSale() > 0 && sale > 0 && sale !== calcTotalItemsSale() && (
              <p className="text-[10px] text-gray-500 font-medium mt-1">
                {sale < calcTotalItemsSale()
                  ? `* Hay un descuento de $${formatMoney(calcTotalItemsSale() - sale)} respecto a la suma individual de prendas`
                  : `* La venta total supera en $${formatMoney(sale - calcTotalItemsSale())} la suma individual de prendas`}
              </p>
            )}
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
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              {method === 'Tarjeta' && <option value="Tarjeta">Tarjeta de Crédito</option>}
              <option value="Crypto/USD">USDT / Dólares</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 mt-3 border-t border-dashed border-ragucci-gold-light">
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
        </div>

        {/* Facturación Fiscal (Opcional: en caso de hacer factura) */}
        <div className="pt-3 mt-3 border-t border-dashed border-ragucci-gold-light">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasInvoice}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasInvoice(checked);
                  if (!checked) {
                    setInvoiceNumber('');
                    setInvoiceDetails('');
                  }
                }}
                className="w-4 h-4 rounded text-ragucci-primary focus:ring-ragucci-gold border-gray-300 cursor-pointer"
              />
              <span className="text-xs font-black uppercase text-ragucci-primary flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-ragucci-gold" />
                <span>¿Lleva Factura?</span>
              </span>
            </label>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              hasInvoice 
                ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {hasInvoice ? '🧾 Factura habilitada' : 'Sin factura'}
            </span>
          </div>

          {hasInvoice && (
            <div className="mt-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 transition-all">
              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  Número de Factura *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 0001-00001234 o A-0004-1234"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-white text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  Detalle / Razón Social / Concepto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Razón Social, CUIT, o detalle facturado..."
                  value={invoiceDetails}
                  onChange={(e) => setInvoiceDetails(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold bg-white text-gray-900"
                />
              </div>
            </div>
          )}
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
            origin={origin}
            clientName={client}
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
          onClick={() => {
            const isOrderArr = origin.toLowerCase().includes('arreglo') || products.some(p => (p.description || '').toUpperCase().includes('ARREGLO'));
            const defaultProdStatus = isOrderArr ? '🟠 En el Local' : (status || '🔴 Pendiente');
            setProducts([
              ...products,
              { description: '', price: 0, status: defaultProdStatus, costs: { telas: 0, forreria: 0, sastre: 0, camisero: 0, arreglos: 0 } }
            ]);
          }}
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
            clientName={client}
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
          onClick={() => setRtwItems([...rtwItems, { desc: '', qty: 1, price: 0, salePrice: 0, costPrice: 0, status: '🔴 Pendiente' }])}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {([
            { key: 'percha', label: 'Percha' },
            { key: 'funda', label: 'Funda' },
            { key: 'bolsa', label: 'Bolsa' },
            { key: 'bolsaplastica', label: 'Bolsa Plástica' },
            { key: 'bolsa_ecom_chica', label: 'Bolsa E-Comers (Chica)' },
            { key: 'bolsa_ecom_grande', label: 'Bolsa E-Comers (Grande)' }
          ] as const).map(({ key, label }) => {
            const unitPrice = config.aviosPrecios?.[key] || 0;
            const currentQty = aviosQtys[key] || 0;
            const subtotal = currentQty * unitPrice;

            return (
              <div key={key}>
                <label className="block font-bold text-ragucci-primary-light mb-1 truncate text-[11px]" title={`${label} (Precio unitario: $${formatMoney(unitPrice)})`}>
                  {label}
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    value={currentQty}
                    onChange={(e) =>
                      setAviosQtys({ ...aviosQtys, [key]: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-14 p-1.5 border border-gray-300 rounded text-center font-bold text-xs"
                  />
                  <div className="flex-1 p-1.5 bg-gray-100 border border-gray-300 rounded text-right font-bold text-ragucci-primary text-xs" title={`Subtotal: ${currentQty} x $${formatMoney(unitPrice)}`}>
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
