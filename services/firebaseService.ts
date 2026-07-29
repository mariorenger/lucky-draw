import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch,
  deleteDoc 
} from 'firebase/firestore';
import { Employee, Prize, Winner, Settings, RiggedSetting } from '../types';

const rawConfig: Record<string, string> = {};

const activeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
};

const app = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApps()[0];
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId || undefined);

// Main Config Document Reference
const CONFIG_DOC_PATH = doc(db, 'app_config', 'main');

export interface AppDataSync {
  employees: Employee[];
  prizes: Prize[];
  winners: Winner[];
  settings: Settings;
  riggedSettings: RiggedSetting[];
  adminPin: string;
  mcPin: string;
  spinTrigger?: {
    prizeId: string;
    quantity: number;
    timestamp: number;
    senderId: string;
  } | null;
}

// Default Admin and MC PINs
export const DEFAULT_ADMIN_PIN = 'hannn2';
export const DEFAULT_MC_PIN = 'hannn13';

// Realtime Listener for sync across all devices
export function subscribeToCloudData(
  onDataChange: (data: Partial<AppDataSync>) => void,
  onError?: (err: Error) => void
) {
  // 1. Subscribe to App Config
  const unsubConfig = onSnapshot(CONFIG_DOC_PATH, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onDataChange({
        settings: data.settings || undefined,
        adminPin: data.adminPin || DEFAULT_ADMIN_PIN,
        mcPin: data.mcPin || DEFAULT_MC_PIN,
        riggedSettings: data.riggedSettings || [],
        spinTrigger: data.spinTrigger || null
      });
    } else {
      // Initialize config if missing
      setDoc(CONFIG_DOC_PATH, {
        adminPin: DEFAULT_ADMIN_PIN,
        mcPin: DEFAULT_MC_PIN,
        settings: {
          soundEnabled: true,
          demoMode: false,
          confettiEnabled: true,
          enableTease: false
        },
        riggedSettings: []
      }).catch(console.error);
    }
  }, onError);

  // 2. Subscribe to Employees collection
  const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
    const employeesList: Employee[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as Employee));
    onDataChange({ employees: employeesList });
  }, onError);

  // 3. Subscribe to Prizes collection
  const unsubPrizes = onSnapshot(collection(db, 'prizes'), (snapshot) => {
    const prizesList: Prize[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as Prize));
    // Sort prizes by original order if available
    prizesList.sort((a, b) => (a.id > b.id ? 1 : -1));
    onDataChange({ prizes: prizesList });
  }, onError);

  // 4. Subscribe to Winners collection
  const unsubWinners = onSnapshot(collection(db, 'winners'), (snapshot) => {
    const winnersList: Winner[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as Winner));
    onDataChange({ winners: winnersList });
  }, onError);

  return () => {
    unsubConfig();
    unsubEmployees();
    unsubPrizes();
    unsubWinners();
  };
}

// Sync All Employees to Cloud
export async function syncEmployeesToCloud(employees: Employee[]) {
  try {
    const snapshot = await getDocs(collection(db, 'employees'));
    const batch = writeBatch(db);
    
    // Delete existing
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    
    // Insert new
    employees.forEach((emp) => {
      const docRef = doc(db, 'employees', emp.id);
      batch.set(docRef, emp);
    });
    
    await batch.commit();
  } catch (err) {
    console.error('Error syncing employees to Firestore:', err);
    throw err;
  }
}

// Sync All Prizes to Cloud
export async function syncPrizesToCloud(prizes: Prize[]) {
  try {
    const snapshot = await getDocs(collection(db, 'prizes'));
    const batch = writeBatch(db);
    
    // Delete existing
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    
    // Insert new
    prizes.forEach((prize) => {
      const docRef = doc(db, 'prizes', prize.id);
      batch.set(docRef, prize);
    });
    
    await batch.commit();
  } catch (err) {
    console.error('Error syncing prizes to Firestore:', err);
    throw err;
  }
}

// Sync Single Prize Update to Cloud (when winning reduces count)
export async function updatePrizeCountCloud(prizeId: string, newQuantity: number) {
  try {
    const prizeRef = doc(db, 'prizes', prizeId);
    await setDoc(prizeRef, { quantity: newQuantity }, { merge: true });
  } catch (err) {
    console.error('Error updating prize quantity:', err);
  }
}

// Add Winners to Cloud
export async function addWinnersToCloud(winners: Winner[]) {
  try {
    const batch = writeBatch(db);
    winners.forEach((winner) => {
      const docRef = doc(db, 'winners', winner.id);
      batch.set(docRef, winner);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error adding winners to Firestore:', err);
  }
}

// Clear All Winners in Cloud
export async function clearWinnersInCloud() {
  try {
    const snapshot = await getDocs(collection(db, 'winners'));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.error('Error clearing winners from Firestore:', err);
  }
}

// Sync Settings, Admin PIN & MC PIN to Cloud
export async function syncConfigToCloud(settings: Settings, adminPin: string, riggedSettings: RiggedSetting[], mcPin?: string) {
  try {
    await setDoc(CONFIG_DOC_PATH, {
      settings,
      adminPin,
      ...(mcPin ? { mcPin } : {}),
      riggedSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing config to Firestore:', err);
  }
}

// Send Remote Spin Trigger to Cloud
export async function sendRemoteSpinTriggerToCloud(prizeId: string, quantity: number, senderId: string) {
  try {
    await setDoc(CONFIG_DOC_PATH, {
      spinTrigger: {
        prizeId,
        quantity,
        timestamp: Date.now(),
        senderId
      }
    }, { merge: true });
  } catch (err) {
    console.error('Error sending remote spin trigger:', err);
  }
}

