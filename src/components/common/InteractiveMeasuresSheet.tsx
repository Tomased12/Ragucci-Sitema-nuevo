import React, { useState } from 'react';
import { SacoDrawing, ChalecoDrawing, PantalonDrawing, CamisaDrawing } from './GarmentSvgDrawings';
import { ChevronDown, ChevronUp, CheckCircle, Ruler } from 'lucide-react';

import { ClientMeasurements } from '../../types';

interface InteractiveMeasuresSheetProps {
  measurements: Record<string, any> | ClientMeasurements;
  onChangeMeasurements?: (newMeasurements: any) => void;
  mode: 'edit' | 'view';
}

type GarmentType = 'saco' | 'chaleco' | 'pantalon' | 'camisa';

export const InteractiveMeasuresSheet: React.FC<InteractiveMeasuresSheetProps> = ({
  measurements = {},
  onChangeMeasurements,
  mode = 'edit'
}) => {
  const [activeGarment, setActiveGarment] = useState<GarmentType>('saco');
  const [showAll, setShowAll] = useState<boolean>(mode === 'edit');

  const handleChange = (key: string, value: string) => {
    if (onChangeMeasurements) {
      onChangeMeasurements({
        ...measurements,
        [key]: value
      });
    }
  };

  // Check if a garment has any measures populated
  const hasSacoMeasures = !!(measurements.sacoLargoMangas || measurements.sacoPecho || measurements.sacoCintura || measurements.sacoCadera || measurements.sacoAbdomen || measurements.sacoLargoTotal || measurements.sacoHombro || measurements.largoMangaSaco || measurements.pechoSaco);
  const hasChalecoMeasures = !!(measurements.chalecoPecho || measurements.chalecoLargoDelantero || measurements.chalecoLargoTrasero || measurements.chalecoEscote);
  const hasPantalonMeasures = !!(measurements.pantCintura || measurements.pantCadera || measurements.pantLargoConCintura || measurements.pantTiro || measurements.pantRodilla || measurements.pantBota || measurements.cinturaPant || measurements.largoPant);
  const hasCamisaMeasures = !!(measurements.camisaCuello || measurements.camisaEspalda || measurements.camisaPecho || measurements.camisaAbdomen || measurements.camisaCintura || measurements.camisaLargo || measurements.camisaManga || measurements.cuello);

  const garmentTabs: Array<{ id: GarmentType; label: string; icon: string; hasData: boolean; DrawingComponent: React.FC<any> }> = [
    { id: 'saco', label: 'SACO / BLAZER', icon: '🧥', hasData: hasSacoMeasures, DrawingComponent: SacoDrawing },
    { id: 'chaleco', label: 'CHALECO', icon: '🦺', hasData: hasChalecoMeasures, DrawingComponent: ChalecoDrawing },
    { id: 'pantalon', label: 'PANTALÓN', icon: '👖', hasData: hasPantalonMeasures, DrawingComponent: PantalonDrawing },
    { id: 'camisa', label: 'CAMISA', icon: '👔', hasData: hasCamisaMeasures, DrawingComponent: CamisaDrawing },
  ];

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Selector Cards Matrix (B&N Technical Illustrations) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {garmentTabs.map((g) => {
          const isSelected = activeGarment === g.id && !showAll;
          const DrawingComponent = g.DrawingComponent;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setActiveGarment(g.id);
                setShowAll(false);
              }}
              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2 relative overflow-hidden group ${
                isSelected
                  ? 'border-ragucci-gold bg-ragucci-primary text-ragucci-gold shadow-lg scale-[1.02]'
                  : g.hasData
                  ? 'border-emerald-500/70 bg-emerald-50/50 text-emerald-950 hover:border-emerald-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-ragucci-gold/60'
              }`}
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span>{g.icon}</span>
                  <span>{g.id}</span>
                </span>
                {g.hasData && (
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>Cargado</span>
                  </span>
                )}
              </div>

              {/* Technical Drawing SVG */}
              <div className="w-full py-1 px-2 flex items-center justify-center bg-white rounded-lg border border-gray-100 group-hover:scale-105 transition-transform">
                <DrawingComponent className="w-full h-24 text-gray-900" />
              </div>

              {/* Action Hint */}
              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-ragucci-gold text-ragucci-primary' : 'bg-gray-100 text-gray-600'
              }`}>
                {mode === 'edit' ? 'Ver / Editar Medidas' : 'Ver Medidas'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toggle View All Button */}
      <div className="flex justify-between items-center bg-ragucci-bg p-2.5 rounded-xl border border-ragucci-border">
        <div className="flex items-center gap-1.5 text-ragucci-primary font-bold text-xs">
          <Ruler className="w-4 h-4 text-ragucci-gold" />
          <span>Ficha de Medidas: <strong>{showAll ? 'Todas las prendas desplegadas' : activeGarment.toUpperCase()}</strong></span>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-extrabold text-ragucci-primary hover:text-ragucci-gold bg-white px-3 py-1 rounded-lg border border-ragucci-gold/40 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Ver de a una prenda</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Desplegar todas las prendas</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Content Panel */}
      <div className="space-y-4">
        {/* SACO SECTION */}
        {(showAll || activeGarment === 'saco') && (
          <div className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-ragucci-gold/30 pb-2">
              <span className="text-base">🧥</span>
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">SACO / BLAZER</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Mangas</label>
                  <input type="text" placeholder="Ej: 64" value={measurements.sacoLargoMangas || measurements.largoMangaSaco || ''} onChange={e => handleChange('sacoLargoMangas', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                  <input type="text" placeholder="Ej: 104" value={measurements.sacoPecho || measurements.pechoSaco || ''} onChange={e => handleChange('sacoPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                  <input type="text" placeholder="Ej: 92" value={measurements.sacoCintura || ''} onChange={e => handleChange('sacoCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cadera</label>
                  <input type="text" placeholder="Ej: 102" value={measurements.sacoCadera || ''} onChange={e => handleChange('sacoCadera', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Abdomen</label>
                  <input type="text" placeholder="Ej: 94" value={measurements.sacoAbdomen || ''} onChange={e => handleChange('sacoAbdomen', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Total</label>
                  <input type="text" placeholder="Ej: 75" value={measurements.sacoLargoTotal || ''} onChange={e => handleChange('sacoLargoTotal', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Hombro</label>
                  <input type="text" placeholder="Ej: 46" value={measurements.sacoHombro || ''} onChange={e => handleChange('sacoHombro', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (measurements.sacoLargoMangas || measurements.largoMangaSaco) && `Largo Mangas: ${measurements.sacoLargoMangas || measurements.largoMangaSaco}`,
                  (measurements.sacoPecho || measurements.pechoSaco) && `Pecho: ${measurements.sacoPecho || measurements.pechoSaco}`,
                  measurements.sacoCintura && `Cintura: ${measurements.sacoCintura}`,
                  measurements.sacoCadera && `Cadera: ${measurements.sacoCadera}`,
                  measurements.sacoAbdomen && `Abdomen: ${measurements.sacoAbdomen}`,
                  measurements.sacoLargoTotal && `Largo total: ${measurements.sacoLargoTotal}`,
                  measurements.sacoHombro && `Hombro: ${measurements.sacoHombro}`,
                ].filter(Boolean).map((item, idx) => (
                  <span key={idx} className="bg-amber-50 text-ragucci-primary font-bold px-2.5 py-1 rounded-lg border border-ragucci-gold/30">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHALECO SECTION */}
        {(showAll || activeGarment === 'chaleco') && (
          <div className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-ragucci-gold/30 pb-2">
              <span className="text-base">🦺</span>
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">CHALECO</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                  <input type="text" placeholder="Ej: 102" value={measurements.chalecoPecho || ''} onChange={e => handleChange('chalecoPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Delantero</label>
                  <input type="text" placeholder="Ej: 62" value={measurements.chalecoLargoDelantero || ''} onChange={e => handleChange('chalecoLargoDelantero', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Trasero</label>
                  <input type="text" placeholder="Ej: 56" value={measurements.chalecoLargoTrasero || ''} onChange={e => handleChange('chalecoLargoTrasero', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Escote</label>
                  <input type="text" placeholder="Ej: 32" value={measurements.chalecoEscote || ''} onChange={e => handleChange('chalecoEscote', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  measurements.chalecoPecho && `Pecho: ${measurements.chalecoPecho}`,
                  measurements.chalecoLargoDelantero && `Largo delantero: ${measurements.chalecoLargoDelantero}`,
                  measurements.chalecoLargoTrasero && `Largo trasero: ${measurements.chalecoLargoTrasero}`,
                  measurements.chalecoEscote && `Escote: ${measurements.chalecoEscote}`,
                ].filter(Boolean).map((item, idx) => (
                  <span key={idx} className="bg-amber-50 text-ragucci-primary font-bold px-2.5 py-1 rounded-lg border border-ragucci-gold/30">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANTALÓN SECTION */}
        {(showAll || activeGarment === 'pantalon') && (
          <div className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-ragucci-gold/30 pb-2">
              <span className="text-base">👖</span>
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">PANTALÓN</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                  <input type="text" placeholder="Ej: 88" value={measurements.pantCintura || measurements.cinturaPant || ''} onChange={e => handleChange('pantCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cadera</label>
                  <input type="text" placeholder="Ej: 100" value={measurements.pantCadera || measurements.caderaPant || ''} onChange={e => handleChange('pantCadera', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo con Cintura</label>
                  <input type="text" placeholder="Ej: 102" value={measurements.pantLargoConCintura || measurements.largoPant || ''} onChange={e => handleChange('pantLargoConCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tiro</label>
                  <input type="text" placeholder="Ej: 26" value={measurements.pantTiro || measurements.tiro || ''} onChange={e => handleChange('pantTiro', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Rodilla</label>
                  <input type="text" placeholder="Ej: 24" value={measurements.pantRodilla || ''} onChange={e => handleChange('pantRodilla', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bota</label>
                  <input type="text" placeholder="Ej: 19" value={measurements.pantBota || measurements.botamanga || ''} onChange={e => handleChange('pantBota', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (measurements.pantCintura || measurements.cinturaPant) && `Cintura: ${measurements.pantCintura || measurements.cinturaPant}`,
                  (measurements.pantCadera || measurements.caderaPant) && `Cadera: ${measurements.pantCadera || measurements.caderaPant}`,
                  (measurements.pantLargoConCintura || measurements.largoPant) && `Largo con cintura: ${measurements.pantLargoConCintura || measurements.largoPant}`,
                  (measurements.pantTiro || measurements.tiro) && `Tiro: ${measurements.pantTiro || measurements.tiro}`,
                  measurements.pantRodilla && `Rodilla: ${measurements.pantRodilla}`,
                  (measurements.pantBota || measurements.botamanga) && `Bota: ${measurements.pantBota || measurements.botamanga}`,
                ].filter(Boolean).map((item, idx) => (
                  <span key={idx} className="bg-amber-50 text-ragucci-primary font-bold px-2.5 py-1 rounded-lg border border-ragucci-gold/30">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAMISA SECTION */}
        {(showAll || activeGarment === 'camisa') && (
          <div className="bg-white p-4 rounded-xl border-2 border-ragucci-gold/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-ragucci-gold/30 pb-2">
              <span className="text-base">👔</span>
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">CAMISA</h4>
            </div>

            {mode === 'edit' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cuello</label>
                    <input type="text" placeholder="Ej: 41" value={measurements.camisaCuello || measurements.cuello || ''} onChange={e => handleChange('camisaCuello', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Espalda</label>
                    <input type="text" placeholder="Ej: 45" value={measurements.camisaEspalda || ''} onChange={e => handleChange('camisaEspalda', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                    <input type="text" placeholder="Ej: 104" value={measurements.camisaPecho || ''} onChange={e => handleChange('camisaPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Abdomen</label>
                    <input type="text" placeholder="Ej: 92" value={measurements.camisaAbdomen || ''} onChange={e => handleChange('camisaAbdomen', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                    <input type="text" placeholder="Ej: 90" value={measurements.camisaCintura || measurements.cinturaCamisa || ''} onChange={e => handleChange('camisaCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo</label>
                    <input type="text" placeholder="Ej: 78" value={measurements.camisaLargo || ''} onChange={e => handleChange('camisaLargo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Manga</label>
                    <input type="text" placeholder="Ej: 65" value={measurements.camisaManga || measurements.largoMangaCamisa || ''} onChange={e => handleChange('camisaManga', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bicep</label>
                    <input type="text" placeholder="Ej: 34" value={measurements.camisaBicep || ''} onChange={e => handleChange('camisaBicep', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Antebrazo</label>
                    <input type="text" placeholder="Ej: 28" value={measurements.camisaAntebrazo || ''} onChange={e => handleChange('camisaAntebrazo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Puño Izq</label>
                    <input type="text" placeholder="Ej: 24" value={measurements.camisaPunoIzq || measurements.puno || ''} onChange={e => handleChange('camisaPunoIzq', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Puño Der</label>
                    <input type="text" placeholder="Ej: 24.5" value={measurements.camisaPunoDer || measurements.puno || ''} onChange={e => handleChange('camisaPunoDer', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tipo de Cuello</label>
                    <input type="text" placeholder="Ej: Italiano / Francés" value={measurements.camisaTipoCuello || ''} onChange={e => handleChange('camisaTipoCuello', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tipo de Puño</label>
                    <input type="text" placeholder="Ej: Botón / Doble Gemelo" value={measurements.camisaTipoPuno || ''} onChange={e => handleChange('camisaTipoPuno', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Monograma</label>
                    <input type="text" placeholder="Ej: E.A. (Hilo Azul)" value={measurements.camisaMonograma || ''} onChange={e => handleChange('camisaMonograma', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (measurements.camisaCuello || measurements.cuello) && `Cuello: ${measurements.camisaCuello || measurements.cuello}`,
                  measurements.camisaEspalda && `Espalda: ${measurements.camisaEspalda}`,
                  measurements.camisaPecho && `Pecho: ${measurements.camisaPecho}`,
                  measurements.camisaAbdomen && `Abdomen: ${measurements.camisaAbdomen}`,
                  (measurements.camisaCintura || measurements.cinturaCamisa) && `Cintura: ${measurements.camisaCintura || measurements.cinturaCamisa}`,
                  measurements.camisaLargo && `Largo: ${measurements.camisaLargo}`,
                  (measurements.camisaManga || measurements.largoMangaCamisa) && `Manga: ${measurements.camisaManga || measurements.largoMangaCamisa}`,
                  measurements.camisaBicep && `Bicep: ${measurements.camisaBicep}`,
                  measurements.camisaAntebrazo && `Antebrazo: ${measurements.camisaAntebrazo}`,
                  (measurements.camisaPunoIzq || measurements.puno) && `Puño Izq: ${measurements.camisaPunoIzq || measurements.puno}`,
                  (measurements.camisaPunoDer || measurements.puno) && `Puño Der: ${measurements.camisaPunoDer || measurements.puno}`,
                  measurements.camisaTipoCuello && `Tipo de cuello: ${measurements.camisaTipoCuello}`,
                  measurements.camisaTipoPuno && `Tipo de puño: ${measurements.camisaTipoPuno}`,
                  measurements.camisaMonograma && `Monograma: ${measurements.camisaMonograma}`,
                ].filter(Boolean).map((item, idx) => (
                  <span key={idx} className="bg-amber-50 text-ragucci-primary font-bold px-2.5 py-1 rounded-lg border border-ragucci-gold/30">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POSTURA & OBSERVACIONES */}
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
          <label className="block text-xs font-black text-amber-900 uppercase tracking-wide mb-1">
            Observaciones de Postura & Calce:
          </label>
          {mode === 'edit' ? (
            <textarea
              rows={2}
              placeholder="Ej: Hombro izquierdo caído -2cm, postura erguida, caída de cintura ligera..."
              value={measurements.posturaNotes || ''}
              onChange={e => handleChange('posturaNotes', e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg text-xs font-medium focus:outline-none focus:border-ragucci-gold bg-white"
            />
          ) : (
            <p className="text-xs text-amber-950 font-bold italic">
              {measurements.posturaNotes || 'Sin observaciones adicionales de postura.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
