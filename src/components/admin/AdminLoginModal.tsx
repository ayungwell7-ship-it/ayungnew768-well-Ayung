import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CyberButton } from '../ui/CyberButton';
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  X, 
  AlertTriangle, 
  Loader2, 
  Fingerprint,
  HelpCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { isPasskeySupported } from '../../services/passkeyService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithCredentials, loginWithPasskey, adminIdentity } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const hasPasskeySupport = isPasskeySupported();

  // 1. Biometric Passkey Login (Fingerprint / Face ID / Windows Hello)
  const handlePasskeyLogin = async () => {
    setIsPasskeyLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithPasskey();
      if (res.success) {
        setIsPasskeyLoading(false);
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Verifikasi biometrik gagal.');
        setIsPasskeyLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login biometrik.');
      setIsPasskeyLoading(false);
    }
  };

  // 2. ID Akun or Phone Number + Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Harap isi ID Akun atau Nomor HP beserta password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(identifier.trim(), password);
      if (res.success) {
        setIsLoading(false);
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'ID Akun / Nomor HP atau password salah.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan pada sistem autentikasi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Subtle accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
          disabled={isLoading || isPasskeyLoading}
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 mx-auto mb-3 flex items-center justify-center text-cyan-400 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Masuk Control Panel Admin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan ID Akun atau Nomor HP dan password admin
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Form Login: ID Akun atau Nomor HP & Password */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Identifier: Account ID or Phone Number */}
          <div>
            <label className="block text-slate-300 mb-1.5 text-[11px] font-medium">
              ID Akun atau Nomor HP
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center gap-1">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: SG-7K4P92 atau 081234567890"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                disabled={isLoading || isPasskeyLoading}
                autoComplete="username"
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-mono">
              <span>Bisa menggunakan ID Akun atau No. HP</span>
              {adminIdentity?.accountId && (
                <span className="text-cyan-500/80">Format ID: {adminIdentity.accountId.slice(0, 3)}***</span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-[11px] font-medium">
                Password Admin
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                disabled={isLoading || isPasskeyLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <CyberButton
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={isLoading || isPasskeyLoading}
              icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Shield className="w-4 h-4 text-slate-950" />}
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Control Panel'}
            </CyberButton>
          </div>

        </form>

        {/* Biometric Passkey Login (Sidik Jari / Wajah / Windows Hello) */}
        {hasPasskeySupport && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={isLoading || isPasskeyLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-850 to-blue-950/90 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-semibold text-xs tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isPasskeyLoading ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4 text-cyan-400" />
              )}
              <span>{isPasskeyLoading ? 'Memverifikasi Biometrik...' : 'Masuk dengan Sidik Jari atau Wajah'}</span>
            </button>
          </div>
        )}

        {/* Informasi Bantuan Jika Lupa Password / ID Akun */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Bantuan jika lupa Password atau ID Akun
            </span>
            {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHelp && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <strong className="text-white">ID Akun &amp; Nomor HP:</strong> Anda dapat masuk menggunakan salah satu: ID Akun (misal <span className="font-mono text-cyan-300">{adminIdentity?.accountId || 'SG-7K4P92'}</span>) atau Nomor HP terdaftar (misal <span className="font-mono text-cyan-300">{adminIdentity?.phone || '081234567890'}</span>).
                  </p>
                  <p>
                    <strong className="text-white">Password Default:</strong> Jika belum pernah diubah di Pengaturan Akun, password awal sistem adalah <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">admin123</code>.
                  </p>
                  <p>
                    <strong className="text-white">Biometrik:</strong> Jika Anda sebelumnya telah mendaftarkan perangkat ini, Anda dapat login secara instan dengan menekan tombol sidik jari/wajah di atas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-2 text-[10px] text-slate-500 text-center font-mono">
          Autentikasi Terenkripsi PBKDF2 SHA-256 &amp; WebAuthn FIDO2
        </div>

      </div>
    </div>
  );
};
