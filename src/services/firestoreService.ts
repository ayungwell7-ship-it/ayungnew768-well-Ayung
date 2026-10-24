import { 
  firestoreDb, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot, 
  serverTimestamp,
  Unsubscribe 
} from './firebase';
import { 
  UserProfile, 
  Achievement, 
  Hobby, 
  MusicTrack, 
  PrivateLink, 
  PrivateNote,
  SecretAccountNote,
  VaultSettings,
  CloudinaryConfig
} from '../types';
import { 
  INITIAL_PROFILE, 
  INITIAL_ACHIEVEMENTS, 
  INITIAL_HOBBIES, 
  INITIAL_MUSIC, 
  INITIAL_PRIVATE_LINKS, 
  INITIAL_PRIVATE_NOTES,
  INITIAL_SECRET_ACCOUNTS,
  DEFAULT_VAULT_PASSWORD
} from './seedData';
import { generateSalt, hashVaultPassword, encryptSecret } from '../utils/crypto';

// Local storage fallback keys
const LS_PROFILE = 'sg_demo_profile';
const LS_ACHIEVEMENTS = 'sg_demo_achievements';
const LS_HOBBIES = 'sg_demo_hobbies';
const LS_MUSIC = 'sg_demo_music';
const LS_LINKS = 'sg_demo_links';
const LS_NOTES = 'sg_demo_notes';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }
}

/* ============================================================
   PROFILE SERVICE
============================================================ */
export function subscribeToProfile(callback: (p: UserProfile) => void): Unsubscribe {
  if (firestoreDb) {
    const profileRef = doc(firestoreDb, 'profiles', 'main');
    return onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        // If not initialized in Firestore yet, provide seed profile
        callback(INITIAL_PROFILE);
      }
    }, (error) => {
      console.warn('Firestore profile sync error, falling back to local:', error);
      callback(getLocalData<UserProfile>(LS_PROFILE, INITIAL_PROFILE));
    });
  } else {
    // Local / Offline mode
    const data = getLocalData<UserProfile>(LS_PROFILE, INITIAL_PROFILE);
    callback(data);
    
    // Listen for storage events across tabs
    const handler = (e: StorageEvent) => {
      if (e.key === LS_PROFILE) {
        callback(getLocalData<UserProfile>(LS_PROFILE, INITIAL_PROFILE));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function saveProfile(data: Partial<UserProfile>): Promise<void> {
  if (firestoreDb) {
    const profileRef = doc(firestoreDb, 'profiles', 'main');
    await setDoc(profileRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else {
    const current = getLocalData<UserProfile>(LS_PROFILE, INITIAL_PROFILE);
    const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
    setLocalData(LS_PROFILE, updated);
  }
}

/* ============================================================
   ACHIEVEMENTS SERVICE
============================================================ */
export function subscribeToAchievements(callback: (items: Achievement[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'achievements');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: Achievement[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Achievement);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(list);
      } else {
        callback(INITIAL_ACHIEVEMENTS);
      }
    }, (error) => {
      console.warn('Firestore achievements sync error:', error);
      callback(getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS));
    });
  } else {
    const list = getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_ACHIEVEMENTS) {
        callback(getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createAchievement(item: Omit<Achievement, 'id'>): Promise<string> {
  const newId = `ach_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'achievements', newId);
    await setDoc(docRef, {
      ...item,
      createdAt: serverTimestamp()
    });
    return newId;
  } else {
    const current = getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
    const newEntry: Achievement = { id: newId, ...item, createdAt: new Date().toISOString() };
    setLocalData(LS_ACHIEVEMENTS, [...current, newEntry]);
    return newId;
  }
}

export async function updateAchievement(id: string, updates: Partial<Achievement>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'achievements', id);
    await updateDoc(docRef, updates);
  } else {
    const current = getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
    setLocalData(LS_ACHIEVEMENTS, updated);
  }
}

export async function deleteAchievement(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'achievements', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<Achievement[]>(LS_ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
    setLocalData(LS_ACHIEVEMENTS, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   HOBBIES SERVICE
============================================================ */
export function subscribeToHobbies(callback: (items: Hobby[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'hobbies');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: Hobby[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Hobby);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(list);
      } else {
        callback(INITIAL_HOBBIES);
      }
    }, (error) => {
      console.warn('Firestore hobbies sync error:', error);
      callback(getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES));
    });
  } else {
    const list = getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_HOBBIES) {
        callback(getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createHobby(item: Omit<Hobby, 'id'>): Promise<string> {
  const newId = `hob_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'hobbies', newId);
    await setDoc(docRef, { ...item, createdAt: serverTimestamp() });
    return newId;
  } else {
    const current = getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES);
    const newEntry: Hobby = { id: newId, ...item, createdAt: new Date().toISOString() };
    setLocalData(LS_HOBBIES, [...current, newEntry]);
    return newId;
  }
}

export async function updateHobby(id: string, updates: Partial<Hobby>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'hobbies', id);
    await updateDoc(docRef, updates);
  } else {
    const current = getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES);
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
    setLocalData(LS_HOBBIES, updated);
  }
}

