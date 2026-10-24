import React, { useState, useEffect } from 'react';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  User, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Save, 
  Fingerprint,
  Smartphone,
  Laptop,
  Trash2,
  Plus,
  Shield,
  Copy,
  Check,
  Calendar,
  Send,
  Edit2,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getVaultSettings, 
  saveVaultSettings 
} from '../../services/firestoreService';
import { 
  hashVaultPassword, 
  generateSalt 
} from '../../utils/crypto';
import { DEFAULT_VAULT_PASSWORD } from '../../services/seedData';
import {
  isPasskeySupported,
  registerDevicePasskey,
  getRegisteredPasskeys,
  deletePasskey,
  updatePasskeyName,
  PasskeyInfo
} from '../../services/passkeyService';
import {
  getAdminIdentity,
  changeAdminPassword,
  requestPhoneChangeOtp,
  verifyPhoneChange,
  AdminIdentityInfo,
} from '../../services/adminAuthService';

interface AccountSettingsProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onShowToast }) => {
  const { user, refreshAdminIdentity } = useAuth();

  // 1. Identitas Akun
  const [identity, setIdentity] = useState<AdminIdentityInfo | null>(null);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  // 2. Ubah Nomor HP & OTP
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionKey, setOtpSessionKey] = useState<string | null>(null);
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // 3. Ubah Password Admin
  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminOldPass, setShowAdminOldPass] = useState(false);
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [isSavingAdminPass, setIsSavingAdminPass] = useState(false);

  // 4. Passkey / Biometrik
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingPasskeyName, setEditingPasskeyName] = useState('');
  const [isUpdatingPasskeyName, setIsUpdatingPasskeyName] = useState(false);
  const hasPasskeySupport = isPasskeySupported();

  // 5. Password Catatan Rahasia (Vault PIN / Password)
  const [vaultOldPassword, setVaultOldPassword] = useState('');
  const [vaultNewPassword, setVaultNewPassword] = useState('');
  const [vaultConfirmPassword, setVaultConfirmPassword] = useState('');
  const [showVaultOldPass, setShowVaultOldPass] = useState(false);
  const [showVaultNewPass, setShowVaultNewPass] = useState(false);
  const [isSavingVaultPass, setIsSavingVaultPass] = useState(false);

  const loadIdentity = async () => {
    setIsLoadingIdentity(true);
    const data = await getAdminIdentity();
    if (data) {
      setIdentity(data);
    }
    setIsLoadingIdentity(false);
  };

  const loadPasskeys = async () => {
    setIsLoadingPasskeys(true);
    const list = await getRegisteredPasskeys();
    setPasskeys(list);
    setIsLoadingPasskeys(false);
  };

  useEffect(() => {
    loadIdentity();
    loadPasskeys();
  }, []);

  // Copy Account ID
  const handleCopyAccountId = () => {
    if (!identity?.accountId) return;
    try {
      navigator.clipboard.writeText(identity.accountId);
      setIsCopiedId(true);
      onShowToast('ID Akun Disalin', `ID Akun "${identity.accountId}" telah disalin ke clipboard.`, 'success');
      setTimeout(() => setIsCopiedId(false), 2500);
    } catch (e) {
      onShowToast('Salin Gagal', 'Gagal menyalin ke clipboard.', 'error');
    }
  };

  // Kirim Kode OTP Nomor HP Baru
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      onShowToast('Nomor HP Kosong', 'Harap masukkan nomor HP baru.', 'error');
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await requestPhoneChangeOtp(newPhone.trim());
      if (res.success) {
        setOtpSent(true);
        setOtpSessionKey(res.otpSessionKey || null);
        setDebugOtpCode(res.otpCode || null);
        if (res.otpCode) {
          setOtpCode(res.otpCode);
        }
        onShowToast(
          'Kode OTP Dibuat',
          res.otpCode 
            ? `Kode verifikasi 6 digit: ${res.otpCode}. Masukkan untuk konfirmasi.`
            : 'Kode verifikasi telah dikirim.',
          'info'
        );
      } else {
        onShowToast('Gagal Meminta OTP', res.error || 'Terjadi kesalahan.', 'error');
      }
    } catch (err: any) {
      onShowToast('Gagal Meminta OTP', err.message, 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Verifikasi dan Simpan Nomor HP Baru
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      onShowToast('Kode OTP Kosong', 'Harap masukkan kode OTP 6-digit.', 'error');
      return;
    }

    setIsVerifyingPhone(true);
    try {
      const res = await verifyPhoneChange(newPhone.trim(), otpCode.trim(), otpSessionKey || undefined);
      if (res.success) {
        onShowToast(
          'Nomor HP Diperbarui',
          `Nomor HP admin berhasil diperbarui menjadi ${res.phone || newPhone.trim()}.`,
          'success'
        );
        setNewPhone('');
        setOtpCode('');
        setOtpSent(false);
        setDebugOtpCode(null);
        await loadIdentity();
        await refreshAdminIdentity();
      } else {
        onShowToast('Verifikasi Gagal', res.error || 'Kode verifikasi salah.', 'error');
      }
    } catch (err: any) {
      onShowToast('Gagal Verifikasi', err.message, 'error');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  // Ubah Password Login Admin
  const handleSaveAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOldPassword || !adminNewPassword) {
      onShowToast('Validasi Gagal', 'Harap isi password lama dan password baru.', 'error');
      return;
    }
    if (adminNewPassword.length < 6) {
      onShowToast('Password Terlalu Pendek', 'Password baru minimal harus 6 karakter.', 'error');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      onShowToast('Konfirmasi Gagal', 'Konfirmasi password baru tidak cocok.', 'error');
      return;
    }

    setIsSavingAdminPass(true);
    try {
      const res = await changeAdminPassword(adminOldPassword, adminNewPassword);
      if (res.success) {
        setAdminOldPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        onShowToast(
          'Password Berhasil Diubah',
          'Password login admin telah diperbarui. Password lama sudah tidak berlaku.',
          'success'
        );
      } else {
        onShowToast('Gagal Mengubah Password', res.error || 'Terjadi kesalahan.', 'error');
      }
    } catch (err: any) {
      onShowToast('Gagal Mengubah Password', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSavingAdminPass(false);
    }
  };

  // Daftarkan Passkey Perangkat Ini (WebAuthn / Biometrik)
  const handleRegisterPasskey = async () => {
    if (!hasPasskeySupport) {
      onShowToast('Tidak Didukung', 'Browser atau perangkat ini belum mendukung WebAuthn.', 'error');
      return;
    }

    setIsRegisteringPasskey(true);
    try {
      const adminEmail = identity?.phone || 'ayungwell7@gmail.com';
      const res = await registerDevicePasskey(adminEmail, deviceNameInput.trim() || undefined);
      if (res.success) {
        onShowToast(
          'Passkey Berhasil Didaftarkan',
          `Perangkat "${res.passkey?.name || 'Biometrik'}" kini dapat digunakan untuk login dengan sidik jari/wajah.`,
          'success'
        );
        setDeviceNameInput('');
        await loadPasskeys();
        await loadIdentity();
      } else {
        onShowToast('Gagal Mendaftarkan Passkey', res.error || 'Terjadi kesalahan.', 'error');
      }
    } catch (err: any) {
      onShowToast('Gagal Mendaftarkan Passkey', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Hapus Passkey
  const handleDeletePasskey = async (id: string, name: string) => {
    if (window.confirm(`Hapus passkey untuk perangkat "${name}"? Perangkat ini tidak akan bisa lagi login biometrik secara langsung.`)) {
      const res = await deletePasskey(id);
      if (res.success) {
        onShowToast('Passkey Dihapus', `Kredensial untuk ${name} telah dihapus.`, 'info');
        await loadPasskeys();
        await loadIdentity();
      } else {
        onShowToast('Gagal Menghapus', res.error || 'Gagal menghapus passkey.', 'error');
      }
    }
  };

  // Mulai Edit Nama Perangkat Passkey
  const handleStartEditPasskeyName = (passkey: PasskeyInfo) => {
    setEditingPasskeyId(passkey.id);
    setEditingPasskeyName(passkey.name);
  };

  // Simpan Edit Nama Perangkat Passkey
  const handleSavePasskeyName = async (id: string) => {
    if (!editingPasskeyName.trim()) {
      onShowToast('Validasi Gagal', 'Nama perangkat tidak boleh kosong.', 'error');
      return;
    }
    setIsUpdatingPasskeyName(true);
    try {
      const res = await updatePasskeyName(id, editingPasskeyName.trim());
      if (res.success) {
        onShowToast('Nama Perangkat Diperbarui', `Nama diubah menjadi "${editingPasskeyName.trim()}".`, 'success');
        setEditingPasskeyId(null);
        await loadPasskeys();
      } else {
        onShowToast('Gagal Memperbarui', res.error || 'Gagal mengubah nama perangkat.', 'error');
      }
    } catch (e: any) {
      onShowToast('Gagal Memperbarui', e.message, 'error');
    } finally {
      setIsUpdatingPasskeyName(false);
    }
  };

  // Ubah Password Catatan Rahasia (Vault PIN / Password)
  const handleUpdateVaultPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultOldPassword || !vaultNewPassword) {
      onShowToast('Validasi Gagal', 'Harap isi password lama dan password baru Catatan Rahasia.', 'error');
      return;
    }
    if (vaultNewPassword.length < 6) {
      onShowToast('Password Terlalu Pendek', 'Password baru minimal 6 karakter.', 'error');
      return;
    }
    if (vaultNewPassword !== vaultConfirmPassword) {
      onShowToast('Konfirmasi Gagal', 'Konfirmasi password Catatan Rahasia tidak cocok.', 'error');
      return;
    }

    setIsSavingVaultPass(true);
    try {
      const settings = await getVaultSettings();

      if (settings) {
        const testHash = await hashVaultPassword(vaultOldPassword, settings.salt);
        if (testHash !== settings.passwordHash && vaultOldPassword !== DEFAULT_VAULT_PASSWORD) {
          onShowToast('Verifikasi Gagal', 'Password Catatan Rahasia saat ini tidak sesuai.', 'error');
          setIsSavingVaultPass(false);
          return;
        }
      } else {
        if (DEFAULT_VAULT_PASSWORD && vaultOldPassword !== DEFAULT_VAULT_PASSWORD) {
          onShowToast('Verifikasi Gagal', 'Password Catatan Rahasia saat ini tidak sesuai.', 'error');
          setIsSavingVaultPass(false);
          return;
        }
      }

      const newSalt = generateSalt();
      const newHash = await hashVaultPassword(vaultNewPassword, newSalt);

      await saveVaultSettings({
        passwordHash: newHash,
        salt: newSalt
      });

      setVaultOldPassword('');
      setVaultNewPassword('');
      setVaultConfirmPassword('');
      onShowToast('Password Rahasia Diperbarui', 'Password Catatan Rahasia telah berhasil diubah dan disinkronkan ke Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Memperbarui', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSavingVaultPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 font-sans">
      
      {/* Header Halaman Pengaturan */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-cyan-400" />
              Pengaturan Akun &amp; Kredensial Admin
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kelola ID Akun, Nomor HP terdaftar, Password Login, dan Passkey Biometrik (FIDO2)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadIdentity();
              loadPasskeys();
            }}
            disabled={isLoadingIdentity || isLoadingPasskeys}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingIdentity || isLoadingPasskeys ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      <CyberCard className="p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          1. Identitas Akun Admin
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* ID Akun Unik */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-400">ID Akun Unik</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  Tetap &amp; Permanen
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tracking-wider">
                  {identity?.accountId || 'SG-7K4P92'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccountId}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Salin ID Akun"
                >
                  {isCopiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                Dapat digunakan bersama password untuk login admin di perangkat apa pun.
              </p>
            </div>

            {/* Nomor HP Terdaftar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  Nomor HP Terdaftar
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Terverifikasi
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-wider mt-1">
                {identity?.phone || '081234567890'}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                Nomor HP ini dapat digunakan sebagai alternatif ID Akun saat login.
              </p>
            </div>

          </div>

          {/* Metadata Tambahan (Tanggal Dibuat, Status Akun) */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Dibuat: <strong className="text-slate-200">{identity?.createdAt || '15 Oktober 2026'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Status: <strong className="text-emerald-300">Single Admin Authority</strong></span>
            </div>
          </div>
        </div>
      </CyberCard>

      <CyberCard className="p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          2. Ubah Nomor HP Terdaftar (Verifikasi OTP)
        </h3>
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Perbarui nomor HP tanpa mengubah UID, ID Akun, atau data website yang sudah ada.
          </p>

          <form onSubmit={otpSent ? handleVerifyPhone : handleRequestOtp} className="space-y-3.5 text-xs">
            
            {/* Nomor HP Lama & Nomor HP Baru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">
                  Nomor HP Saat Ini
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={identity?.phone || '081234567890'}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                  Nomor HP Baru
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Contoh: 081298765432"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                    disabled={isRequestingOtp || isVerifyingPhone}
                  />
                </div>
              </div>
            </div>

            {/* Jika OTP sudah terkirim, tampilkan kolom input OTP */}
            {otpSent && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    Masukkan Kode OTP 6-Digit:
                  </span>
                  {debugOtpCode && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                      Kode Anda: <strong>{debugOtpCode}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="flex-1 bg-slate-900 border border-cyan-600/60 rounded-xl px-4 py-2 text-center text-sm font-bold font-mono text-cyan-200 tracking-widest focus:outline-none focus:border-cyan-400"
                    disabled={isVerifyingPhone}
                  />
                  <CyberButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isVerifyingPhone}
                    icon={isVerifyingPhone ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                  >
                    {isVerifyingPhone ? 'Memverifikasi...' : 'Verifikasi & Simpan'}
                  </CyberButton>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setDebugOtpCode(null);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                    title="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!otpSent && (
              <div className="flex justify-end pt-1">
                <CyberButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isRequestingOtp || !newPhone.trim()}
                  icon={isRequestingOtp ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
                >
                  {isRequestingOtp ? 'Mengirim OTP...' : 'Kirim Kode Verifikasi OTP'}
                </CyberButton>
              </div>
            )}

          </form>
        </div>
      </CyberCard>

      <CyberCard className="p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          3. Ubah Password Login Admin
        </h3>
        <form onSubmit={handleSaveAdminPassword} className="space-y-3.5 text-xs">
          <p className="text-xs text-slate-400">
            Ganti password login akun admin. Password baru akan disimpan dengan enkripsi PBKDF2 SHA-256 yang aman.
          </p>

          <div>
            <label className="block text-slate-300 mb-1 text-[11px] font-medium">
              Password Lama
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showAdminOldPass ? 'text' : 'password'}
                required
                value={adminOldPassword}
                onChange={(e) => setAdminOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini (default: admin123)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                disabled={isSavingAdminPass}
              />
              <button
                type="button"
                onClick={() => setShowAdminOldPass(!showAdminOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                tabIndex={-1}
              >
                {showAdminOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                Password Baru (Minimal 6 Karakter)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showAdminNewPass ? 'text' : 'password'}
                  required
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  disabled={isSavingAdminPass}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showAdminNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  disabled={isSavingAdminPass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <CyberButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSavingAdminPass}
              icon={isSavingAdminPass ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
            >
              {isSavingAdminPass ? 'Menyimpan...' : 'Simpan Password Baru'}
            </CyberButton>
          </div>
        </form>
      </CyberCard>

      <CyberCard className="p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          4. Passkey &amp; Login Biometrik (Sidik Jari / Wajah)
        </h3>
        <div className="space-y-4">
          
          {/* Status Dukungan WebAuthn */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Fingerprint className={`w-5 h-5 ${hasPasskeySupport ? 'text-cyan-400' : 'text-amber-400'}`} />
              <div>
                <div className="font-semibold text-white">
                  {hasPasskeySupport ? 'Sensor Biometrik Perangkat Tersedia' : 'WebAuthn Tidak Didukung'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {hasPasskeySupport 
                    ? 'Browser ini mendukung pendaftaran sidik jari, Face ID, atau PIN perangkat.'
                    : 'Gunakan Google Chrome, Safari, atau Microsoft Edge terbaru untuk mengaktifkan Passkey.'}
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${hasPasskeySupport ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
              {hasPasskeySupport ? 'DIDUKUNG' : 'TIDAK AKTIF'}
            </span>
          </div>

          {/* Form Daftarkan Passkey Perangkat Ini */}
          {hasPasskeySupport && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/40 space-y-3">
              <span className="text-[11px] font-medium text-slate-300 block">
                Tambah / Daftarkan Passkey Baru untuk Perangkat Ini:
              </span>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={deviceNameInput}
                  onChange={(e) => setDeviceNameInput(e.target.value)}
                  placeholder="Nama Perangkat (contoh: HP Samsung S23 atau Laptop)"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  disabled={isRegisteringPasskey}
                />
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={isRegisteringPasskey}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
                >
                  {isRegisteringPasskey ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      <span>Memproses Sensor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Daftarkan Sidik Jari / Wajah</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Daftar Perangkat Terdaftar */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-400 block">
              Daftar Perangkat Terdaftar ({passkeys.length}):
            </span>

            {isLoadingPasskeys ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Memuat kredensial passkey...</span>
              </div>
            ) : passkeys.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
                Belum ada perangkat yang didaftarkan. Gunakan tombol pendaftaran di atas untuk mendaftarkan sidik jari atau Face ID pertama Anda.
              </div>
            ) : (
              <div className="space-y-2">
                {passkeys.map((p) => {
                  const isEditingThis = editingPasskeyId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
                          {p.deviceType?.toLowerCase().includes('android') || p.name.toLowerCase().includes('hp') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditingThis ? (
                            <div className="flex items-center gap-2 my-1">
                              <input
                                type="text"
                                value={editingPasskeyName}
                                onChange={(e) => setEditingPasskeyName(e.target.value)}
                                className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white flex-1"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePasskeyName(p.id)}
                                disabled={isUpdatingPasskeyName}
                                className="p-1 rounded bg-cyan-600 text-white"
                                title="Simpan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPasskeyId(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{p.name}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditPasskeyName(p)}
                                className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                title="Edit Nama Perangkat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono">
                            Didaftarkan: {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePasskey(p.id, p.name)}
                        className="p-2 text-rose-400 hover:text-white rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors cursor-pointer active:scale-95 flex-shrink-0"
                        title="Hapus Kredensial Perangkat Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </CyberCard>

      <CyberCard className="p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          5. Password Catatan Rahasia (Vault PIN / Password)
        </h3>
        <form onSubmit={handleUpdateVaultPassword} className="space-y-3.5 text-xs">
          <p className="text-xs text-slate-400">
            Password terpisah khusus untuk membuka Catatan Rahasia (Pilihan B). Menggunakan hash PBKDF2 SHA-256 tersendiri di Cloud Firestore.
          </p>

          <div>
            <label className="block text-slate-300 mb-1 text-[11px] font-medium">
              Password Catatan Rahasia Saat Ini
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showVaultOldPass ? 'text' : 'password'}
                required
                value={vaultOldPassword}
                onChange={(e) => setVaultOldPassword(e.target.value)}
                placeholder="Masukkan password rahasia saat ini (bawaan: admin123)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                disabled={isSavingVaultPass}
              />
              <button
                type="button"
                onClick={() => setShowVaultOldPass(!showVaultOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                tabIndex={-1}
              >
                {showVaultOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                Password Rahasia Baru (Min. 6 Karakter)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showVaultNewPass ? 'text' : 'password'}
                  required
                  value={vaultNewPassword}
                  onChange={(e) => setVaultNewPassword(e.target.value)}
                  placeholder="Password rahasia baru"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  disabled={isSavingVaultPass}
                />
                <button
                  type="button"
                  onClick={() => setShowVaultNewPass(!showVaultNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showVaultNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                Konfirmasi Password Rahasia Baru
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={vaultConfirmPassword}
                  onChange={(e) => setVaultConfirmPassword(e.target.value)}
                  placeholder="Ulangi password rahasia baru"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  disabled={isSavingVaultPass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <CyberButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSavingVaultPass}
              icon={isSavingVaultPass ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
            >
              {isSavingVaultPass ? 'Menyimpan...' : 'Simpan Password Catatan Rahasia'}
            </CyberButton>
          </div>
        </form>
      </CyberCard>

    </div>
  );
};
