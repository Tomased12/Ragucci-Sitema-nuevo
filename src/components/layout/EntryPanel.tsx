import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserInitial } from '../../types';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const EntryPanel: React.FC = () => {
  const { availableUsers, loginUser } = useApp();
  const [selectedUser, setSelectedUser] = useState<UserInitial>('L');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');

  const activeProfile = availableUsers.find((u) => u.initial === selectedUser) || availableUsers[0];

  const handleUserSelect = (initial: UserInitial) => {
    setSelectedUser(initial);
    setError('');
    setPassword('');
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      loginUser(selectedUser, password, rememberDevice);
      setPassword('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-ragucci-primary flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <img src="/logo.png" alt="" className="w-[500px] h-[500px] object-contain filter brightness-150" />
      </div>

      {/* Decorative Glow Circles */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-ragucci-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Main Card */}
        <div className="rounded-3xl border-2 border-ragucci-gold/40 bg-ragucci-primary-light/95 p-6 md:p-8 shadow-2xl backdrop-blur-md text-ragucci-gold">
          
          {/* Header Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ragucci-gold/10 border border-ragucci-gold/30 text-ragucci-gold-light text-xs font-semibold tracking-widest uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-ragucci-gold" />
              <span>Panel de Entrada</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest font-display text-ragucci-gold drop-shadow-md">
              RAGUCCI
            </h1>
            <p className="mt-2 text-sm text-ragucci-gold-light/80 tracking-wide font-medium">
              Selecciona tu usuario para ingresar
            </p>
          </div>

          {/* User Selection Cards */}
          <div className="grid grid-cols-3 gap-3.5 mb-8">
            {availableUsers.map((user) => {
              const isSelected = selectedUser === user.initial;
              return (
                <button
                  key={user.initial}
                  type="button"
                  onClick={() => handleUserSelect(user.initial)}
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-ragucci-gold bg-ragucci-gold/20 text-ragucci-gold shadow-lg shadow-ragucci-gold/10 scale-105'
                      : 'border-ragucci-gold/30 bg-ragucci-primary/50 text-ragucci-gold-light/70 hover:border-ragucci-gold/60 hover:bg-ragucci-primary/80 hover:text-ragucci-gold-light'
                  }`}
                >
                  {/* Circle Avatar / Badge */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mb-2 transition-all ${
                      isSelected
                        ? 'bg-ragucci-gold text-ragucci-primary shadow-md ring-4 ring-ragucci-gold/30'
                        : 'bg-ragucci-primary-light text-ragucci-gold border border-ragucci-gold/40 group-hover:scale-110'
                    }`}
                  >
                    {user.initial}
                  </div>

                  <span className="font-bold text-base md:text-lg tracking-wide">
                    {user.name}
                  </span>

                  {isSelected && (
                    <span className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-ragucci-gold bg-ragucci-gold/20 px-2 py-0.5 rounded-full border border-ragucci-gold/40">
                      <ShieldCheck className="w-3 h-3" /> Seleccionado
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Password & Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-[0.2em] text-ragucci-gold-light mb-2 flex items-center justify-between">
                <span>Contraseña de {activeProfile.name}</span>
                <span className="text-[10px] normal-case font-normal opacity-70">
                  (Predeterminada: "{activeProfile.name}")
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ragucci-gold/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Ingresa la contraseña de ${activeProfile.name}`}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl border-2 border-ragucci-gold/40 bg-ragucci-primary/70 text-ragucci-gold placeholder:text-ragucci-gold/40 focus:border-ragucci-gold focus:outline-none text-sm transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ragucci-gold/60 hover:text-ragucci-gold transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Device Checkbox */}
            <div className="flex items-center justify-between text-xs text-ragucci-gold-light">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded accent-ragucci-gold cursor-pointer"
                />
                <span>Recordar sesión en este dispositivo</span>
              </label>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3 rounded-xl border border-red-500/50 bg-red-500/10 text-red-200 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            {/* Enter Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-ragucci-gold text-ragucci-primary font-extrabold text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-ragucci-gold-light active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Ingresar como {activeProfile.name}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-ragucci-gold/40 mt-6 tracking-widest font-medium">
          SASTRERÍA RAGUCCI &copy; {new Date().getFullYear()} — SISTEMA PRIVADO
        </p>
      </div>
    </div>
  );
};
