import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { loading } = useApp();

  return (
    <header className="bg-ragucci-primary text-ragucci-gold-light p-6 md:p-8 text-center rounded-lg mb-6 border-b-4 border-ragucci-gold shadow-md relative overflow-hidden">
      <div className="absolute top-3 right-4 flex items-center gap-2 text-xs font-semibold text-ragucci-gold bg-ragucci-primary-light/50 px-3 py-1 rounded-full border border-ragucci-gold/30">
        {loading ? (
          <>
            <CloudOff className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Sincronizando...</span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Sync Activo (Firebase)</span>
          </>
        )}
      </div>

      <h1 className="font-bodoni text-2xl md:text-4xl tracking-widest font-black uppercase text-ragucci-gold mb-1 drop-shadow-sm">
        SASTRERÍA RAGUCCI
      </h1>
      <p className="text-ragucci-gold-light text-xs md:text-sm tracking-wider font-medium">
        Sistema de Gestión Integral & Calculadora de Rentabilidad
      </p>
    </header>
  );
};
