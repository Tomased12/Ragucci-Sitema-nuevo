import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { PlusCircle, BookOpen, Users, DollarSign, Settings, HardDriveDownload, Crown, Wallet, Calendar } from 'lucide-react';

export const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs: { id: TabType; label: string; icon: React.ReactNode; isBackup?: boolean }[] = [
    { id: 'carga', label: 'Nueva Orden / Venta', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'registro', label: 'Registro General', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'talleres', label: 'Pagos a Talleres', icon: <Users className="w-4 h-4" /> },
    { id: 'balance', label: 'Balance Financiero', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'agenda', label: 'Agenda & Calendario', icon: <Calendar className="w-4 h-4" /> },
    { id: 'capitales', label: 'Control de Capitales', icon: <Wallet className="w-4 h-4" /> },
    { id: 'crm', label: 'Clientes VIP (CRM)', icon: <Crown className="w-4 h-4" /> },
    { id: 'configuracion', label: 'Configuración (M.O)', icon: <Settings className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup', icon: <HardDriveDownload className="w-4 h-4" />, isBackup: true },
  ];

  return (
    <nav className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-thin scrollbar-thumb-ragucci-gold">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-ragucci-primary text-ragucci-gold shadow-md border-b-2 border-ragucci-gold'
                : tab.isBackup
                ? 'bg-ragucci-primary-light text-ragucci-gold-light hover:bg-ragucci-primary hover:text-ragucci-gold'
                : 'bg-ragucci-gold-light text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold'
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
