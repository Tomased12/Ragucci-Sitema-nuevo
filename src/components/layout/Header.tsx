import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Smartphone, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { loading, darkMode, toggleDarkMode } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="bg-ragucci-primary text-ragucci-gold-light p-6 md:p-8 text-center rounded-lg mb-6 border-b-4 border-ragucci-gold shadow-md relative overflow-hidden">
      {/* Top Controls: Cloud Status + Dark Mode Toggle */}
      <div className="absolute top-3 right-4 flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-xs font-bold text-ragucci-gold bg-ragucci-primary-light/80 hover:bg-ragucci-primary px-3 py-1 rounded-full border border-ragucci-gold/40 transition-colors cursor-pointer shadow-sm"
          title="Cambiar tema visual (Modo Oscuro / Claro)"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-ragucci-gold" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-ragucci-gold bg-ragucci-primary-light/50 px-3 py-1 rounded-full border border-ragucci-gold/30">
          {loading ? (
            <>
              <CloudOff className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Sync</span>
            </>
          )}
        </div>
      </div>

      {deferredPrompt && (
        <div className="absolute top-3 left-4">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary text-xs font-extrabold px-3 py-1 rounded-full shadow-md transition-all cursor-pointer animate-bounce"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Instalar App Ragucci</span>
          </button>
        </div>
      )}

      <h1 className="font-display text-3xl md:text-5xl tracking-widest font-black uppercase text-ragucci-gold mb-1 drop-shadow-sm">
        SASTRERÍA RAGUCCI
      </h1>
      <p className="text-ragucci-gold-light text-xs md:text-sm tracking-wider font-medium font-sans">
        Sistema de Gestión Integral & Calculadora de Rentabilidad
      </p>
    </header>
  );
};
