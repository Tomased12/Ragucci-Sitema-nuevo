import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../utils/formatters';
import { Download, Cloud, HardDrive, Upload, CheckCircle2 } from 'lucide-react';

export const BackupView: React.FC = () => {
  const { orders, config, saveOrderData, saveConfigData } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data.ragucci_orders || !Array.isArray(data.ragucci_orders)) {
          alert("El archivo seleccionado no es un respaldo válido de Sastrería Ragucci.");
          return;
        }

        if (!confirm(`¿Deseas restaurar e importar ${data.ragucci_orders.length} órdenes desde este archivo de respaldo a la nube?`)) {
          return;
        }

        for (const order of data.ragucci_orders) {
          await saveOrderData(order, order.firestoreId || undefined);
        }

        if (data.ragucci_config) {
          await saveConfigData(data.ragucci_config);
        }

        alert("✅ Backup restaurado con éxito en la nube de Firebase.");
      } catch (err) {
        alert("Error al leer el archivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-2 inline-block tracking-wide">
          Gestión de Datos, Respaldo e Importación (Cloud Sync Activo)
        </h2>
        <p className="text-xs text-ragucci-primary-light">
          Tus datos se sincronizan automáticamente en la nube de Firebase Firestore en tiempo real. Aquí también puedes descargar o restaurar respaldos en archivo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export Box */}
        <div className="border border-ragucci-gold-light p-6 rounded-lg bg-ragucci-bg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-ragucci-primary font-bold text-sm mb-2">
              <Download className="w-5 h-5 text-ragucci-gold" />
              <h3>📥 Exportar Backup Local</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Descarga un archivo JSON de respaldo en tu computadora o celular con todas las órdenes, ventas, Fichas de Medidas y configuraciones al día de hoy.
            </p>
          </div>
          <button
            onClick={exportBackup}
            className="w-full py-3 bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-xs uppercase tracking-wider rounded transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>Descargar Backup JSON</span>
          </button>
        </div>

        {/* Restore / Import Box */}
        <div className="border border-sky-300 p-6 rounded-lg bg-sky-50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm mb-2">
              <Upload className="w-5 h-5 text-sky-700" />
              <h3>📤 Restaurar / Cargar Backup</h3>
            </div>
            <p className="text-xs text-sky-800 mb-4">
              Si cambiaste de computadora o quieres recuperar un respaldo guardado previamente, selecciona el archivo JSON para restaurarlo en la nube.
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs uppercase tracking-wider rounded transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Seleccionar y Restaurar Backup</span>
          </button>
        </div>

        {/* Cloud Status Box */}
        <div className="border border-emerald-200 p-6 rounded-lg bg-emerald-50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <Cloud className="w-5 h-5 text-emerald-600" />
              <h3>☁️ Estado de la Nube (Firebase)</h3>
            </div>
            <p className="text-xs text-emerald-700 mb-2">
              Proyecto activo: <strong className="font-mono">sastreria-ragucci</strong>
            </p>
            <p className="text-xs text-emerald-700 mb-2">
              Total de órdenes en la nube: <strong className="font-bold text-emerald-900">{orders.length} órdenes</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100 p-2.5 rounded border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sincronización en tiempo real activa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
