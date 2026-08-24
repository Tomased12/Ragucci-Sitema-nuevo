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
import { Order, AppConfig, CashMovement, ProspectAppointment } from "../types";
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
const cashMovementsColRef = collection(db, "ragucci_cash_movements");

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

export const subscribeCashMovements = (callback: (movements: CashMovement[]) => void) => {
  return onSnapshot(cashMovementsColRef, (snapshot) => {
    const movements: CashMovement[] = [];
    snapshot.forEach((docSnap) => {
      movements.push({
        firestoreId: docSnap.id,
        ...docSnap.data()
      } as CashMovement);
    });
    callback(movements);
  }, (error) => {
    console.error("Error al escuchar movimientos de caja:", error);
  });
};

export const saveCashMovement = async (movementData: CashMovement, firestoreId?: string): Promise<string> => {
  try {
    const { firestoreId: _, ...dataToSave } = movementData;
    const cleanData = JSON.parse(JSON.stringify(dataToSave));

    if (firestoreId) {
      await setDoc(doc(db, "ragucci_cash_movements", firestoreId), cleanData);
      return firestoreId;
    } else {
      const docRef = await addDoc(cashMovementsColRef, cleanData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error al guardar movimiento de caja:", error);
    throw error;
  }
};

export const deleteCashMovement = async (firestoreId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "ragucci_cash_movements", firestoreId));
  } catch (error) {
    console.error("Error al eliminar movimiento de caja:", error);
    throw error;
  }
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
    // Sanitizar objeto eliminando valores undefined para evitar errores de Firestore
    const cleanData = JSON.parse(JSON.stringify(dataToSave));

    if (firestoreId) {
      await setDoc(doc(db, "ragucci_orders", firestoreId), cleanData);
      return firestoreId;
    } else {
      const docRef = await addDoc(ordersColRef, cleanData);
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

// Prospect Appointments Firestore Services
const prospectAppointmentsColRef = collection(db, "ragucci_prospect_appointments");

export const subscribeProspectAppointments = (callback: (appointments: ProspectAppointment[]) => void) => {
  return onSnapshot(prospectAppointmentsColRef, (snapshot) => {
    const list: ProspectAppointment[] = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as ProspectAppointment),
      firestoreId: docSnap.id,
    }));
    callback(list);
  }, (error) => {
    console.error("Error al escuchar citas de prospectos en tiempo real:", error);
  });
};

export const saveProspectAppointment = async (appointmentData: ProspectAppointment, firestoreId?: string): Promise<string> => {
  try {
    const { firestoreId: _, ...dataToSave } = appointmentData;
    const cleanData = JSON.parse(JSON.stringify(dataToSave));

    if (firestoreId) {
      await setDoc(doc(db, "ragucci_prospect_appointments", firestoreId), cleanData);
      return firestoreId;
    } else {
      const docRef = await addDoc(prospectAppointmentsColRef, cleanData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error al guardar cita de prospecto en Firestore:", error);
    throw error;
  }
};

export const deleteProspectAppointment = async (firestoreId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "ragucci_prospect_appointments", firestoreId));
  } catch (error) {
    console.error("Error al eliminar cita de prospecto:", error);
    throw error;
  }
};
