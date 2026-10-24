import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

const PASSKEY_TOKEN_KEY = 'sg_passkey_session_token';

export interface PasskeyInfo {
  id: string;
  name: string;
  createdAt: string;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
  userEmail?: string;
}

/**
 * Checks if current browser and hardware platform support WebAuthn / Passkeys
 */
export function isPasskeySupported(): boolean {
  if (typeof window === 'undefined') return false;
  return browserSupportsWebAuthn();
}

/**
 * Gets stored session token
 */
export function getPasskeyToken(): string | null {
  try {
    return localStorage.getItem(PASSKEY_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Clears passkey session token
 */
export async function clearPasskeySession(): Promise<void> {
  const token = getPasskeyToken();
  if (token) {
    try {
      await fetch('/api/passkey/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      // Ignore network errors on logout
    }
  }
  try {
    localStorage.removeItem(PASSKEY_TOKEN_KEY);
  } catch (e) {}
}

/**
 * Registers current device passkey (Fingerprint / Face ID / Windows Hello / Device PIN)
 */
export async function registerDevicePasskey(
  email: string = 'ayungwell7@gmail.com',
  deviceName?: string
): Promise<{ success: boolean; passkey?: PasskeyInfo; error?: string }> {
  if (!isPasskeySupported()) {
    return {
      success: false,
      error: 'Browser atau perangkat ini belum mendukung verifikasi biometrik Passkey (WebAuthn). Gunakan Google Chrome, Safari, atau Edge terbaru.'
    };
  }

  try {
    // 1. Get registration challenge options from backend
    const defaultDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? 'Apple Device (Face ID / Touch ID)'
      : /Android/i.test(navigator.userAgent)
      ? 'Android Phone (Sidik Jari / Wajah)'
      : /Macintosh/i.test(navigator.userAgent)
      ? 'MacBook (Touch ID)'
      : /Windows/i.test(navigator.userAgent)
      ? 'Windows PC (Windows Hello / PIN)'
      : 'Perangkat Biometrik Admin';

    const name = deviceName || defaultDevice;

    const res = await fetch('/api/passkey/register-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, deviceName: name })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Gagal memulai registrasi passkey dari server.');
    }

    const { options, challengeKey } = await res.json();

    // 2. Prompt device authenticator (Face ID / Fingerprint dialog)
    let attResp;
    try {
      attResp = await startRegistration({ optionsJSON: options });
    } catch (authError: any) {
      if (authError.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Pendaftaran passkey dibatalkan atau waktu verifikasi habis. Silakan coba kembali.'
        };
      }
      throw authError;
    }

    // 3. Send registration response to backend for cryptographic verification
    const verifyRes = await fetch('/api/passkey/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: attResp,
        challengeKey,
        deviceName: name,
        email
      })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || 'Verifikasi pendaftaran biometrik gagal.');
    }

    return {
      success: true,
      passkey: verifyData.passkey
    };
  } catch (err: any) {
    console.error('Passkey registration error:', err);
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan saat mendaftarkan passkey biometrik.'
    };
  }
}

/**
 * Authenticates admin using Biometric / Passkey
 */
export async function authenticateWithPasskey(): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  if (!isPasskeySupported()) {
    return {
      success: false,
      error: 'Perangkat atau browser tidak mendukung fitur login biometrik Passkey. Gunakan login dengan akun Google atau email.'
    };
  }

  try {
    // 1. Request authentication challenge from backend
    const challengeRes = await fetch('/api/passkey/login-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!challengeRes.ok) {
      const data = await challengeRes.json().catch(() => ({}));
      throw new Error(data.error || 'Gagal memulai verifikasi passkey.');
    }

    const { options, challengeKey } = await challengeRes.json();

    // 2. Trigger OS biometric prompt (Fingerprint / Face ID / Windows Hello)
    let asseResp;
    try {
      asseResp = await startAuthentication({ optionsJSON: options });
    } catch (authError: any) {
      if (authError.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Verifikasi sidik jari/wajah dibatalkan. Anda tetap dapat masuk menggunakan Google.'
        };
      }
      throw authError;
    }

    // 3. Send assertion to backend for signature verification
    const verifyRes = await fetch('/api/passkey/login-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: asseResp,
        challengeKey
      })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || 'Autentikasi biometrik gagal.');
    }

    // Save session token in localStorage
    if (verifyData.sessionToken) {
      try {
        localStorage.setItem(PASSKEY_TOKEN_KEY, verifyData.sessionToken);
      } catch (e) {}
    }

    return {
      success: true,
      user: verifyData.user
    };
  } catch (err: any) {
    console.error('Passkey authentication error:', err);
    return {
      success: false,
      error: err.message || 'Gagal melakukan verifikasi biometrik.'
    };
  }
}

/**
 * Retrieves the list of registered passkeys
 */
export async function getRegisteredPasskeys(): Promise<PasskeyInfo[]> {
  try {
    const res = await fetch('/api/passkey/list');
    if (res.ok) {
      const data = await res.json();
      return data.passkeys || [];
    }
  } catch (e) {
    console.warn('Failed to fetch passkeys list:', e);
  }
  return [];
}

/**
 * Deletes a registered passkey
 */
export async function deletePasskey(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/passkey/delete/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal menghapus passkey.'
    };
  }
}

/**
 * Updates a registered passkey device name
 */
export async function updatePasskeyName(id: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/passkey/update-name/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      error: data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengubah nama perangkat.',
    };
  }
}

/**
 * Verifies active passkey session on application mount
 */
export async function verifyPasskeySession(): Promise<{ valid: boolean; user?: any }> {
  const token = getPasskeyToken();
  if (!token) return { valid: false };

  try {
    const res = await fetch('/api/passkey/verify-session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return { valid: !!data.valid, user: data.user };
    }
  } catch (e) {
    // Session offline / not valid
  }
  return { valid: false };
}
