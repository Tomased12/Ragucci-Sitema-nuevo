import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { Order, AppConfig } from "../types";
import { DEFAULT_CONFIG } from "../utils/constants";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1QJYUQrHpCIwAO-X3zaYU_ixZFfmVJTo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sastreria-ragucci.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sastreria-ragucci",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sastreria-ragucci.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "49879460829",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:49879460829:web:5beb639d270649daf52434"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const ordersColRef = collection(db, "ragucci_orders");
const configDocRef = doc(db, "ragucci_settings", "config");

export const subscribeOrders = (callback: (orders: Order[]) => void) => {
  return onSnapshot(ordersColRef, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({
        firestoreId: docSnap.id,
        ...docSnap.data()
      } as Order);
    });
    callback(orders);
  }, (error) => {
    console.error("Error al escuchar órdenes:", error);
  });
};

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const querySnapshot = await getDocs(ordersColRef);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({
        firestoreId: docSnap.id,
        ...docSnap.data()
      } as Order);
    });
    return orders;
  } catch (error) {
    console.error("Error al cargar órdenes:", error);
    return [];
  }
};

export const fetchConfig = async (): Promise<AppConfig> => {
  try {
    const configSnap = await getDoc(configDocRef);
    let cloudData = configSnap.exists() ? (configSnap.data() as AppConfig) : DEFAULT_CONFIG;
    
    // Check fallback if incomplete
    if (!cloudData.saco || cloudData.saco === 0 || !cloudData.arreglosPrecios?.["MARIA"]) {
      cloudData = DEFAULT_CONFIG;
    }

    if (!cloudData.arreglosPrecios) cloudData.arreglosPrecios = DEFAULT_CONFIG.arreglosPrecios;
    if (!cloudData.aviosPrecios) cloudData.aviosPrecios = DEFAULT_CONFIG.aviosPrecios;
    if (!cloudData.rtwPrecios) cloudData.rtwPrecios = DEFAULT_CONFIG.rtwPrecios;

    localStorage.setItem('ragucci_config', JSON.stringify(cloudData));
    return cloudData;
  } catch (error) {
    console.error("Error al cargar configuración desde la nube:", error);
    const local = localStorage.getItem('ragucci_config');
    return local ? JSON.parse(local) : DEFAULT_CONFIG;
  }
};

export const saveOrder = async (orderData: Order, firestoreId?: string): Promise<string> => {
  try {
    const { firestoreId: _, ...dataToSave } = orderData;
    if (firestoreId) {
      await setDoc(doc(db, "ragucci_orders", firestoreId), dataToSave);
      return firestoreId;
    } else {
      const docRef = await addDoc(ordersColRef, dataToSave);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error al guardar orden:", error);
    throw error;
  }
};

export const deleteOrder = async (firestoreId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "ragucci_orders", firestoreId));
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    throw error;
  }
};

export const saveConfig = async (config: AppConfig): Promise<void> => {
  try {
    await setDoc(configDocRef, config);
    localStorage.setItem('ragucci_config', JSON.stringify(config));
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    throw error;
  }
};
