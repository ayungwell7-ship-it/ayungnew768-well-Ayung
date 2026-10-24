export type CategoryType = 'Web' | 'Sosmed' | 'Aplikasi' | 'Game';

export type NeonAccent = 'cyan' | 'purple' | 'blue' | 'emerald' | 'rose';

export interface UserProfile {
  id?: string;
  name: string;
  gamerTag: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  avatarStoragePath?: string;
  avatarFrame: string;
  status: 'Online' | 'In-Game' | 'Streaming' | 'AFK';
  currentPlaying?: string;
  
  // Identity Details
  fullName: string;
  nickname: string;
  domicile: string;
  emailContact?: string;
  aboutMe: string;
  additionalInfo: { label: string; value: string }[];
  
  // Visual Theme
  accentColor: NeonAccent;
  
  // Visibility toggles for sections
  sectionVisibility: {
    hero: boolean;
    identity: boolean;
    achievements: boolean;
    hobbies: boolean;
    music: boolean;
  };
  
  updatedAt?: any;
}

export interface Achievement {
  id: string;
  title: string;
  gameOrEvent: string;
  description: string;
  date: string;
  badge: string; // e.g., '1st Place', 'MVP', 'Diamond Rank', 'Champion'
  imageUrl?: string;
  order: number;
  highlighted?: boolean;
  createdAt?: any;
}

export interface Hobby {
  id: string;
  name: string;
  category: string; // e.g. 'Competitive Gaming', 'Speedrunning', 'Game Dev', 'Hardware Modding'
  description: string;
  icon: string; // Lucide icon name
  imageUrl?: string;
  order: number;
  createdAt?: any;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: string;
  isPublic: boolean;
  order: number;
  mediaType?: 'audio' | 'video';
  videoUrl?: string;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  createdAt?: any;
}

export interface PrivateLink {
  id: string;
  name: string;
  url: string;
  description: string;
  category: CategoryType;
  icon?: string;
  tags?: string[];
  createdAt: any;
  updatedAt?: any;
}

// Catatan Kata-Kata (Option A)
export interface PrivateNote {
  id: string;
  title: string;
  content: string;
  category: CategoryType;
  createdAt: any;
  updatedAt: any;
}

// Catatan Rahasia (Option B - Akun & Kredensial)
export type IdentityType = 'Gmail' | 'Username';
export type CredentialType = 'Password' | 'PIN';

export interface SecretAccountNote {
  id: string;
  title: string;
  category: CategoryType;
  identityType: IdentityType;
  identityValue: string; // Email or username
  credentialType: CredentialType;
  credentialValue: string; // AES-GCM encrypted ciphertext
  iv: string; // Initialization vector for AES-GCM
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface VaultSettings {
  passwordHash: string;
  salt: string;
  updatedAt?: any;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  updatedAt?: any;
}

export interface SyncStatus {
  isOnline: boolean;
  isFirebaseActive: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  mode: 'firebase' | 'local_demo';
  error: string | null;
}
