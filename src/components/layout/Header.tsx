import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Smartphone, Moon, Sun, LogOut, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { loading, darkMode, toggleDarkMode, currentUser, logoutUser } = useApp();
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
    <header className="bg-ragucci-primary text-ragucci-gold-light py-5 px-6 md:py-6 md:px-8 text-center rounded-lg mb-6 border-b-4 border-ragucci-gold shadow-md relative overflow-hidden">
      {/* Background Semi-Transparent Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <img 
          src="/logo.png" 
          alt="" 
          className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-15 filter brightness-125 scale-110" 
        />
      </div>

      {/* Top Controls: Cloud Status + User Profile + Dark Mode Toggle */}
      <div className="absolute top-3 right-4 flex items-center gap-2 z-20 flex-wrap justify-end">
        {currentUser && (
          <button
            onClick={logoutUser}
            className="flex items-center gap-1.5 text-xs font-bold text-ragucci-gold bg-ragucci-primary-light/90 hover:bg-ragucci-gold/20 px-3 py-1 rounded-full border border-ragucci-gold/50 transition-all cursor-pointer shadow-sm group"
            title="Cambiar de usuario / Salir"
          >
            <span className="w-4 h-4 rounded-full bg-ragucci-gold text-ragucci-primary flex items-center justify-center text-[10px] font-black">
              {currentUser.initial}
            </span>
            <span className="group-hover:text-ragucci-gold-light">{currentUser.name}</span>
            <LogOut className="w-3.5 h-3.5 text-ragucci-gold/70 group-hover:text-ragucci-gold ml-0.5" />
          </button>
        )}

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
        <div className="absolute top-3 left-4 z-20">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary text-xs font-extrabold px-3 py-1 rounded-full shadow-md transition-all cursor-pointer animate-bounce"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Instalar App Ragucci</span>
          </button>
        </div>
      )}

      {/* Main Foreground Title */}
      <div className="relative z-10 py-1">
        <h1 className="font-display text-3xl md:text-5xl tracking-widest font-black uppercase text-ragucci-gold mb-1 drop-shadow-md">
          SASTRERÍA RAGUCCI
        </h1>
        <p className="text-ragucci-gold-light text-xs md:text-sm tracking-wider font-medium font-sans drop-shadow-sm">
          Sistema de Gestión Integral & Calculadora de Rentabilidad
        </p>
      </div>
    </header>
  );
};
