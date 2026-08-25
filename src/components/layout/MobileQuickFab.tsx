import React from 'react';
import { ArrowDownRight, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileQuickFabProps {
  onOpenQuickExpense: () => void;
}

export const MobileQuickFab: React.FC<MobileQuickFabProps> = ({ onOpenQuickExpense }) => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-5 right-4 z-40 md:hidden animate-bounce shadow-2xl">
      <button
        onClick={onOpenQuickExpense}
        type="button"
        className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-full border-2 border-ragucci-gold shadow-2xl active:scale-95 transition-all cursor-pointer"
        title="Cargar Egreso Rápido"
      >
        <div className="w-5 h-5 rounded-full bg-ragucci-gold text-ragucci-primary flex items-center justify-center text-[10px] font-black shrink-0">
          {currentUser.initial}
        </div>
        <div className="flex items-center gap-1">
          <ArrowDownRight className="w-4 h-4 text-white" />
          <span>+ Egreso</span>
        </div>
      </button>
    </div>
  );
};
