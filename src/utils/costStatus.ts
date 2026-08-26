import { ProductItem, Order } from '../types';
import { formatMoney } from './formatters';

export interface CostStatusItem {
  key: 'telas' | 'forreria' | 'arreglos';
  label: string;
  status: 'ok' | 'no' | 'pending';
  value?: number;
}

export function getProductCostStatuses(p: ProductItem): CostStatusItem[] {
  const upper = p.description.toUpperCase();
  const isArreglo = upper.includes('ARREGLO');
  const isRTW = upper.includes('RTW') || upper.includes('TERMINADO');
  const isMedida = !isArreglo && !isRTW;
  const isForreriaApplicable = isMedida && /SACO|AMBO|SOBRETODO|SMOKING|TRAJE/.test(upper);

  const statuses: CostStatusItem[] = [];

  if (isMedida) {
    // Telas (solo aplica para productos A Medida, no RTW ni Arreglos)
    if (p.costs?.noTelas) {
      statuses.push({ key: 'telas', label: 'Tela', status: 'no' });
    } else if ((p.costs?.telas || 0) > 0) {
      statuses.push({ key: 'telas', label: 'Tela', status: 'ok', value: p.costs.telas });
    } else {
      statuses.push({ key: 'telas', label: 'Tela', status: 'pending' });
    }

    // Forrería (solo aplica para Saco, Ambo, Sobretodo, Smoking y Traje a medida)
    if (isForreriaApplicable) {
      if (p.costs?.noForreria) {
        statuses.push({ key: 'forreria', label: 'Forrería', status: 'no' });
      } else if ((p.costs?.forreria || 0) > 0) {
        statuses.push({ key: 'forreria', label: 'Forrería', status: 'ok', value: p.costs.forreria });
      } else {
        statuses.push({ key: 'forreria', label: 'Forrería', status: 'pending' });
      }
    }
  }

  // Arreglos (if isArreglo or if product has arreglos cost/details)
  if (isArreglo || (p.costs?.arreglos && p.costs.arreglos > 0) || p.costs?.noArreglos) {
    if (p.costs?.noArreglos) {
      statuses.push({ key: 'arreglos', label: 'Arreglos', status: 'no' });
    } else if ((p.costs?.arreglos || 0) > 0) {
      statuses.push({ key: 'arreglos', label: 'Arreglos', status: 'ok', value: p.costs.arreglos });
    } else if (isArreglo) {
      statuses.push({ key: 'arreglos', label: 'Arreglos', status: 'pending' });
    }
  }

  return statuses;
}

export function getOrderPendingCosts(order: Order): CostStatusItem[] {
  if (!order.products || order.products.length === 0) return [];

  const allStatuses: CostStatusItem[] = [];
  order.products.forEach(p => {
    const statuses = getProductCostStatuses(p);
    statuses.forEach(s => {
      if (s.status === 'pending') {
        allStatuses.push(s);
      }
    });
  });

  return allStatuses;
}
