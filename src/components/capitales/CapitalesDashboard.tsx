import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CashMovement, UserInitial } from '../../types';
import { formatMoney, getTodayString, formatDate } from '../../utils/formatters';
import { UserBadge } from '../common/UserBadge';
import { 
  Wallet, 
  Landmark, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Scale,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';

export const CapitalesDashboard: React.FC = () => {
  const { orders, cashMovements, dolarBlueVenta, saveCashMovementData, removeCashMovementData } = useApp();

  // Form State for Manual Movement
  const [showForm, setShowForm] = useState(false);
  const [movType, setMovType] = useState<'ingreso' | 'egreso' | 'transferencia'>('ingreso');
  const [amount, setAmount] = useState<string>('');
  const [account, setAccount] = useState<'efectivo' | 'banco' | 'dolar'>('efectivo');
  const [toAccount, setToAccount] = useState<'efectivo' | 'banco' | 'dolar'>('banco');
  const [category, setCategory] = useState<string>('Varios / Aporte');
  const [description, setDescription] = useState<string>('');
  const [movDate, setMovDate] = useState<string>(getTodayString());

  // Filter State
  const [accountFilter, setAccountFilter] = useState<'all' | 'efectivo' | 'banco' | 'dolar'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ingreso' | 'egreso' | 'transferencia'>('all');

  // Arqueo Modal State
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [countedEfectivo, setCountedEfectivo] = useState<string>('');

  // 1. Calculate Balances from Orders & Manual Movements
  const balances = useMemo(() => {
    let efectivo = 0;
    let banco = 0;
    let dolar = 0;

    // A. Automatic Inflows from Client Payments (Orders)
    orders.forEach((o) => {
      if (o.paymentHistory && o.paymentHistory.length > 0) {
        o.paymentHistory.forEach((p) => {
          const m = (p.method || '').toLowerCase();
          if (m.includes('dólar') || m.includes('dolar') || m.includes('usd')) {
            dolar += p.amount;
          } else if (m.includes('transferencia') || m.includes('banco') || m.includes('mercadopago') || m.includes('tarjeta')) {
            banco += p.amount;
          } else {
            efectivo += p.amount;
          }
        });
      } else {
        // Fallback for orders without payment history array: credited sale - saldo
        const collected = (o.sale || 0) - (o.saldo || 0);
        if (collected > 0) {
          efectivo += collected;
        }
      }
    });

    // B. Manual Cash Movements
    cashMovements.forEach((m) => {
      const amt = m.amount || 0;
      if (m.type === 'ingreso') {
        if (m.account === 'efectivo') efectivo += amt;
        if (m.account === 'banco') banco += amt;
        if (m.account === 'dolar') dolar += amt;
      } else if (m.type === 'egreso') {
        if (m.account === 'efectivo') efectivo -= amt;
        if (m.account === 'banco') banco -= amt;
        if (m.account === 'dolar') dolar -= amt;
      } else if (m.type === 'transferencia' && m.toAccount) {
        if (m.account === 'efectivo') efectivo -= amt;
        if (m.account === 'banco') banco -= amt;
        if (m.account === 'dolar') dolar -= amt;

        if (m.toAccount === 'efectivo') efectivo += amt;
        if (m.toAccount === 'banco') banco += amt;
        if (m.toAccount === 'dolar') dolar += amt;
      }
    });

    const totalArsEquivalent = efectivo + banco + (dolar * dolarBlueVenta);

    return {
      efectivo,
      banco,
      dolar,
      totalArsEquivalent
    };
  }, [orders, cashMovements, dolarBlueVenta]);

  // Combined Log of All Transactions (Automatic + Manual)
  const allTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      firestoreId?: string;
      date: string;
      type: 'ingreso' | 'egreso' | 'transferencia';
      account: 'efectivo' | 'banco' | 'dolar';
      toAccount?: 'efectivo' | 'banco' | 'dolar';
      category: string;
      description: string;
      amount: number;
      isManual: boolean;
      createdAt?: number;
      createdBy?: UserInitial;
      updatedBy?: UserInitial;
    }> = [];

    // Add manual cash movements
    cashMovements.forEach((m) => {
      let timestamp = 0;
      if (typeof m.createdAt === 'number') {
        timestamp = m.createdAt;
      } else if (typeof m.createdAt === 'string') {
        timestamp = new Date(m.createdAt).getTime() || parseInt(m.createdAt, 10) || 0;
      } else if (m.id && /^\d{10,15}$/.test(m.id)) {
        timestamp = parseInt(m.id, 10);
      }

      list.push({
        id: m.id || m.firestoreId || Math.random().toString(),
        firestoreId: m.firestoreId,
        date: m.date,
        createdAt: timestamp,
        type: m.type,
        account: m.account,
        toAccount: m.toAccount,
        category: m.category || 'Movimiento Manual',
        description: m.description || '',
        amount: m.amount,
        isManual: true,
        createdBy: m.createdBy,
        updatedBy: m.updatedBy
      });
    });

    // Add automatic client payments
    orders.forEach((o) => {
      if (o.paymentHistory && o.paymentHistory.length > 0) {
        o.paymentHistory.forEach((p, idx) => {
          const m = (p.method || '').toLowerCase();
          let acc: 'efectivo' | 'banco' | 'dolar' = 'efectivo';
          if (m.includes('dólar') || m.includes('dolar') || m.includes('usd')) acc = 'dolar';
          else if (m.includes('transferencia') || m.includes('banco') || m.includes('mercadopago') || m.includes('tarjeta')) acc = 'banco';

          const pDate = p.date || o.date;
          const timestamp = new Date(pDate + 'T12:00:00').getTime();

          list.push({
            id: `ord-pay-${o.id}-${idx}`,
            date: pDate,
            createdAt: timestamp,
            type: 'ingreso',
            account: acc,
            category: '💰 Cobro a Cliente',
            description: `Pago de ${o.client} (${p.method})`,
            amount: p.amount,
            isManual: false,
            createdBy: o.createdBy,
            updatedBy: o.updatedBy
          });
        });
      }
    });

    // Sort descending by date first, then by createdAt / id (lo último cargado primero)
    list.sort((a, b) => {
      const dateA = new Date(a.date + 'T12:00:00').getTime();
      const dateB = new Date(b.date + 'T12:00:00').getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }, [orders, cashMovements]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (accountFilter !== 'all' && t.account !== accountFilter && t.toAccount !== accountFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      return true;
    });
  }, [allTransactions, accountFilter, typeFilter]);

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    if (movType === 'transferencia' && account === toAccount) {
      alert("La cuenta de origen y destino no pueden ser la misma en una transferencia.");
      return;
    }

    const newMov: CashMovement = {
      id: Date.now().toString(),
      date: movDate,
      createdAt: Date.now(),
      type: movType,
      amount: parsedAmt,
      account,
      toAccount: movType === 'transferencia' ? toAccount : undefined,
      category: category.trim() || 'Movimiento de Caja',
      description: description.trim()
    };

    try {
      await saveCashMovementData(newMov);
      setAmount('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      alert("Error al guardar el movimiento de caja.");
    }
  };

  const handleDeleteManualMovement = async (t: typeof allTransactions[0]) => {
    if (!t.isManual || !t.firestoreId) return;
    if (confirm(`¿Deseas eliminar el movimiento manual "${t.description}" por $${formatMoney(t.amount)}?`)) {
      try {
        await removeCashMovementData(t.firestoreId);
      } catch (err) {
        alert("Error al eliminar el movimiento.");
      }
    }
  };

  const getAccountLabel = (acc: 'efectivo' | 'banco' | 'dolar') => {
    if (acc === 'efectivo') return '💵 Efectivo (ARS)';
    if (acc === 'banco') return '🏦 Banco / MercadoPago (ARS)';
    return '💵 Dólares (USD)';
  };

  // Edit Account Balance Modal State
  const [editingAccount, setEditingAccount] = useState<'efectivo' | 'banco' | 'dolar' | null>(null);
  const [targetBalance, setTargetBalance] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Ajuste de Saldo Inicial / Dinero Real en Mano');

  const handleOpenEditAccount = (acc: 'efectivo' | 'banco' | 'dolar') => {
    setEditingAccount(acc);
    setTargetBalance(balances[acc].toString());
    setAdjustReason('Ajuste de Saldo Inicial / Dinero Real en Mano');
  };

  const handleSaveAccountAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const newTarget = parseFloat(targetBalance);
    if (isNaN(newTarget) || newTarget < 0) {
      alert("Por favor ingresa un monto válido igual o mayor a 0.");
      return;
    }

    const currentCalculated = balances[editingAccount];
    const diff = newTarget - currentCalculated;

    if (diff === 0) {
      alert("El saldo ingresado es idéntico al saldo actual de la cuenta.");
      setEditingAccount(null);
      return;
    }

    const newMov: CashMovement = {
      id: Date.now().toString(),
      date: getTodayString(),
      createdAt: Date.now(),
      type: diff > 0 ? 'ingreso' : 'egreso',
      amount: Math.abs(diff),
      account: editingAccount,
      category: '⚙️ Ajuste de Saldo Inicial',
      description: adjustReason.trim() || 'Ajuste de Saldo Real en Mano'
    };

    try {
      await saveCashMovementData(newMov);
      setEditingAccount(null);
      setTargetBalance('');
    } catch (err) {
      alert("Error al guardar el ajuste de saldo.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border border-ragucci-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary flex items-center gap-2">
            <Wallet className="w-6 h-6 text-ragucci-gold" />
            <span>Control de Capitales, Caja & Cuentas</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Arqueo de caja en tiempo real, saldos por cuenta y flujo de fondos de Sastrería Ragucci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowArqueoModal(true)}
            className="bg-ragucci-primary-light hover:bg-ragucci-primary text-ragucci-gold font-extrabold px-3.5 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border border-ragucci-gold/30"
          >
            <Scale className="w-4 h-4 text-ragucci-gold" />
            <span>📊 Arqueo de Caja</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary font-extrabold px-4 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Cancelar' : '➕ Nuevo Movimiento'}</span>
          </button>
        </div>
      </div>

      {/* Live Account Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Caja Efectivo ARS */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 rounded-lg shadow-md border-l-4 border-ragucci-gold flex flex-col justify-between relative group">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider">Caja Efectivo (ARS)</span>
              <button
                onClick={() => handleOpenEditAccount('efectivo')}
                className="text-amber-200 hover:text-white bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Editar / Ajustar Saldo Real en Mano"
              >
                ✏️ Editar
              </button>
            </div>
            <strong className="text-xl md:text-2xl font-extrabold block text-white font-sans mt-1">
              ${formatMoney(balances.efectivo)}
            </strong>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-amber-200 font-medium">Dinero físico en caja</span>
            <button
              onClick={() => handleOpenEditAccount('efectivo')}
              className="text-[10px] text-amber-100 underline decoration-dashed hover:text-white"
            >
              Ajustar Saldo Real ➔
            </button>
          </div>
        </div>

        {/* Banco / MercadoPago ARS */}
        <div className="bg-gradient-to-br from-sky-700 to-blue-900 text-white p-4 rounded-lg shadow-md border-l-4 border-sky-400 flex flex-col justify-between relative group">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-sky-100 tracking-wider">Banco / MercadoPago (ARS)</span>
              <button
                onClick={() => handleOpenEditAccount('banco')}
                className="text-sky-200 hover:text-white bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Editar / Ajustar Saldo Bancario Real"
              >
                ✏️ Editar
              </button>
            </div>
            <strong className="text-xl md:text-2xl font-extrabold block text-white font-sans mt-1">
              ${formatMoney(balances.banco)}
            </strong>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-sky-200 font-medium">Cuenta bancaria</span>
            <button
              onClick={() => handleOpenEditAccount('banco')}
              className="text-[10px] text-sky-100 underline decoration-dashed hover:text-white"
            >
              Ajustar Saldo Real ➔
            </button>
          </div>
        </div>

        {/* Caja Dólares USD */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-4 rounded-lg shadow-md border-l-4 border-emerald-400 flex flex-col justify-between relative group">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Caja Dólares (USD)</span>
              <button
                onClick={() => handleOpenEditAccount('dolar')}
                className="text-emerald-200 hover:text-white bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Editar / Ajustar Saldo Dólares Real"
              >
                ✏️ Editar
              </button>
            </div>
            <strong className="text-xl md:text-2xl font-extrabold block text-white font-sans mt-1">
              USD ${formatMoney(balances.dolar)}
            </strong>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-emerald-200 font-medium">≈ ${formatMoney(Math.round(balances.dolar * dolarBlueVenta))} ARS</span>
            <button
              onClick={() => handleOpenEditAccount('dolar')}
              className="text-[10px] text-emerald-100 underline decoration-dashed hover:text-white"
            >
              Ajustar Saldo Real ➔
            </button>
          </div>
        </div>

        {/* Total Capital Acumulado */}
        <div className="bg-gradient-to-br from-ragucci-primary to-ragucci-primary-light text-ragucci-gold p-4 rounded-lg shadow-md border-l-4 border-ragucci-gold flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-ragucci-gold-light tracking-wider">Capital Total en Caja</span>
              <Layers className="w-5 h-5 text-ragucci-gold" />
            </div>
            <strong className="text-xl md:text-2xl font-extrabold block text-white font-sans mt-1">
              ${formatMoney(Math.round(balances.totalArsEquivalent))}
            </strong>
          </div>
          <span className="text-[10px] text-ragucci-gold-light block mt-2 font-medium">
            Suma en ARS de todas las cuentas combinadas
          </span>
        </div>
      </div>

      {/* Manual Movement Form Modal / Collapsible */}
      {showForm && (
        <form onSubmit={handleSaveMovement} className="bg-white p-5 rounded-lg shadow-md border border-ragucci-gold space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-ragucci-gold-light pb-2">
            <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-ragucci-gold" />
              <span>Registrar Movimiento Manual de Caja</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 font-bold text-xs"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tipo de Movimiento */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tipo de Operación:</label>
              <select
                value={movType}
                onChange={(e) => setMovType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold cursor-pointer"
              >
                <option value="ingreso">📥 Ingreso Directo (+)</option>
                <option value="egreso">📤 Egreso / Retiro (-)</option>
                <option value="transferencia">🔀 Transferencia entre Cuentas</option>
              </select>
            </div>

            {/* Cuenta Origen */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {movType === 'transferencia' ? 'Cuenta Origen (Sale):' : 'Cuenta Afectada:'}
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
              >
                <option value="efectivo">💵 Caja Efectivo (ARS)</option>
                <option value="banco">🏦 Banco / MercadoPago (ARS)</option>
                <option value="dolar">💵 Caja Dólares (USD)</option>
              </select>
            </div>

            {/* Cuenta Destino (Solo Transferencia) */}
            {movType === 'transferencia' && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Cuenta Destino (Entra):</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
                >
                  <option value="efectivo">💵 Caja Efectivo (ARS)</option>
                  <option value="banco">🏦 Banco / MercadoPago (ARS)</option>
                  <option value="dolar">💵 Caja Dólares (USD)</option>
                </select>
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Monto ({account === 'dolar' ? 'USD' : '$'}):
              </label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold"
                min="0"
                step="any"
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Categoría / Concepto:</label>
              <input
                type="text"
                placeholder="Ej: Retiro de Socio, Aporte, Compra Dólares..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
              />
            </div>
          </div>

          {/* Observaciones y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Observaciones / Detalle (Opcional):</label>
              <input
                type="text"
                placeholder="Descripción adicional del movimiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
              />
            </div>

            <div className="flex gap-2">
              <div className="w-full">
                <label className="text-xs font-bold text-gray-700 block mb-1">Fecha:</label>
                <input
                  type="date"
                  value={movDate}
                  onChange={(e) => setMovDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors shadow-sm cursor-pointer whitespace-nowrap self-end"
              >
                Guardar Movimiento
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Transaction History & Filters */}
      <div className="bg-white rounded-lg shadow-md border border-ragucci-border overflow-hidden">
        <div className="p-4 bg-ragucci-bg border-b border-ragucci-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-extrabold text-xs uppercase text-ragucci-primary tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-ragucci-gold" />
            <span>Historial de Flujo de Fondos (Entradas y Salidas)</span>
          </h3>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filter by Account */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-gray-600">Cuenta:</label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value as any)}
                className="p-1.5 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold cursor-pointer"
              >
                <option value="all">Todas las Cuentas</option>
                <option value="efectivo">💵 Caja Efectivo</option>
                <option value="banco">🏦 Banco / MercadoPago</option>
                <option value="dolar">💵 Caja Dólares</option>
              </select>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-gray-600">Tipo:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="p-1.5 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold cursor-pointer"
              >
                <option value="all">Todos los Tipos</option>
                <option value="ingreso">📥 Ingresos (+)</option>
                <option value="egreso">📤 Egresos (-)</option>
                <option value="transferencia">🔀 Transferencias</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-ragucci-primary text-ragucci-gold uppercase text-[11px] tracking-wider border-b border-ragucci-gold">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Cuenta Afectada</th>
                <th className="py-3 px-3">Concepto / Detalle</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-3 text-center">Origen</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                    No hay movimientos registrados para las opciones seleccionadas.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#fdfaf5] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-600 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>

                    <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                      {t.type === 'ingreso' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-extrabold border border-emerald-300">
                          <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                          <span>Ingreso</span>
                        </span>
                      ) : t.type === 'egreso' ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] font-extrabold border border-red-300">
                          <ArrowDownRight className="w-3 h-3 text-red-700" />
                          <span>Egreso</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-[10px] font-extrabold border border-sky-300">
                          <ArrowRightLeft className="w-3 h-3 text-sky-700" />
                          <span>Transferencia</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-gray-800 whitespace-nowrap">
                      {t.type === 'transferencia' ? (
                        <span>{getAccountLabel(t.account)} ➔ {getAccountLabel(t.toAccount!)}</span>
                      ) : (
                        <span>{getAccountLabel(t.account)}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <strong className="text-gray-800 block text-xs">{t.category}</strong>
                      {t.description && <span className="text-gray-500 text-[11px] block">{t.description}</span>}
                    </td>

                    <td className={`py-2.5 px-3 text-right font-extrabold text-sm font-sans whitespace-nowrap ${
                      t.type === 'ingreso' ? 'text-emerald-700' : t.type === 'egreso' ? 'text-red-600' : 'text-sky-700'
                    }`}>
                      {t.type === 'ingreso' ? '+' : t.type === 'egreso' ? '-' : ''}
                      {t.account === 'dolar' ? `USD $${formatMoney(t.amount)}` : `$${formatMoney(t.amount)}`}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        {t.isManual ? (
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-extrabold border border-amber-300">
                            ✍️ Manual
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                            ⚡ Automático (Orden)
                          </span>
                        )}
                        {(t.createdBy || t.updatedBy) && (
                          <UserBadge initial={t.updatedBy || t.createdBy} size="xs" showFullName={true} />
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {t.isManual ? (
                        <button
                          onClick={() => handleDeleteManualMovement(t)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                          title="Eliminar movimiento manual"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Desde Orden</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arqueo y Cierre de Caja Modal */}
      {showArqueoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <Scale className="w-5 h-5 text-ragucci-gold" />
                <span>Arqueo y Cierre de Caja (Efectivo)</span>
              </h3>
              <button
                onClick={() => setShowArqueoModal(null as any)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fffdfa] p-4 border border-ragucci-gold-light rounded text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Saldo Teórico del Sistema (Efectivo ARS):</span>
                <strong className="text-base font-extrabold text-ragucci-primary">${formatMoney(balances.efectivo)}</strong>
              </div>

              <div>
                <label className="text-xs font-extrabold text-gray-800 block mb-1">
                  Monto Físico en Mano ($ contado):
                </label>
                <input
                  type="number"
                  placeholder="Ej: 170000"
                  value={countedEfectivo}
                  onChange={(e) => setCountedEfectivo(e.target.value)}
                  className="w-full p-2.5 border-2 border-ragucci-gold rounded text-sm font-extrabold focus:outline-none text-ragucci-primary"
                />
              </div>

              {countedEfectivo !== '' && (() => {
                const counted = parseFloat(countedEfectivo) || 0;
                const diff = counted - balances.efectivo;

                if (diff === 0) {
                  return (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>¡Caja Perfecta! El dinero contado coincide exactamente con el sistema.</span>
                    </div>
                  );
                } else if (diff > 0) {
                  return (
                    <div className="p-3 bg-sky-100 border border-sky-300 text-sky-900 rounded flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-5 h-5 text-sky-600 shrink-0" />
                      <span>Sobrante de Caja: Hay +${formatMoney(diff)} más en mano que en el sistema.</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <span>Faltante de Caja: Faltan -${formatMoney(Math.abs(diff))} en mano respecto al sistema.</span>
                    </div>
                  );
                }
              })()}
            </div>

            <button
              onClick={() => {
                setShowArqueoModal(false);
                setCountedEfectivo('');
              }}
              className="w-full py-2.5 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors"
            >
              Cerrar Arqueo
            </button>
          </div>
        </div>
      )}

      {/* Editar / Ajustar Saldo Real Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveAccountAdjustment} className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-md w-full p-5 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <Wallet className="w-5 h-5 text-ragucci-gold" />
                <span>Editar Saldo Real: {getAccountLabel(editingAccount)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fffdfa] p-4 border border-ragucci-gold-light rounded text-xs space-y-3">
              <div className="flex justify-between items-center text-gray-600">
                <span>Saldo Calculado Actual:</span>
                <strong className="text-sm font-extrabold text-gray-800">
                  {editingAccount === 'dolar' ? `USD $${formatMoney(balances[editingAccount])}` : `$${formatMoney(balances[editingAccount])}`}
                </strong>
              </div>

              <div>
                <label className="text-xs font-extrabold text-ragucci-primary block mb-1">
                  Ingrese el Saldo Real Actual ({editingAccount === 'dolar' ? 'USD' : '$'}):
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={targetBalance}
                  onChange={(e) => setTargetBalance(e.target.value)}
                  className="w-full p-2.5 border-2 border-ragucci-gold rounded text-sm font-extrabold focus:outline-none text-ragucci-primary"
                  min="0"
                  step="any"
                  required
                />
                <span className="text-[10px] text-gray-500 block mt-1">
                  * Si ingresas 0 (o cualquier valor real), la app ajustará la caja para que coincida exactamente.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Motivo del Ajuste:</label>
                <input
                  type="text"
                  placeholder="Ej: Ajuste inicial / Dinero retirado previamente"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="w-1/2 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors shadow-sm cursor-pointer"
              >
                Guardar Saldo Real
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
