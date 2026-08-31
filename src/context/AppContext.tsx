import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, AppConfig, TabType, CashMovement, ProspectAppointment, StockItem, FinancialCommitment, UserInitial } from '../types';
import { DEFAULT_CONFIG } from '../utils/constants';
import { 
  subscribeOrders, 
  subscribeCashMovements, 
  subscribeProspectAppointments,
  subscribeStockItems,
  subscribeFinancialCommitments,
  fetchConfig, 
  saveOrder, 
  deleteOrder, 
  saveConfig, 
  saveCashMovement, 
  deleteCashMovement,
  saveProspectAppointment,
  deleteProspectAppointment,
  saveStockItem,
  deleteStockItem,
  saveFinancialCommitment,
  deleteFinancialCommitment
} from '../services/firebase';
import { fetchDolarBlue } from '../services/dolar';

interface AppUserProfile {
  initial: UserInitial;
  name: string;
  password: string;
}

interface AppContextType {
  orders: Order[];
  config: AppConfig;
  cashMovements: CashMovement[];
  prospectAppointments: ProspectAppointment[];
  stockItems: StockItem[];
  financialCommitments: FinancialCommitment[];
  dolarBlueVenta: number;
  activeTab: TabType;
  editingOrderId: string | null;
  loading: boolean;
  darkMode: boolean;
  currentUser: AppUserProfile | null;
  isAuthenticated: boolean;
  availableUsers: AppUserProfile[];
  toggleDarkMode: () => void;
  setActiveTab: (tab: TabType) => void;
  setEditingOrderId: (id: string | null) => void;
  loginUser: (initial: UserInitial, password: string, remember: boolean) => void;
  logoutUser: () => void;
  saveOrderData: (order: Order, firestoreId?: string) => Promise<void>;
  removeOrderData: (firestoreId: string) => Promise<void>;
  saveConfigData: (newConfig: AppConfig) => Promise<void>;
  reloadConfig: () => Promise<void>;
  saveCashMovementData: (movement: CashMovement, firestoreId?: string) => Promise<void>;
  removeCashMovementData: (firestoreId: string) => Promise<void>;
  saveProspectAppointmentData: (appointment: ProspectAppointment, firestoreId?: string) => Promise<void>;
  removeProspectAppointmentData: (firestoreId: string) => Promise<void>;
  saveStockItemData: (item: StockItem, firestoreId?: string) => Promise<void>;
  removeStockItemData: (firestoreId: string) => Promise<void>;
  saveFinancialCommitmentData: (item: FinancialCommitment, firestoreId?: string) => Promise<void>;
  removeFinancialCommitmentData: (firestoreId: string) => Promise<void>;
}

const USER_PROFILES: Record<UserInitial, AppUserProfile> = {
  L: { initial: 'L', name: 'Lu', password: 'Lu' },
  C: { initial: 'C', name: 'Charly', password: 'Charly' },
  T: { initial: 'T', name: 'Tomi', password: 'Tomi' }
};

const STORAGE_KEYS = {
  currentUser: 'ragucci_current_user',
  rememberedUsers: 'ragucci_remembered_users'
};

const getRememberedUsers = (): Partial<Record<UserInitial, string>> => {
  try {
   const raw = localStorage.getItem(STORAGE_KEYS.rememberedUsers);
   if (!raw) return {};
   const parsed = JSON.parse(raw) as Partial<Record<UserInitial, string>>;
   const result: Partial<Record<UserInitial, string>> = {};

   (Object.keys(parsed) as UserInitial[]).forEach((initial) => {
     if (USER_PROFILES[initial] && typeof parsed[initial] === 'string') {
       result[initial] = parsed[initial];
     }
   });

   return result;
  } catch {
   return {};
  }
};

