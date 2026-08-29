import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Ruler, Plus, Trash2, User, Edit2 } from 'lucide-react';
import { ClientMeasurements, ClientMeasurementProfile } from '../../types';

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

  // Multi-Profile State Initialization
  const getInitialProfiles = (): ClientMeasurementProfile[] => {
    if (measurements.profiles && Array.isArray(measurements.profiles) && measurements.profiles.length > 0) {
      return measurements.profiles;
    }
    return [{ id: 'p1', profileName: 'Medidas Principales', measurements: { ...measurements } }];
  };

  const [profilesList, setProfilesList] = useState<ClientMeasurementProfile[]>(getInitialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => profilesList[0]?.id || 'p1');
  const [editingProfileNameId, setEditingProfileNameId] = useState<string | null>(null);

  // Sync internal profiles list if external measurements.profiles changes
  useEffect(() => {
    if (measurements.profiles && Array.isArray(measurements.profiles) && measurements.profiles.length > 0) {
      setProfilesList(measurements.profiles);
      if (!measurements.profiles.some(p => p.id === activeProfileId)) {
        setActiveProfileId(measurements.profiles[0].id);
      }
    }
  }, [measurements.profiles]);

  // Current Active Profile
  const activeProfile = profilesList.find(p => p.id === activeProfileId) || profilesList[0] || { id: 'p1', profileName: 'Medidas Principales', measurements: {} };
  const activeMeasures = activeProfile.measurements || {};

  const handleFieldChange = (key: string, value: string) => {
    const updatedProfiles = profilesList.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          measurements: {
            ...p.measurements,
            [key]: value
          }
        };
      }
      return p;
    });

    setProfilesList(updatedProfiles);

    if (onChangeMeasurements) {
      const activeUpdated = updatedProfiles.find(p => p.id === activeProfileId)?.measurements || {};
      const primaryMeasures = updatedProfiles[0]?.measurements || {};

      onChangeMeasurements({
        ...primaryMeasures,
        ...activeUpdated,
        profiles: updatedProfiles
      });
    }
  };

  const addProfile = () => {
    const newId = `p_${Date.now()}`;
    const newProfileName = `Perfil ${profilesList.length + 1} (ej: Hijo, Saco 2)`;
    const newProfile: ClientMeasurementProfile = {
      id: newId,
      profileName: newProfileName,
      measurements: {}
    };

    const updated = [...profilesList, newProfile];
    setProfilesList(updated);
    setActiveProfileId(newId);
    setEditingProfileNameId(newId);

    if (onChangeMeasurements) {
      onChangeMeasurements({
        ...(updated[0]?.measurements || {}),
        profiles: updated
      });
    }
  };

  const deleteProfile = (profileId: string) => {
    if (profilesList.length <= 1) return;
    const updated = profilesList.filter(p => p.id !== profileId);
    setProfilesList(updated);
    const nextActive = updated[0]?.id || 'p1';
    setActiveProfileId(nextActive);

    if (onChangeMeasurements) {
      onChangeMeasurements({
        ...(updated[0]?.measurements || {}),
        profiles: updated
      });
    }
  };

  const renameProfile = (profileId: string, newName: string) => {
    const updated = profilesList.map(p => p.id === profileId ? { ...p, profileName: newName } : p);
    setProfilesList(updated);

    if (onChangeMeasurements) {
      onChangeMeasurements({
        ...(updated[0]?.measurements || {}),
        profiles: updated
      });
    }
  };

  // Check if a garment has any measures populated in the active profile
  const hasSacoMeasures = !!(activeMeasures.sacoLargoMangas || activeMeasures.sacoPecho || activeMeasures.sacoCintura || activeMeasures.sacoCadera || activeMeasures.sacoAbdomen || activeMeasures.sacoLargoTotal || activeMeasures.sacoHombro || activeMeasures.largoMangaSaco || activeMeasures.pechoSaco);
  const hasChalecoMeasures = !!(activeMeasures.chalecoPecho || activeMeasures.chalecoLargoDelantero || activeMeasures.chalecoLargoTrasero || activeMeasures.chalecoEscote);
  const hasPantalonMeasures = !!(activeMeasures.pantCintura || activeMeasures.pantCadera || activeMeasures.pantLargoConCintura || activeMeasures.pantTiro || activeMeasures.pantRodilla || activeMeasures.pantBota || activeMeasures.cinturaPant || activeMeasures.largoPant);
  const hasCamisaMeasures = !!(activeMeasures.camisaCuello || activeMeasures.camisaEspalda || activeMeasures.camisaPecho || activeMeasures.camisaAbdomen || activeMeasures.camisaCintura || activeMeasures.camisaLargo || activeMeasures.camisaManga || activeMeasures.cuello);

  const garmentTabs: Array<{ id: GarmentType; label: string; icon: string; hasData: boolean; imageSrc: string }> = [
    { id: 'saco', label: 'SACO / BLAZER', icon: '🧥', hasData: hasSacoMeasures, imageSrc: '/garments/saco.png' },
    { id: 'chaleco', label: 'CHALECO', icon: '🦺', hasData: hasChalecoMeasures, imageSrc: '/garments/chaleco.png' },
    { id: 'pantalon', label: 'PANTALÓN', icon: '👖', hasData: hasPantalonMeasures, imageSrc: '/garments/pantalon.png' },
    { id: 'camisa', label: 'CAMISA', icon: '👔', hasData: hasCamisaMeasures, imageSrc: '/garments/camisa.png' },
  ];

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* MULTI-PROFILE SELECTOR BAR */}
      <div className="bg-ragucci-primary/5 p-3 rounded-xl border border-ragucci-gold/40 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase text-ragucci-primary flex items-center gap-1.5 tracking-wider">
            <User className="w-4 h-4 text-ragucci-gold" />
            <span>Fichas de Medidas por Persona / Prenda ({profilesList.length})</span>
          </span>

          {mode === 'edit' && (
            <button
              type="button"
              onClick={addProfile}
              className="bg-ragucci-primary hover:bg-ragucci-primary-light text-ragucci-gold text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar Ficha (ej: Hijo, Amigo, Saco 2)</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {profilesList.map((p) => {
            const isActive = p.id === activeProfileId;

            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-ragucci-primary text-ragucci-gold border-ragucci-gold shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-ragucci-gold/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveProfileId(p.id)}
                  className="flex items-center gap-1.5 cursor-pointer font-extrabold"
                >
                  <span>👤</span>
                  <span>{p.profileName}</span>
                </button>

                {mode === 'edit' && (
                  <div className="flex items-center gap-1 ml-1 border-l border-gray-300/40 pl-1">
                    <button
                      type="button"
                      onClick={() => setEditingProfileNameId(p.id === editingProfileNameId ? null : p.id)}
                      className="text-gray-400 hover:text-ragucci-gold p-0.5"
                      title="Renombrar perfil"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {profilesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteProfile(p.id)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                        title="Eliminar esta ficha de medidas"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Rename Input Box */}
        {editingProfileNameId && mode === 'edit' && (
          <div className="flex items-center gap-2 pt-2 border-t border-ragucci-gold/30">
            <span className="text-[11px] font-bold text-gray-600">Nombre de la ficha:</span>
            <input
              type="text"
              value={profilesList.find(p => p.id === editingProfileNameId)?.profileName || ''}
              onChange={(e) => renameProfile(editingProfileNameId, e.target.value)}
              placeholder="Ej: Matías (Padre), Luca (Hijo), Saco Azul..."
              className="text-xs p-1.5 border border-ragucci-gold rounded bg-white font-bold w-64 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setEditingProfileNameId(null)}
              className="bg-ragucci-gold text-ragucci-primary font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer"
            >
              Listo
            </button>
          </div>
        )}
      </div>

      {/* Selector Cards Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {garmentTabs.map((g) => {
          const isSelected = activeGarment === g.id && !showAll;

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

              {/* Exact Technical B&N Image */}
              <div className="w-full py-1.5 px-2 flex items-center justify-center bg-white rounded-lg border border-gray-100 group-hover:scale-105 transition-transform overflow-hidden">
                <img 
                  src={g.imageSrc} 
                  alt={g.label} 
                  className="w-full h-28 object-contain filter brightness-95" 
                />
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
          <span>Ficha de <strong>{activeProfile.profileName}</strong>: {showAll ? 'Todas las prendas desplegadas' : activeGarment.toUpperCase()}</span>
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
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">SACO / BLAZER ({activeProfile.profileName})</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Mangas</label>
                  <input type="text" placeholder="Ej: 64" value={activeMeasures.sacoLargoMangas || activeMeasures.largoMangaSaco || ''} onChange={e => handleFieldChange('sacoLargoMangas', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                  <input type="text" placeholder="Ej: 104" value={activeMeasures.sacoPecho || activeMeasures.pechoSaco || ''} onChange={e => handleFieldChange('sacoPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                  <input type="text" placeholder="Ej: 92" value={activeMeasures.sacoCintura || ''} onChange={e => handleFieldChange('sacoCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cadera</label>
                  <input type="text" placeholder="Ej: 102" value={activeMeasures.sacoCadera || ''} onChange={e => handleFieldChange('sacoCadera', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Abdomen</label>
                  <input type="text" placeholder="Ej: 94" value={activeMeasures.sacoAbdomen || ''} onChange={e => handleFieldChange('sacoAbdomen', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Total</label>
                  <input type="text" placeholder="Ej: 75" value={activeMeasures.sacoLargoTotal || ''} onChange={e => handleFieldChange('sacoLargoTotal', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Hombro</label>
                  <input type="text" placeholder="Ej: 46" value={activeMeasures.sacoHombro || ''} onChange={e => handleFieldChange('sacoHombro', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (activeMeasures.sacoLargoMangas || activeMeasures.largoMangaSaco) && `Largo Mangas: ${activeMeasures.sacoLargoMangas || activeMeasures.largoMangaSaco}`,
                  (activeMeasures.sacoPecho || activeMeasures.pechoSaco) && `Pecho: ${activeMeasures.sacoPecho || activeMeasures.pechoSaco}`,
                  activeMeasures.sacoCintura && `Cintura: ${activeMeasures.sacoCintura}`,
                  activeMeasures.sacoCadera && `Cadera: ${activeMeasures.sacoCadera}`,
                  activeMeasures.sacoAbdomen && `Abdomen: ${activeMeasures.sacoAbdomen}`,
                  activeMeasures.sacoLargoTotal && `Largo total: ${activeMeasures.sacoLargoTotal}`,
                  activeMeasures.sacoHombro && `Hombro: ${activeMeasures.sacoHombro}`,
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
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">CHALECO ({activeProfile.profileName})</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                  <input type="text" placeholder="Ej: 102" value={activeMeasures.chalecoPecho || ''} onChange={e => handleFieldChange('chalecoPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Delantero</label>
                  <input type="text" placeholder="Ej: 62" value={activeMeasures.chalecoLargoDelantero || ''} onChange={e => handleFieldChange('chalecoLargoDelantero', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo Trasero</label>
                  <input type="text" placeholder="Ej: 56" value={activeMeasures.chalecoLargoTrasero || ''} onChange={e => handleFieldChange('chalecoLargoTrasero', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Escote</label>
                  <input type="text" placeholder="Ej: 32" value={activeMeasures.chalecoEscote || ''} onChange={e => handleFieldChange('chalecoEscote', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  activeMeasures.chalecoPecho && `Pecho: ${activeMeasures.chalecoPecho}`,
                  activeMeasures.chalecoLargoDelantero && `Largo delantero: ${activeMeasures.chalecoLargoDelantero}`,
                  activeMeasures.chalecoLargoTrasero && `Largo trasero: ${activeMeasures.chalecoLargoTrasero}`,
                  activeMeasures.chalecoEscote && `Escote: ${activeMeasures.chalecoEscote}`,
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
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">PANTALÓN ({activeProfile.profileName})</h4>
            </div>

            {mode === 'edit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                  <input type="text" placeholder="Ej: 88" value={activeMeasures.pantCintura || activeMeasures.cinturaPant || ''} onChange={e => handleFieldChange('pantCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cadera</label>
                  <input type="text" placeholder="Ej: 100" value={activeMeasures.pantCadera || activeMeasures.caderaPant || ''} onChange={e => handleFieldChange('pantCadera', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo con Cintura</label>
                  <input type="text" placeholder="Ej: 105" value={activeMeasures.pantLargoConCintura || activeMeasures.largoPant || ''} onChange={e => handleFieldChange('pantLargoConCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tiro</label>
                  <input type="text" placeholder="Ej: 28" value={activeMeasures.pantTiro || activeMeasures.tiro || ''} onChange={e => handleFieldChange('pantTiro', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Rodilla</label>
                  <input type="text" placeholder="Ej: 24" value={activeMeasures.pantRodilla || ''} onChange={e => handleFieldChange('pantRodilla', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bota</label>
                  <input type="text" placeholder="Ej: 19" value={activeMeasures.pantBota || activeMeasures.botamanga || ''} onChange={e => handleFieldChange('pantBota', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (activeMeasures.pantCintura || activeMeasures.cinturaPant) && `Cintura: ${activeMeasures.pantCintura || activeMeasures.cinturaPant}`,
                  (activeMeasures.pantCadera || activeMeasures.caderaPant) && `Cadera: ${activeMeasures.pantCadera || activeMeasures.caderaPant}`,
                  (activeMeasures.pantLargoConCintura || activeMeasures.largoPant) && `Largo con cintura: ${activeMeasures.pantLargoConCintura || activeMeasures.largoPant}`,
                  (activeMeasures.pantTiro || activeMeasures.tiro) && `Tiro: ${activeMeasures.pantTiro || activeMeasures.tiro}`,
                  activeMeasures.pantRodilla && `Rodilla: ${activeMeasures.pantRodilla}`,
                  (activeMeasures.pantBota || activeMeasures.botamanga) && `Bota: ${activeMeasures.pantBota || activeMeasures.botamanga}`,
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
              <h4 className="font-black text-xs uppercase text-ragucci-primary tracking-wider">CAMISA ({activeProfile.profileName})</h4>
            </div>

            {mode === 'edit' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cuello</label>
                    <input type="text" placeholder="Ej: 41" value={activeMeasures.camisaCuello || activeMeasures.cuello || ''} onChange={e => handleFieldChange('camisaCuello', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Espalda</label>
                    <input type="text" placeholder="Ej: 45" value={activeMeasures.camisaEspalda || ''} onChange={e => handleFieldChange('camisaEspalda', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pecho</label>
                    <input type="text" placeholder="Ej: 104" value={activeMeasures.camisaPecho || ''} onChange={e => handleFieldChange('camisaPecho', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Abdomen</label>
                    <input type="text" placeholder="Ej: 92" value={activeMeasures.camisaAbdomen || ''} onChange={e => handleFieldChange('camisaAbdomen', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cintura</label>
                    <input type="text" placeholder="Ej: 90" value={activeMeasures.camisaCintura || activeMeasures.cinturaCamisa || ''} onChange={e => handleFieldChange('camisaCintura', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Largo</label>
                    <input type="text" placeholder="Ej: 78" value={activeMeasures.camisaLargo || ''} onChange={e => handleFieldChange('camisaLargo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Manga</label>
                    <input type="text" placeholder="Ej: 65" value={activeMeasures.camisaManga || activeMeasures.largoMangaCamisa || ''} onChange={e => handleFieldChange('camisaManga', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bicep</label>
                    <input type="text" placeholder="Ej: 34" value={activeMeasures.camisaBicep || ''} onChange={e => handleFieldChange('camisaBicep', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Antebrazo</label>
                    <input type="text" placeholder="Ej: 28" value={activeMeasures.camisaAntebrazo || ''} onChange={e => handleFieldChange('camisaAntebrazo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Puño Izq</label>
                    <input type="text" placeholder="Ej: 24" value={activeMeasures.camisaPunoIzq || activeMeasures.puno || ''} onChange={e => handleFieldChange('camisaPunoIzq', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Puño Der</label>
                    <input type="text" placeholder="Ej: 24.5" value={activeMeasures.camisaPunoDer || activeMeasures.puno || ''} onChange={e => handleFieldChange('camisaPunoDer', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tipo de Cuello</label>
                    <input type="text" placeholder="Ej: Italiano / Francés" value={activeMeasures.camisaTipoCuello || ''} onChange={e => handleFieldChange('camisaTipoCuello', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tipo de Puño</label>
                    <input type="text" placeholder="Ej: Botón / Doble Gemelo" value={activeMeasures.camisaTipoPuno || ''} onChange={e => handleFieldChange('camisaTipoPuno', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Monograma</label>
                    <input type="text" placeholder="Ej: E.A. (Hilo Azul)" value={activeMeasures.camisaMonograma || ''} onChange={e => handleFieldChange('camisaMonograma', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-ragucci-gold bg-[#fffdfa]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  (activeMeasures.camisaCuello || activeMeasures.cuello) && `Cuello: ${activeMeasures.camisaCuello || activeMeasures.cuello}`,
                  activeMeasures.camisaEspalda && `Espalda: ${activeMeasures.camisaEspalda}`,
                  activeMeasures.camisaPecho && `Pecho: ${activeMeasures.camisaPecho}`,
                  activeMeasures.camisaAbdomen && `Abdomen: ${activeMeasures.camisaAbdomen}`,
                  (activeMeasures.camisaCintura || activeMeasures.cinturaCamisa) && `Cintura: ${activeMeasures.camisaCintura || activeMeasures.cinturaCamisa}`,
                  activeMeasures.camisaLargo && `Largo: ${activeMeasures.camisaLargo}`,
                  (activeMeasures.camisaManga || activeMeasures.largoMangaCamisa) && `Manga: ${activeMeasures.camisaManga || activeMeasures.largoMangaCamisa}`,
                  activeMeasures.camisaBicep && `Bicep: ${activeMeasures.camisaBicep}`,
                  activeMeasures.camisaAntebrazo && `Antebrazo: ${activeMeasures.camisaAntebrazo}`,
                  (activeMeasures.camisaPunoIzq || activeMeasures.puno) && `Puño Izq: ${activeMeasures.camisaPunoIzq || activeMeasures.puno}`,
                  (activeMeasures.camisaPunoDer || activeMeasures.puno) && `Puño Der: ${activeMeasures.camisaPunoDer || activeMeasures.puno}`,
                  activeMeasures.camisaTipoCuello && `Tipo de cuello: ${activeMeasures.camisaTipoCuello}`,
                  activeMeasures.camisaTipoPuno && `Tipo de puño: ${activeMeasures.camisaTipoPuno}`,
                  activeMeasures.camisaMonograma && `Monograma: ${activeMeasures.camisaMonograma}`,
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
            Observaciones de Postura & Calce ({activeProfile.profileName}):
          </label>
          {mode === 'edit' ? (
            <textarea
              rows={2}
              placeholder="Ej: Hombro izquierdo caído -2cm, postura erguida, caída de cintura ligera..."
              value={activeMeasures.posturaNotes || ''}
              onChange={e => handleFieldChange('posturaNotes', e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg text-xs font-medium focus:outline-none focus:border-ragucci-gold bg-white"
            />
          ) : (
            <p className="text-xs text-amber-950 font-bold italic">
              {activeMeasures.posturaNotes || 'Sin observaciones adicionales de postura.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
