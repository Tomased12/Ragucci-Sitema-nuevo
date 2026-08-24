import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppConfig } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { Save, Plus, Trash2, Package } from 'lucide-react';
import { formatMoney, parseMoney } from '../../utils/formatters';

export const ConfigForm: React.FC = () => {
  const { config, saveConfigData, setActiveTab } = useApp();
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });

  const handleBaseChange = (key: keyof AppConfig, val: number) => {
    setLocalConfig({ ...localConfig, [key]: val });
  };

  const handleAviosPriceChange = (key: 'percha' | 'funda' | 'bolsa' | 'bolsaplastica', val: number) => {
    setLocalConfig({
      ...localConfig,
      aviosPrecios: { ...localConfig.aviosPrecios, [key]: val }
    });
  };

  const handleArregloPriceChange = (modista: string, clave: string, price: number) => {
    setLocalConfig({
      ...localConfig,
      arreglosPrecios: {
        ...localConfig.arreglosPrecios,
        [modista]: {
          ...(localConfig.arreglosPrecios[modista] || {}),
          [clave]: price
        }
      }
    });
  };

  const handleSaveAll = async () => {
    try {
      await saveConfigData(localConfig);
      alert("Configuración guardada en la nube con éxito.");
    } catch (e) {
      alert("Error al guardar la configuración.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-ragucci-border">
      <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-4 inline-block tracking-wide">
        Configuración de Costos Base
      </h2>
      <p className="text-xs text-ragucci-primary-light mb-6">
        Modifica los precios base para Confección, Camiseros, Avios, Productos Terminados y Arreglos.
      </p>

      {/* Sastrería Base */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-3 inline-block">
          Confección Base (Sastre - Santiago)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {(['saco', 'ambo', 'traje', 'pantalon', 'sobretodo', 'smoking', 'chaleco'] as const).map((key) => (
            <div key={key}>
              <label className="block font-bold text-ragucci-primary-light mb-1 uppercase">{key} ($)</label>
              <MoneyInput
                value={localConfig[key] || 0}
                onValueChange={(val) => handleBaseChange(key, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Camiseros Base */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-3 inline-block">
          Camiseros (Precios Base)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-ragucci-primary-light mb-1">Diego ($)</label>
            <MoneyInput
              value={localConfig.diego || 0}
              onValueChange={(val) => handleBaseChange('diego', val)}
            />
          </div>
          <div>
            <label className="block font-bold text-ragucci-primary-light mb-1">Guillermo ($)</label>
            <MoneyInput
              value={localConfig.guillermo || 0}
              onValueChange={(val) => handleBaseChange('guillermo', val)}
            />
          </div>
        </div>
      </div>

      {/* Avíos Base */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-3 inline-block">
          Avios y Embalaje (Precios Unitarios Base)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {(['percha', 'funda', 'bolsa', 'bolsaplastica'] as const).map((key) => (
            <div key={key}>
              <label className="block font-bold text-ragucci-primary-light mb-1 uppercase">{key} ($)</label>
              <MoneyInput
                value={localConfig.aviosPrecios?.[key] || 0}
                onValueChange={(val) => handleAviosPriceChange(key, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* RTW Single Source of Truth Banner */}
      <div className="border border-ragucci-gold/40 p-5 rounded-lg mb-6 bg-amber-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase text-ragucci-primary flex items-center gap-2">
            <Package className="w-5 h-5 text-ragucci-gold" />
            <span>Productos Terminados / RTW (Gestionados Unificadamente en Stock)</span>
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Todos los productos terminados, precios de costo, precios de venta y desgloses por talle se administran ahora directamente desde la pestaña <strong>📦 Stock</strong>. El autocompletado en ventas y el descuento de stock se realizan automáticamente desde allí.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className="bg-ragucci-primary text-ragucci-gold font-extrabold px-4 py-2 rounded text-xs uppercase hover:bg-ragucci-primary-light transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          <span>📦 Ir al Inventario de Stock</span>
        </button>
      </div>

      {/* Arreglos por Modista */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-1 inline-block">
          Precios de Arreglos por Modista (María / Jesús / Arturo)
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Aquí configuras cuánto cobra cada modista por cada tipo de arreglo.
        </p>

        {['MARIA', 'JESUS', 'ARTURO'].map((modista) => {
          const modistaPrices = localConfig.arreglosPrecios?.[modista] || {};
          const sortedKeys = Object.keys(modistaPrices).sort();

          return (
            <div key={modista} className="mb-6">
              <h4 className="font-extrabold text-sm text-ragucci-primary border-b border-ragucci-gold pb-1 mb-3">
                {modista}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {sortedKeys.map((clave) => (
                  <div key={clave}>
                    <label className="block text-[11px] text-ragucci-primary-light font-semibold mb-1 truncate" title={clave}>
                      {clave} ($)
                    </label>
                    <MoneyInput
                      value={modistaPrices[clave]}
                      onValueChange={(val) => handleArregloPriceChange(modista, clave, val)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSaveAll}
        className="w-full py-3 bg-ragucci-gold hover:bg-ragucci-primary text-ragucci-primary hover:text-ragucci-gold font-extrabold text-sm uppercase tracking-wider rounded transition-colors shadow-md flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        <span>Guardar Configuración en la Nube</span>
      </button>
    </div>
  );
};