const getStoredCurrentUser = (): AppUserProfile | null => {
  try {
   const currentInitial = localStorage.getItem(STORAGE_KEYS.currentUser) as UserInitial | null;
   if (!currentInitial || !USER_PROFILES[currentInitial]) {
     return null;
   }

   const rememberedUsers = getRememberedUsers();
   if (!rememberedUsers[currentInitial]) {
     return null;
   }

   return USER_PROFILES[currentInitial];
  } catch {
   return null;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [prospectAppointments, setProspectAppointments] = useState<ProspectAppointment[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [financialCommitments, setFinancialCommitments] = useState<FinancialCommitment[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [dolarBlueVenta, setDolarBlueVenta] = useState<number>(1500);
  const [activeTab, setActiveTab] = useState<TabType>('carga');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
   return localStorage.getItem('ragucci_theme') === 'dark';
  });
  const [rememberedUsers, setRememberedUsers] = useState<Partial<Record<UserInitial, string>>>(() => getRememberedUsers());
  const [currentUser, setCurrentUser] = useState<AppUserProfile | null>(() => getStoredCurrentUser());

  useEffect(() => {
   localStorage.setItem(STORAGE_KEYS.rememberedUsers, JSON.stringify(rememberedUsers));
  }, [rememberedUsers]);

  useEffect(() => {
   if (darkMode) {
     document.body.classList.add('dark');
     localStorage.setItem('ragucci_theme', 'dark');
   } else {
     document.body.classList.remove('dark');
     localStorage.setItem('ragucci_theme', 'light');
   }
  }, [darkMode]);

  useEffect(() => {
   if (currentUser) {
     localStorage.setItem(STORAGE_KEYS.currentUser, currentUser.initial);
     return;
   }

   localStorage.removeItem(STORAGE_KEYS.currentUser);
  }, [currentUser]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const loginUser = (initial: UserInitial, password: string, remember: boolean) => {
   const user = USER_PROFILES[initial];
   if (!user) {
     throw new Error('Usuario inválido');
   }

   if (password.trim().toLowerCase() !== user.password.toLowerCase()) {
     throw new Error(`Contraseña incorrecta para ${user.name}.`);
   }

   setCurrentUser(user);

   if (remember) {
     setRememberedUsers(prev => ({ ...prev, [initial]: user.password }));
     return;
   }

   setRememberedUsers(prev => {
     const next = { ...prev };
     delete next[initial];
     return next;
   });
  };

  const logoutUser = () => {
   setCurrentUser(null);
  };

  const withAuditFields = <T extends Record<string, any>>(record: T): T => {
   if (!currentUser) {
     return record;
   }

   const next = { ...record } as T & { createdBy?: UserInitial; updatedBy?: UserInitial };
   next.updatedBy = currentUser.initial;
   if (!next.createdBy) {
     next.createdBy = currentUser.initial;
   }
   return next as T;
  };

  useEffect(() => {
   fetchDolarBlue().then(res => setDolarBlueVenta(res.venta));
   fetchConfig().then(cfg => setConfig(cfg));

   const unsubscribeOrders = subscribeOrders((fetchedOrders) => {
     setOrders(fetchedOrders);
     setLoading(false);
   });

   const unsubscribeCash = subscribeCashMovements((fetchedMovements) => {
     setCashMovements(fetchedMovements);
   });

   const unsubscribeProspects = subscribeProspectAppointments((fetchedAppointments) => {
     setProspectAppointments(fetchedAppointments);
   });

   const unsubscribeStock = subscribeStockItems((fetchedStock) => {
     setStockItems(fetchedStock);
   });

   const unsubscribeCommitments = subscribeFinancialCommitments((fetchedCommitments) => {
     setFinancialCommitments(fetchedCommitments);
   });

   return () => {
     unsubscribeOrders();
     unsubscribeCash();
     unsubscribeProspects();
     unsubscribeStock();
     unsubscribeCommitments();
   };
  }, []);

  const saveOrderData = async (order: Order, firestoreId?: string) => {
   await saveOrder(withAuditFields(order), firestoreId);
  };

  const removeOrderData = async (firestoreId: string) => {
   await deleteOrder(firestoreId);
  };

  const saveConfigData = async (newConfig: AppConfig) => {
   const configWithAudit = {
     ...newConfig,
     lastEditedBy: currentUser?.initial ?? newConfig.lastEditedBy
   };

   await saveConfig(configWithAudit);
   setConfig(configWithAudit);
  };

  const reloadConfig = async () => {
   const cfg = await fetchConfig();
   setConfig(cfg);
  };

  const saveCashMovementData = async (movement: CashMovement, firestoreId?: string) => {
   await saveCashMovement(withAuditFields(movement), firestoreId);
  };

  const removeCashMovementData = async (firestoreId: string) => {
   await deleteCashMovement(firestoreId);
  };

  const saveProspectAppointmentData = async (appointment: ProspectAppointment, firestoreId?: string) => {
   await saveProspectAppointment(withAuditFields(appointment), firestoreId);
  };

  const removeProspectAppointmentData = async (firestoreId: string) => {
   await deleteProspectAppointment(firestoreId);
  };

  const saveStockItemData = async (item: StockItem, firestoreId?: string) => {
    await saveStockItem(withAuditFields(item), firestoreId);
  };

  const removeStockItemData = async (firestoreId: string) => {
    await deleteStockItem(firestoreId);
  };

  const saveFinancialCommitmentData = async (item: FinancialCommitment, firestoreId?: string) => {
    await saveFinancialCommitment(withAuditFields(item), firestoreId);
  };

  const removeFinancialCommitmentData = async (firestoreId: string) => {
    await deleteFinancialCommitment(firestoreId);
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        config,
        cashMovements,
        prospectAppointments,
        stockItems,
        financialCommitments,
        dolarBlueVenta,
        activeTab,
        editingOrderId,
        loading,
        darkMode,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        availableUsers: Object.values(USER_PROFILES),
        toggleDarkMode,
        setActiveTab,
        setEditingOrderId,
        loginUser,
        logoutUser,
        saveOrderData,
        removeOrderData,
        saveConfigData,
        reloadConfig,
        saveCashMovementData,
        removeCashMovementData,
        saveProspectAppointmentData,
        removeProspectAppointmentData,
        saveStockItemData,
        removeStockItemData,
        saveFinancialCommitmentData,
        removeFinancialCommitmentData
      }}
    >
     {children}
   </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
   throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
