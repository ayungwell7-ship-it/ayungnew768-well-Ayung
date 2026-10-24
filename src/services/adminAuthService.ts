export interface AdminIdentityInfo {
  accountId: string;
  phone: string;
  phoneVerified: boolean;
  createdAt: string;
  displayName: string;
  uid: string;
  hasPasskey?: boolean;
  passkeysCount?: number;
}

const ADMIN_TOKEN_KEY = 'sg_admin_session_token';

export function getAdminSessionToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setAdminSessionToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (e) {}
}

export async function clearAdminSession(): Promise<void> {
  const token = getAdminSessionToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {}
  }
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (e) {}
}

/**
 * Fetch Public Admin Identity Info (Account ID, Registered Phone, Creation Date)
 */
export async function getAdminIdentity(): Promise<AdminIdentityInfo | null> {
  try {
    const res = await fetch('/api/auth/identity');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to fetch admin identity from backend:', e);
  }
  return null;
}

/**
 * Login using Account ID or Phone Number + Password
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: any; sessionToken?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'ID Akun / Nomor HP atau password yang Anda masukkan salah.',
      };
    }

    if (data.sessionToken) {
      setAdminSessionToken(data.sessionToken);
    }

    return {
      success: true,
      user: data.user,
      sessionToken: data.sessionToken,
    };
  } catch (err: any) {
    console.error('Credential login error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menghubungi server autentikasi.',
    };
  }
}

/**
 * Change Admin Login Password
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const token = getAdminSessionToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Gagal mengubah password admin.',
      };
    }

    return {
      success: true,
      message: data.message || 'Password login admin berhasil diperbarui.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan sistem saat memperbarui password.',
    };
  }
}

/**
 * Request Phone Change OTP Verification Code
 */
export async function requestPhoneChangeOtp(
  newPhone: string
): Promise<{ success: boolean; otpSessionKey?: string; otpCode?: string; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/request-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Gagal meminta kode verifikasi nomor HP.',
      };
    }

    return {
      success: true,
      otpSessionKey: data.otpSessionKey,
      otpCode: data.otpCode,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan saat meminta kode verifikasi.',
    };
  }
}

/**
 * Verify OTP and Commit Phone Number Change
 */
export async function verifyPhoneChange(
  newPhone: string,
  otp: string,
  otpSessionKey?: string
): Promise<{ success: boolean; phone?: string; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify-phone-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone, otp, otpSessionKey }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Kode verifikasi tidak sesuai.',
      };
    }

    return {
      success: true,
      phone: data.phone,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan saat memverifikasi kode OTP.',
    };
  }
}

/**
 * Verify active admin session
 */
export async function verifyAdminSession(): Promise<{ valid: boolean; user?: any }> {
  const token = getAdminSessionToken();
  if (!token) return { valid: false };

  try {
    const res = await fetch('/api/auth/verify-session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { valid: !!data.valid, user: data.user };
    }
  } catch (e) {}

  return { valid: false };
}
