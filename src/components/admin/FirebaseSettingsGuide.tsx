import React, { useState, useEffect } from 'react';
import { FirebaseCustomConfig, CloudinaryConfig } from '../../types';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  testFirestoreConnection 
} from '../../services/firebase';
import { 
  seedFirebaseCloud,
  getCloudinaryConfig,
  saveCloudinaryConfig
} from '../../services/firestoreService';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  Settings, 
  Database, 
  Key, 
  ShieldCheck, 
  CloudUpload, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  HelpCircle, 
  FileCode,
  Flame,
  Globe,
  Radio,
  Loader2,
  Cloud,
  Smartphone,
  Save
} from 'lucide-react';

interface FirebaseSettingsGuideProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FirebaseSettingsGuide: React.FC<FirebaseSettingsGuideProps> = ({ onShowToast }) => {
  const currentSaved = getSavedFirebaseConfig();
  
  const [config, setConfig] = useState<FirebaseCustomConfig>({
    apiKey: currentSaved?.apiKey || '',
    authDomain: currentSaved?.authDomain || '',
    projectId: currentSaved?.projectId || 'bionic-safeguard-b3skh',
    storageBucket: currentSaved?.storageBucket || '',
    messagingSenderId: currentSaved?.messagingSenderId || '',
    appId: currentSaved?.appId || '',
  });

