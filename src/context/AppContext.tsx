import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, AppConfig, TabType } from '../types';
import { DEFAULT_CONFIG } from '../utils/constants';
import { subscribeOrders, fetchConfig, saveOrder, deleteOrder, saveConfig } from '../services/firebase';
import { fetchDolarBlue } from '../services/dolar';

interface AppContextType {
  orders: Order[];
  config: AppConfig;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
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
    const unsubscribe = subscribeOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
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

  return (
    <AppContext.Provider
      value={{
        orders,
        config,
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
        reloadConfig
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
