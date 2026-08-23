export interface PaymentRecord {
  date: string;
  amount: number;
  method: string;
}

export interface ArregloDetalleItem {
  isCustom: boolean;
  tipo: string;
  price?: number;
  qty: number;
}

export interface ProductCosts {
  telas: number;
  forreria: number;
  sastre: number;
  camisero: number;
  arreglos: number;
  otros?: number;
}

export interface ProductItem {
  description: string;
  notes?: string;
  modista?: string;
  camiseroSelected?: string;
  arreglosDetalle?: ArregloDetalleItem[];
  costs: ProductCosts;
}

export interface RTWItem {
  desc: string;
  qty: number;
  price: number;
}

export type AviosQuantities = Record<'percha' | 'funda' | 'bolsa' | 'bolsaplastica', number>;
export type AviosPrices = Record<'percha' | 'funda' | 'bolsa' | 'bolsaplastica', number>;

export interface CostsBreakdown {
  telas: number;
  forreria: number;
  sastre: number;
  camisero: number;
  arreglos: number;
  pterminado: number;
  envios: number;
  avios: number;
  comision: number;
  otros: number;
}

export interface Order {
  firestoreId?: string;
  id?: number;
  date: string;
  deliveryDate?: string;
  client: string;
  phone?: string;
  dni?: string;
  email?: string;
  birthday?: string;
  sale: number;
  method: string;
  sena: number;
  saldo: number;
  paymentHistory?: PaymentRecord[];
  origin: string;
  status: string;
  products: ProductItem[];
  rtwItems?: RTWItem[];
  pterminadoDesc?: string;
  aviosQtys?: AviosQuantities;
  costs: CostsBreakdown;
  paidTalleresMap?: Record<string, boolean>;
  totalCost: number;
  profit: number;
}

export interface AppConfig {
  saco: number;
  ambo: number;
  traje: number;
  pantalon: number;
  sobretodo: number;
  smoking: number;
  chaleco: number;
  diego: number;
  guillermo: number;
  aviosPrecios: AviosPrices;
  rtwPrecios: Record<string, number>;
  arreglosPrecios: Record<string, Record<string, number>>;
  gasto_expensas?: number;
  gasto_internet?: number;
  gasto_servicios?: number;
  gasto_redes?: number;
  gasto_publicidad?: number;
  gasto_alquiler_usd?: number;
}

export type TabType = 'carga' | 'registro' | 'talleres' | 'balance' | 'configuracion' | 'backup';
