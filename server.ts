import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   ADMIN AUTH & PASSKEY PERSISTENT STORAGE
============================================================ */
const DATA_FILE = path.resolve(__dirname, 'admin_auth_data.json');

export interface AdminAccountData {
  uid: string;
  accountId: string; // e.g. "SG-7K4P92"
  phone: string;     // e.g. "081234567890"
  phoneVerified: boolean;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  firebaseEmail: string;
  displayName: string;
}

export interface StoredPasskey {
  id: string; // Base64URL credential ID
  name: string;
  publicKey: string; // Base64URL string
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
  createdAt: string;
  userEmail: string;
}

interface AuthStorageSchema {
  admin: AdminAccountData;
  passkeys: StoredPasskey[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Generate Crockford-style unique Account ID like "SG-7K4P92"
function generateAccountId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `SG-${random}`;
}

// Normalize phone numbers (e.g. "+62 812-3456-7890" -> "081234567890")
function normalizePhone(phone: string): string {
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+62')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

// Normalize Account ID (e.g. "sg-7k4p92" or " 7k4p92 " -> "SG-7K4P92")
function normalizeAccountId(id: string): string {
  let clean = id.trim().toUpperCase();
  if (!clean.startsWith('SG-') && clean.length === 6) {
    clean = `SG-${clean}`;
  }
  return clean;
}

function loadAuthData(): AuthStorageSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.admin && Array.isArray(parsed.passkeys)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading auth data file, creating fresh initial data:', e);
  }

  // Initial persistent admin setup
  const salt = crypto.randomBytes(16).toString('hex');
  const initialHash = hashPassword('admin123', salt);
  const initialData: AuthStorageSchema = {
    admin: {
      uid: 'admin_syahrul_main',
      accountId: generateAccountId(),
      phone: '081234567890',
      phoneVerified: true,
      createdAt: '15 Oktober 2026',
      passwordSalt: salt,
      passwordHash: initialHash,
      firebaseEmail: 'ayungwell7@gmail.com',
      displayName: 'Syahrul Gunawan',
    },
    passkeys: [],
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial auth data file:', err);
  }
  return initialData;
}

function saveAuthData(data: AuthStorageSchema): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save auth data file:', err);
  }
}

// In-memory runtime state
let authData = loadAuthData();
const challenges = new Map<string, { challenge: string; expiresAt: number; email?: string }>();
const sessionStore = new Map<string, { email: string; accountId: string; uid: string; expiresAt: number }>();
// Brute-force rate limiting: identifier -> { count, lockedUntil }
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
// OTP verification store for phone changes: sessionKey -> { newPhone, otp, expiresAt }
const phoneOtpStore = new Map<string, { newPhone: string; otp: string; expiresAt: number }>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, val] of challenges.entries()) {
    if (val.expiresAt < now) challenges.delete(key);
  }
  for (const [token, val] of sessionStore.entries()) {
    if (val.expiresAt < now) sessionStore.delete(token);
  }
  for (const [key, val] of phoneOtpStore.entries()) {
    if (val.expiresAt < now) phoneOtpStore.delete(key);
  }
  for (const [key, val] of failedAttempts.entries()) {
    if (val.lockedUntil < now && val.count >= 5) failedAttempts.delete(key);
  }
}

