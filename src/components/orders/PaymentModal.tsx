import React, { useState } from 'react';
import { Order, PaymentRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { getTodayString, formatDate, formatMoney } from '../../utils/formatters';
import { Trash2, Plus, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, isOpen, onClose }) => {
  const { saveOrderData } = useApp();

  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  if (!order) return null;

  // Real-time fallback for legacy payment history
  const displayHistory: PaymentRecord[] = (order.paymentHistory && order.paymentHistory.length > 0)
    ? order.paymentHistory
    : (order.sena > 0 ? [{ date: order.date, amount: order.sena, method: order.method || 'Efectivo' }] : []);

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      alert("Ingrese un monto válido mayor a 0.");
      return;
    }

    if (isAdding || deletingIndex !== null) return;

    setIsAdding(true);

    const currentHistory: PaymentRecord[] = [...displayHistory];
    currentHistory.push({
      date: paymentDate,
      amount: paymentAmount,
      method: paymentMethod
    });

    const nuevaSena = currentHistory.reduce((acc, curr) => acc + curr.amount, 0);
    const nuevoSaldo = Math.max(0, order.sale - nuevaSena);

    const updatedOrder: Order = {
      ...order,
      paymentHistory: currentHistory,
      sena: nuevaSena,
      saldo: nuevoSaldo,
      status: nuevoSaldo === 0 ? '🟢 Entregado' : order.status
    };

    try {
      await saveOrderData(updatedOrder, order.firestoreId);
      setPaymentAmount(0);
      setIsAdding(false);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error al acreditar el pago en la nube.");
      setIsAdding(false);
    }
  };

  const handleDeletePayment = async (index: number) => {
    if (isAdding || deletingIndex !== null) return;

    if (!confirm("¿Seguro que deseas eliminar este pago? Recalculará el saldo de la orden automáticamente.")) return;

    setDeletingIndex(index);

    const currentHistory: PaymentRecord[] = [...displayHistory];
    currentHistory.splice(index, 1);

    const nuevaSena = currentHistory.reduce((acc, curr) => acc + curr.amount, 0);
    const nuevoSaldo = Math.max(0, order.sale - nuevaSena);

    const updatedOrder: Order = {
      ...order,
      paymentHistory: currentHistory,
      sena: nuevaSena,
      saldo: nuevoSaldo,
      status: (nuevoSaldo > 0 && order.status === '🟢 Entregado') ? '🔵 Prueba' : order.status
    };

    try {
      await saveOrderData(updatedOrder, order.firestoreId);
      setDeletingIndex(null);
    } catch (e) {
      console.error(e);
      alert("Error al anular el pago.");
      setDeletingIndex(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestión de Pagos: ${order.client}`}>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-ragucci-primary uppercase mb-2">Pagos Registrados</h4>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100">
          {displayHistory.length > 0 ? (
            displayHistory.map((p, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-2.5 rounded text-xs transition-colors"
              >
                <div>
                  <span className="font-bold text-gray-800">🗓️ {formatDate(p.date)}</span>
                  <span className="mx-1.5 text-gray-400">|</span>
                  <strong className="text-emerald-700 font-extrabold">${formatMoney(p.amount)}</strong>
                  <span className="ml-1 text-[11px] text-gray-500 italic">({p.method})</span>
                </div>
                <button
                  type="button"
                  disabled={deletingIndex !== null || isAdding}
                  onClick={() => handleDeletePayment(i)}
                  className="bg-ragucci-red hover:bg-red-900 disabled:opacity-50 text-white font-extrabold text-[10px] py-1 px-2.5 rounded transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Anular y borrar este cobro (recalcula el saldo automáticamente)"
                >
                  {deletingIndex === i ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Anulando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      <span>Anular Pago</span>
                    </>
                  )}
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic py-2">No hay pagos registrados para esta orden.</p>
          )}
        </div>
      </div>

      <h4 className="text-xs font-bold text-ragucci-primary-light uppercase border-b border-ragucci-gold-light pb-1 mb-3">
        Registrar Nuevo Pago
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <label className="block font-bold text-ragucci-primary-light mb-1">Fecha de Pago</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        <div>
          <label className="block font-bold text-ragucci-primary-light mb-1">Medio de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          >
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta de Crédito</option>
            <option value="Crypto/USD">USDT / Dólares</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold text-ragucci-primary-light mb-1">Monto Abonado ($)</label>
        <MoneyInput
          value={paymentAmount}
          onValueChange={(val) => setPaymentAmount(val)}
          placeholder="Ej: 100.000"
        />
      </div>

      <button
        type="button"
        disabled={isAdding || deletingIndex !== null}
        onClick={handleAddPayment}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Acreditando Pago...</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>Acreditar Pago</span>
          </>
        )}
      </button>
    </Modal>
  );
};
