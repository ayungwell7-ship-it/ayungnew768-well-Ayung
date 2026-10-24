import React, { useState, useMemo } from 'react';
import { SecretAccountNote, CategoryType, IdentityType, CredentialType } from '../../../types';
import { CyberCard } from '../../ui/CyberCard';
import { CyberButton } from '../../ui/CyberButton';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Pencil, 
  Globe, 
  Share2, 
  Tv, 
  Gamepad2, 
  X, 
  ArrowLeft, 
  ShieldAlert, 
  Clock, 
  Mail, 
  User, 
  Hash, 
  Key,
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { 
  hashVaultPassword, 
  encryptSecret, 
  decryptSecret, 
  generateSalt 
} from '../../../utils/crypto';
import { getVaultSettings, saveVaultSettings } from '../../../services/firestoreService';
import { DEFAULT_VAULT_PASSWORD } from '../../../services/seedData';

interface SecretAccountsVaultProps {
  notes: SecretAccountNote[];
  onCreate: (item: Omit<SecretAccountNote, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<SecretAccountNote>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBackToHub: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SecretAccountsVault: React.FC<SecretAccountsVaultProps> = ({
  notes,
  onCreate,
  onUpdate,
  onDelete,
  onBackToHub,
  onShowToast,
}) => {
  // Vault Authentication Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showInputPassword, setShowInputPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('Game');
  const [formIdentityType, setFormIdentityType] = useState<IdentityType>('Gmail');
  const [formIdentityValue, setFormIdentityValue] = useState('');
  const [formCredentialType, setFormCredentialType] = useState<CredentialType>('Password');
  const [formCredentialValue, setFormCredentialValue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [showFormCredential, setShowFormCredential] = useState(false);

  // View Secret Detail Modal State
  const [viewingNote, setViewingNote] = useState<SecretAccountNote | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string>('');
  const [showViewCredential, setShowViewCredential] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const categories: CategoryType[] = ['Web', 'Sosmed', 'Aplikasi', 'Game'];

  const getCategoryBadge = (cat: CategoryType) => {
    switch (cat) {
      case 'Game': return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'Sosmed': return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'Aplikasi': return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'Web': return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Game': return <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'Sosmed': return <Share2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Aplikasi': return <Tv className="w-3.5 h-3.5 text-blue-400" />;
      case 'Web': return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  // Handle Vault Unlock Verification
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword) {
      setLockError('Harap masukkan password Catatan Rahasia.');
      return;
    }

    setVerifying(true);
    setLockError(null);

    try {
      const settings = await getVaultSettings();

      if (!settings || !settings.passwordHash) {
        // First-time setup: establish new vault password
        if (inputPassword.length < 6) {
          setLockError('Password Catatan Rahasia minimal 6 karakter demi keamanan akun.');
          return;
        }
        const salt = generateSalt();
        const hash = await hashVaultPassword(inputPassword, salt);
        await saveVaultSettings({ passwordHash: hash, salt });
        setVaultPassword(inputPassword);
        setIsUnlocked(true);
        onShowToast('Brankas Diaktifkan', 'Password Catatan Rahasia berhasil dibuat dan brankas dibuka.', 'success');
      } else {
        // Verify against stored hash using PBKDF2
        const checkHash = await hashVaultPassword(inputPassword, settings.salt);
        if (checkHash === settings.passwordHash) {
          setVaultPassword(inputPassword);
          setIsUnlocked(true);
          onShowToast('Brankas Terbuka', 'Akses Catatan Rahasia berhasil diverifikasi.', 'success');
        } else {
          setLockError('Password Catatan Rahasia salah. Akses ditolak demi keamanan data.');
        }
      }
    } catch (err: any) {
      setLockError('Terjadi kesalahan verifikasi kriptografi.');
    } finally {
      setVerifying(false);
    }
  };

  // Lock Vault
  const handleLockVault = () => {
    setIsUnlocked(false);
    setVaultPassword('');
    setInputPassword('');
    setViewingNote(null);
    setDecryptedValue('');
    onShowToast('Brankas Terkunci', 'Sesi Catatan Rahasia telah ditutup dan diamankan.', 'info');
  };

  // Recovery Mechanism
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryNewPassword || recoveryNewPassword.length < 6) {
      onShowToast('Password Terlalu Pendek', 'Password minimal 6 karakter.', 'error');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirm) {
      onShowToast('Konfirmasi Tidak Cocok', 'Konfirmasi password baru tidak sesuai.', 'error');
      return;
    }

    try {
      const salt = generateSalt();
      const hash = await hashVaultPassword(recoveryNewPassword, salt);
      await saveVaultSettings({ passwordHash: hash, salt });
      setShowRecoveryModal(false);
      setInputPassword(recoveryNewPassword);
      onShowToast('Password Direset', 'Password Catatan Rahasia berhasil diperbarui. Silakan buka brankas.', 'success');
    } catch (e: any) {
      onShowToast('Gagal Reset', e.message, 'error');
    }
  };

  // Filtered List
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = selectedCategory === 'ALL' || n.category === selectedCategory;
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('Game');
    setFormIdentityType('Gmail');
    setFormIdentityValue('');
    setFormCredentialType('Password');
    setFormCredentialValue('');
    setFormDescription('');
    setShowFormCredential(false);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (item: SecretAccountNote) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormIdentityType(item.identityType);
    setFormIdentityValue(item.identityValue);
    setFormCredentialType(item.credentialType);
    setFormDescription(item.description || '');

    // Decrypt credential value for editing
    try {
      if (item.iv) {
        const settings = await getVaultSettings();
        const salt = settings?.salt || generateSalt();
        const plain = await decryptSecret(item.credentialValue, item.iv, vaultPassword, salt);
        setFormCredentialValue(plain);
      } else {
        setFormCredentialValue(item.credentialValue);
      }
    } catch (e) {
      setFormCredentialValue(item.credentialValue);
    }

    setShowFormCredential(false);
    setIsFormModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formIdentityValue || !formCredentialValue) {
      onShowToast('Validasi Gagal', `Harap lengkapi judul, ${formIdentityType}, dan ${formCredentialType}.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const settings = await getVaultSettings();
      const salt = settings?.salt || generateSalt();

      // Encrypt credential using AES-GCM
      const encrypted = await encryptSecret(formCredentialValue, vaultPassword, salt);

      if (editingId) {
        await onUpdate(editingId, {
          title: formTitle,
          category: formCategory,
          identityType: formIdentityType,
          identityValue: formIdentityValue,
          credentialType: formCredentialType,
          credentialValue: encrypted.ciphertext,
          iv: encrypted.iv,
          description: formDescription,
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Catatan Rahasia Diperbarui', 'Data akun berhasil dienkripsi dan disimpan di Firestore.', 'success');
      } else {
        await onCreate({
          title: formTitle,
          category: formCategory,
          identityType: formIdentityType,
          identityValue: formIdentityValue,
          credentialType: formCredentialType,
          credentialValue: encrypted.ciphertext,
          iv: encrypted.iv,
          description: formDescription,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Catatan Rahasia Ditambahkan', 'Data akun berhasil dienkripsi dan disimpan di Firestore.', 'success');
      }

      setIsSubmitting(false);
      setIsFormModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan', err.message, 'error');
    }
  };

  // Handle View Note Details
  const handleViewNote = async (item: SecretAccountNote) => {
    setViewingNote(item);
    setShowViewCredential(false);

    try {
      if (item.iv) {
        const settings = await getVaultSettings();
        const salt = settings?.salt || generateSalt();
        const plain = await decryptSecret(item.credentialValue, item.iv, vaultPassword, salt);
        setDecryptedValue(plain);
      } else {
        // Fallback for unencrypted seed
        setDecryptedValue(item.credentialValue);
      }
    } catch (e) {
      setDecryptedValue('(Gagal mendekripsi: password brankas berbeda)');
    }
  };

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onShowToast('Tersalin!', `${fieldName} telah disalin ke papan klip.`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus catatan rahasia "${title}" secara permanen? Data kredensial yang dihapus tidak dapat dipulihkan.`)) return;
    try {
      await onDelete(id);
      onShowToast('Catatan Dihapus', 'Catatan rahasia berhasil dihapus dari Cloud Firestore.', 'success');
      if (viewingNote?.id === id) setViewingNote(null);
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  /* ============================================================
     LOCK SCREEN VIEW (WHEN NOT UNLOCKED)
  ============================================================ */
  if (!isUnlocked) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Navigation Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-purple-400" />
          </button>
          <div>
            <span className="font-cyber font-bold text-white text-base sm:text-lg">
              KEMBALI KE PILIHAN CATATAN
            </span>
          </div>
        </div>

        {/* Futuristic Gaming Lockscreen Card */}
        <div className="max-w-md mx-auto my-8 relative">
          
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 opacity-60 blur-xl pointer-events-none" />

          <CyberCard highlight={true} glow={true} className="p-8 text-center space-y-6 relative z-10">
            
            {/* Animated Lock Icon */}
            <div className="w-20 h-20 rounded-full bg-purple-950/80 border-2 border-purple-500/60 mx-auto flex items-center justify-center text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-[10px] font-mono text-rose-300 uppercase tracking-widest mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                SECURITY CLEARANCE LEVEL 5
              </div>
              <h3 className="text-2xl font-cyber font-black tracking-wider text-white">
                CATATAN <span className="text-purple-400">RAHASIA</span>
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Masukkan password khusus Catatan Rahasia untuk mendekripsi brankas akun.
              </p>
            </div>

            {lockError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded text-rose-200 text-xs flex items-start gap-2 text-left font-mono animate-in slide-in-from-top-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{lockError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockVault} className="space-y-4 font-mono text-xs">
              
              <div className="relative text-left">
                <label className="text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
                  PASSWORD CATATAN RAHASIA
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type={showInputPassword ? 'text' : 'password'}
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Masukkan password rahasia..."
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInputPassword(!showInputPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showInputPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <CyberButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={verifying}
                icon={verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4 text-black" />}
              >
                {verifying ? 'MEMVERIFIKASI...' : 'BUKA BRANKAS RAHASIA'}
              </CyberButton>

            </form>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="text-slate-500">Enkripsi AES-256 PBKDF2</span>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Reset / Lupa Password?
              </button>
            </div>

          </CyberCard>
        </div>

        {/* Recovery Modal */}
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-[#090d18] border border-purple-500/60 rounded-xl p-6 shadow-2xl font-mono text-xs">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-base font-cyber font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                PEMULIHAN PASSWORD CATATAN RAHASIA
              </h4>
              <p className="text-slate-400 mb-4 font-sans text-xs">
                Sebagai admin terautentikasi, Anda dapat menetapkan password baru untuk Catatan Rahasia:
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="text-slate-300 block mb-1">PASSWORD BARU</label>
                  <input
                    type="password"
                    required
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">KONFIRMASI PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={recoveryConfirm}
                    onChange={(e) => setRecoveryConfirm(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="px-3 py-1.5 rounded bg-slate-900 text-slate-400"
                  >
                    Batal
                  </button>
                  <CyberButton type="submit" variant="primary" size="sm">
                    SIMPAN PASSWORD BARU
                  </CyberButton>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  /* ============================================================
     UNLOCKED SECRET VAULT VIEW
  ============================================================ */
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Navigation & Lock Button */}
      <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Kembali ke Pilihan Catatan"
          >
            <ArrowLeft className="w-5 h-5 text-purple-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔐</span>
              <h2 className="font-cyber font-bold text-white text-base sm:text-lg">
                CATATAN RAHASIA // AKUN &amp; KREDENSIAL
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <Unlock className="w-3 h-3 text-emerald-400" />
                BRANKAS TERBUKA
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Terenkripsi AES-GCM 256-bit. Data tersimpan aman di Cloud Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleLockVault}
            className="px-3 py-2 rounded bg-rose-950/70 border border-rose-600/60 text-rose-300 hover:bg-rose-900/80 text-xs font-cyber flex items-center gap-1.5 transition-colors"
            title="Tutup & Kunci Kembali Brankas"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>KUNCI BRANKAS</span>
          </button>

          <CyberButton
            onClick={handleOpenAdd}
            variant="primary"
            icon={<Plus className="w-4 h-4 text-black" />}
          >
            + TAMBAH CATATAN RAHASIA
          </CyberButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded border transition-colors ${selectedCategory === 'ALL' ? 'bg-purple-950 border-purple-400 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            SEMUA ({notes.length})
          </button>
          {categories.map((cat) => {
            const count = notes.filter(n => n.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${selectedCategory === cat ? 'bg-purple-950 border-purple-400 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search by Title */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul..."
            className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

      </div>

      {/* Secret Cards Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-cyber text-slate-300">Belum Ada Catatan Akun Rahasia</h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan tombol "+ TAMBAH CATATAN RAHASIA" untuk menyimpan akun Mobile Legends, sosmed, atau aplikasi Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <CyberCard
              key={note.id}
              className="p-5 flex flex-col justify-between group hover:border-purple-500/80 transition-all duration-300"
            >
              <div>
                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1.5 ${getCategoryBadge(note.category)}`}>
                    {getCategoryIcon(note.category)}
                    {note.category}
                  </span>

                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-cyber font-bold text-white text-base group-hover:text-purple-300 transition-colors mb-3">
                  {note.title}
                </h4>

                {/* Account Details Badges (Masked) */}
                <div className="p-3 bg-black/60 rounded border border-slate-800/80 space-y-2 font-mono text-xs">
                  
                  {/* Identity: Gmail vs Username */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      {note.identityType === 'Gmail' ? <Mail className="w-3.5 h-3.5 text-cyan-400" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
                      {note.identityType}:
                    </span>
                    <span className="text-cyan-300 font-semibold truncate max-w-[150px]">
                      {note.identityValue}
                    </span>
                  </div>

                  {/* Credential: Password vs PIN (MASKED) */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      {note.credentialType === 'Password' ? <Key className="w-3.5 h-3.5 text-purple-400" /> : <Hash className="w-3.5 h-3.5 text-purple-400" />}
                      {note.credentialType}:
                    </span>
                    <span className="text-purple-400 font-mono tracking-widest text-xs font-bold">
                      ••••••••••••
                    </span>
                  </div>

                </div>

                {/* Optional Note Description */}
                {note.description && (
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 font-sans">
                    {note.description}
                  </p>
                )}
              </div>

              {/* Bottom Actions: Lihat, Edit, Hapus */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                
                {/* Tombol Lihat */}
                <button
                  onClick={() => handleViewNote(note)}
                  className="px-3 py-1.5 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 hover:bg-purple-900 text-xs font-cyber flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>LIHAT</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                    title="Edit Catatan Rahasia"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(note.id, note.title)}
                    className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100 hover:bg-rose-900 transition-colors"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </CyberCard>
          ))}
        </div>
      )}

      {/* ============================================================
          FORMULIR TAMBAH / EDIT CATATAN RAHASIA (MODAL)
      ============================================================ */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#090d18] border border-purple-500/60 rounded-xl p-6 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-cyber font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
              {editingId ? 'EDIT CATATAN RAHASIA' : 'TAMBAH CATATAN RAHASIA BARU'}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-4">
              
              {/* SECTION A: INFORMASI DASAR */}
              <div className="space-y-3 pb-3 border-b border-slate-800">
                <div className="text-[11px] font-cyber font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> A. INFORMASI DASAR
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    JUDUL
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Mobile Legend / Akun Game Kedua"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    KATEGORI
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`
                          py-2 px-1 rounded border text-center transition-all flex items-center justify-center gap-1
                          ${formCategory === cat 
                            ? 'bg-purple-950 border-purple-400 text-purple-300 font-bold' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                        `}
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    CATATAN TAMBAHAN (OPSIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Akun utama saya, skin collector, tier rank..."
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-purple-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* SECTION B: JENIS IDENTITAS AKUN */}
              <div className="space-y-3 pb-3 border-b border-slate-800">
                <div className="text-[11px] font-cyber font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> B. JENIS IDENTITAS AKUN
                </div>

                {/* Clickable Radio Buttons: Gmail vs Username */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormIdentityType('Gmail')}
                    className={`
                      py-2.5 px-3 rounded border text-center transition-all flex items-center justify-center gap-2
                      ${formIdentityType === 'Gmail' 
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>GMAIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIdentityType('Username')}
                    className={`
                      py-2.5 px-3 rounded border text-center transition-all flex items-center justify-center gap-2
                      ${formIdentityType === 'Username' 
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>USERNAME</span>
                  </button>
                </div>

                {/* DYNAMIC FIELD: Gmail OR Username only */}
                {formIdentityType === 'Gmail' ? (
                  <div>
                    <label className="text-cyan-300 block mb-1 uppercase tracking-wider font-bold">
                      GMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={formIdentityValue}
                      onChange={(e) => setFormIdentityValue(e.target.value)}
                      placeholder="contoh: alamat.gmail@gmail.com"
                      className="w-full bg-[#05070d] border border-cyan-500/50 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-cyan-300 block mb-1 uppercase tracking-wider font-bold">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      required
                      value={formIdentityValue}
                      onChange={(e) => setFormIdentityValue(e.target.value)}
                      placeholder="contoh: nama_pengguna_saya"
                      className="w-full bg-[#05070d] border border-cyan-500/50 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* SECTION C: JENIS KREDENSIAL */}
              <div className="space-y-3 pb-3 border-b border-slate-800">
                <div className="text-[11px] font-cyber font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> C. JENIS KREDENSIAL
                </div>

                {/* Clickable Radio Buttons: Password vs PIN */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormCredentialType('Password')}
                    className={`
                      py-2.5 px-3 rounded border text-center transition-all flex items-center justify-center gap-2
                      ${formCredentialType === 'Password' 
                        ? 'bg-purple-950 border-purple-400 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>PASSWORD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormCredentialType('PIN')}
                    className={`
                      py-2.5 px-3 rounded border text-center transition-all flex items-center justify-center gap-2
                      ${formCredentialType === 'PIN' 
                        ? 'bg-purple-950 border-purple-400 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    <Hash className="w-4 h-4 text-purple-400" />
                    <span>PIN</span>
                  </button>
                </div>

                {/* DYNAMIC FIELD: Password Akun OR PIN Akun with Eye Toggle */}
                {formCredentialType === 'Password' ? (
                  <div>
                    <label className="text-purple-300 block mb-1 uppercase tracking-wider font-bold">
                      PASSWORD AKUN
                    </label>
                    <div className="relative">
                      <input
                        type={showFormCredential ? 'text' : 'password'}
                        required
                        value={formCredentialValue}
                        onChange={(e) => setFormCredentialValue(e.target.value)}
                        placeholder="masukkan password akun..."
                        className="w-full bg-[#05070d] border border-purple-500/50 focus:border-purple-400 rounded pl-3 pr-10 py-2 text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormCredential(!showFormCredential)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showFormCredential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-purple-300 block mb-1 uppercase tracking-wider font-bold">
                      PIN AKUN
                    </label>
                    <div className="relative">
                      <input
                        type={showFormCredential ? 'text' : 'password'}
                        required
                        value={formCredentialValue}
                        onChange={(e) => setFormCredentialValue(e.target.value)}
                        placeholder="masukkan PIN akun (misal: 123456)..."
                        className="w-full bg-[#05070d] border border-purple-500/50 focus:border-purple-400 rounded pl-3 pr-10 py-2 text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormCredential(!showFormCredential)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showFormCredential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-900 text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <CyberButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengenkripsi & Menyimpan...' : 'Simpan Catatan Rahasia'}
                </CyberButton>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL DETAIL LIHAT CATATAN RAHASIA
      ============================================================ */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#090d18] border border-purple-500/60 rounded-xl p-6 shadow-2xl font-mono text-xs">
            
            <button
              onClick={() => setViewingNote(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-cyber font-bold text-white truncate">
                {viewingNote.title}
              </h3>
            </div>

            <div className="space-y-4">
              
              {/* Category & Status */}
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">KATEGORI:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${getCategoryBadge(viewingNote.category)}`}>
                  {viewingNote.category}
                </span>
              </div>

              {/* Identity Value: Gmail or Username */}
              <div className="p-3 bg-black/70 rounded border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  {viewingNote.identityType === 'Gmail' ? <Mail className="w-3.5 h-3.5 text-cyan-400" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{viewingNote.identityType}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-cyan-300 break-all">
                    {viewingNote.identityValue}
                  </span>
                  <button
                    onClick={() => handleCopy(viewingNote.identityValue, viewingNote.identityType)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex-shrink-0"
                    title={`Salin ${viewingNote.identityType}`}
                  >
                    {copiedField === viewingNote.identityType ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Credential Value: Password or PIN (MASKED BY DEFAULT) */}
              <div className="p-3 bg-black/70 rounded border border-purple-900/50 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  {viewingNote.credentialType === 'Password' ? <Key className="w-3.5 h-3.5 text-purple-400" /> : <Hash className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{viewingNote.credentialType === 'Password' ? 'Password Akun' : 'PIN Akun'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-bold text-purple-300 break-all">
                    {showViewCredential ? decryptedValue : '••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowViewCredential(!showViewCredential)}
                      className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-purple-400"
                      title={showViewCredential ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showViewCredential ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(decryptedValue, viewingNote.credentialType)}
                      className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                      title={`Salin ${viewingNote.credentialType}`}
                    >
                      {copiedField === viewingNote.credentialType ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingNote.description && (
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-slate-300 text-xs font-sans">
                  <span className="text-slate-500 font-mono text-[10px] block mb-1">CATATAN TAMBAHAN:</span>
                  {viewingNote.description}
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
                <span>Dibuat: {new Date(viewingNote.createdAt).toLocaleDateString('id-ID')}</span>
                <span>Diperbarui: {new Date(viewingNote.updatedAt).toLocaleDateString('id-ID')}</span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
