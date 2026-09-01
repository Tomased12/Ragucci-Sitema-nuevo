import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { formatMoney, getTodayString } from '../../utils/formatters';
import { CreditCard, Calendar, Wallet, Landmark, DollarSign, CheckCircle2 } from 'lucide-react';

export interface ExpensePaymentModalItem {
  title: string;
  client: string;
  detail: string;
  providerOrWorkshop: string;
  amount: number;
  categoryType: 'taller' | 'tela';
}

interface ExpensePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExpensePaymentModalItem | null;
  onConfirm: (data: { date: string; account: 'efectivo' | 'banco' | 'dolar'; note: string }) => Promise<void>;
}

export const ExpensePaymentModal: React.FC<ExpensePaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [date, setDate] = useState<string>(getTodayString());
  const [account, setAccount] = useState<'efectivo' | 'banco' | 'dolar'>('efectivo');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayString());
      setAccount('efectivo');
      setNote('');
      setLoading(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Por favor selecciona una fecha de pago válida.');
      return;
    }

    try {
      setLoading(true);
      await onConfirm({
        date,
        account,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error al registrar pago de egreso:', err);
      alert('Ocurrió un error al registrar el pago y descontar de la caja.');
    } finally {
      setLoading(false);
    }
  };

  const isTaller = item.categoryType === 'taller';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`💳 Registrar Pago de ${isTaller ? 'Taller' : 'Tela'} & Descontar de Caja`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Item Summary Card */}
        <div className="bg-ragucci-bg p-3.5 rounded-xl border border-ragucci-gold-light space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-ragucci-gold bg-ragucci-primary px-2 py-0.5 rounded-full inline-block mb-1">
                {isTaller ? '✂️ Taller / Confección' : '🧵 Proveedor de Tela / Forrería'}
              </span>
              <h4 className="text-sm font-black text-ragucci-primary uppercase">
                {item.providerOrWorkshop}
              </h4>
              <p className="text-xs font-bold text-gray-700">
                Cliente: <span className="text-ragucci-primary font-black uppercase">{item.client}</span>
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                {item.detail}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Monto a Liquidar</span>
              <span className="text-lg font-black text-emerald-600 tabular-nums">
                ${formatMoney(item.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-ragucci-gold" />
            <span>Fecha en que se realizó el pago:</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-ragucci-gold shadow-2xs"
            required
          />
        </div>

        {/* Account / Payment Method Selection */}
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-1.5 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-ragucci-gold" />
            <span>Medio de Pago / Cuenta a Descontar:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAccount('efectivo')}
              className={`p-3 rounded-xl border-2 font-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                account === 'efectivo'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-950 shadow-sm ring-1 ring-amber-400'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">💵</span>
              <span className="text-[11px] uppercase">Efectivo</span>
              <span className="text-[9px] font-medium text-gray-500">(Caja Física)</span>
            </button>

            <button
              type="button"
              onClick={() => setAccount('banco')}
              className={`p-3 rounded-xl border-2 font-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                account === 'banco'
                  ? 'border-sky-500 bg-sky-500/15 text-sky-950 shadow-sm ring-1 ring-sky-400'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">🏦</span>
              <span className="text-[11px] uppercase">Banco / MP</span>
              <span className="text-[9px] font-medium text-gray-500">(Transferencia)</span>
            </button>

            <button
              type="button"
              onClick={() => setAccount('dolar')}
              className={`p-3 rounded-xl border-2 font-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                account === 'dolar'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-950 shadow-sm ring-1 ring-emerald-400'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">💵</span>
              <span className="text-[11px] uppercase">Dólares</span>
              <span className="text-[9px] font-medium text-gray-500">(Caja USD)</span>
            </button>
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Observación / Nota de Pago (Opcional):
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Ej: Pagado por transferencia / nro comprobante...`}
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-ragucci-gold" />
            <span>
              {loading ? 'Guardando y Descontando...' : `Confirmar & Descontar $${formatMoney(item.amount)}`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
