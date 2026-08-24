import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, AppConfig, TabType, CashMovement, ProspectAppointment, StockItem } from '../types';
import { DEFAULT_CONFIG } from '../utils/constants';
import { 
  subscribeOrders, 
  subscribeCashMovements, 
  subscribeProspectAppointments,
  subscribeStockItems,
  fetchConfig, 
  saveOrder, 
  deleteOrder, 
  saveConfig, 
  saveCashMovement, 
  deleteCashMovement,
  saveProspectAppointment,
  deleteProspectAppointment,
  saveStockItem,
  deleteStockItem
} from '../services/firebase';
import { fetchDolarBlue } from '../services/dolar';

interface AppContextType {
  orders: Order[];
  config: AppConfig;
  cashMovements: CashMovement[];
  prospectAppointments: ProspectAppointment[];
  stockItems: StockItem[];
  dolarBlueVenta: number;
  activeTab: TabType;
  editingOrderId: string | null;
  loading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setActiveTab: (tab: TabType) => void;
  setEditingOrderId: (id: string | null) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [prospectAppointments, setProspectAppointments] = useState<ProspectAppointment[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [dolarBlueVenta, setDolarBlueVenta] = useState<number>(1500);
  const [activeTab, setActiveTab] = useState<TabType>('carga');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ragucci_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('ragucci_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('ragucci_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    // 1. Fetch Blue Dollar Rate
    fetchDolarBlue().then(res => setDolarBlueVenta(res.venta));

    // 2. Fetch Initial Config
    fetchConfig().then(cfg => setConfig(cfg));

    // 3. Subscribe to Real-time Orders from Firebase
    const unsubscribeOrders = subscribeOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
      setLoading(false);
    });

    // 4. Subscribe to Real-time Cash Movements from Firebase
    const unsubscribeCash = subscribeCashMovements((fetchedMovements) => {
      setCashMovements(fetchedMovements);
    });

    // 5. Subscribe to Real-time Prospect Appointments from Firebase
    const unsubscribeProspects = subscribeProspectAppointments((fetchedAppointments) => {
      setProspectAppointments(fetchedAppointments);
    });

    // 6. Subscribe to Real-time Stock Items from Firebase
    const unsubscribeStock = subscribeStockItems((fetchedStock) => {
      setStockItems(fetchedStock);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCash();
      unsubscribeProspects();
      unsubscribeStock();
    };
  }, []);

  const saveOrderData = async (order: Order, firestoreId?: string) => {
    await saveOrder(order, firestoreId);
  };

  const removeOrderData = async (firestoreId: string) => {
    await deleteOrder(firestoreId);
  };

  const saveConfigData = async (newConfig: AppConfig) => {
    await saveConfig(newConfig);
    setConfig(newConfig);
  };

  const reloadConfig = async () => {
    const cfg = await fetchConfig();
    setConfig(cfg);
  };

  const saveCashMovementData = async (movement: CashMovement, firestoreId?: string) => {
    await saveCashMovement(movement, firestoreId);
  };

  const removeCashMovementData = async (firestoreId: string) => {
    await deleteCashMovement(firestoreId);
  };

  const saveProspectAppointmentData = async (appointment: ProspectAppointment, firestoreId?: string) => {
    await saveProspectAppointment(appointment, firestoreId);
  };

  const removeProspectAppointmentData = async (firestoreId: string) => {
    await deleteProspectAppointment(firestoreId);
  };

  const saveStockItemData = async (item: StockItem, firestoreId?: string) => {
    await saveStockItem(item, firestoreId);
  };

  const removeStockItemData = async (firestoreId: string) => {
    await deleteStockItem(firestoreId);
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        config,
        cashMovements,
        prospectAppointments,
        stockItems,
        dolarBlueVenta,
        activeTab,
        editingOrderId,
        loading,
        darkMode,
        toggleDarkMode,
        setActiveTab,
        setEditingOrderId,
        saveOrderData,
        removeOrderData,
        saveConfigData,
        reloadConfig,
        saveCashMovementData,
        removeCashMovementData,
        saveProspectAppointmentData,
        removeProspectAppointmentData,
        saveStockItemData,
        removeStockItemData
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
