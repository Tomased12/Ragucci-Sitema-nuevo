import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppConfig } from '../../types';
import { MoneyInput } from '../common/MoneyInput';
import { Save, Plus, Trash2 } from 'lucide-react';
import { formatMoney, parseMoney } from '../../utils/formatters';

export const ConfigForm: React.FC = () => {
  const { config, saveConfigData } = useApp();
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });

  const [newRtwName, setNewRtwName] = useState('');
  const [newRtwPrice, setNewRtwPrice] = useState(0);

  const handleBaseChange = (key: keyof AppConfig, val: number) => {
    setLocalConfig({ ...localConfig, [key]: val });
  };

  const handleAviosPriceChange = (key: 'percha' | 'funda' | 'bolsa' | 'bolsaplastica', val: number) => {
    setLocalConfig({
      ...localConfig,
      aviosPrecios: { ...localConfig.aviosPrecios, [key]: val }
    });
  };

  const handleRtwPriceChange = (name: string, price: number) => {
    setLocalConfig({
      ...localConfig,
      rtwPrecios: { ...localConfig.rtwPrecios, [name]: price }
    });
  };

  const handleRemoveRtw = (name: string) => {
    const updatedRtw = { ...localConfig.rtwPrecios };
    delete updatedRtw[name];
    setLocalConfig({ ...localConfig, rtwPrecios: updatedRtw });
  };

  const handleAddRtw = () => {
    if (!newRtwName.trim()) {
      alert("Ingrese el nombre del producto RTW.");
      return;
    }
    const upperName = newRtwName.trim().toUpperCase();
    setLocalConfig({
      ...localConfig,
      rtwPrecios: { ...localConfig.rtwPrecios, [upperName]: newRtwPrice }
    });
    setNewRtwName('');
    setNewRtwPrice(0);
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

      {/* RTW Base Catalog */}
      <div className="border border-ragucci-gold-light p-5 rounded-lg mb-6 bg-white">
        <h3 className="text-sm font-extrabold uppercase text-ragucci-primary border-b-2 border-ragucci-gold pb-1 mb-1 inline-block">
          Productos Terminados / RTW (Precios Base)
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Agrega o modifica productos terminados frecuentes para el autocompletado en el sistema.
        </p>

        <div className="space-y-2 mb-4">
          {Object.keys(localConfig.rtwPrecios || {}).map((name) => (
            <div key={name} className="flex gap-2 items-center text-xs">
              <input
                type="text"
                disabled
                value={name}
                className="flex-2 p-2 bg-gray-100 border border-gray-300 rounded font-bold"
              />
              <div className="flex-1">
                <MoneyInput
                  value={localConfig.rtwPrecios[name]}
                  onValueChange={(val) => handleRtwPriceChange(name, val)}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRtw(name)}
                className="bg-ragucci-red text-white p-2 rounded hover:bg-red-900 font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center pt-3 border-t border-dashed border-gray-200">
          <input
            type="text"
            placeholder="Nombre (ej: Moño)"
            value={newRtwName}
            onChange={(e) => setNewRtwName(e.target.value)}
            className="flex-2 p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold"
          />
          <div className="flex-1">
            <MoneyInput
              value={newRtwPrice}
              onValueChange={(val) => setNewRtwPrice(val)}
              placeholder="Precio ($)"
            />
          </div>
          <button
            type="button"
            onClick={handleAddRtw}
            className="bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light text-xs font-bold py-2 px-3 rounded flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar RTW</span>
          </button>
        </div>
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
