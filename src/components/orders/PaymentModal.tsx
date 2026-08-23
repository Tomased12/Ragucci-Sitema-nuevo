import React, { useState } from 'react';
import { Order, PaymentRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { MoneyInput } from '../common/MoneyInput';
import { getTodayString, formatDate, formatMoney } from '../../utils/formatters';
import { Trash2, Plus } from 'lucide-react';

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

  if (!order) return null;

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) {
      alert("Ingrese un monto válido mayor a 0.");
      return;
    }

    const currentHistory: PaymentRecord[] = order.paymentHistory ? [...order.paymentHistory] : [];
    if (currentHistory.length === 0 && order.sena > 0) {
      currentHistory.push({ date: order.date, amount: order.sena, method: order.method });
    }

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
      alert("Pago acreditado en la nube.");
      setPaymentAmount(0);
      onClose();
    } catch (e) {
      alert("Error al guardar el pago.");
    }
  };

  const handleDeletePayment = async (index: number) => {
    if (!confirm("¿Seguro que deseas eliminar este pago?")) return;

    const currentHistory = order.paymentHistory ? [...order.paymentHistory] : [];
    currentHistory.splice(index, 1);

    const nuevaSena = currentHistory.reduce((acc, curr) => acc + curr.amount, 0);
    const nuevoSaldo = Math.max(0, order.sale - nuevaSena);

    const updatedOrder: Order = {
      ...order,
      paymentHistory: currentHistory,
      sena: nuevaSena,
      saldo: nuevoSaldo,
      status: nuevoSaldo > 0 && order.status === '🟢 Entregado' ? '🔵 Prueba' : order.status
    };

    try {
      await saveOrderData(updatedOrder, order.firestoreId);
    } catch (e) {
      alert("Error al eliminar el pago.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestión de Pagos: ${order.client}`}>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-ragucci-primary uppercase mb-2">Pagos Registrados</h4>
        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
          {order.paymentHistory && order.paymentHistory.length > 0 ? (
            order.paymentHistory.map((p, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-100 p-2.5 rounded text-xs"
              >
                <span>
                  🗓️ {formatDate(p.date)} - <strong className="text-emerald-600">${formatMoney(p.amount)}</strong> <em>({p.method})</em>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePayment(i)}
                  className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] py-1 px-2 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Anular y borrar este cobro (recalcula el saldo automáticamente)"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Anular Pago</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">No hay pagos registrados para editar.</p>
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
            className="w-full p-2 border border-gray-300 rounded text-xs"
          />
        </div>

        <div>
          <label className="block font-bold text-ragucci-primary-light mb-1">Medio de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-xs font-medium"
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
        onClick={handleAddPayment}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>Acreditar Pago</span>
      </button>
    </Modal>
  );
};
