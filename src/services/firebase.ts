import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { FirebaseCustomConfig } from '../types';

// Import provisioned config directly from root
import provisionedConfig from '../../firebase-applet-config.json';

const STORAGE_KEY_CONFIG = 'syahrul_firebase_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB83-9E32WvbZtvy1iUzKuKEd8glgmdPOw",
  authDomain: "bionic-safeguard-b3skh.firebaseapp.com",
  projectId: "bionic-safeguard-b3skh",
  storageBucket: "bionic-safeguard-b3skh.firebasestorage.app",
  messagingSenderId: "663659111765",
  appId: "1:663659111765:web:9403fb9a01114888c27bdc",
  firestoreDatabaseId: "ai-studio-syahrulgunawanga-f57e832f-cba5-4a90-910e-486edb67291e"
};

export function getSavedFirebaseConfig(): any {
  // 1. Check if user configured custom override in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error reading local override config', e);
  }

  // 2. Return the provisioned Firebase configuration
  if (provisionedConfig && provisionedConfig.apiKey && provisionedConfig.projectId) {
    return { ...DEFAULT_FIREBASE_CONFIG, ...provisionedConfig };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseCustomConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
}

// Active Firebase Instances
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function initFirebaseService(): { 
  app: FirebaseApp | null; 
  auth: Auth | null; 
  db: Firestore | null; 
  storage: FirebaseStorage | null;
  isOnline: boolean; 
  hasConfig: boolean 
} {
  const config = getSavedFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, storage: null, isOnline: false, hasConfig: false };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    
    authInstance = getAuth(appInstance);
    // CRITICAL: Pass firestoreDatabaseId when custom database ID is configured
    firestoreInstance = config.firestoreDatabaseId 
      ? getFirestore(appInstance, config.firestoreDatabaseId)
      : getFirestore(appInstance);

    // Initialize Firebase Storage
    if (config.storageBucket) {
      storageInstance = getStorage(appInstance, `gs://${config.storageBucket}`);
    } else {
      storageInstance = getStorage(appInstance);
    }

    return {
      app: appInstance,
      auth: authInstance,
      db: firestoreInstance,
      storage: storageInstance,
      isOnline: true,
      hasConfig: true
    };
  } catch (error) {
    console.error('Failed to initialize Firebase with provided config:', error);
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      isOnline: false,
      hasConfig: true
    };
  }
}

// Initial setup
const initResult = initFirebaseService();
export const firebaseApp = initResult.app;
export const firebaseAuth = initResult.auth;
export const firestoreDb = initResult.db;
export const firebaseStorage = initResult.storage;
export const isConfigured = initResult.hasConfig;
export const googleAuthProvider = new GoogleAuthProvider();

export {
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};

// Connection check test
export async function testFirestoreConnection(): Promise<boolean> {
  if (!firestoreInstance) return false;
  try {
    await getDocFromServer(doc(firestoreInstance, 'test', 'connection'));
    return true;
  } catch (e: any) {
    if (e instanceof Error && e.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    // If permission or exists error, network is still reached
    if (e?.code === 'unavailable' || e?.message?.includes('offline')) {
      return false;
    }
    return true;
  }
}

// Automatically test connection when application boots
if (firestoreInstance) {
  testFirestoreConnection().catch(() => {});
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
};
export type { User, Unsubscribe };
