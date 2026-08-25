import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { UserBadge } from '../common/UserBadge';
import { formatDate, formatMoney } from '../../utils/formatters';
import { MessageCircle } from 'lucide-react';

interface ClientHistoryModalProps {
  clientName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ clientName, isOpen, onClose }) => {
  const { orders } = useApp();

  if (!clientName) return null;

  const clientOrders = orders
    .filter(o => o.client === clientName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastOrderInfo = clientOrders.find(o => o.phone || o.dni || o.email || o.birthday);

  const totalBought = clientOrders.reduce((acc, o) => acc + o.sale, 0);
  const totalDebt = clientOrders.reduce((acc, o) => acc + (o.saldo || 0), 0);

  let cleanPhone = lastOrderInfo?.phone?.replace(/\D/g, '') || '';
  if (cleanPhone && !cleanPhone.startsWith('549')) cleanPhone = '549' + cleanPhone;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ficha de Cliente: ${clientName}`} maxWidth="max-w-3xl">
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-white p-3 border border-ragucci-gold-light rounded shadow-sm">
          <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">Total Comprado</h4>
          <div className="text-xl font-extrabold text-emerald-600 font-sans mt-1">${formatMoney(totalBought)}</div>
        </div>
        <div className="bg-white p-3 border border-ragucci-gold-light rounded shadow-sm">
          <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">Saldo Pendiente</h4>
          <div className="text-xl font-extrabold text-ragucci-red font-sans mt-1">${formatMoney(totalDebt)}</div>
        </div>
        <div className="bg-white p-3 border border-ragucci-gold-light rounded shadow-sm">
          <h4 className="text-[11px] uppercase font-bold text-ragucci-primary-light">Total Órdenes</h4>
          <div className="text-xl font-extrabold text-ragucci-primary font-sans mt-1">{clientOrders.length}</div>
        </div>
      </div>

      <div className="bg-ragucci-bg p-3 rounded border border-ragucci-border text-xs mb-4">
        <strong>Datos de Contacto:</strong> Tel:{' '}
        {cleanPhone ? (
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
          >
            {lastOrderInfo?.phone} <MessageCircle className="w-3.5 h-3.5 fill-current" />
          </a>
        ) : (
          'No'
        )}{' '}
        | DNI: {lastOrderInfo?.dni || 'No'} | Mail: {lastOrderInfo?.email || 'No'} | Cumple: {lastOrderInfo?.birthday || 'No'}
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {clientOrders.map((o, idx) => (
          <div key={idx} className="bg-ragucci-bg border border-ragucci-border rounded p-4 text-xs">
            <div className="flex justify-between items-center border-b border-ragucci-gold-light pb-2 mb-2">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold">Orden del {formatDate(o.date)}</strong>
                {o.createdBy && <UserBadge initial={o.createdBy} size="xs" actionLabel="Creada por" />}
                {o.updatedBy && o.updatedBy !== o.createdBy && <UserBadge initial={o.updatedBy} size="xs" actionLabel="Mod. por" />}
              </div>
              <span className={`px-2.5 py-1 rounded text-[11px] font-bold text-white ${o.status === '🟢 Entregado' ? 'bg-emerald-600' : 'bg-ragucci-primary'}`}>
                {o.status || '🔴 Pendiente'}
              </span>
            </div>

            <div className="font-semibold mb-2">
              {o.products && o.products.map((p, pIdx) => (
                <div key={pIdx}>
                  • {p.description} {p.modista ? `(Modista: ${p.modista})` : ''}
                  {p.arreglosDetalle && p.arreglosDetalle.length > 0 && (
                    <span className="text-gray-600 font-normal">
                      {' '}— Arreglos: {p.arreglosDetalle.map(ad => `${ad.tipo} (x${ad.qty})`).join(', ')}
                    </span>
                  )}
                </div>
              ))}
              {o.rtwItems && o.rtwItems.map((rtw, rIdx) => (
                <div key={rIdx}>• {rtw.desc} (x{rtw.qty}) - ${formatMoney(rtw.price * rtw.qty)}</div>
              ))}
            </div>

            <div className="bg-white p-2.5 rounded border border-dashed border-gray-300">
              <div className="font-bold text-sm mb-1">💰 Valor Total: ${formatMoney(o.sale)}</div>
              <div className="text-ragucci-primary-light font-bold mb-1">Historial de Pagos:</div>
              {o.paymentHistory && o.paymentHistory.length > 0 ? (
                o.paymentHistory.map((p, pIdx) => (
                  <div key={pIdx} className="ml-2">
                    🗓️ {formatDate(p.date)}: <strong className="text-emerald-600">${formatMoney(p.amount)}</strong> <em>({p.method})</em>
                  </div>
                ))
              ) : (
                <div className="ml-2 text-gray-500">Sin pagos registrados.</div>
              )}

              {o.saldo > 0 ? (
                <div className="mt-2 text-ragucci-red font-bold">⚠️ Saldo Pendiente: ${formatMoney(o.saldo)}</div>
              ) : (
                <div className="mt-2 text-emerald-600 font-bold">✅ Pagado en su totalidad</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