function getRpAndOrigin(req: express.Request): { rpID: string; origin: string } {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000') as string;
  const proto = (req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')) as string;
  const hostWithoutPort = host.split(':')[0];
  const origin = `${proto}://${host}`;
  return { rpID: hostWithoutPort, origin };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  /* ============================================================
     ADMIN AUTHENTICATION API ROUTES (/api/auth)
  ============================================================ */
  const authRouter = express.Router();

  // 1. Get Admin Public Identity Info (Account ID, Phone, Verification status)
  authRouter.get('/identity', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    res.json({
      accountId: authData.admin.accountId,
      phone: authData.admin.phone,
      phoneVerified: authData.admin.phoneVerified,
      createdAt: authData.admin.createdAt,
      displayName: authData.admin.displayName,
      uid: authData.admin.uid,
      hasPasskey: authData.passkeys.length > 0,
      passkeysCount: authData.passkeys.length,
    });
  });

  // 2. Admin Login via Account ID or Phone Number + Password
  authRouter.post('/login', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Harap masukkan ID Akun atau Nomor HP beserta password admin.',
      });
    }

    const inputClean = String(identifier).trim();
    const inputNormalizedId = normalizeAccountId(inputClean);
    const inputNormalizedPhone = normalizePhone(inputClean);
    const storedPhoneNormalized = normalizePhone(authData.admin.phone);

    // Rate Limiting Check
    const rateKey = inputNormalizedId || inputNormalizedPhone;
    const attempt = failedAttempts.get(rateKey);
    const now = Date.now();
    if (attempt && attempt.count >= 5 && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        error: `Terlalu banyak percobaan gagal. Silakan coba kembali dalam ${waitSeconds} detik.`,
      });
    }

    // Check if identifier matches Account ID or Phone Number
    const matchesId = inputNormalizedId === authData.admin.accountId;
    const matchesPhone = inputNormalizedPhone.length >= 8 && inputNormalizedPhone === storedPhoneNormalized;

    if (!matchesId && !matchesPhone) {
      // Record failed attempt
      const currentCount = (attempt ? attempt.count : 0) + 1;
      failedAttempts.set(rateKey, {
        count: currentCount,
        lockedUntil: currentCount >= 5 ? now + 5 * 60 * 1000 : now,
      });
      return res.status(401).json({
        success: false,
        error: 'ID Akun / Nomor HP atau password yang Anda masukkan salah.',
      });
    }

    // Verify Password Hash
    const isValid = verifyPassword(String(password), authData.admin.passwordSalt, authData.admin.passwordHash);
    if (!isValid) {
      const currentCount = (attempt ? attempt.count : 0) + 1;
      failedAttempts.set(rateKey, {
        count: currentCount,
        lockedUntil: currentCount >= 5 ? now + 5 * 60 * 1000 : now,
      });
      return res.status(401).json({
        success: false,
        error: 'ID Akun / Nomor HP atau password yang Anda masukkan salah.',
      });
    }

    // Successful login: clear failed attempts
    failedAttempts.delete(rateKey);

    // Create session token (14 days valid)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessionStore.set(sessionToken, {
      email: authData.admin.firebaseEmail,
      accountId: authData.admin.accountId,
      uid: authData.admin.uid,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      sessionToken,
      user: {
        uid: authData.admin.uid,
        accountId: authData.admin.accountId,
        phone: authData.admin.phone,
        email: authData.admin.firebaseEmail,
        displayName: authData.admin.displayName,
        authMethod: matchesId ? 'account-id' : 'phone-password',
      },
    });
  });

  // 3. Change Admin Login Password
  authRouter.post('/change-password', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Harap masukkan password lama dan password baru.',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password baru minimal harus terdiri dari 6 karakter.',
      });
    }

    // Verify old password
    const isOldValid = verifyPassword(String(currentPassword), authData.admin.passwordSalt, authData.admin.passwordHash);
    if (!isOldValid) {
      return res.status(401).json({
        success: false,
        error: 'Password lama yang Anda masukkan tidak sesuai.',
      });
    }

    // Generate new salt and new hash
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(String(newPassword), newSalt);

    authData.admin.passwordSalt = newSalt;
    authData.admin.passwordHash = newHash;
    saveAuthData(authData);

    res.json({
      success: true,
      message: 'Password login admin berhasil diperbarui. Password lama sudah tidak berlaku.',
    });
  });

  // 4. Request Phone Number Change with 6-digit OTP
  authRouter.post('/request-phone-otp', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const { newPhone } = req.body;

    if (!newPhone) {
      return res.status(400).json({ success: false, error: 'Harap masukkan nomor HP baru.' });
    }

    const cleanNew = normalizePhone(String(newPhone));
    if (cleanNew.length < 9 || cleanNew.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Format nomor HP tidak valid. Masukkan nomor HP aktif minimal 9 digit (contoh: 081234567890).',
      });
    }

    const cleanCurrent = normalizePhone(authData.admin.phone);
    if (cleanNew === cleanCurrent) {
      return res.status(400).json({
        success: false,
        error: 'Nomor HP baru sama dengan nomor HP yang saat ini terdaftar.',
      });
    }

    // Generate 6-digit random verification code
    const otp = String(crypto.randomInt(100000, 999999));
    const sessionKey = crypto.randomBytes(16).toString('hex');

    phoneOtpStore.set(sessionKey, {
      newPhone: cleanNew,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    res.json({
      success: true,
      message: `Kode verifikasi OTP 6-digit telah dibuat untuk nomor ${cleanNew}.`,
      otpSessionKey: sessionKey,
      otpCode: otp, // Returned for instant mobile verification
    });
  });

  // 5. Verify and Commit Phone Number Change
  authRouter.post('/verify-phone-change', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const { otpSessionKey, newPhone, otp } = req.body;

    let targetStoreKey = otpSessionKey;
    if (!targetStoreKey) {
      // Find by newPhone
      for (const [key, val] of phoneOtpStore.entries()) {
        if (normalizePhone(val.newPhone) === normalizePhone(newPhone)) {
          targetStoreKey = key;
          break;
        }
      }
    }

    const storedOtpData = targetStoreKey ? phoneOtpStore.get(targetStoreKey) : null;
    if (!storedOtpData || storedOtpData.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Kode verifikasi telah kadaluwarsa atau tidak valid. Harap minta kode baru.',
      });
    }

    if (String(storedOtpData.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Kode verifikasi OTP yang Anda masukkan salah.',
      });
    }

    // Commit phone number change
    authData.admin.phone = storedOtpData.newPhone;
    authData.admin.phoneVerified = true;
    saveAuthData(authData);
    phoneOtpStore.delete(targetStoreKey);

    res.json({
      success: true,
      message: `Nomor HP berhasil diperbarui menjadi ${authData.admin.phone}. Identitas UID dan ID Akun tetap terjaga.`,
      phone: authData.admin.phone,
      phoneVerified: true,
    });
  });

  // 6. Verify Active Admin Session
  authRouter.get('/verify-session', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }
    const token = authHeader.split(' ')[1];
    const session = sessionStore.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessionStore.delete(token);
      return res.status(401).json({ valid: false });
    }
    res.json({
      valid: true,
      user: {
        uid: authData.admin.uid,
        accountId: authData.admin.accountId,
        phone: authData.admin.phone,
        email: authData.admin.firebaseEmail,
        displayName: authData.admin.displayName,
      },
    });
  });

  // 7. Logout Session
  authRouter.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      sessionStore.delete(token);
    }
    res.json({ success: true });
  });

  app.use('/api/auth', authRouter);

  /* ============================================================
     WEBAUTHN PASSKEY API ROUTES (/api/passkey)
  ============================================================ */
  const passkeyRouter = express.Router();

  // 1. Status
  passkeyRouter.get('/status', (req, res) => {
    authData = loadAuthData();
    res.json({
      enabled: true,
      registeredCount: authData.passkeys.length,
      rpName: 'Syahrul Gunawan Gaming Profile',
    });
  });

  // 2. List Registered Passkeys
  passkeyRouter.get('/list', (req, res) => {
    authData = loadAuthData();
    const list = authData.passkeys.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      deviceType: p.deviceType,
      backedUp: p.backedUp,
      transports: p.transports,
      userEmail: p.userEmail,
    }));
    res.json({ passkeys: list });
  });

  // 3. Delete a Registered Passkey
  passkeyRouter.delete('/delete/:id', (req, res) => {
    authData = loadAuthData();
    const { id } = req.params;
    const initialLen = authData.passkeys.length;
    authData.passkeys = authData.passkeys.filter(p => p.id !== id);

    if (authData.passkeys.length < initialLen) {
      saveAuthData(authData);
      return res.json({ success: true, message: 'Passkey berhasil dihapus.' });
    }
    return res.status(404).json({ success: false, error: 'Passkey tidak ditemukan.' });
  });

  // 4. Update Device Name for a Passkey
  passkeyRouter.put('/update-name/:id', (req, res) => {
    authData = loadAuthData();
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nama perangkat tidak boleh kosong.' });
    }

    const passkey = authData.passkeys.find(p => p.id === id);
    if (!passkey) {
      return res.status(404).json({ success: false, error: 'Passkey tidak ditemukan.' });
    }

    passkey.name = name.trim();
    saveAuthData(authData);
    res.json({ success: true, message: 'Nama perangkat berhasil diperbarui.', passkey });
  });

  // 5. Generate Registration Challenge
  passkeyRouter.post('/register-challenge', async (req, res) => {
    try {
      cleanExpired();
      authData = loadAuthData();
      const { email, deviceName } = req.body;
      const adminEmail = email || authData.admin.firebaseEmail;
      const { rpID } = getRpAndOrigin(req);

      const excludeCredentials = authData.passkeys.map(p => ({
        id: p.id,
        transports: p.transports as any,
      }));

      const options = await generateRegistrationOptions({
        rpName: 'Syahrul Gunawan | Gaming Profile',
        rpID,
        userID: new TextEncoder().encode(adminEmail),
        userName: adminEmail,
        userDisplayName: authData.admin.displayName,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      const challengeKey = `reg_${options.challenge}`;
      challenges.set(challengeKey, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000,
        email: adminEmail,
      });

      res.json({ options, challengeKey, deviceName });
    } catch (err: any) {
      console.error('Registration challenge error:', err);
      res.status(500).json({ error: err.message || 'Gagal membuat challenge pendaftaran passkey.' });
    }
  });

  // 6. Verify Registration Response & Store Credential
  passkeyRouter.post('/register-verify', async (req, res) => {
    try {
      cleanExpired();
      authData = loadAuthData();
      const { response, challengeKey, deviceName, email } = req.body;
      const stored = challenges.get(challengeKey);

      if (!stored) {
        return res.status(400).json({ verified: false, error: 'Challenge telah kadaluwarsa atau tidak valid. Silakan coba lagi.' });
      }

      challenges.delete(challengeKey);
      const { rpID, origin } = getRpAndOrigin(req);

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const {
          credential,
          credentialDeviceType,
          credentialBackedUp,
        } = verification.registrationInfo;

        const newPasskey: StoredPasskey = {
          id: credential.id,
          name: deviceName || 'Perangkat Biometrik Admin',
          publicKey: Buffer.from(credential.publicKey).toString('base64url'),
          counter: credential.counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: response.response.transports || ['internal', 'hybrid'],
          createdAt: new Date().toISOString(),
          userEmail: stored.email || email || authData.admin.firebaseEmail,
        };

        // Update or append
        const existingIdx = authData.passkeys.findIndex(p => p.id === newPasskey.id);
        if (existingIdx >= 0) {
          authData.passkeys[existingIdx] = newPasskey;
        } else {
          authData.passkeys.push(newPasskey);
        }
        saveAuthData(authData);

        return res.json({
          verified: true,
          passkey: {
            id: newPasskey.id,
            name: newPasskey.name,
            createdAt: newPasskey.createdAt,
            deviceType: newPasskey.deviceType,
            backedUp: newPasskey.backedUp,
          },
        });
      }

      res.status(400).json({ verified: false, error: 'Verifikasi pendaftaran WebAuthn gagal.' });
    } catch (err: any) {
      console.error('Registration verify error:', err);
      res.status(400).json({ verified: false, error: err.message || 'Verifikasi pendaftaran gagal.' });
    }
  });

  // 7. Generate Authentication Challenge (for biometric/passkey login)
  passkeyRouter.post('/login-challenge', async (req, res) => {
    try {
      cleanExpired();
      authData = loadAuthData();
      const { rpID } = getRpAndOrigin(req);

      const allowCredentials = authData.passkeys.map(p => ({
        id: p.id,
        transports: p.transports as any,
      }));

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
      });

      const challengeKey = `auth_${options.challenge}`;
      challenges.set(challengeKey, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json({ options, challengeKey });
    } catch (err: any) {
      console.error('Authentication challenge error:', err);
      res.status(500).json({ error: err.message || 'Gagal membuat challenge login biometrik.' });
    }
  });

  // 8. Verify Authentication Response (Login with fingerprint/face/PIN)
  passkeyRouter.post('/login-verify', async (req, res) => {
    try {
      cleanExpired();
      authData = loadAuthData();
      const { response, challengeKey } = req.body;
      const stored = challenges.get(challengeKey);

      if (!stored) {
        return res.status(400).json({ verified: false, error: 'Challenge login telah kadaluwarsa. Silakan ulangi.' });
      }

      challenges.delete(challengeKey);
      const { rpID, origin } = getRpAndOrigin(req);

      const passkey = authData.passkeys.find(p => p.id === response.id);
      if (!passkey) {
        return res.status(400).json({ verified: false, error: 'Kredensial passkey tidak ditemukan atau belum terdaftar pada akun admin ini.' });
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.id,
          publicKey: Buffer.from(passkey.publicKey, 'base64url'),
          counter: passkey.counter,
          transports: passkey.transports as any,
        },
      });

      if (verification.verified) {
        passkey.counter = verification.authenticationInfo.newCounter;
        saveAuthData(authData);

        // Generate cryptographically secure session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        sessionStore.set(sessionToken, {
          email: passkey.userEmail,
          accountId: authData.admin.accountId,
          uid: authData.admin.uid,
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
        });

        return res.json({
          verified: true,
          sessionToken,
          user: {
            email: passkey.userEmail,
            accountId: authData.admin.accountId,
            phone: authData.admin.phone,
            uid: authData.admin.uid,
            displayName: authData.admin.displayName,
            authMethod: 'biometric-passkey',
          },
        });
      }

      res.status(400).json({ verified: false, error: 'Tanda tangan biometrik tidak valid.' });
    } catch (err: any) {
      console.error('Login verify error:', err);
      res.status(400).json({ verified: false, error: err.message || 'Autentikasi biometrik gagal.' });
    }
  });

  // 9. Session Validation Endpoint
  passkeyRouter.get('/verify-session', (req, res) => {
    cleanExpired();
    authData = loadAuthData();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }
    const token = authHeader.split(' ')[1];
    const session = sessionStore.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessionStore.delete(token);
      return res.status(401).json({ valid: false });
    }
    res.json({
      valid: true,
      user: {
        email: session.email,
        accountId: authData.admin.accountId,
        phone: authData.admin.phone,
        uid: authData.admin.uid,
        displayName: authData.admin.displayName,
        authMethod: 'biometric-passkey',
      },
    });
  });

  // 10. Session Logout
  passkeyRouter.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      sessionStore.delete(token);
    }
    res.json({ success: true });
  });

  app.use('/api/passkey', passkeyRouter);

  /* ============================================================
     VITE INTEGRATION
  ============================================================ */
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULL-STACK SERVER] Ready on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
