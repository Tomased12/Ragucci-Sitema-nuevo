import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialCommitment, FinancialCommitmentInstallment } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { CreditCard, Plus, CheckCircle, Clock, Trash2, Calendar, ChevronDown, ChevronUp, Wallet, ShieldCheck } from 'lucide-react';

export const SaldosDashboard: React.FC = () => {
  const { financialCommitments, saveFinancialCommitmentData, removeFinancialCommitmentData, saveCashMovementData, removeCashMovementData } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<FinancialCommitment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'CHEQUE_DIFERIDO' | 'PRESTAMO' | 'FINANCIACION' | 'OTRO'>('CHEQUE_DIFERIDO');
  const [entity, setEntity] = useState('');
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(10);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [totalAmountInput, setTotalAmountInput] = useState<number>(0);
  const [calcMode, setCalcMode] = useState<'monthly' | 'total'>('monthly');
  const [notes, setNotes] = useState('');

  // Filters State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVO');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCommitmentId, setExpandedCommitmentId] = useState<string | null>(null);

  // Debit Action Modal State
  const [debitInstallmentTarget, setDebitInstallmentTarget] = useState<{ commitment: FinancialCommitment; installment: FinancialCommitmentInstallment } | null>(null);
  const [debitAccount, setDebitAccount] = useState<'banco' | 'efectivo'>('banco');
  const [debitDate, setDebitDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Calculate number of months between startMonth and endMonth (inclusive)
  const calculateMonthsCount = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const [startYear, startM] = start.split('-').map(Number);
    const [endYear, endM] = end.split('-').map(Number);
    const months = (endYear - startYear) * 12 + (endM - startM) + 1;
    return Math.max(1, months);
  };

  const currentMonthsCount = calculateMonthsCount(startMonth, endMonth);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingresa un título o concepto para el cheque / préstamo.');
      return;
    }

    const calculatedMonthlyAmount = calcMode === 'monthly' ? monthlyAmount : Math.round(totalAmountInput / currentMonthsCount);
    const calculatedTotalAmount = calcMode === 'monthly' ? monthlyAmount * currentMonthsCount : totalAmountInput;

    if (calculatedMonthlyAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    // Generate Installments
    const [startYear, startM] = startMonth.split('-').map(Number);
    const generatedInstallments: FinancialCommitmentInstallment[] = [];

    for (let i = 0; i < currentMonthsCount; i++) {
      const targetDateObj = new Date(startYear, startM - 1 + i, Math.min(dueDayOfMonth, 28));
      const yearStr = targetDateObj.getFullYear();
      const monthStr = String(targetDateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDateObj.getDate()).padStart(2, '0');
      const dueDateStr = `${yearStr}-${monthStr}-${dayStr}`;

      // Check if preserving existing paid status when editing
      const existingInst = editingCommitment?.installments?.[i];

      generatedInstallments.push({
        installmentNumber: i + 1,
        dueDate: dueDateStr,
        amount: calculatedMonthlyAmount,
        status: existingInst?.status || 'PENDIENTE',
        paidDate: existingInst?.paidDate,
        cashMovementId: existingInst?.cashMovementId
      });
    }

    const allPaid = generatedInstallments.every(inst => inst.status === 'DEBITADO');

    const payload: FinancialCommitment = {
      id: editingCommitment?.id || `com_${Date.now()}`,
      title: title.trim(),
      type,
      entity: entity.trim() || undefined,
      totalAmount: calculatedTotalAmount,
      totalInstallments: currentMonthsCount,
      startMonth,
      endMonth,
      dueDayOfMonth,
      monthlyAmount: calculatedMonthlyAmount,
      installments: generatedInstallments,
      status: allPaid ? 'SALDADO' : 'ACTIVO',
      notes: notes.trim() || undefined,
      createdAt: editingCommitment?.createdAt || new Date().toISOString()
    };

    try {
      await saveFinancialCommitmentData(payload, editingCommitment?.firestoreId);
      alert(editingCommitment ? 'Compromiso financiero actualizado.' : 'Cheque / Préstamo cargado con éxito con sus cuotas mensuales.');
      resetForm();
    } catch (err) {
      alert('Error al guardar el compromiso financiero.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('CHEQUE_DIFERIDO');
    setEntity('');
    setMonthlyAmount(0);
    setTotalAmountInput(0);
    setCalcMode('monthly');
    setNotes('');
    setEditingCommitment(null);
    setShowAddModal(false);
  };

  const handleEdit = (c: FinancialCommitment) => {
    setEditingCommitment(c);
    setTitle(c.title);
    setType(c.type);
    setEntity(c.entity || '');
    setStartMonth(c.startMonth);
    setEndMonth(c.endMonth);
    setDueDayOfMonth(c.dueDayOfMonth);
    setMonthlyAmount(c.monthlyAmount);
    setTotalAmountInput(c.totalAmount);
    setNotes(c.notes || '');
    setShowAddModal(true);
  };

  const handleDeleteCommitment = async (c: FinancialCommitment) => {
    if (confirm(`¿Seguro que deseas eliminar ${c.title}? Se quitará de los saldos y balances.`)) {
      if (c.firestoreId) {
        await removeFinancialCommitmentData(c.firestoreId);
      }
    }
  };

  // Confirm Debit of an Installment (Mark Paid & Create Cash Movement)
  const handleConfirmDebit = async () => {
    if (!debitInstallmentTarget) return;

    const { commitment, installment } = debitInstallmentTarget;

    try {
      // 1. Create Cash Expense Movement in Caja/Balance
      const cashMovementId = `cm_${Date.now()}`;
      await saveCashMovementData({
        id: cashMovementId,
        date: debitDate,
        type: 'egreso',
        amount: installment.amount,
        account: debitAccount,
        category: commitment.type === 'CHEQUE_DIFERIDO' ? 'Cheque Diferido' : 'Préstamo / Cuota Financiación',
        description: `Pago Cuota ${installment.installmentNumber}/${commitment.totalInstallments} (${commitment.title})`,
        clientOrRef: commitment.entity || commitment.title
      });

      // 2. Update Installment Status in Commitment
      const updatedInstallments = commitment.installments.map(inst => {
        if (inst.installmentNumber === installment.installmentNumber) {
          return {
            ...inst,
            status: 'DEBITADO' as const,
            paidDate: debitDate,
            cashMovementId
          };
        }
        return inst;
      });

      const allPaid = updatedInstallments.every(inst => inst.status === 'DEBITADO');

      const updatedCommitment: FinancialCommitment = {
        ...commitment,
        installments: updatedInstallments,
        status: allPaid ? 'SALDADO' : 'ACTIVO'
      };

      await saveFinancialCommitmentData(updatedCommitment, commitment.firestoreId);
      alert(`✅ Cuota ${installment.installmentNumber} de $${formatMoney(installment.amount)} marcada como debitada y registrada en la Caja de ${debitAccount.toUpperCase()}.`);
      setDebitInstallmentTarget(null);
    } catch (err) {
      alert('Error al registrar el débito de la cuota.');
    }
  };

  // Revert / Undo Debit of an Installment
  const handleUndoDebit = async (commitment: FinancialCommitment, installment: FinancialCommitmentInstallment) => {
    if (!confirm(`¿Deseas anular el débito de la cuota ${installment.installmentNumber}?`)) return;

    try {
      // 1. Remove Cash Movement if associated
      if (installment.cashMovementId) {
        await removeCashMovementData(installment.cashMovementId);
      }

      // 2. Update Installment Status back to PENDIENTE
      const updatedInstallments = commitment.installments.map(inst => {
        if (inst.installmentNumber === installment.installmentNumber) {
          return {
            ...inst,
            status: 'PENDIENTE' as const,
            paidDate: undefined,
            cashMovementId: undefined
          };
        }
        return inst;
      });

      const updatedCommitment: FinancialCommitment = {
        ...commitment,
        installments: updatedInstallments,
        status: 'ACTIVO'
      };

      await saveFinancialCommitmentData(updatedCommitment, commitment.firestoreId);
    } catch (err) {
      alert('Error al anular el débito.');
    }
  };

  // Calculate Metrics across all commitments
  const currentYYYYMM = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  let totalPendingDebt = 0;
  let currentMonthObligations = 0;
  let currentMonthDebited = 0;
  let totalSaldadosCount = 0;

  financialCommitments.forEach(c => {
    if (c.status === 'SALDADO') {
      totalSaldadosCount += 1;
    }
    c.installments?.forEach(inst => {
      if (inst.status === 'PENDIENTE') {
        totalPendingDebt += inst.amount;
      }

      // Check current month
      const instMonth = inst.dueDate ? inst.dueDate.substring(0, 7) : '';
      if (instMonth === currentYYYYMM) {
        if (inst.status === 'PENDIENTE') {
          currentMonthObligations += inst.amount;
        } else if (inst.status === 'DEBITADO') {
          currentMonthDebited += inst.amount;
        }
      }
    });
  });

  // Filter commitments list
  const filteredCommitments = financialCommitments.filter(c => {
    const matchType = filterType === 'all' || c.type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = !searchTerm.trim() ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.entity && c.entity.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-ragucci-gold pb-3 gap-2">
        <div>
          <h2 className="text-xl font-extrabold uppercase text-ragucci-primary flex items-center gap-2 tracking-wide">
            <CreditCard className="w-6 h-6 text-ragucci-gold" />
            <span>Gestión de Saldos, Cheques & Préstamos</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Carga tus cheques a fecha y préstamos mensuales emitidos. Se desglosarán mes a mes e impactarán en el Balance General de la Sastrería.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold font-extrabold text-xs uppercase px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cargar Cheque / Préstamo</span>
        </button>
      </div>

      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide block mb-0.5">
              💳 Total Deuda Pendiente
            </span>
            <span className="text-lg md:text-xl font-black text-amber-950">
              ${formatMoney(totalPendingDebt)}
            </span>
            <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
              En cheques y préstamos activos
            </span>
          </div>
          <Wallet className="w-8 h-8 text-amber-500 opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-red-300 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-red-900 uppercase tracking-wide block mb-0.5">
              📅 Vencimientos del Mes
            </span>
            <span className="text-lg md:text-xl font-black text-red-950">
              ${formatMoney(currentMonthObligations)}
            </span>
            <span className="text-[10px] text-red-800 font-medium block mt-0.5">
              A debitar en el mes en curso
            </span>
          </div>
          <Clock className="w-8 h-8 text-red-500 opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-emerald-300 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wide block mb-0.5">
              🟢 Cuotas Debitadas (Mes)
            </span>
            <span className="text-lg md:text-xl font-black text-emerald-950">
              ${formatMoney(currentMonthDebited)}
            </span>
            <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">
              Ya impactadas en Caja / Balance
            </span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-ragucci-primary uppercase tracking-wide block mb-0.5">
              ✅ Compromisos Saldados
            </span>
            <span className="text-lg md:text-xl font-black text-ragucci-primary">
              {totalSaldadosCount} 100% Pagados
            </span>
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
              Histórico finalizado
            </span>
          </div>
          <ShieldCheck className="w-8 h-8 text-ragucci-gold opacity-90" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-ragucci-bg p-4 rounded-xl border border-ragucci-gold-light flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por concepto o banco..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2 pl-3 border border-gray-300 rounded-lg bg-white font-bold focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-gray-600">Tipo:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs p-1.5 border border-gray-300 rounded-lg bg-white font-bold focus:outline-none focus:border-ragucci-gold"
          >
            <option value="all">Todos los tipos</option>
            <option value="CHEQUE_DIFERIDO">Cheque Diferido</option>
            <option value="PRESTAMO">Préstamo Bancario / Personal</option>
            <option value="FINANCIACION">Financiación Proveedor</option>
            <option value="OTRO">Otro Compromiso</option>
          </select>

          <span className="text-xs font-bold text-gray-600 ml-2">Estado:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs p-1.5 border border-gray-300 rounded-lg bg-white font-bold focus:outline-none focus:border-ragucci-gold"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVO">🔴 Activos (Con cuotas pendientes)</option>
            <option value="SALDADO">🟢 Saldados (100% pagados)</option>
          </select>
        </div>
      </div>

      {/* Commitments List / Accordion Cards */}
      {filteredCommitments.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 font-medium italic">
          No hay cheques o préstamos registrados con los filtros seleccionados. Presiona el botón <strong>"+ Cargar Cheque / Préstamo"</strong> arriba para registrar uno nuevo.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommitments.map(c => {
            const isExpanded = expandedCommitmentId === c.id;
            const paidCount = c.installments?.filter(i => i.status === 'DEBITADO').length || 0;
            const totalCount = c.installments?.length || c.totalInstallments;
            const progressPct = Math.round((paidCount / totalCount) * 100);

            const pendingAmount = c.installments?.filter(i => i.status === 'PENDIENTE').reduce((sum, i) => sum + i.amount, 0) || 0;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border-2 transition-all shadow-xs ${
                  c.status === 'SALDADO'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-ragucci-gold/40 hover:border-ragucci-gold'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg text-lg ${
                      c.type === 'CHEQUE_DIFERIDO'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-sky-100 text-sky-900 border border-sky-300'
                    }`}>
                      {c.type === 'CHEQUE_DIFERIDO' ? '💳' : '🏦'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm uppercase text-ragucci-primary">
                          {c.title}
                        </h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          c.status === 'SALDADO'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {c.status === 'SALDADO' ? '✅ SALDADO' : `🔴 DEUDA ACTIVA: $${formatMoney(pendingAmount)}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                        {c.entity && <span><strong>Entidad:</strong> {c.entity}</span>}
                        <span><strong>Período:</strong> {c.startMonth} a {c.endMonth} ({c.totalInstallments} cuotas)</span>
                        <span><strong>Día de Débito:</strong> Día {c.dueDayOfMonth}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-black text-ragucci-primary block">
                        Monto Cuota: ${formatMoney(c.monthlyAmount)} / mes
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 block mt-0.5">
                        Total: ${formatMoney(c.totalAmount)} ({paidCount}/{totalCount} pagadas)
                      </span>
                      {/* Mini Progress Bar */}
                      <div className="w-36 h-2 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-ragucci-gold font-bold transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedCommitmentId(isExpanded ? null : c.id)}
                        className="bg-ragucci-bg hover:bg-ragucci-gold-light/40 text-ragucci-primary font-extrabold text-xs px-3 py-1.5 rounded-lg border border-ragucci-gold/40 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? 'Ocultar Cuotas' : 'Ver Cuotas'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="p-1.5 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg cursor-pointer"
                        title="Editar compromiso"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCommitment(c)}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Eliminar compromiso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Installments List Table */}
                {isExpanded && (
                  <div className="border-t border-ragucci-gold/30 bg-ragucci-bg/30 p-4 space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-black uppercase text-ragucci-primary tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-ragucci-gold" />
                      <span>Desglose de Cuotas Mensuales de {c.title}</span>
                    </h4>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-ragucci-primary text-ragucci-gold font-extrabold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Cuota</th>
                            <th className="py-2.5 px-3">Fecha Vencimiento</th>
                            <th className="py-2.5 px-3">Monto Cuota</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3 text-center">Acción / Débito</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {c.installments?.map(inst => {
                            const isPaid = inst.status === 'DEBITADO';
                            const isCurrentMonth = inst.dueDate?.substring(0, 7) === currentYYYYMM;

                            return (
                              <tr
                                key={inst.installmentNumber}
                                className={`hover:bg-amber-50/50 ${isCurrentMonth ? 'bg-amber-100/40 font-bold' : ''}`}
                              >
                                <td className="py-2 px-3 font-extrabold">
                                  Cuota {inst.installmentNumber} / {c.totalInstallments}
                                </td>
                                <td className="py-2 px-3">
                                  {formatDate(inst.dueDate)}
                                  {isCurrentMonth && (
                                    <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">
                                      ¡ESTE MES!
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-black text-ragucci-primary">
                                  ${formatMoney(inst.amount)}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}>
                                    {isPaid ? `🟢 Debitado el ${formatDate(inst.paidDate || inst.dueDate)}` : '🔴 Pendiente de Débito'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {!isPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => setDebitInstallmentTarget({ commitment: c, installment: inst })}
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-extrabold py-1 px-3 rounded-md shadow-xs cursor-pointer transition-colors"
                                    >
                                      🟢 Marcar como Debitado
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUndoDebit(c, inst)}
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-1 px-2 rounded-md border border-gray-300 cursor-pointer"
                                    >
                                      ↩️ Anular Débito
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT FINANCIAL COMMITMENT */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingCommitment ? `Editar Compromiso: ${editingCommitment.title}` : '💳 Cargar Nuevo Cheque / Préstamo Emitido'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-ragucci-primary mb-1">
              Concepto / Referencia del Compromiso *
            </label>
            <input
              type="text"
              placeholder="Ej: Cheque 00482 - Proveedor Tela o Préstamo Banco Galicia"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Obligación</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-white"
              >
                <option value="CHEQUE_DIFERIDO">💳 Cheque Diferido a Fecha</option>
                <option value="PRESTAMO">🏦 Préstamo Bancario / Personal</option>
                <option value="FINANCIACION">📦 Financiación Proveedor</option>
                <option value="OTRO">📌 Otro Compromiso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Banco / Entidad (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Banco Galicia, BBVA, etc."
                value={entity}
                onChange={e => setEntity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold"
              />
            </div>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-3">
            <span className="text-xs font-extrabold text-amber-950 block uppercase tracking-wide">
              🗓️ Período de Débito y Vencimientos
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Mes de Inicio</label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={e => setStartMonth(e.target.value)}
                  className="w-full p-1.5 border border-amber-300 rounded text-xs font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Mes de Fin</label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={e => setEndMonth(e.target.value)}
                  className="w-full p-1.5 border border-amber-300 rounded text-xs font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Día del Mes</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDayOfMonth}
                  onChange={e => setDueDayOfMonth(Number(e.target.value))}
                  className="w-full p-1.5 border border-amber-300 rounded text-xs font-bold bg-white"
                  required
                />
              </div>
            </div>

            <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
              <span>Duración calculada: <strong>{currentMonthsCount} mes(es) / cuota(s)</strong></span>
              <span>Día de cobro: <strong>Día {dueDayOfMonth} de cada mes</strong></span>
            </div>
          </div>

          {/* Amount Calculation Mode */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs font-bold text-gray-700">
              <span>Forma de ingresar el monto:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="calcMode"
                  checked={calcMode === 'monthly'}
                  onChange={() => setCalcMode('monthly')}
                />
                <span>Monto mensual por cuota ($X)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="calcMode"
                  checked={calcMode === 'total'}
                  onChange={() => setCalcMode('total')}
                />
                <span>Monto total a dividir</span>
              </label>
            </div>

            {calcMode === 'monthly' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monto Mensual por Cuota ($) *</label>
                <MoneyInput
                  value={monthlyAmount}
                  onValueChange={val => setMonthlyAmount(val)}
                  placeholder="Ej: 50.000"
                />
                <span className="text-[11px] text-gray-500 font-medium block mt-1">
                  Monto Total Estimado: <strong>${formatMoney(monthlyAmount * currentMonthsCount)}</strong> ({currentMonthsCount} cuotas de ${formatMoney(monthlyAmount)})
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monto Total ($) *</label>
                <MoneyInput
                  value={totalAmountInput}
                  onValueChange={val => setTotalAmountInput(val)}
                  placeholder="Ej: 400.000"
                />
                <span className="text-[11px] text-gray-500 font-medium block mt-1">
                  Cuota Mensual Estimada: <strong>${formatMoney(Math.round(totalAmountInput / currentMonthsCount))}</strong> / mes ({currentMonthsCount} cuotas)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones / Notas (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Ej: Nro de cheque, titular, sucursal o condiciones..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase py-2 px-5 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              💾 Guardar y Generar Cuotas
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONFIRM DEBIT OF INSTALLMENT */}
      {debitInstallmentTarget && (
        <Modal
          isOpen={!!debitInstallmentTarget}
          onClose={() => setDebitInstallmentTarget(null)}
          title={`🟢 Confirmar Débito: Cuota ${debitInstallmentTarget.installment.installmentNumber} (${debitInstallmentTarget.commitment.title})`}
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Al confirmar el débito, esta cuota de <strong>${formatMoney(debitInstallmentTarget.installment.amount)}</strong> pasará a estado 🟢 <strong>DEBITADO</strong> y se registrará automáticamente como un egreso de dinero en la Caja/Balance de la Sastrería.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha del Débito</label>
              <input
                type="date"
                value={debitDate}
                onChange={e => setDebitDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cuenta de donde se descuenta el dinero</label>
              <select
                value={debitAccount}
                onChange={e => setDebitAccount(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold bg-white"
              >
                <option value="banco">🏦 Cuenta Bancaria (Transferencia / Débito Automático)</option>
                <option value="efectivo">💵 Caja Efectivo</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setDebitInstallmentTarget(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDebit}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase py-2 px-5 rounded-lg shadow-sm cursor-pointer"
              >
                🟢 Confirmar Débito & Descontar de Caja
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