export async function deleteHobby(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'hobbies', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<Hobby[]>(LS_HOBBIES, INITIAL_HOBBIES);
    setLocalData(LS_HOBBIES, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   MUSIC SERVICE
============================================================ */
export function subscribeToMusic(callback: (items: MusicTrack[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'music');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: MusicTrack[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as MusicTrack);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(list);
      } else {
        callback(INITIAL_MUSIC);
      }
    }, (error) => {
      console.warn('Firestore music sync error:', error);
      callback(getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC));
    });
  } else {
    const list = getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_MUSIC) {
        callback(getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createMusic(item: Omit<MusicTrack, 'id'>): Promise<string> {
  const newId = `mus_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'music', newId);
    await setDoc(docRef, { ...item, createdAt: serverTimestamp() });
    return newId;
  } else {
    const current = getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC);
    const newEntry: MusicTrack = { id: newId, ...item, createdAt: new Date().toISOString() };
    setLocalData(LS_MUSIC, [...current, newEntry]);
    return newId;
  }
}

export async function updateMusic(id: string, updates: Partial<MusicTrack>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'music', id);
    await updateDoc(docRef, updates);
  } else {
    const current = getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC);
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
    setLocalData(LS_MUSIC, updated);
  }
}

export async function deleteMusic(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'music', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<MusicTrack[]>(LS_MUSIC, INITIAL_MUSIC);
    setLocalData(LS_MUSIC, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   PRIVATE LINKS SERVICE (STRICTLY PRIVATE - ADMIN ONLY)
============================================================ */
export function subscribeToPrivateLinks(callback: (items: PrivateLink[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'privateLinks');
    return onSnapshot(colRef, (snapshot) => {
      const list: PrivateLink[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PrivateLink);
      });
      callback(list.length > 0 ? list : INITIAL_PRIVATE_LINKS);
    }, (error) => {
      console.warn('Firestore privateLinks sync error (permission or network):', error);
      callback(getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS));
    });
  } else {
    const list = getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_LINKS) {
        callback(getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createPrivateLink(item: Omit<PrivateLink, 'id'>): Promise<string> {
  const newId = `link_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateLinks', newId);
    await setDoc(docRef, { ...item, createdAt: serverTimestamp() });
    return newId;
  } else {
    const current = getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS);
    const newEntry: PrivateLink = { id: newId, ...item, createdAt: new Date().toISOString() };
    setLocalData(LS_LINKS, [newEntry, ...current]);
    return newId;
  }
}

export async function updatePrivateLink(id: string, updates: Partial<PrivateLink>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateLinks', id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  } else {
    const current = getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS);
    const updated = current.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
    setLocalData(LS_LINKS, updated);
  }
}

