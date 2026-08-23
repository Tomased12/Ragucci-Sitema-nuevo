import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';
import { ClientHistoryModal } from '../clients/ClientHistoryModal';
import { 
  Crown, 
  Search, 
  Award, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  MessageCircle, 
  Ruler, 
  History, 
  Star,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ClientMetrics {
  name: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  ordersCount: number;
  latestOrderDate: string;
  latestOrder: Order;
  hasMeasurements: boolean;
  tier: 'black' | 'gold' | 'silver' | 'regular';
}

export const CrmDashboard: React.FC = () => {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'spent_desc' | 'orders_desc' | 'latest_desc' | 'name_asc'>('spent_desc');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [selectedMeasurementOrder, setSelectedMeasurementOrder] = useState<Order | null>(null);

  // Process client metrics
  const clientMetricsList = useMemo(() => {
    const map = new Map<string, { orders: Order[]; phone: string }>();

    orders.forEach((o) => {
      const cleanName = o.client.trim();
      if (!cleanName) return;

      if (!map.has(cleanName)) {
        map.set(cleanName, { orders: [], phone: o.phone || '' });
      }
      const item = map.get(cleanName)!;
      item.orders.push(o);
      if (!item.phone && o.phone) item.phone = o.phone;
    });

    const result: ClientMetrics[] = [];

    map.forEach((data, name) => {
      // Sort orders by date descending
      const sortedOrders = [...data.orders].sort((a, b) => {
        return new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime();
      });

      const totalSpent = sortedOrders.reduce((acc, o) => acc + (o.sale || 0), 0);
      const latestOrder = sortedOrders[0];
      const hasMeasurements = sortedOrders.some((o) => o.measurements && Object.keys(o.measurements).length > 0);

      let tier: 'black' | 'gold' | 'silver' | 'regular' = 'regular';
      if (totalSpent >= 1000000) tier = 'black';
      else if (totalSpent >= 500000) tier = 'gold';
      else if (totalSpent >= 250000) tier = 'silver';

      result.push({
        name,
        phone: data.phone,
        orders: sortedOrders,
        totalSpent,
        ordersCount: sortedOrders.length,
        latestOrderDate: latestOrder.date,
        latestOrder,
        hasMeasurements,
        tier
      });
    });

    return result;
  }, [orders]);

  // Filtered and sorted clients
  const processedClients = useMemo(() => {
    let filtered = clientMetricsList.filter((c) => {
      const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = c.phone.includes(searchTerm);
      return matchName || matchPhone;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'spent_desc') return b.totalSpent - a.totalSpent;
      if (sortBy === 'orders_desc') return b.ordersCount - a.ordersCount;
      if (sortBy === 'latest_desc') {
        return new Date(b.latestOrderDate + 'T12:00:00').getTime() - new Date(a.latestOrderDate + 'T12:00:00').getTime();
      }
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return filtered;
  }, [clientMetricsList, searchTerm, sortBy]);

  // Summary KPIs
  const totalUniqueClients = clientMetricsList.length;
  const totalSpentAll = clientMetricsList.reduce((acc, c) => acc + c.totalSpent, 0);
  const averageTicketPerClient = totalUniqueClients > 0 ? totalSpentAll / totalUniqueClients : 0;
  const topSpender = useMemo(() => {
    return [...clientMetricsList].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [clientMetricsList]);
  const recurringClientsCount = clientMetricsList.filter((c) => c.ordersCount > 1).length;

  const renderTierBadge = (tier: 'black' | 'gold' | 'silver' | 'regular') => {
    switch (tier) {
      case 'black':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-900 text-ragucci-gold px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-ragucci-gold/50 shadow-sm">
            💎 Ragucci Black VIP
          </span>
        );
      case 'gold':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-300">
            🥇 Ragucci Gold
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-slate-300">
            🥈 Ragucci Silver
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
            🥉 Cliente Ragucci
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border border-ragucci-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-ragucci-gold" />
            <span>CRM & Ranking de Clientes VIP</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Gestión de clientes de Sastrería Ragucci, fidelización, historial acumulado de consumo y fichas de medidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-ragucci-primary text-ragucci-gold px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1.5">
            <Users className="w-4 h-4 text-ragucci-gold" />
            <span>{totalUniqueClients} Clientes Registrados</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-ragucci-primary to-ragucci-primary-light text-white p-4 rounded-lg shadow-md border-l-4 border-ragucci-gold">
          <span className="text-[10px] uppercase font-bold text-ragucci-gold-light tracking-wider block">💎 Cliente Ragucci N°1</span>
          <strong className="text-base md:text-lg font-extrabold text-ragucci-gold block truncate mt-1">
            {topSpender ? topSpender.name : '-'}
          </strong>
          <span className="text-xs font-bold text-white block mt-0.5">
            ${formatMoney(topSpender ? topSpender.totalSpent : 0)} acumulados
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-emerald-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Gasto Promedio por Cliente</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <strong className="text-lg font-extrabold text-emerald-700 block font-sans">
            ${formatMoney(Math.round(averageTicketPerClient))}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Venta total ÷ clientes</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-amber-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Clientes Recurrentes (2+ compras)</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <strong className="text-lg font-extrabold text-amber-700 block font-sans">
            {recurringClientsCount} clientes
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {totalUniqueClients > 0 ? ((recurringClientsCount / totalUniqueClients) * 100).toFixed(0) : 0}% de fidelización
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-sky-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Facturación Total Acumulada</span>
            <ShoppingBag className="w-4 h-4 text-sky-600" />
          </div>
          <strong className="text-lg font-extrabold text-ragucci-primary block font-sans">
            ${formatMoney(totalSpentAll)}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Suma bruta histórica</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-ragucci-gold font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-600 shrink-0">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto p-2 border border-gray-300 rounded text-xs font-extrabold focus:outline-none focus:border-ragucci-gold cursor-pointer"
          >
            <option value="spent_desc">💰 Mayor Consumo Acumulado ($)</option>
            <option value="orders_desc">🛍️ Más Compras Realizadas</option>
            <option value="latest_desc">📅 Última Visita (Recientes)</option>
            <option value="name_asc">🅰️ Nombre de Cliente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow-md border border-ragucci-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-ragucci-primary text-ragucci-gold uppercase text-[11px] tracking-wider border-b border-ragucci-gold">
                <th className="py-3 px-3 text-center w-12"># Rank</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Categoría VIP</th>
                <th className="py-3 px-3 text-center">Compras</th>
                <th className="py-3 px-3 text-right">Consumo Acumulado</th>
                <th className="py-3 px-3">Última Compra</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                    No se encontraron clientes registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                processedClients.map((client, idx) => {
                  let cleanPhone = client.phone?.replace(/\D/g, '') || '';
                  if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

                  return (
                    <tr key={client.name} className="hover:bg-[#fdfaf5] transition-colors">
                      {/* Rank Position */}
                      <td className="py-3 px-3 text-center font-extrabold text-sm">
                        {idx === 0 ? (
                          <span className="text-amber-500 font-extrabold text-base">🥇 1°</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-400 font-extrabold text-base">🥈 2°</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-700 font-extrabold text-base">🥉 3°</span>
                        ) : (
                          <span className="text-gray-500">{idx + 1}°</span>
                        )}
                      </td>

                      {/* Client Name & WhatsApp */}
                      <td className="py-3 px-3 font-bold">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedClientName(client.name)}
                            className="text-ragucci-primary hover:text-ragucci-gold underline decoration-dashed transition-colors text-left text-sm"
                          >
                            {client.name}
                          </button>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-800 transition-colors"
                              title={`Enviar WhatsApp a ${client.name}`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {client.phone && (
                          <span className="text-[10px] text-gray-400 font-normal block">{client.phone}</span>
                        )}
                      </td>

                      {/* VIP Tier Badge */}
                      <td className="py-3 px-3">
                        {renderTierBadge(client.tier)}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-3 text-center font-extrabold text-gray-800 font-sans">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {client.ordersCount} {client.ordersCount === 1 ? 'compra' : 'compras'}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700 font-sans text-sm">
                        ${formatMoney(client.totalSpent)}
                      </td>

                      {/* Latest Purchase Date */}
                      <td className="py-3 px-3 font-medium text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{formatDate(client.latestOrderDate)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                          {client.latestOrder.products?.[0]?.description || 'Orden a medida'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedClientName(client.name)}
                            className="bg-ragucci-primary text-ragucci-gold hover:bg-ragucci-primary-light font-extrabold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                            title="Ver Historial Completo de Compras"
                          >
                            <History className="w-3 h-3" />
                            <span>Historial ({client.ordersCount})</span>
                          </button>

                          {client.hasMeasurements && (
                            <button
                              onClick={() => setSelectedMeasurementOrder(client.latestOrder)}
                              className="bg-amber-100 text-amber-900 hover:bg-amber-200 font-extrabold px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-amber-300"
                              title="Ver Ficha de Medidas Sartoriales"
                            >
                              <Ruler className="w-3 h-3 text-amber-700" />
                              <span>Medidas</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client History Modal */}
      <ClientHistoryModal
        clientName={selectedClientName}
        isOpen={!!selectedClientName}
        onClose={() => setSelectedClientName(null)}
      />

      {/* Measurements View Modal */}
      {selectedMeasurementOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <Ruler className="w-4 h-4 text-ragucci-gold" />
                <span>Ficha de Medidas: {selectedMeasurementOrder.client}</span>
              </h3>
              <button
                onClick={() => setSelectedMeasurementOrder(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {selectedMeasurementOrder.measurements && (
              <div className="bg-[#fffdfa] p-3 border border-ragucci-gold-light rounded text-xs space-y-3">
                {/* SACO */}
                {(selectedMeasurementOrder.measurements.sacoLargoMangas || selectedMeasurementOrder.measurements.sacoPecho || selectedMeasurementOrder.measurements.sacoHombro || selectedMeasurementOrder.measurements.hombro) && (
                  <div>
                    <strong className="text-ragucci-primary font-extrabold block mb-0.5">• SACO: </strong>
                    <span className="text-gray-700">
                      {[
                        (selectedMeasurementOrder.measurements.sacoLargoMangas || selectedMeasurementOrder.measurements.largoManga) && `Largo Mangas: ${selectedMeasurementOrder.measurements.sacoLargoMangas || selectedMeasurementOrder.measurements.largoManga}`,
                        (selectedMeasurementOrder.measurements.sacoPecho || selectedMeasurementOrder.measurements.torax) && `Pecho: ${selectedMeasurementOrder.measurements.sacoPecho || selectedMeasurementOrder.measurements.torax}`,
                        (selectedMeasurementOrder.measurements.sacoCintura || selectedMeasurementOrder.measurements.cinturaSaco) && `Cintura: ${selectedMeasurementOrder.measurements.sacoCintura || selectedMeasurementOrder.measurements.cinturaSaco}`,
                        (selectedMeasurementOrder.measurements.sacoCadera || selectedMeasurementOrder.measurements.caderaSaco) && `Cadera: ${selectedMeasurementOrder.measurements.sacoCadera || selectedMeasurementOrder.measurements.caderaSaco}`,
                        selectedMeasurementOrder.measurements.sacoAbdomen && `Abdomen: ${selectedMeasurementOrder.measurements.sacoAbdomen}`,
                        (selectedMeasurementOrder.measurements.sacoLargoTotal || selectedMeasurementOrder.measurements.largoSaco) && `Largo total: ${selectedMeasurementOrder.measurements.sacoLargoTotal || selectedMeasurementOrder.measurements.largoSaco}`,
                        (selectedMeasurementOrder.measurements.sacoHombro || selectedMeasurementOrder.measurements.hombro) && `Hombro: ${selectedMeasurementOrder.measurements.sacoHombro || selectedMeasurementOrder.measurements.hombro}`
                      ].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                )}

                {/* CHALECO */}
                {(selectedMeasurementOrder.measurements.chalecoPecho || selectedMeasurementOrder.measurements.chalecoLargoDelantero) && (
                  <div>
                    <strong className="text-ragucci-primary font-extrabold block mb-0.5">• CHALECO: </strong>
                    <span className="text-gray-700">
                      {[
                        selectedMeasurementOrder.measurements.chalecoPecho && `Pecho: ${selectedMeasurementOrder.measurements.chalecoPecho}`,
                        selectedMeasurementOrder.measurements.chalecoLargoDelantero && `Largo delantero: ${selectedMeasurementOrder.measurements.chalecoLargoDelantero}`,
                        selectedMeasurementOrder.measurements.chalecoLargoTrasero && `Largo trasero: ${selectedMeasurementOrder.measurements.chalecoLargoTrasero}`,
                        selectedMeasurementOrder.measurements.chalecoEscote && `Escote: ${selectedMeasurementOrder.measurements.chalecoEscote}`
                      ].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                )}

                {/* PANTALÓN */}
                {(selectedMeasurementOrder.measurements.pantCintura || selectedMeasurementOrder.measurements.pantCadera || selectedMeasurementOrder.measurements.cinturaPant) && (
                  <div>
                    <strong className="text-ragucci-primary font-extrabold block mb-0.5">• PANTALÓN: </strong>
                    <span className="text-gray-700">
                      {[
                        (selectedMeasurementOrder.measurements.pantCintura || selectedMeasurementOrder.measurements.cinturaPant) && `Cintura: ${selectedMeasurementOrder.measurements.pantCintura || selectedMeasurementOrder.measurements.cinturaPant}`,
                        (selectedMeasurementOrder.measurements.pantCadera || selectedMeasurementOrder.measurements.caderaPant) && `Cadera: ${selectedMeasurementOrder.measurements.pantCadera || selectedMeasurementOrder.measurements.caderaPant}`,
                        (selectedMeasurementOrder.measurements.pantLargoConCintura || selectedMeasurementOrder.measurements.largoPant) && `Largo con cintura: ${selectedMeasurementOrder.measurements.pantLargoConCintura || selectedMeasurementOrder.measurements.largoPant}`,
                        (selectedMeasurementOrder.measurements.pantTiro || selectedMeasurementOrder.measurements.tiro) && `Tiro: ${selectedMeasurementOrder.measurements.pantTiro || selectedMeasurementOrder.measurements.tiro}`,
                        selectedMeasurementOrder.measurements.pantRodilla && `Rodilla: ${selectedMeasurementOrder.measurements.pantRodilla}`,
                        (selectedMeasurementOrder.measurements.pantBota || selectedMeasurementOrder.measurements.botamanga) && `Bota: ${selectedMeasurementOrder.measurements.pantBota || selectedMeasurementOrder.measurements.botamanga}`
                      ].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                )}

                {/* CAMISA */}
                {(selectedMeasurementOrder.measurements.camisaCuello || selectedMeasurementOrder.measurements.camisaEspalda || selectedMeasurementOrder.measurements.cuello) && (
                  <div>
                    <strong className="text-ragucci-primary font-extrabold block mb-0.5">• CAMISA: </strong>
                    <span className="text-gray-700">
                      {[
                        (selectedMeasurementOrder.measurements.camisaCuello || selectedMeasurementOrder.measurements.cuello) && `Cuello: ${selectedMeasurementOrder.measurements.camisaCuello || selectedMeasurementOrder.measurements.cuello}`,
                        selectedMeasurementOrder.measurements.camisaEspalda && `Espalda: ${selectedMeasurementOrder.measurements.camisaEspalda}`,
                        selectedMeasurementOrder.measurements.camisaPecho && `Pecho: ${selectedMeasurementOrder.measurements.camisaPecho}`,
                        selectedMeasurementOrder.measurements.camisaAbdomen && `Abdomen: ${selectedMeasurementOrder.measurements.camisaAbdomen}`,
                        (selectedMeasurementOrder.measurements.camisaCintura || selectedMeasurementOrder.measurements.cinturaCamisa) && `Cintura: ${selectedMeasurementOrder.measurements.camisaCintura || selectedMeasurementOrder.measurements.cinturaCamisa}`,
                        selectedMeasurementOrder.measurements.camisaLargo && `Largo: ${selectedMeasurementOrder.measurements.camisaLargo}`,
                        (selectedMeasurementOrder.measurements.camisaManga || selectedMeasurementOrder.measurements.largoMangaCamisa) && `Manga: ${selectedMeasurementOrder.measurements.camisaManga || selectedMeasurementOrder.measurements.largoMangaCamisa}`,
                        selectedMeasurementOrder.measurements.camisaPunoIzq && `Puño Izq: ${selectedMeasurementOrder.measurements.camisaPunoIzq}`,
                        selectedMeasurementOrder.measurements.camisaTipoCuello && `Cuello: ${selectedMeasurementOrder.measurements.camisaTipoCuello}`,
                        selectedMeasurementOrder.measurements.camisaMonograma && `Monograma: ${selectedMeasurementOrder.measurements.camisaMonograma}`
                      ].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                )}

                {selectedMeasurementOrder.measurements.posturaNotes && (
                  <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-900 font-medium mt-1">
                    <strong>Postura & Calce:</strong> {selectedMeasurementOrder.measurements.posturaNotes}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedMeasurementOrder(null)}
              className="w-full py-2 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
