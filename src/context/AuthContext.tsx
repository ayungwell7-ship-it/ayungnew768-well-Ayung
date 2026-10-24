import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  firebaseAuth, 
  fbSignOut, 
  onAuthStateChanged,
  User 
} from '../services/firebase';

import { 
  authenticateWithPasskey, 
  verifyPasskeySession, 
  clearPasskeySession 
} from '../services/passkeyService';

import {
  AdminIdentityInfo,
  getAdminIdentity,
  loginWithCredentials,
  verifyAdminSession,
  clearAdminSession,
} from '../services/adminAuthService';

export interface AdminUserData {
  uid: string;
  accountId?: string;
  phone?: string;
  email?: string;
  displayName?: string;
  authMethod?: string;
}

interface AuthContextType {
  user: (User | AdminUserData) | null;
  isAdmin: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  adminIdentity: AdminIdentityInfo | null;
  refreshAdminIdentity: () => Promise<void>;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPasskey: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User | AdminUserData) | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminIdentity, setAdminIdentity] = useState<AdminIdentityInfo | null>(null);
  const isFirebaseActive = !!firebaseAuth;

  const refreshAdminIdentity = async () => {
    try {
      const data = await getAdminIdentity();
      if (data) {
        setAdminIdentity(data);
      }
    } catch (e) {
      console.warn('Could not load admin identity info:', e);
    }
  };

  // Restore authenticated session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Fetch public admin identity (Account ID, phone, etc.)
      const identity = await getAdminIdentity();
      if (isMounted && identity) {
        setAdminIdentity(identity);
      }

      // 2. Check active backend admin session token
      const adminSession = await verifyAdminSession();
      if (isMounted && adminSession.valid && adminSession.user) {
        setIsAdmin(true);
        setUser({
          uid: adminSession.user.uid || 'admin_syahrul_main',
          accountId: adminSession.user.accountId || identity?.accountId,
          phone: adminSession.user.phone || identity?.phone,
          email: adminSession.user.email,
          displayName: adminSession.user.displayName || 'Syahrul Gunawan',
          authMethod: 'session-token',
        });
        setIsLoading(false);
        return;
      }

      // 3. Check active passkey session token
      const passkeySession = await verifyPasskeySession();
      if (isMounted && passkeySession.valid && passkeySession.user) {
        setIsAdmin(true);
        setUser({
          uid: passkeySession.user.uid || 'admin_syahrul_main',
          accountId: passkeySession.user.accountId || identity?.accountId,
          phone: passkeySession.user.phone || identity?.phone,
          email: passkeySession.user.email,
          displayName: passkeySession.user.displayName || 'Syahrul Gunawan',
          authMethod: 'passkey',
        });
        setIsLoading(false);
        return;
      }

      // 4. Check Firebase Auth if active
      if (firebaseAuth) {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
          if (!isMounted) return;
          if (currentUser) {
            setUser(currentUser);
            setIsAdmin(true);
          } else {
            // Check if admin session is already active
            verifyAdminSession().then(s => {
              if (!isMounted) return;
              if (!s.valid) {
                setUser(null);
                setIsAdmin(false);
              }
            });
          }
          setIsLoading(false);
        });
        return () => unsubscribe();
      } else {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [isFirebaseActive]);

  // Login using Account ID or Phone Number + Password
  const handleLoginWithCredentials = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await loginWithCredentials(identifier, pass);
      if (res.success && res.user) {
        setIsAdmin(true);
        setUser({
          uid: res.user.uid || 'admin_syahrul_main',
          accountId: res.user.accountId,
          phone: res.user.phone,
          email: res.user.email,
          displayName: res.user.displayName || 'Syahrul Gunawan',
          authMethod: res.user.authMethod,
        });
        await refreshAdminIdentity();
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'ID Akun/Nomor HP atau password salah.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Gagal login.' };
    }
  };

  // Login using WebAuthn Biometric Passkey (Fingerprint / Face ID / PIN)
  const handleLoginWithPasskey = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authenticateWithPasskey();
      if (res.success && res.user) {
        setIsAdmin(true);
        setUser({
          uid: res.user.uid || 'admin_syahrul_main',
          accountId: res.user.accountId,
          phone: res.user.phone,
          email: res.user.email,
          displayName: res.user.displayName || 'Syahrul Gunawan',
          authMethod: 'biometric-passkey',
        });
        await refreshAdminIdentity();
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'Verifikasi biometrik gagal.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Gagal login dengan sidik jari/wajah.' };
    }
  };

  // Unified Logout: Terminates backend sessions and Firebase Auth
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await clearAdminSession();
      await clearPasskeySession();
      if (firebaseAuth) {
        try {
          await fbSignOut(firebaseAuth);
        } catch (e) {}
      }
      setUser(null);
      setIsAdmin(false);
      return { success: true };
    } catch (err: any) {
      console.error('Logout error:', err);
      return {
        success: false,
        error: err.message || 'Gagal melakukan logout.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isFirebaseActive,
        adminIdentity,
        refreshAdminIdentity,
        login: handleLoginWithCredentials,
        loginWithCredentials: handleLoginWithCredentials,
        loginWithPasskey: handleLoginWithPasskey,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
