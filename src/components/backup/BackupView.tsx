import React from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../utils/formatters';
import { Download, Cloud, HardDrive } from 'lucide-react';

export const BackupView: React.FC = () => {
  const { orders, config } = useApp();

  const exportBackup = () => {
    const data = {
      ragucci_orders: orders,
      ragucci_config: config
    };
    const dl = document.createElement('a');
    dl.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)));
    dl.setAttribute("download", `Ragucci_Cloud_Backup_${getTodayString()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Gestión de Datos y Backup (Cloud Sync Activo)
      </h2>
      <p className="text-xs text-ragucci-primary-light mb-6">
        Tus datos ya se guardan automáticamente en la nube de Firebase Firestore en tiempo real.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-ragucci-gold-light p-6 rounded-lg bg-ragucci-bg shadow-sm">
          <div className="flex items-center gap-2 text-ragucci-primary font-bold text-sm mb-2">
            <Download className="w-5 h-5 text-ragucci-gold" />
            <h3>📥 Exportar Backup Local</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Descarga un archivo JSON de respaldo adicional en tu computadora con todas las órdenes y configuraciones cargadas.
          </p>
          <button
            onClick={exportBackup}
            className="w-full py-3 bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase tracking-wider rounded transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>Descargar Backup JSON</span>
          </button>
        </div>

        <div className="border border-emerald-200 p-6 rounded-lg bg-emerald-50 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
            <Cloud className="w-5 h-5 text-emerald-600" />
            <h3>☁️ Estado de la Nube (Firebase)</h3>
          </div>
          <p className="text-xs text-emerald-700 mb-2">
            Proyecto activo: <strong className="font-mono">sastreria-ragucci</strong>
          </p>
          <p className="text-xs text-emerald-700">
            Total de órdenes en la nube: <strong className="font-bold">{orders.length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
