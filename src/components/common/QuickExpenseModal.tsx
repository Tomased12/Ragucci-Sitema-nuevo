import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashMovement } from '../../types';
import { Modal } from './Modal';
import { getTodayString } from '../../utils/formatters';
import { ArrowDownRight, CheckCircle2, DollarSign, Tag, Calendar, Sparkles } from 'lucide-react';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_CATEGORIES = [
  'Insumos & Telas',
  'Pago a Taller',
  'Servicios & Expensas',
  'Comida & Viáticos',
  'Publicidad & Redes',
  'Varios / Retiro',
];

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({ isOpen, onClose }) => {
  const { saveCashMovementData, currentUser } = useApp();

  const [amount, setAmount] = useState<string>('');
  const [account, setAccount] = useState<'efectivo' | 'banco' | 'dolar'>('efectivo');
  const [category, setCategory] = useState<string>('Insumos & Telas');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    const finalCategory = category === 'Otros' ? (customCategory.trim() || 'Varios') : category;

    const newMov: CashMovement = {
      id: Date.now().toString(),
      date,
      type: 'egreso',
      amount: parsedAmount,
      account,
      category: finalCategory,
      description: description.trim(),
    };

    try {
      setLoading(true);
      await saveCashMovementData(newMov);
      setSuccessMsg(`¡Egreso de $${parsedAmount.toLocaleString('es-AR')} guardado con éxito!`);
      
      // Reset form
      setAmount('');
      setDescription('');
      setCustomCategory('');
      
      setTimeout(() => {
        setSuccessMsg('');
        setLoading(false);
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      alert('Error al guardar el egreso en la caja.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💸 Carga Rápida de Egreso / Gasto">
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {/* Banner / User badge info */}
        <div className="bg-ragucci-primary text-ragucci-gold p-3 rounded-xl border border-ragucci-gold/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ragucci-gold text-ragucci-primary font-black flex items-center justify-center text-xs">
              {currentUser?.initial || 'U'}
            </span>
            <span className="font-bold text-xs text-ragucci-gold-light">
              Registrando como <strong className="text-ragucci-gold">{currentUser?.name || 'Usuario'}</strong>
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-400/40">
            Egreso (-)
          </span>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-xs font-black uppercase text-ragucci-primary tracking-wider mb-1">
            Monto del Gasto:
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-extrabold text-base text-ragucci-gold">
              {account === 'dolar' ? 'USD $' : '$'}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
              className="w-full pl-14 pr-4 py-3 rounded-xl border-2 border-ragucci-gold bg-[#fffdfa] text-lg font-black text-ragucci-primary focus:outline-none focus:ring-2 focus:ring-ragucci-gold shadow-inner"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Selección de Cuenta */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Cuenta donde se resta el dinero:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAccount('efectivo')}
              className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all ${
                account === 'efectivo'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-900 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              💵 Efectivo
            </button>
            <button
              type="button"
              onClick={() => setAccount('banco')}
              className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all ${
                account === 'banco'
                  ? 'border-sky-500 bg-sky-500/15 text-sky-900 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏦 Banco / MP
            </button>
            <button
              type="button"
              onClick={() => setAccount('dolar')}
              className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all ${
                account === 'dolar'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              💵 Dólares
            </button>
          </div>
        </div>

        {/* Categorías Rápidas */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Categoría / Concepto:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  category === cat
                    ? 'border-ragucci-gold bg-ragucci-gold text-ragucci-primary shadow-sm scale-105'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-ragucci-gold/60'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategory('Otros')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                category === 'Otros'
                  ? 'border-ragucci-gold bg-ragucci-gold text-ragucci-primary shadow-sm scale-105'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-ragucci-gold/60'
              }`}
            >
              ✏️ Otro concepto
            </button>
          </div>

          {category === 'Otros' && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Escribe el concepto del egreso..."
              className="mt-2 w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold focus:outline-none focus:border-ragucci-gold"
              required
            />
          )}
        </div>

        {/* Detalle / Observación Opcional */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Detalle u Observación (Opcional):
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Pago de flete, compra de hilo negro..."
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Fecha:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs font-bold focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{loading ? 'Guardando...' : 'Confirmar & Guardar Egreso'}</span>
        </button>
      </form>
    </Modal>
  );
};
