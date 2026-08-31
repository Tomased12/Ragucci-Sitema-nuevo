import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialCommitment, FinancialCommitmentInstallment } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { CreditCard, Plus, CheckCircle, Clock, Trash2, Calendar, ChevronDown, ChevronUp, Wallet, ShieldCheck, Crown, DollarSign, Edit3 } from 'lucide-react';

export const SaldosDashboard: React.FC = () => {
  const { 
    orders, 
    config, 
    cashMovements, 
    saveConfigData, 
    financialCommitments, 
    saveFinancialCommitmentData, 
    removeFinancialCommitmentData, 
    saveCashMovementData, 
    removeCashMovementData 
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<FinancialCommitment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'CHEQUE_DIFERIDO' | 'PRESTAMO' | 'FINANCIACION' | 'DEUDA_PENDIENTE' | 'OTRO'>('CHEQUE_DIFERIDO');
  const [isOpenDebt, setIsOpenDebt] = useState(false);
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
  const [debitAmountPay, setDebitAmountPay] = useState<number>(0);

  // Tomy Commission State & Modals
  const [showPagoTomyModal, setShowPagoTomyModal] = useState(false);
  const [showEditSaldoAnteriorTomyModal, setShowEditSaldoAnteriorTomyModal] = useState(false);
  const [pagoTomyAmount, setPagoTomyAmount] = useState<number>(0);
  const [pagoTomyDate, setPagoTomyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pagoTomyAccount, setPagoTomyAccount] = useState<'banco' | 'efectivo'>('banco');
  const [pagoTomyNotes, setPagoTomyNotes] = useState('');
  const [saldoAnteriorTomyInput, setSaldoAnteriorTomyInput] = useState<number>(config.saldo_anterior_comision_tomy || 0);
  const [showTomyMonthlyBreakdown, setShowTomyMonthlyBreakdown] = useState(false);

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
      alert('Por favor ingresa un título o concepto para la deuda / préstamo.');
      return;
    }

    const isSingleOpenDebt = type === 'DEUDA_PENDIENTE' || isOpenDebt;
    const monthsCount = isSingleOpenDebt ? 1 : currentMonthsCount;

    const calculatedMonthlyAmount = isSingleOpenDebt
      ? (calcMode === 'monthly' ? monthlyAmount : totalAmountInput)
      : (calcMode === 'monthly' ? monthlyAmount : Math.round(totalAmountInput / monthsCount));

    const calculatedTotalAmount = isSingleOpenDebt
      ? (calcMode === 'monthly' ? monthlyAmount : totalAmountInput)
      : (calcMode === 'monthly' ? monthlyAmount * monthsCount : totalAmountInput);

    if (calculatedTotalAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    // Generate Installments
    const generatedInstallments: FinancialCommitmentInstallment[] = [];

    if (isSingleOpenDebt) {
      const existingInst = editingCommitment?.installments?.[0];
      generatedInstallments.push({
        installmentNumber: 1,
        dueDate: 'Sin fecha fija',
        amount: calculatedTotalAmount,
        status: existingInst?.status || 'PENDIENTE',
        paidDate: existingInst?.paidDate,
        cashMovementId: existingInst?.cashMovementId
      });
    } else {
      const [startYear, startM] = startMonth.split('-').map(Number);

      for (let i = 0; i < monthsCount; i++) {
        const targetDateObj = new Date(startYear, startM - 1 + i, Math.min(dueDayOfMonth, 28));
        const yearStr = targetDateObj.getFullYear();
        const monthStr = String(targetDateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(targetDateObj.getDate()).padStart(2, '0');
        const dueDateStr = `${yearStr}-${monthStr}-${dayStr}`;

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
    }

    const allPaid = generatedInstallments.every(inst => inst.status === 'DEBITADO');

    const payload: FinancialCommitment = {
      id: editingCommitment?.id || `com_${Date.now()}`,
      title: title.trim(),
      type,
      entity: entity.trim() || undefined,
      totalAmount: calculatedTotalAmount,
      totalInstallments: monthsCount,
      startMonth: isSingleOpenDebt ? 'Abierto' : startMonth,
      endMonth: isSingleOpenDebt ? 'Sin fecha' : endMonth,
      dueDayOfMonth: isSingleOpenDebt ? 0 : dueDayOfMonth,
      monthlyAmount: calculatedMonthlyAmount,
      installments: generatedInstallments,
      status: allPaid ? 'SALDADO' : 'ACTIVO',
      notes: notes.trim() || undefined,
      createdAt: editingCommitment?.createdAt || new Date().toISOString()
    };

    try {
      await saveFinancialCommitmentData(payload, editingCommitment?.firestoreId);
      alert(editingCommitment ? 'Compromiso financiero actualizado.' : 'Deuda / Compromiso guardado con éxito.');
      resetForm();
    } catch (err) {
      alert('Error al guardar el compromiso financiero.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('CHEQUE_DIFERIDO');
    setIsOpenDebt(false);
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
    setIsOpenDebt(c.type === 'DEUDA_PENDIENTE' || c.startMonth === 'Abierto');
    setEntity(c.entity || '');
    setStartMonth(c.startMonth !== 'Abierto' ? c.startMonth : startMonth);
    setEndMonth(c.endMonth !== 'Sin fecha' ? c.endMonth : endMonth);
    setDueDayOfMonth(c.dueDayOfMonth || 10);
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
    const amountToPay = debitAmountPay > 0 ? Math.min(debitAmountPay, installment.amount) : installment.amount;

    if (amountToPay <= 0) {
      alert('Por favor ingresa un monto a abonar válido.');
      return;
    }

    try {
      const cashMovementId = `cm_${Date.now()}`;
      await saveCashMovementData({
        id: cashMovementId,
        date: debitDate,
        type: 'egreso',
        amount: amountToPay,
        account: debitAccount,
        category: commitment.type === 'CHEQUE_DIFERIDO' ? 'Cheque Diferido' : commitment.type === 'DEUDA_PENDIENTE' ? 'Pago Deuda Pendiente' : 'Préstamo / Cuota Financiación',
        description: `Pago ${commitment.totalInstallments === 1 ? 'Deuda' : `Cuota ${installment.installmentNumber}/${commitment.totalInstallments}`} (${commitment.title})`,
        clientOrRef: commitment.entity || commitment.title
      });

      const isFullPayment = amountToPay >= installment.amount;
      const remainingAmount = Math.max(0, installment.amount - amountToPay);
      const nextStatus: 'DEBITADO' | 'PENDIENTE' = isFullPayment ? 'DEBITADO' : 'PENDIENTE';

      const updatedInstallments: FinancialCommitmentInstallment[] = commitment.installments.map(inst => {
        if (inst.installmentNumber === installment.installmentNumber) {
          return {
            ...inst,
            amount: isFullPayment ? inst.amount : remainingAmount,
            status: nextStatus,
            paidDate: debitDate,
            cashMovementId: isFullPayment ? cashMovementId : inst.cashMovementId
          };
        }
        return inst;
      });

      const allPaid = updatedInstallments.every(inst => inst.status === 'DEBITADO');

      const updatedCommitment: FinancialCommitment = {
        ...commitment,
        totalAmount: isFullPayment ? commitment.totalAmount : (commitment.totalAmount - amountToPay),
        installments: updatedInstallments,
        status: allPaid ? 'SALDADO' : 'ACTIVO'
      };

      await saveFinancialCommitmentData(updatedCommitment, commitment.firestoreId);
      alert(`✅ Pago de $${formatMoney(amountToPay)} registrado con éxito en la Caja de ${debitAccount.toUpperCase()}.`);
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

  // --- CALCULOS DE COMISIÓN DE TOMY ---
  const saldoAnteriorTomy = config.saldo_anterior_comision_tomy || 0;

  // Comisiones generadas en todas las ventas
  const totalComisionesVentasTomy = orders.reduce((acc, o) => acc + (o.costs?.comision || 0), 0);

  // Pagos / Adelantos realizados a Tomy
  const pagosTomyMovements = cashMovements.filter(m => 
    m.type === 'egreso' && (
      m.category === 'Pago Comisión Tomy' ||
      m.category === 'Adelanto Tomy' ||
      m.description.toLowerCase().includes('comision tomy') ||
      m.description.toLowerCase().includes('comisión tomy') ||
      m.description.toLowerCase().includes('pago tomy')
    )
  );

  const totalPagosTomy = pagosTomyMovements.reduce((acc, m) => acc + m.amount, 0);

  // Saldo Neto Pendiente a Pagar a Tomy
  const saldoPendienteTomy = Math.max(0, (saldoAnteriorTomy + totalComisionesVentasTomy) - totalPagosTomy);

  // Desglose Mensual de Comisiones de Tomy
  const monthlyCommissionsMap: Record<string, { monthKey: string; monthLabel: string; generated: number; paid: number; orderCount: number }> = {};

  orders.forEach(o => {
    const comision = o.costs?.comision || 0;
    if (comision > 0 && o.date) {
      const monthKey = o.date.substring(0, 7); // YYYY-MM
      if (!monthlyCommissionsMap[monthKey]) {
        const [y, m] = monthKey.split('-');
        const monthLabel = `${formatDate(`${monthKey}-01`).split(' ')[1] || m} ${y}`;
        monthlyCommissionsMap[monthKey] = { monthKey, monthLabel, generated: 0, paid: 0, orderCount: 0 };
      }
      monthlyCommissionsMap[monthKey].generated += comision;
      monthlyCommissionsMap[monthKey].orderCount += 1;
    }
  });

  pagosTomyMovements.forEach(m => {
    if (m.date) {
      const monthKey = m.date.substring(0, 7);
      if (monthlyCommissionsMap[monthKey]) {
        monthlyCommissionsMap[monthKey].paid += m.amount;
      }
    }
  });

  const sortedMonthlyCommissions = Object.values(monthlyCommissionsMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Handler para guardar Pago a Tomy
  const handleSavePagoTomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pagoTomyAmount <= 0) {
      alert('Ingresa un monto válido mayor a 0.');
      return;
    }

    try {
      await saveCashMovementData({
        id: `cm_${Date.now()}`,
        date: pagoTomyDate,
        type: 'egreso',
        amount: pagoTomyAmount,
        account: pagoTomyAccount,
        category: 'Pago Comisión Tomy',
        description: pagoTomyNotes.trim() || 'Pago de Comisión / Adelanto Tomy',
        clientOrRef: 'Tomy'
      });

      alert(`✅ Pago de $${formatMoney(pagoTomyAmount)} a Tomy registrado y descontado de la Caja de ${pagoTomyAccount.toUpperCase()}.`);
      setShowPagoTomyModal(false);
      setPagoTomyAmount(0);
      setPagoTomyNotes('');
    } catch (err) {
      alert('Error al registrar el pago a Tomy.');
    }
  };

  // Handler para guardar Saldo Anterior
  const handleSaveSaldoAnteriorTomy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveConfigData({
        ...config,
        saldo_anterior_comision_tomy: saldoAnteriorTomyInput
      });
      alert('✅ Saldo anterior pendiente de Tomy actualizado.');
      setShowEditSaldoAnteriorTomyModal(false);
    } catch (err) {
      alert('Error al actualizar el saldo anterior.');
    }
  };

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

  const totalPendingDebtCombined = totalPendingDebt + saldoPendienteTomy;

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
              ${formatMoney(totalPendingDebtCombined)}
            </span>
            <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
              Cheques, préstamos + Saldo Tomy
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

      {/* SECCIÓN DESTACADA: CUENTA CORRIENTE & COMISIÓN DE TOMY */}
      <div className="bg-gradient-to-r from-ragucci-primary via-ragucci-primary-light to-ragucci-primary border-2 border-ragucci-gold p-5 rounded-2xl text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ragucci-gold/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-ragucci-gold text-ragucci-primary rounded-xl font-black text-2xl shadow-xs">
              👑
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black uppercase text-ragucci-gold tracking-wide flex items-center gap-2">
                <span>Cuenta Corriente & Comisión de Tomy</span>
                <span className="text-[10px] bg-ragucci-gold text-ragucci-primary font-black px-2 py-0.5 rounded-full uppercase">
                  Saldo Automático
                </span>
              </h3>
              <p className="text-xs text-gray-300 font-medium">
                Cálculo acumulativo automático por comisiones de ventas de órdenes, saldo anterior y egresos registrados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSaldoAnteriorTomyInput(config.saldo_anterior_comision_tomy || 0);
                setShowEditSaldoAnteriorTomyModal(true);
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-3 py-2 rounded-lg border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-ragucci-gold" />
              <span>Saldo Anterior: ${formatMoney(saldoAnteriorTomy)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPagoTomyAmount(0);
                setPagoTomyNotes('');
                setShowPagoTomyModal(true);
              }}
              className="bg-ragucci-gold hover:bg-white text-ragucci-primary font-black text-xs uppercase px-4 py-2 rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>🟢 Registrar Pago / Adelanto a Tomy</span>
            </button>
          </div>
        </div>

        {/* Breakdown Banner Cards for Tomy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
              📌 Saldo Anterior Arrastre
            </span>
            <span className="text-base font-black text-white mt-0.5 block">
              ${formatMoney(saldoAnteriorTomy)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block">
              Configurable manualmente
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
              📈 Comisiones x Ventas (Total)
            </span>
            <span className="text-base font-black text-emerald-400 mt-0.5 block">
              +${formatMoney(totalComisionesVentasTomy)}
            </span>
            <span className="text-[10px] text-emerald-300 font-medium block">
              Generadas de órdenes
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <span className="text-[10px] font-extrabold uppercase text-gray-300 block">
              💵 Pagos / Adelantos Retirados
            </span>
            <span className="text-base font-black text-sky-300 mt-0.5 block">
              -${formatMoney(totalPagosTomy)}
            </span>
            <span className="text-[10px] text-sky-200 font-medium block">
              Egresos de caja registrados
            </span>
          </div>

          <div className="bg-ragucci-gold text-ragucci-primary p-3 rounded-xl font-extrabold shadow-sm border border-yellow-200">
            <span className="text-[10px] uppercase font-black tracking-wider block opacity-90">
              🔴 Saldo Pendiente a Tomy
            </span>
            <span className="text-lg font-black mt-0.5 block">
              ${formatMoney(saldoPendienteTomy)}
            </span>
            <span className="text-[10px] font-bold block opacity-80">
              {saldoPendienteTomy === 0 ? '🟢 Al día (0 Pendiente)' : 'Pendiente acumulado'}
            </span>
          </div>
        </div>

        {/* Toggle Monthly Breakdown button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowTomyMonthlyBreakdown(!showTomyMonthlyBreakdown)}
            className="text-xs font-bold text-ragucci-gold hover:text-white flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
          >
            <span>{showTomyMonthlyBreakdown ? 'Ocultar desglose por meses' : 'Ver desglose de comisiones mes a mes'}</span>
            {showTomyMonthlyBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[11px] text-gray-300 font-medium italic">
            El saldo se acumula automáticamente mes a mes al ingresar órdenes con comisión.
          </span>
        </div>

        {/* Monthly Breakdown Table */}
        {showTomyMonthlyBreakdown && (
          <div className="bg-white text-ragucci-primary p-3.5 rounded-xl border border-ragucci-gold/50 space-y-2 animate-fadeIn">
            <h4 className="text-xs font-black uppercase text-ragucci-primary tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-ragucci-gold" />
              <span>Desglose Histórico de Comisiones por Mes</span>
            </h4>

            {sortedMonthlyCommissions.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No hay comisiones de Tomy registradas en órdenes aún.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ragucci-primary text-ragucci-gold font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Mes / Período</th>
                      <th className="py-2 px-3">Ventas c/ Comisión</th>
                      <th className="py-2 px-3">Comisión Generada</th>
                      <th className="py-2 px-3">Pagos en el Mes</th>
                      <th className="py-2 px-3">Estado Mes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedMonthlyCommissions.map(item => {
                      const netMonth = item.generated - item.paid;
                      return (
                        <tr key={item.monthKey} className="hover:bg-amber-50/50">
                          <td className="py-2 px-3 font-extrabold uppercase">{item.monthLabel}</td>
                          <td className="py-2 px-3">{item.orderCount} órdenes</td>
                          <td className="py-2 px-3 font-black text-emerald-700">+${formatMoney(item.generated)}</td>
                          <td className="py-2 px-3 font-black text-sky-700">-${formatMoney(item.paid)}</td>
                          <td className="py-2 px-3 font-bold">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              netMonth <= 0 
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {netMonth <= 0 ? '🟢 Cubierto' : `🔴 Saldo $${formatMoney(netMonth)}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
            <option value="DEUDA_PENDIENTE">📌 Deuda Pendiente (Sin Fecha Fija / Sastre, etc.)</option>
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
                                      onClick={() => {
                                        setDebitInstallmentTarget({ commitment: c, installment: inst });
                                        setDebitAmountPay(inst.amount);
                                      }}
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-extrabold py-1 px-3 rounded-md shadow-xs cursor-pointer transition-colors"
                                    >
                                      🟢 {c.totalInstallments === 1 ? 'Realizar Abono / Débito' : 'Marcar como Debitado'}
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
                <option value="DEUDA_PENDIENTE">📌 Deuda Pendiente (Sin Fecha Fija / Sastre España, etc.)</option>
                <option value="OTRO">📌 Otro Compromiso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Banco / Entidad / Persona (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Santiago (Sastre España), Banco Galicia, etc."
                value={entity}
                onChange={e => setEntity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-ragucci-gold"
              />
            </div>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                🗓️ Período de Débito y Vencimientos
              </span>

              <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpenDebt || type === 'DEUDA_PENDIENTE'}
                  onChange={e => setIsOpenDebt(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-ragucci-gold focus:ring-ragucci-gold"
                />
                <span>📌 Deuda Abierta (Sin fecha ni cuotas fijas)</span>
              </label>
            </div>

            {!(isOpenDebt || type === 'DEUDA_PENDIENTE') ? (
              <>
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
              </>
            ) : (
              <div className="p-2 bg-amber-100/60 rounded text-xs text-amber-950 font-bold">
                ℹ️ Esta deuda se registrará como un saldo pendiente abierto sin vencimiento fijo. Podrás hacer abonos o saldarla en cualquier momento.
              </div>
            )}
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
              Registra el pago o saldo cancelado para <strong>{debitInstallmentTarget.commitment.title}</strong>. Se descontará automáticamente de la Caja y del Balance de la Sastrería.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Monto a Abonar / Debitar en este Pago ($) *
              </label>
              <MoneyInput
                value={debitAmountPay}
                onValueChange={val => setDebitAmountPay(val)}
                placeholder="Ej: 50.000"
              />
              {debitAmountPay < debitInstallmentTarget.installment.amount && debitAmountPay > 0 && (
                <span className="text-[11px] text-amber-800 font-bold block mt-1">
                  ⚠️ Se realizará un <strong>Abono Parcial</strong> de ${formatMoney(debitAmountPay)}. Quedará un saldo pendiente de <strong>${formatMoney(debitInstallmentTarget.installment.amount - debitAmountPay)}</strong>.
                </span>
              )}
            </div>

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

      {/* MODAL: REGISTRAR PAGO O ADELANTO A TOMY */}
      {showPagoTomyModal && (
        <Modal
          isOpen={showPagoTomyModal}
          onClose={() => setShowPagoTomyModal(false)}
          title="🟢 Registrar Pago / Adelanto de Comisión a Tomy"
        >
          <form onSubmit={handleSavePagoTomy} className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Este pago descontará del Saldo Pendiente de Tomy y se registrará automáticamente como un egreso de dinero en la Caja/Balance.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Monto del Pago / Adelanto ($) *
              </label>
              <MoneyInput
                value={pagoTomyAmount}
                onValueChange={val => setPagoTomyAmount(val)}
                placeholder="Ej: 100.000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha del Pago</label>
                <input
                  type="date"
                  value={pagoTomyDate}
                  onChange={e => setPagoTomyDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cuenta de Salida</label>
                <select
                  value={pagoTomyAccount}
                  onChange={e => setPagoTomyAccount(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-bold bg-white"
                >
                  <option value="banco">🏦 Cuenta Bancaria (Transferencia)</option>
                  <option value="efectivo">💵 Caja Efectivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones / Nota (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Transferencia Banco Galicia o Adelanto comisión"
                value={pagoTomyNotes}
                onChange={e => setPagoTomyNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPagoTomyModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase py-2 px-5 rounded-lg shadow-sm cursor-pointer"
              >
                🟢 Registrar Pago & Descontar de Caja
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: EDITAR SALDO ANTERIOR PENDIENTE DE TOMY */}
      {showEditSaldoAnteriorTomyModal && (
        <Modal
          isOpen={showEditSaldoAnteriorTomyModal}
          onClose={() => setShowEditSaldoAnteriorTomyModal(false)}
          title="✏️ Modificar Saldo Anterior Pendiente de Tomy"
        >
          <form onSubmit={handleSaveSaldoAnteriorTomy} className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Modifica el saldo arrastrado de comisiones de meses o períodos anteriores antes del seguimiento automático de órdenes.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Saldo Anterior Pendiente ($) *
              </label>
              <MoneyInput
                value={saldoAnteriorTomyInput}
                onValueChange={val => setSaldoAnteriorTomyInput(val)}
                placeholder="Ej: 150.000"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowEditSaldoAnteriorTomyModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase py-2 px-5 rounded-lg shadow-sm cursor-pointer"
              >
                💾 Guardar Saldo Anterior
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
