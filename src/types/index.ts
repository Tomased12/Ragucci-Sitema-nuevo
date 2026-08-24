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

export interface ClientMeasurements {
  // SACO
  sacoLargoMangas?: string;
  sacoPecho?: string;
  sacoCintura?: string;
  sacoCadera?: string;
  sacoAbdomen?: string;
  sacoLargoTotal?: string;
  sacoHombro?: string;

  // CHALECO
  chalecoPecho?: string;
  chalecoLargoDelantero?: string;
  chalecoLargoTrasero?: string;
  chalecoEscote?: string;

  // PANTALÓN
  pantCintura?: string;
  pantCadera?: string;
  pantLargoConCintura?: string;
  pantTiro?: string;
  pantRodilla?: string;
  pantBota?: string;

  // CAMISA
  camisaCuello?: string;
  camisaEspalda?: string;
  camisaPecho?: string;
  camisaAbdomen?: string;
  camisaCintura?: string;
  camisaLargo?: string;
  camisaManga?: string;
  camisaBicep?: string;
  camisaAntebrazo?: string;
  camisaPunoIzq?: string;
  camisaPunoDer?: string;
  camisaTipoCuello?: string;
  camisaTipoPuno?: string;
  camisaMonograma?: string;

  // Observaciones & Postura
  posturaNotes?: string;

  // Compatibilidad con campos anteriores
  hombro?: string;
  torax?: string;
  cinturaSaco?: string;
  caderaSaco?: string;
  largoSaco?: string;
  largoManga?: string;
  espalda?: string;
  cinturaPant?: string;
  caderaPant?: string;
  largoPant?: string;
  tiro?: string;
  muslo?: string;
  botamanga?: string;
  cuello?: string;
  cinturaCamisa?: string;
  largoMangaCamisa?: string;
  puno?: string;
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
  measurements?: ClientMeasurements;
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

export interface CashMovement {
  id: string;
  firestoreId?: string;
  date: string;
  type: 'ingreso' | 'egreso' | 'transferencia';
  amount: number;
  account: 'efectivo' | 'banco' | 'dolar';
  toAccount?: 'efectivo' | 'banco' | 'dolar';
  category: string;
  description: string;
  clientOrRef?: string;
}

export type TabType = 'carga' | 'registro' | 'talleres' | 'balance' | 'crm' | 'capitales' | 'configuracion' | 'backup';
