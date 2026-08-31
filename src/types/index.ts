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
  noTelas?: boolean;
  noForreria?: boolean;
  noArreglos?: boolean;
}

export interface ProductItem {
  description: string;
  notes?: string;
  color?: string;
  colorHex?: string;
  modista?: string;
  camiseroSelected?: string;
  arreglosDetalle?: ArregloDetalleItem[];
  costs: ProductCosts;
}

export interface RTWItem {
  desc: string;
  qty: number;
  price: number;
  notes?: string;
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

export interface MeasurementRevision {
  id: string;
  date: string;
  label?: string;
  measurements: Record<string, string>;
}

export interface ClientMeasurementProfile {
  id: string;
  profileName: string;
  measurements: ClientMeasurements;
  history?: MeasurementRevision[];
}

export interface ClientMeasurements {
  [key: string]: any;
  profiles?: ClientMeasurementProfile[];
  history?: MeasurementRevision[];
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

export type UserInitial = 'L' | 'C' | 'T';

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
  tallerNotesMap?: Record<string, string>;
  measurements?: ClientMeasurements;
  totalCost: number;
  profit: number;
  createdBy?: UserInitial;
  updatedBy?: UserInitial;
}

export interface AppConfig {
  lastEditedBy?: UserInitial;
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
  saldo_anterior_comision_tomy?: number;
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
  createdBy?: UserInitial;
  updatedBy?: UserInitial;
}

export interface ProspectAppointment {
  id: string;
  firestoreId?: string;
  clientName: string;
  phone?: string;
  date: string;
  time?: string;
  interest: string;
  notes?: string;
  status: 'pendiente' | 'confirmada' | 'concretada' | 'cancelada';
  createdAt?: string;
  createdBy?: UserInitial;
  updatedBy?: UserInitial;
}

export interface StockSizeVariant {
  size: string;
  color?: string;
  quantity: number;
}

export interface StockItem {
  id: string;
  firestoreId?: string;
  code: string;
  name: string;
  category: 'Sacos RTW' | 'Ambos RTW' | 'Pantalones RTW' | 'Sobretodos & Camperas' | 'Camisas' | 'Corbatas & Pañuelos' | 'Accesorios & Zapatos' | 'Otros';
  sizes: StockSizeVariant[];
  size?: string;
  color?: string;
  quantity: number;
  minStockWarning: number;
  costPrice: number;
  retailPrice: number;
  supplier?: string;
  notes?: string;
  lastUpdated?: string;
  createdBy?: UserInitial;
  updatedBy?: UserInitial;
}

export interface FinancialCommitmentInstallment {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  status: 'PENDIENTE' | 'DEBITADO' | 'VENCIDO';
  paidDate?: string;
  cashMovementId?: string;
}

export interface FinancialCommitment {
  id: string;
  firestoreId?: string;
  title: string;
  type: 'CHEQUE_DIFERIDO' | 'PRESTAMO' | 'FINANCIACION' | 'DEUDA_PENDIENTE' | 'OTRO';
  entity?: string;
  totalAmount: number;
  totalInstallments: number;
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
  dueDayOfMonth: number;
  monthlyAmount: number;
  installments: FinancialCommitmentInstallment[];
  status: 'ACTIVO' | 'SALDADO';
  notes?: string;
  createdAt: string;
  createdBy?: UserInitial;
  updatedBy?: UserInitial;
}

export type TabType = 'carga' | 'registro' | 'talleres' | 'balance' | 'saldos' | 'agenda' | 'stock' | 'crm' | 'capitales' | 'configuracion' | 'backup';