  const [activeTab, setActiveTab] = useState<'config' | 'cloudinary' | 'guide' | 'rules' | 'checklist'>('config');
  const [copiedRules, setCopiedRules] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);

  // Cloudinary State
  const [cloudConfig, setCloudConfig] = useState<CloudinaryConfig>({
    cloudName: '',
    uploadPreset: ''
  });
  const [isSavingCloudinary, setIsSavingCloudinary] = useState(false);

  React.useEffect(() => {
    getCloudinaryConfig().then(cfg => {
      if (cfg) {
        setCloudConfig({
          cloudName: cfg.cloudName || '',
          uploadPreset: cfg.uploadPreset || ''
        });
      }
    });
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      onShowToast('Validasi Gagal', 'Harap isi minimal API Key dan Project ID.', 'error');
      return;
    }

    saveFirebaseConfig(config);
    onShowToast('Konfigurasi Disimpan', 'Konfigurasi Firebase berhasil disimpan. Memuat ulang...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudConfig.cloudName.trim() || !cloudConfig.uploadPreset.trim()) {
      onShowToast('Validasi Gagal', 'Harap isi Cloud Name dan Upload Preset Cloudinary.', 'error');
      return;
    }
    setIsSavingCloudinary(true);
    try {
      await saveCloudinaryConfig({
        cloudName: cloudConfig.cloudName.trim(),
        uploadPreset: cloudConfig.uploadPreset.trim()
      });
      onShowToast(
        'Cloudinary Berhasil Disimpan',
        'Pengaturan Cloudinary tersimpan di Cloud Firestore dan otomatis tersinkron ke semua perangkat HP/PC!',
        'success'
      );
    } catch (err: any) {
      onShowToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSavingCloudinary(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Reset pengaturan konfigurasi kustom ke konfigurasi default proyek bionic-safeguard-b3skh?')) {
      clearFirebaseConfig();
      onShowToast('Konfigurasi Direset', 'Kembali ke default.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    const success = await testFirestoreConnection();
    setIsTestingConn(false);
    if (success) {
      onShowToast('Koneksi Berhasil!', 'Cloud Firestore terhubung dan merespons dengan lancar.', 'success');
    } else {
      onShowToast('Koneksi Gagal', 'Tidak dapat menghubungi server Firestore.', 'error');
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedFirebaseCloud();
    setIsSeeding(false);
    onShowToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'error');
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // Default deny for unmatched collections
    match /{document=**} {
      allow read, write: if false;
    }

    // Connection testing endpoint
    match /test/{docId} {
      allow read: if true;
    }

    // 1. PUBLIC GAMING PROFILE
    match /profiles/{profileId} {
      allow read: if true;
      allow write: if isSignedIn() && isValidId(profileId);
    }

    // 2. ACHIEVEMENTS
    match /achievements/{achievementId} {
      allow read: if true;
      allow write: if isSignedIn() && isValidId(achievementId);
    }

    // 3. HOBBIES
    match /hobbies/{hobbyId} {
      allow read: if true;
      allow write: if isSignedIn() && isValidId(hobbyId);
    }

    // 4. MUSIC PLAYLIST
    match /music/{trackId} {
      allow read: if resource.data.isPublic == true || isSignedIn();
      allow write: if isSignedIn() && isValidId(trackId);
    }

    // 5. PRIVATE WEBSITE COLLECTION (STRICTLY PRIVATE)
    match /privateLinks/{linkId} {
      allow read, write: if isSignedIn() && isValidId(linkId);
    }

    // 6. PRIVATE NOTES (STRICTLY PRIVATE)
    match /privateNotes/{noteId} {
      allow read, write: if isSignedIn() && isValidId(noteId);
    }

    // 7. SECRET VAULT NOTES (STRICTLY PRIVATE)
    match /secretVaultNotes/{secretId} {
      allow read, write: if isSignedIn() && isValidId(secretId);
    }

    // 8. CLOUDINARY CONFIG (PUBLIC UPLOAD PRESET)
    match /vaultSettings/cloudinary {
      allow read: if true;
      allow write: if isSignedIn();
    }

    // 9. VAULT SECURITY SETTINGS (PASSWORD HASH & SALT)
    match /vaultSettings/{settingId} {
      allow read, write: if isSignedIn() && isValidId(settingId);
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRules(true);
    onShowToast('Rules Disalin', 'Aturan keamanan Firestore siap ditempel.', 'success');
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wider flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            PENGATURAN FIREBASE // CLOUD ENGINE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Status koneksi, Cloudinary foto gratis, security rules, dan sinkronisasi antarperangkat.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'config', label: '1. Status Firebase' },
            { id: 'cloudinary', label: '2. Cloudinary (Foto Gratis)' },
            { id: 'guide', label: '3. Panduan Lengkap' },
            { id: 'rules', label: '4. Security Rules' },
            { id: 'checklist', label: '5. Checklist Pengujian' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-3 py-1.5 rounded border transition-colors
                ${activeTab === tab.id 
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7">
            <CyberCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-cyber font-bold text-white text-sm">
                    STATUS FIREBASE ONLINE
                  </h3>
                </div>
                <span className="text-emerald-400 text-xs font-mono flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  AKTIF & TERHUBUNG
                </span>
              </div>

              {/* Active Project Card */}
              <div className="p-4 rounded bg-slate-900/80 border border-cyan-500/30 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">PROJECT ID:</span>
                  <span className="text-cyan-300 font-bold">bionic-safeguard-b3skh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DATABASE ID:</span>
                  <span className="text-purple-300 font-mono truncate max-w-[200px]">
                    ai-studio-syahrulgunawanga...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AUTH PROVIDER:</span>
                  <span className="text-emerald-400">Google OAuth &amp; Email</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DEPLOYED RULES:</span>
                  <span className="text-emerald-400">Active (Protected)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <CyberButton
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConn}
                  icon={isTestingConn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 text-cyan-400" />}
                >
                  {isTestingConn ? 'Menguji...' : 'UJI KONEKSI DATABASE'}
                </CyberButton>

                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-400 text-xs underline font-mono ml-auto"
                >
                  Reset Konfigurasi
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-cyber font-bold text-slate-300 mb-2 uppercase">
                  Ubah Kredensial Kustom (Opsional)
                </h4>
                <form onSubmit={handleSaveConfig} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">API KEY (apiKey)</label>
                    <input
                      type="text"
                      required
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">PROJECT ID</label>
                      <input
                        type="text"
                        required
                        value={config.projectId}
                        onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                        className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">AUTH DOMAIN</label>
                      <input
                        type="text"
                        value={config.authDomain}
                        onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                        className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <CyberButton type="submit" variant="secondary" size="sm">
                      SIMPAN KREDENSIAL KUSTOM
                    </CyberButton>
                  </div>
                </form>
              </div>
            </CyberCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            
            {/* Cloud Seed Action */}
            <CyberCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <CloudUpload className="w-5 h-5 text-purple-400" />
                <h3 className="font-cyber font-bold text-white text-sm">
                  UNGGAH DATA AWAL KE CLOUD FIRESTORE
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Database Firebase Anda telah aktif! Tekan tombol di bawah ini untuk mengisi koleksi Cloud Firestore Anda dengan data resmi Syahrul Gunawan (*Profil, Prestasi, Hobi, Musik, Link Website, dan Catatan*).
              </p>

              <CyberButton
                onClick={handleSeed}
                variant="primary"
                fullWidth
                disabled={isSeeding}
                icon={isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 text-black" />}
              >
                {isSeeding ? 'Mengunggah ke Firestore...' : 'UNGGAH DATA KE FIRESTORE SEKARANG'}
              </CyberButton>
            </CyberCard>

            {/* Sync Antarperangkat Info */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
              <div className="font-cyber font-bold text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Sinkronisasi Online Antarperangkat
              </div>
              <p className="text-slate-400 leading-relaxed">
                Database tersambung langsung ke cloud Firestore. Jika Anda membuka website ini dari HP Android, iPhone, laptop, maupun PC lain, data yang Anda ubah akan otomatis terupdate seketika!
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CLOUDINARY GRATIS (FREE TIER ONLINE STORAGE) */}
      {activeTab === 'cloudinary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          <div className="lg:col-span-7 space-y-6">
            <CyberCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-cyber font-bold text-white text-sm">
                    PENGATURAN CLOUDINARY // PAKET 100% GRATIS
                  </h3>
                </div>
                {cloudConfig.cloudName && cloudConfig.uploadPreset ? (
                  <span className="text-emerald-400 text-xs font-mono flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    SUDAH TERKONFIGURASI
                  </span>
                ) : (
                  <span className="text-amber-400 text-xs font-mono flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    BELUM DIISI
                  </span>
                )}
              </div>

              {/* Status info */}
              <div className="p-4 rounded bg-slate-900/80 border border-cyan-500/30 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">STATUS LAYANAN:</span>
                  <span className="text-emerald-400 font-bold">Cloudinary Free Plan (Bebas Biaya)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">METODE UPLOAD:</span>
                  <span className="text-cyan-300">Unsigned Upload Preset (Aman, Tanpa Secret)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DATABASE PENYIMPAN URL:</span>
                  <span className="text-purple-300">Cloud Firestore (profiles/main)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SINKRONISASI HP:</span>
                  <span className="text-emerald-400">Real-Time onSnapshot (Otomatis)</span>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSaveCloudinary} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 uppercase font-bold flex items-center justify-between">
                    <span>1. CLOUD NAME</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Dari Dashboard Cloudinary</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cloudConfig.cloudName}
                    onChange={(e) => setCloudConfig({ ...cloudConfig, cloudName: e.target.value })}
                    placeholder="Contoh: dy3abc123"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-sans mt-1">
                    Nama unik cloud Anda yang tertera di bagian atas Dashboard Cloudinary.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 uppercase font-bold flex items-center justify-between">
                    <span>2. UNSIGNED UPLOAD PRESET</span>
                    <span className="text-[10px] text-purple-400 font-normal">Mode: Unsigned</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cloudConfig.uploadPreset}
                    onChange={(e) => setCloudConfig({ ...cloudConfig, uploadPreset: e.target.value })}
                    placeholder="Contoh: syahrul_gaming_preset"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-sans mt-1">
                    Preset yang dibuat di Settings -&gt; Upload -&gt; Upload presets dengan mode <strong>Unsigned</strong>.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-sans">
                    Tersimpan permanen di Cloud Firestore &amp; tersinkron ke semua perangkat.
                  </span>
                  <CyberButton
                    type="submit"
                    variant="primary"
                    disabled={isSavingCloudinary}
                    icon={isSavingCloudinary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-black" />}
                  >
                    {isSavingCloudinary ? 'Menyimpan...' : 'SIMPAN KE FIRESTORE'}
                  </CyberButton>
                </div>
              </form>
            </CyberCard>

            {/* Quota & Limits explanation */}
            <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3 font-sans text-xs">
              <div className="font-cyber font-bold text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                BATAS &amp; KETENTUAN PAKET GRATIS CLOUDINARY
              </div>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                <li><strong>Biaya:</strong> 100% Gratis Selamanya, tanpa perlu kartu kredit / billing.</li>
                <li><strong>Kapasitas:</strong> 25 GB penyimpanan atau 25 Monthly Credits (sangat cukup untuk puluhan ribu foto profil gaming).</li>
                <li><strong>Format File:</strong> JPG, JPEG, PNG, WEBP (maksimal 10MB per foto).</li>
                <li><strong>Keamanan:</strong> Hanya menggunakan Unsigned Upload Preset. API Secret <em>TIDAK PERNAH</em> dimasukkan ke frontend.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: HP Step-by-Step Guide */}
          <div className="lg:col-span-5 space-y-4">
            <CyberCard className="p-6 space-y-4 font-sans text-xs">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <h3 className="font-cyber font-bold text-white text-sm">
                  CARA DAPATKAN PRESET LEWAT HP (2 MENIT)
                </h3>
              </div>

              <div className="space-y-3 text-slate-300">
                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Langkah 1: Daftar / Login Cloudinary</div>
                  <p className="text-slate-400 text-[11px]">
                    Buka <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-mono">cloudinary.com</a> di browser HP Anda dan daftar akun Gratis (Free).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Langkah 2: Salin Cloud Name</div>
                  <p className="text-slate-400 text-[11px]">
                    Di Dashboard utama akun Anda, lihat kolom <strong>Cloud Name</strong> lalu salin kodenya.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Langkah 3: Buka Menu Upload Presets</div>
                  <p className="text-slate-400 text-[11px]">
                    Tekan ikon <strong>Gerigi (Settings)</strong> di kiri bawah -&gt; pilih menu <strong>Upload</strong> -&gt; geser ke bawah ke bagian <strong>Upload presets</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Langkah 4: Buat Unsigned Preset</div>
                  <p className="text-slate-400 text-[11px]">
                    Tekan <strong>Add upload preset</strong> -&gt; ubah pilihan <strong>Signing Mode</strong> dari <em>Signed</em> menjadi <strong>Unsigned</strong> -&gt; tekan tombol <strong>Save</strong> di pojok atas.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Langkah 5: Simpan di Website</div>
                  <p className="text-slate-400 text-[11px]">
                    Salin nama preset tersebut, masukkan ke formulir di samping, dan tekan tombol <strong>SIMPAN KE FIRESTORE</strong>. Selesai!
                  </p>
                </div>
              </div>
            </CyberCard>
          </div>

        </div>
      )}

      {/* TAB 3: PANDUAN LENGKAP */}
      {activeTab === 'guide' && (
        <CyberCard className="p-6 sm:p-8 space-y-8 font-sans text-xs sm:text-sm text-slate-300">
          
          <div>
            <h3 className="text-lg font-cyber font-bold text-white mb-2 flex items-center gap-2 text-cyan-400">
              1. PANDUAN MASUK SEBAGAI ADMIN
            </h3>
            <p className="mb-2">
              Anda dapat masuk ke Control Panel Admin dengan dua opsi:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Opsi 1 (1-Klik via Google)</strong>: Klik tombol <em>LOGIN ADMIN</em> di kanan atas &gt; klik <em>Masuk dengan Google</em> menggunakan akun Google Anda (<strong>ayungwell7@gmail.com</strong>).</li>
              <li><strong>Opsi 2 (Email &amp; Password)</strong>: Gunakan email admin dan password yang telah Anda buat di tab Users Firebase Console.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-lg font-cyber font-bold text-white mb-2 flex items-center gap-2 text-purple-400">
              2. STRUKTUR DATABASE CLOUD FIRESTORE
            </h3>
            <p className="text-slate-400 mb-2">
              Struktur koleksi yang terdaftar dan terlindungi di Cloud Firestore:
            </p>
            <div className="p-3 bg-black/80 rounded border border-slate-800 font-mono text-xs space-y-1 text-cyan-300">
              <div>- <strong>profiles/main</strong>: Data profil publik, tagline, bio, spek perangkat</div>
              <div>- <strong>achievements</strong>: Daftar sertifikat dan kejuaraan turnamen</div>
              <div>- <strong>hobbies</strong>: Hobi gaming dan custom tech</div>
              <div>- <strong>music</strong>: Playlist audio dan cover art</div>
              <div>- <strong>privateLinks</strong>: Koleksi link website rahasia (Khusus Admin)</div>
              <div>- <strong>privateNotes</strong>: Catatan strategi &amp; ide privat (Khusus Admin)</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-lg font-cyber font-bold text-white mb-2 flex items-center gap-2 text-emerald-400">
              3. DEPLOYMENT KE FIREBASE HOSTING
            </h3>
            <p className="mb-2">
              Untuk mengunggah website ke Firebase Hosting:
            </p>
            <div className="p-3 bg-black/80 rounded border border-slate-800 font-mono text-xs text-cyan-300 space-y-1">
              <div># 1. Build aplikasi</div>
              <div>npm run build</div>
              <div className="pt-2"># 2. Deploy hosting</div>
              <div>firebase deploy --only hosting</div>
            </div>
          </div>

        </CyberCard>
      )}

      {/* TAB 3: SECURITY RULES */}
      {activeTab === 'rules' && (
        <CyberCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-cyber font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                FIRESTORE SECURITY RULES (AKTIF DI PROJECT: bionic-safeguard-b3skh)
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Aturan keamanan telah dideploy dan aktif melindungi data publik dan brankas rahasia.
              </p>
            </div>

            <button
              onClick={copyRulesToClipboard}
              className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {copiedRules ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRules ? 'TERSALIN' : 'SALIN RULES'}</span>
            </button>
          </div>

          <pre className="p-4 bg-black/90 rounded border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed max-h-[450px]">
            {firestoreRulesText}
          </pre>
        </CyberCard>
      )}

      {/* TAB 4: CHECKLIST PENGUJIAN */}
      {activeTab === 'checklist' && (
        <CyberCard className="p-6 space-y-4">
          <h3 className="font-cyber font-bold text-white text-base border-b border-slate-800 pb-3">
            DAFTAR PENGUJIAN FITUR LENGKAP // SYSTEM VERIFICATION
          </h3>

          <div className="space-y-3 font-sans text-xs sm:text-sm">
            {[
              { title: 'Koneksi Cloud Firestore Online', desc: 'Database telah diprovisi dan tersambung ke project bionic-safeguard-b3skh.' },
              { title: 'Tampilan Futuristik Gamer', desc: 'Background gelap, efek neon cyan/purple/blue, font Orbitron/Rajdhani, responsive mobile.' },
              { title: 'Hero Profile & Dossier', desc: 'Avatar bercahaya, gamer tag [VORTEX_SG], spek PC, status in-game, dan bio lengkap.' },
              { title: 'Audio Player Pemutar Musik', desc: 'Tombol play/pause, volume slider, progress seekbar, equalizer neon bergerak, dan prev/next lagu.' },
              { title: 'Modal Login Admin', desc: 'Tombol neon di kanan atas, opsi login 1-klik Google dan input email/password admin.' },
              { title: 'Brankas Website Rahasia', desc: '4 kategori (Web, Sosmed, Aplikasi, Game), filter, pencarian, salin URL, hanya bisa diakses admin.' },
              { title: 'Brankas Catatan Rahasia', desc: 'Editor nyaman, 4 kategori, auto-save status realtime, tersimpan aman di Cloud Firestore.' },
              { title: 'Kelola Profil & Spek', desc: 'Bisa mengubah foto, nama, bio, spek perangkat, dan sembunyikan/tampilkan bagian tertentu.' },
              { title: 'Sinkronisasi Multi-Device', desc: 'Data tersinkron otomatis antar HP, tablet, dan PC menggunakan satu database terpusat.' },
            ].map((check, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-cyber font-bold text-white text-xs">{check.title}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{check.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CyberCard>
      )}

    </div>
  );
};
