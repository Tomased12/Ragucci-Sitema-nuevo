import React from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { UserBadge } from '../common/UserBadge';
import { formatDate, formatMoney } from '../../utils/formatters';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  const labels: Record<string, string> = {
    telas: 'Telas',
    forreria: 'Forrería',
    sastre: 'M. Obra (Santiago Sastre)',
    camisero: 'M. Obra (Camisero)',
    arreglos: 'Arreglos',
    pterminado: 'Productos Terminados / RTW',
    envios: 'Envíos',
    avios: 'Avios / Embalaje',
    comision: 'Comisión Tomy',
    otros: 'Otras Categorías / Extras'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ficha: ${order.client}`}>
      <div className="bg-ragucci-bg p-4 rounded-lg border border-ragucci-border mb-4 text-sm">
        <p className="my-1"><strong>Fecha de Venta:</strong> {formatDate(order.date)}</p>
        {order.deliveryDate && (
          <p className="my-1 text-amber-900 bg-amber-50 p-2 rounded border border-amber-300 font-extrabold flex items-center gap-1.5 text-xs">
            <span>⏰ Fecha Prometida de Entrega:</span>
            <span>{formatDate(order.deliveryDate)}</span>
          </p>
        )}
        <p className="my-1"><strong>Canal:</strong> {order.origin || 'A Medida (Local)'}</p>
        <p className="my-1"><strong>Estado Actual:</strong> {order.status || '🔴 Pendiente'}</p>

        {(order.createdBy || order.updatedBy) && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-300 flex flex-wrap items-center gap-2">
            {order.createdBy && <UserBadge initial={order.createdBy} actionLabel="Registrado por" size="sm" />}
            {order.updatedBy && <UserBadge initial={order.updatedBy} actionLabel="Última mod." size="sm" />}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
          <p className="my-1 font-bold">Venta Total: ${formatMoney(order.sale)}</p>
          <p className="my-1 text-emerald-600 font-bold">Pagado Acumulado: ${formatMoney(order.sena || 0)}</p>
          <p className="my-1 text-red-600 font-bold">Saldo Pendiente: ${formatMoney(order.saldo || 0)}</p>
        </div>

        {order.paymentHistory && order.paymentHistory.length > 0 && (
          <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-dashed border-gray-300">
            <strong>Historial de Pagos:</strong>
            <ul className="mt-1 space-y-1">
              {order.paymentHistory.map((p, i) => (
                <li key={i}>
                  • {formatDate(p.date)} - <strong className="text-emerald-600">${formatMoney(p.amount)}</strong> <em>({p.method})</em>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {order.measurements && (
        <div className="mb-4">
          <h4 className="font-extrabold text-sm text-ragucci-primary uppercase border-b border-ragucci-border pb-1 mb-2">
            🧵 Ficha de medidas
          </h4>
          <div className="bg-[#fffdfa] p-3 border border-ragucci-gold-light rounded text-xs space-y-2">
            {/* SACO */}
            {(order.measurements.sacoLargoMangas || order.measurements.sacoPecho || order.measurements.sacoCintura || order.measurements.sacoHombro || order.measurements.hombro) && (
              <div>
                <strong className="text-ragucci-primary font-extrabold">• SACO: </strong>
                <span className="text-gray-700">
                  {[
                    (order.measurements.sacoLargoMangas || order.measurements.largoManga) && `Largo Mangas: ${order.measurements.sacoLargoMangas || order.measurements.largoManga}`,
                    (order.measurements.sacoPecho || order.measurements.torax) && `Pecho: ${order.measurements.sacoPecho || order.measurements.torax}`,
                    (order.measurements.sacoCintura || order.measurements.cinturaSaco) && `Cintura: ${order.measurements.sacoCintura || order.measurements.cinturaSaco}`,
                    (order.measurements.sacoCadera || order.measurements.caderaSaco) && `Cadera: ${order.measurements.sacoCadera || order.measurements.caderaSaco}`,
                    order.measurements.sacoAbdomen && `Abdomen: ${order.measurements.sacoAbdomen}`,
                    (order.measurements.sacoLargoTotal || order.measurements.largoSaco) && `Largo total: ${order.measurements.sacoLargoTotal || order.measurements.largoSaco}`,
                    (order.measurements.sacoHombro || order.measurements.hombro) && `Hombro: ${order.measurements.sacoHombro || order.measurements.hombro}`
                  ].filter(Boolean).join(' | ')}
                </span>
              </div>
            )}

            {/* CHALECO */}
            {(order.measurements.chalecoPecho || order.measurements.chalecoLargoDelantero || order.measurements.chalecoLargoTrasero || order.measurements.chalecoEscote) && (
              <div>
                <strong className="text-ragucci-primary font-extrabold">• CHALECO: </strong>
                <span className="text-gray-700">
                  {[
                    order.measurements.chalecoPecho && `Pecho: ${order.measurements.chalecoPecho}`,
                    order.measurements.chalecoLargoDelantero && `Largo delantero: ${order.measurements.chalecoLargoDelantero}`,
                    order.measurements.chalecoLargoTrasero && `Largo trasero: ${order.measurements.chalecoLargoTrasero}`,
                    order.measurements.chalecoEscote && `Escote: ${order.measurements.chalecoEscote}`
                  ].filter(Boolean).join(' | ')}
                </span>
              </div>
            )}

            {/* PANTALÓN */}
            {(order.measurements.pantCintura || order.measurements.pantCadera || order.measurements.pantLargoConCintura || order.measurements.pantTiro || order.measurements.cinturaPant) && (
              <div>
                <strong className="text-ragucci-primary font-extrabold">• PANTALÓN: </strong>
                <span className="text-gray-700">
                  {[
                    (order.measurements.pantCintura || order.measurements.cinturaPant) && `Cintura: ${order.measurements.pantCintura || order.measurements.cinturaPant}`,
                    (order.measurements.pantCadera || order.measurements.caderaPant) && `Cadera: ${order.measurements.pantCadera || order.measurements.caderaPant}`,
                    (order.measurements.pantLargoConCintura || order.measurements.largoPant) && `Largo con cintura: ${order.measurements.pantLargoConCintura || order.measurements.largoPant}`,
                    (order.measurements.pantTiro || order.measurements.tiro) && `Tiro: ${order.measurements.pantTiro || order.measurements.tiro}`,
                    order.measurements.pantRodilla && `Rodilla: ${order.measurements.pantRodilla}`,
                    (order.measurements.pantBota || order.measurements.botamanga) && `Bota: ${order.measurements.pantBota || order.measurements.botamanga}`
                  ].filter(Boolean).join(' | ')}
                </span>
              </div>
            )}

            {/* CAMISA */}
            {(order.measurements.camisaCuello || order.measurements.camisaEspalda || order.measurements.camisaPecho || order.measurements.camisaAbdomen || order.measurements.camisaCintura || order.measurements.camisaManga || order.measurements.cuello) && (
              <div>
                <strong className="text-ragucci-primary font-extrabold">• CAMISA: </strong>
                <span className="text-gray-700">
                  {[
                    (order.measurements.camisaCuello || order.measurements.cuello) && `Cuello: ${order.measurements.camisaCuello || order.measurements.cuello}`,
                    order.measurements.camisaEspalda && `Espalda: ${order.measurements.camisaEspalda}`,
                    order.measurements.camisaPecho && `Pecho: ${order.measurements.camisaPecho}`,
                    order.measurements.camisaAbdomen && `Abdomen: ${order.measurements.camisaAbdomen}`,
                    (order.measurements.camisaCintura || order.measurements.cinturaCamisa) && `Cintura: ${order.measurements.camisaCintura || order.measurements.cinturaCamisa}`,
                    order.measurements.camisaLargo && `Largo: ${order.measurements.camisaLargo}`,
                    (order.measurements.camisaManga || order.measurements.largoMangaCamisa) && `Manga: ${order.measurements.camisaManga || order.measurements.largoMangaCamisa}`,
                    order.measurements.camisaBicep && `Bicep: ${order.measurements.camisaBicep}`,
                    order.measurements.camisaAntebrazo && `Antebrazo: ${order.measurements.camisaAntebrazo}`,
                    (order.measurements.camisaPunoIzq || order.measurements.puno) && `Puño Izq: ${order.measurements.camisaPunoIzq || order.measurements.puno}`,
                    (order.measurements.camisaPunoDer || order.measurements.puno) && `Puño Der: ${order.measurements.camisaPunoDer || order.measurements.puno}`,
                    order.measurements.camisaTipoCuello && `Tipo de cuello: ${order.measurements.camisaTipoCuello}`,
                    order.measurements.camisaTipoPuno && `Tipo de puño: ${order.measurements.camisaTipoPuno}`,
                    order.measurements.camisaMonograma && `Monograma: ${order.measurements.camisaMonograma}`
                  ].filter(Boolean).join(' | ')}
                </span>
              </div>
            )}

            {order.measurements.posturaNotes && (
              <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-900 font-medium mt-1">
                <strong>Postura & Calce:</strong> {order.measurements.posturaNotes}
              </div>
            )}
          </div>
        </div>
      )}

      <h4 className="font-extrabold text-sm text-ragucci-primary-light border-b border-ragucci-border pb-1 mb-2">
        Detalle Técnico de Productos
      </h4>
      <div className="bg-white p-3 border border-gray-200 rounded text-xs mb-4 space-y-2">
        {order.products && order.products.map((p, i) => (
          <div key={i} className="border-b border-gray-100 pb-2 last:border-none">
            <strong>• {p.description}</strong> {p.modista ? <em>(Modista: {p.modista})</em> : ''}
            {p.arreglosDetalle && p.arreglosDetalle.length > 0 && (
              <div className="text-gray-700 ml-3">
                Arreglos: {p.arreglosDetalle.map(ad => `${ad.tipo} (x${ad.qty})`).join(', ')}
              </div>
            )}
            {p.notes && <div className="text-gray-500 italic ml-3">Notas: {p.notes}</div>}
          </div>
        ))}

        {order.rtwItems && order.rtwItems.map((rtw, i) => (
          <div key={i} className="border-b border-gray-100 pb-2 last:border-none">
            <strong>• {rtw.desc} (x{rtw.qty})</strong> - ${formatMoney(rtw.price * rtw.qty)}
          </div>
        ))}
      </div>

      <h4 className="font-extrabold text-sm text-ragucci-primary-light border-b border-ragucci-border pb-1 mb-2">
        Desglose de Costos Generales
      </h4>
      <table className="w-full text-xs mb-4">
        <tbody>
          {Object.keys(labels).map((key) => (
            <tr key={key} className="border-b border-gray-100">
              <td className="py-1.5">{labels[key]}</td>
              <td className="py-1.5 text-right font-medium">
                ${formatMoney(order.costs?.[key as keyof typeof order.costs] || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-ragucci-gold-light/40 border-l-4 border-ragucci-gold p-4 rounded text-sm text-ragucci-primary">
        <p className="my-0.5"><strong>Costo Total (Invertido):</strong> <span className="text-ragucci-red font-bold">-${formatMoney(order.totalCost)}</span></p>
        <p className="my-0.5"><strong>Ganancia Teórica Neta:</strong> <span className="text-ragucci-primary font-bold text-base">${formatMoney(order.profit)}</span></p>
        <p className="my-0.5"><strong>Margen:</strong> {order.sale > 0 ? ((order.profit / order.sale) * 100).toFixed(1) : 0}%</p>
      </div>
    </Modal>
  );
};
