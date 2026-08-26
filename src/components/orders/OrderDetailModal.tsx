import React from 'react';
import { Order } from '../../types';
import { Modal } from '../common/Modal';
import { UserBadge } from '../common/UserBadge';
import { InteractiveMeasuresSheet } from '../common/InteractiveMeasuresSheet';
import { ProductCostBadges } from '../common/ProductCostBadges';
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
        <div className="mb-5">
          <h4 className="font-extrabold text-sm text-ragucci-primary uppercase border-b border-ragucci-border pb-1 mb-3 flex items-center justify-between">
            <span>🧵 Ficha de medidas del Cliente</span>
            <span className="text-[10px] text-ragucci-gold-light bg-ragucci-primary px-2 py-0.5 rounded font-extrabold">
              Haz clic en la prenda para ver sus medidas
            </span>
          </h4>
          <div className="bg-[#fffdfa] p-3.5 border border-ragucci-gold-light rounded-xl text-xs space-y-3">
            <InteractiveMeasuresSheet
              mode="view"
              measurements={order.measurements}
            />
          </div>
        </div>
      )}

      <h4 className="font-extrabold text-sm text-ragucci-primary-light border-b border-ragucci-border pb-1 mb-2">
        Detalle Técnico de Productos
      </h4>
      <div className="bg-white p-3 border border-gray-200 rounded text-xs mb-4 space-y-2">
        {order.products && order.products.map((p, i) => (
          <div key={i} className="border-b border-gray-100 pb-2.5 last:border-none">
            <strong>• {p.description}</strong> {p.modista ? <em>(Modista: {p.modista})</em> : ''}
            {p.arreglosDetalle && p.arreglosDetalle.length > 0 && (
              <div className="text-gray-700 ml-3">
                Arreglos: {p.arreglosDetalle.map(ad => `${ad.tipo} (x${ad.qty})`).join(', ')}
              </div>
            )}
            {p.notes && <div className="text-gray-500 italic ml-3">Notas: {p.notes}</div>}
            <ProductCostBadges product={p} className="ml-3" />
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