export async function deletePrivateLink(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateLinks', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<PrivateLink[]>(LS_LINKS, INITIAL_PRIVATE_LINKS);
    setLocalData(LS_LINKS, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   PRIVATE NOTES SERVICE (STRICTLY PRIVATE - ADMIN ONLY)
============================================================ */
export function subscribeToPrivateNotes(callback: (items: PrivateNote[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'privateNotes');
    return onSnapshot(colRef, (snapshot) => {
      const list: PrivateNote[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PrivateNote);
      });
      callback(list.length > 0 ? list : INITIAL_PRIVATE_NOTES);
    }, (error) => {
      console.warn('Firestore privateNotes sync error:', error);
      callback(getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES));
    });
  } else {
    const list = getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_NOTES) {
        callback(getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createPrivateNote(item: Omit<PrivateNote, 'id'>): Promise<string> {
  const newId = `note_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateNotes', newId);
    await setDoc(docRef, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return newId;
  } else {
    const current = getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES);
    const newEntry: PrivateNote = { 
      id: newId, 
      ...item, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    setLocalData(LS_NOTES, [newEntry, ...current]);
    return newId;
  }
}

export async function updatePrivateNote(id: string, updates: Partial<PrivateNote>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateNotes', id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  } else {
    const current = getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES);
    const updated = current.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
    setLocalData(LS_NOTES, updated);
  }
}

export async function deletePrivateNote(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'privateNotes', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<PrivateNote[]>(LS_NOTES, INITIAL_PRIVATE_NOTES);
    setLocalData(LS_NOTES, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   SECRET ACCOUNT NOTES SERVICE (PILIHAN B - ENCRYPTED CREDENTIALS)
============================================================ */
const LS_SECRET_NOTES = 'sg_demo_secret_notes';
const LS_VAULT_SETTINGS = 'sg_demo_vault_settings';
const LS_ADMIN_USERNAME = 'sg_demo_admin_username';

export function subscribeToSecretAccountNotes(callback: (items: SecretAccountNote[]) => void): Unsubscribe {
  if (firestoreDb) {
    const colRef = collection(firestoreDb, 'secretVaultNotes');
    return onSnapshot(colRef, (snapshot) => {
      const list: SecretAccountNote[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SecretAccountNote);
      });
      callback(list);
    }, (error) => {
      console.warn('Firestore secretVaultNotes sync error:', error);
      callback(getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []));
    });
  } else {
    const list = getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []);
    callback(list);
    const handler = (e: StorageEvent) => {
      if (e.key === LS_SECRET_NOTES) {
        callback(getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export async function createSecretAccountNote(item: Omit<SecretAccountNote, 'id'>): Promise<string> {
  const newId = `sec_${Date.now()}`;
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'secretVaultNotes', newId);
    await setDoc(docRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newId;
  } else {
    const current = getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []);
    const newEntry: SecretAccountNote = {
      id: newId,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalData(LS_SECRET_NOTES, [newEntry, ...current]);
    return newId;
  }
}

export async function updateSecretAccountNote(id: string, updates: Partial<SecretAccountNote>): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'secretVaultNotes', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } else {
    const current = getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []);
    const updated = current.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
    setLocalData(LS_SECRET_NOTES, updated);
  }
}

export async function deleteSecretAccountNote(id: string): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'secretVaultNotes', id);
    await deleteDoc(docRef);
  } else {
    const current = getLocalData<SecretAccountNote[]>(LS_SECRET_NOTES, []);
    setLocalData(LS_SECRET_NOTES, current.filter(item => item.id !== id));
  }
}

/* ============================================================
   VAULT SETTINGS (PASSWORD & SALT)
============================================================ */
export async function getVaultSettings(): Promise<VaultSettings | null> {
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'vaultSettings', 'main');
      const snap = await onSnapshotDoc(docRef);
      if (snap) return snap;
    } catch (e) {
      console.warn('Error reading vaultSettings, using local fallback:', e);
    }
  }
  return getLocalData<VaultSettings | null>(LS_VAULT_SETTINGS, null);
}

// Helper to get doc once
async function onSnapshotDoc(docRef: any): Promise<VaultSettings | null> {
  return new Promise((resolve) => {
    const unsub = onSnapshot(docRef, (snapshot: any) => {
      unsub();
      if (snapshot.exists()) {
        resolve(snapshot.data() as VaultSettings);
      } else {
        resolve(null);
      }
    }, () => {
      unsub();
      resolve(null);
    });
  });
}

export async function saveVaultSettings(settings: VaultSettings): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'vaultSettings', 'main');
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  setLocalData(LS_VAULT_SETTINGS, settings);
}

/* ============================================================
   CLOUDINARY CONFIGURATION (FREE TIER ONLINE IMAGE STORAGE)
============================================================ */
const LS_CLOUDINARY_CONFIG = 'sg_cloudinary_config';

export async function getCloudinaryConfig(): Promise<CloudinaryConfig> {
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'vaultSettings', 'cloudinary');
      const snap = await onSnapshotDoc(docRef);
      if (snap && (snap as any).cloudName) {
        setLocalData(LS_CLOUDINARY_CONFIG, snap);
        return snap as any;
      }
    } catch (e) {
      console.warn('Error reading cloudinary config from Firestore:', e);
    }
  }
  return getLocalData<CloudinaryConfig>(LS_CLOUDINARY_CONFIG, {
    cloudName: (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || ''
  });
}

export async function saveCloudinaryConfig(config: CloudinaryConfig): Promise<void> {
  if (firestoreDb) {
    const docRef = doc(firestoreDb, 'vaultSettings', 'cloudinary');
    await setDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  setLocalData(LS_CLOUDINARY_CONFIG, config);
}

/* ============================================================
   ADMIN USERNAME SETTING
============================================================ */
export async function getAdminUsername(): Promise<string> {
  try {
    const local = localStorage.getItem(LS_ADMIN_USERNAME);
    if (local) return local;
  } catch (e) {}
  return '';
}

export async function saveAdminUsername(username: string): Promise<void> {
  try {
    localStorage.setItem(LS_ADMIN_USERNAME, username);
  } catch (e) {}
}

/* ============================================================
   CLEAR ALL DATA (KOSONGKAN SELURUH DATA & KOLEKSI)
============================================================ */
export async function clearAllDatabaseData(): Promise<{ success: boolean; message: string }> {
  try {
    if (firestoreDb) {
      // 1. Reset Profile to blank initial profile
      await setDoc(doc(firestoreDb, 'profiles', 'main'), INITIAL_PROFILE);

      // 2. Clear all documents in sub-collections
      const collectionsToClear = ['achievements', 'hobbies', 'music', 'privateLinks', 'privateNotes', 'secretVaultNotes', 'vaultSettings'];
      for (const colName of collectionsToClear) {
        try {
          const colRef = collection(firestoreDb, colName);
          const snap = await getDocs(colRef);
          for (const docItem of snap.docs) {
            await deleteDoc(doc(firestoreDb, colName, docItem.id));
          }
        } catch (e) {
          console.warn(`Error clearing collection ${colName}`, e);
        }
      }
    }

    // 3. Clear all cached local data
    localStorage.removeItem(LS_PROFILE);
    localStorage.removeItem(LS_ACHIEVEMENTS);
    localStorage.removeItem(LS_HOBBIES);
    localStorage.removeItem(LS_MUSIC);
    localStorage.removeItem(LS_LINKS);
    localStorage.removeItem(LS_NOTES);
    localStorage.removeItem(LS_SECRET_NOTES);
    localStorage.removeItem(LS_ADMIN_USERNAME);
    localStorage.removeItem(LS_VAULT_SETTINGS);

    return {
      success: true,
      message: 'Semua data profil, prestasi, hobi, musik, kata-kata, dan catatan rahasia telah berhasil dikosongkan.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal mengosongkan data.'
    };
  }
}

/* ============================================================
   FIRESTORE SEED INITIALIZER (OPSIONAL)
============================================================ */
export async function seedFirebaseCloud(): Promise<{ success: boolean; message: string }> {
  return await clearAllDatabaseData();
}
