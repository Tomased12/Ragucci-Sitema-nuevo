import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { UserBadge } from '../common/UserBadge';
import { InteractiveMeasuresSheet } from '../common/InteractiveMeasuresSheet';
import { ProductCostBadges } from '../common/ProductCostBadges';
import { formatDate, formatMoney, isCardPaymentMethod } from '../../utils/formatters';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  const { setEditingOrderId, setActiveTab } = useApp();
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

  const isArreglo = (order.type || '').toUpperCase().includes('ARREGLO') || (order.products || []).some(p => (p.description || '').toUpperCase().includes('ARREGLO'));
  const displayStatus = isArreglo
    ? ((order.status || '').includes('Local') || (order.status || '').includes('Pendiente') || !order.status)
      ? '🟠 En el Local'
      : (order.status || '').includes('Prueba') || (order.status || '').includes('Realizado')
      ? '🔵 Arreglo Realizado'
      : order.status
    : (order.status || '🔴 Pendiente');

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
        <p className="my-1"><strong>Estado Actual:</strong> {displayStatus}</p>

        {(order.hasInvoice || order.invoiceNumber) && (
          <div className="my-2.5 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-xs">
            <div className="flex items-center justify-between font-bold text-blue-950">
              <span className="flex items-center gap-1.5 font-extrabold uppercase text-blue-900">
                🧾 Factura Emitida
              </span>
              <span className="font-mono text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">
                {order.invoiceNumber ? `N° ${order.invoiceNumber}` : 'Sin número'}
              </span>
            </div>
            {order.invoiceDetails && (
              <p className="mt-1 text-gray-700 font-medium">
                <strong>Detalle:</strong> {order.invoiceDetails}
              </p>
            )}
          </div>
        )}

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
                <li key={i} className="flex flex-wrap items-center gap-1.5">
                  <span>• {formatDate(p.date)} - <strong className="text-emerald-600">${formatMoney(p.amount)}</strong> <em>({p.method})</em></span>
                  {isCardPaymentMethod(p.method) && (
                    p.acreditado === true ? (
                      <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">
                        ✓ Acreditado
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded animate-pulse">
                        💳 Falta acreditar
                      </span>
                    )
                  )}
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
            <div className="flex items-center justify-between">
              <div>
                <strong>• {p.description}</strong>
                {p.color && (
                  <span className="ml-1.5 inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                    🎨 {p.color}
                  </span>
                )}
                {p.modista ? <em> (Modista: {p.modista})</em> : ''}
              </div>
              {p.price !== undefined && p.price > 0 && (
                <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-xs tabular-nums">
                  Cobrado: ${formatMoney(p.price)}
                </span>
              )}
            </div>
            {p.arreglosDetalle && p.arreglosDetalle.length > 0 && (
              <div className="text-gray-700 ml-3">
                Arreglos: {p.arreglosDetalle.map(ad => `${ad.tipo} (x${ad.qty})`).join(', ')}
              </div>
            )}
            {p.notes && <div className="text-gray-500 italic ml-3">Notas: {p.notes}</div>}
            <ProductCostBadges 
              product={p} 
              onlyPending={false} 
              className="ml-3" 
              onPendingClick={() => {
                onClose();
                if (order.firestoreId) {
                  setEditingOrderId(order.firestoreId);
                  setActiveTab('carga');
                }
              }}
            />
          </div>
        ))}

        {order.rtwItems && order.rtwItems.map((rtw, i) => {
          const rtwSale = rtw.salePrice !== undefined ? rtw.salePrice : rtw.price;
          return (
            <div key={i} className="border-b border-gray-100 pb-2 last:border-none">
              <div className="flex items-center justify-between">
                <strong>• {rtw.desc} (x{rtw.qty})</strong>
                <div className="flex items-center gap-2">
                  {rtwSale > 0 && (
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-xs tabular-nums">
                      Cobrado: ${formatMoney(rtwSale * rtw.qty)}
                    </span>
                  )}
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs ${
                    (rtw.status || '').includes('Entregado')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : (rtw.status || '').includes('Despachado')
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {rtw.status || '🔴 Pendiente'}
                  </span>
                </div>
              </div>
              {rtw.costPrice !== undefined && rtw.costPrice > 0 && (
                <div className="text-gray-500 font-medium ml-3 text-[11px]">
                  Costo unitario reposición: ${formatMoney(rtw.costPrice)}
                </div>
              )}
              {rtw.notes && <div className="text-gray-500 italic ml-3">Detalle: {rtw.notes}</div>}
            </div>
          );
        })}
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
