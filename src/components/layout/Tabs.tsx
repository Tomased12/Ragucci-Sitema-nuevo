import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { PlusCircle, BookOpen, Users, DollarSign, Settings, HardDriveDownload, Crown, Wallet, Calendar, Package, CreditCard } from 'lucide-react';

export const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs: { id: TabType; label: string; icon: React.ReactNode; isBackup?: boolean }[] = [
    { id: 'carga', label: 'Nueva Venta', icon: <PlusCircle className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'registro', label: 'Registro', icon: <BookOpen className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'talleres', label: 'Talleres', icon: <Users className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'balance', label: 'Balance', icon: <DollarSign className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'saldos', label: 'Saldos', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'stock', label: 'Stock', icon: <Package className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'capitales', label: 'Caja', icon: <Wallet className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'crm', label: 'Clientes VIP', icon: <Crown className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'configuracion', label: 'Ajustes', icon: <Settings className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'backup', label: 'Backup', icon: <HardDriveDownload className="w-3.5 h-3.5 shrink-0" />, isBackup: true },
  ];

  return (
    <nav className="flex overflow-x-auto items-center gap-1 md:gap-1.5 mb-6 p-1.5 bg-white rounded-xl shadow-sm border border-ragucci-border scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-none md:flex-1 flex items-center justify-center gap-1.5 px-3 md:px-2 py-2.5 rounded-lg text-[11px] md:text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-ragucci-primary text-ragucci-gold shadow border-b-2 border-ragucci-gold'
                : tab.isBackup
                ? 'bg-ragucci-primary-light text-ragucci-gold-light hover:bg-ragucci-primary hover:text-ragucci-gold'
                : 'bg-ragucci-bg text-ragucci-primary hover:bg-ragucci-gold-light hover:text-ragucci-primary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
