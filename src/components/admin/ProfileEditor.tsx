import React, { useState, useEffect } from 'react';
import { UserProfile, NeonAccent } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  User, 
  Sparkles, 
  Palette, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Terminal,
  Activity
} from 'lucide-react';

import { ImageUploadField } from '../ui/ImageUploadField';
import { deleteStorageFile } from '../../services/storageService';

interface ProfileEditorProps {
  initialProfile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  initialProfile,
  onSave,
  onShowToast,
}) => {
  const { accent, setAccent } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync profile state when initialProfile updates from Firestore in real-time
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const neonColors: { id: NeonAccent; label: string; bg: string }[] = [
    { id: 'cyan', label: 'Cyan Electric', bg: 'bg-cyan-500' },
    { id: 'purple', label: 'Neon Purple', bg: 'bg-purple-500' },
    { id: 'blue', label: 'Cyber Blue', bg: 'bg-blue-500' },
    { id: 'emerald', label: 'Matrix Emerald', bg: 'bg-emerald-500' },
    { id: 'rose', label: 'Laser Rose', bg: 'bg-rose-500' },
  ];

  const handleFieldChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleVisibilityToggle = (section: keyof UserProfile['sectionVisibility']) => {
    setProfile(prev => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [section]: !prev.sectionVisibility[section]
      }
    }));
  };

  const handleAddInfoField = () => {
    setProfile(prev => ({
      ...prev,
      additionalInfo: [...(prev.additionalInfo || []), { label: 'Spesifikasi Baru', value: '' }]
    }));
  };

  const handleUpdateInfoField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...(profile.additionalInfo || [])];
    updated[index][key] = val;
    setProfile(prev => ({ ...prev, additionalInfo: updated }));
  };

  const handleRemoveInfoField = (index: number) => {
    const updated = (profile.additionalInfo || []).filter((_, i) => i !== index);
    setProfile(prev => ({ ...prev, additionalInfo: updated }));
  };

  const handleColorChange = (color: NeonAccent) => {
    setAccent(color);
    handleFieldChange('accentColor', color);
  };

  const handleAvatarChange = async (newUrl: string, storagePath?: string) => {
    if (!newUrl) return;
    const oldStoragePath = profile.avatarStoragePath;
    setProfile(prev => ({
      ...prev,
      avatarUrl: newUrl,
      avatarStoragePath: storagePath || prev.avatarStoragePath
    }));

    // Auto-save immediately to Cloud Firestore so all phones/tablets/PCs update in real-time
    try {
      await onSave({
        avatarUrl: newUrl,
        avatarStoragePath: storagePath || profile.avatarStoragePath
      });
      onShowToast(
        'Foto Profil Tersimpan',
        'Foto profil berhasil disimpan secara online di Cloud Firestore dan tersinkron ke semua perangkat.',
        'success'
      );

      // Delete old file from Firebase Storage only after new photo is saved to Firestore
      if (oldStoragePath && storagePath && oldStoragePath !== storagePath) {
        deleteStorageFile(oldStoragePath).catch(e => console.warn('Old avatar cleanup:', e));
      }
    } catch (err: any) {
      onShowToast(
        'Gagal Menyimpan ke Database',
        err.message || 'Gagal menyimpan URL foto ke Firestore. Pastikan admin terautentikasi.',
        'error'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSave(profile);
      setIsSaving(false);
      setSaveSuccess(true);
      onShowToast('Profil Berhasil Disimpan', 'Semua perubahan telah disinkronkan ke Cloud Firestore!', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setIsSaving(false);
      onShowToast('Gagal Menyimpan', err.message || 'Periksa koneksi database Anda.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header with Save Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wider flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            EDIT PROFIL GAMER // PUBLIC DOSSIER
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Ubah nama, username, bio, foto avatar, spek perangkat, dan visibilitas section publik.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> TERSIMPAN DI FIREBASE
            </span>
          )}
          <CyberButton
            type="submit"
            variant="primary"
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-black" />}
          >
            {isSaving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
          </CyberButton>
        </div>
      </div>

      {/* Grid Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Theme Accents */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Avatar Preview & URL */}
          <CyberCard className="p-6 space-y-4">
            <ImageUploadField
              label="FOTO PROFIL & AVATAR GAMER"
              value={profile.avatarUrl}
              onChange={handleAvatarChange}
              folder="avatars"
              shape="circle"
              onShowToast={onShowToast}
              helperText="Pilih foto dari galeri HP atau file PC Anda (JPG, PNG, WEBP maks 10MB). Tersimpan online bebas biaya di Cloudinary & Cloud Firestore."
            />

            {/* Quick Gamer Status */}
            <div className="pt-2 border-t border-slate-800 font-mono text-xs space-y-2">
              <label className="text-slate-400 uppercase tracking-wider block">
                STATUS AKTIVITAS GAMER
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Online', 'In-Game', 'Streaming', 'AFK'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleFieldChange('status', status)}
                    className={`
                      py-1.5 px-3 rounded border text-xs font-mono transition-all text-left flex items-center justify-between
                      ${profile.status === status 
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    <span>{status}</span>
                    {profile.status === status && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-wider block mt-2 mb-1">
                  GAME YANG SEDANG DIMAINKAN
                </label>
                <input
                  type="text"
                  value={profile.currentPlaying || ''}
                  onChange={(e) => handleFieldChange('currentPlaying', e.target.value)}
                  placeholder="Nama game yang sedang dimainkan"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </CyberCard>

          {/* Theme Neon Accent Picker */}
          <CyberCard className="p-6 space-y-4">
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Palette className="w-4 h-4 text-purple-400" />
              AKSEN WARNA NEON GAMING
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {neonColors.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleColorChange(color.id)}
                  className={`
                    p-2 rounded border flex items-center gap-3 transition-all
                    ${(profile.accentColor || accent) === color.id 
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] text-white' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}
                  `}
                >
                  <span className={`w-4 h-4 rounded-full ${color.bg}`} />
                  <span className="text-xs font-mono">{color.label}</span>
                </button>
              ))}
            </div>
          </CyberCard>

          {/* Section Visibility Toggles */}
          <CyberCard className="p-6 space-y-4">
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              TAMPILKAN / SEMBUNYIKAN BAGIAN PUBLIK
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {[
                { id: 'hero', label: '1. Hero Profile & Tagline' },
                { id: 'identity', label: '2. Identitas & Dossier' },
                { id: 'achievements', label: '3. Prestasi & Kejuaraan' },
                { id: 'hobbies', label: '4. Hobi & Aktivitas' },
                { id: 'music', label: '5. Pemutar Musik Favorit' },
              ].map(sec => {
                const isVisible = profile.sectionVisibility?.[sec.id as keyof UserProfile['sectionVisibility']] !== false;
                return (
                  <div
                    key={sec.id}
                    onClick={() => handleVisibilityToggle(sec.id as any)}
                    className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700"
                  >
                    <span className="text-slate-300">{sec.label}</span>
                    <button
                      type="button"
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${isVisible ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}
                    >
                      {isVisible ? 'TAMPIL' : 'TERSEMBUNYI'}
                    </button>
                  </div>
                );
              })}
            </div>
          </CyberCard>

        </div>

        {/* Right Column: Names, Bio, Specs */}
        <div className="lg:col-span-7 space-y-6">
          
          <CyberCard className="p-6 space-y-5">
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider border-b border-slate-800 pb-2">
              INFORMASI UTAMA // CORE CREDENTIALS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  NAMA RESMI
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  GAMER TAG / USERNAME
                </label>
                <input
                  type="text"
                  value={profile.gamerTag || ''}
                  onChange={(e) => handleFieldChange('gamerTag', e.target.value)}
                  placeholder="Masukkan gamer tag"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-300 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  NAMA PANGGILAN
                </label>
                <input
                  type="text"
                  value={profile.nickname || ''}
                  onChange={(e) => handleFieldChange('nickname', e.target.value)}
                  placeholder="Nama panggilan"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  DOMISILI / KOTA
                </label>
                <input
                  type="text"
                  value={profile.domicile || ''}
                  onChange={(e) => handleFieldChange('domicile', e.target.value)}
                  placeholder="Kota / Wilayah"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  KONTAK RESMI (EMAIL)
                </label>
                <input
                  type="email"
                  value={profile.emailContact || ''}
                  onChange={(e) => handleFieldChange('emailContact', e.target.value)}
                  placeholder="kontak@email.com"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 uppercase tracking-wider block mb-1">
                  TAGLINE GAMER FUTURISTIK
                </label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="font-mono text-xs">
              <label className="text-slate-400 uppercase tracking-wider block mb-1">
                BIO SINGKAT // HERO SUMMARY
              </label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans"
              />
            </div>

            <div className="font-mono text-xs">
              <label className="text-slate-400 uppercase tracking-wider block mb-1">
                DESKRIPSI LENGKAP // ABOUT ME
              </label>
              <textarea
                rows={4}
                value={profile.aboutMe}
                onChange={(e) => handleFieldChange('aboutMe', e.target.value)}
                className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans"
              />
            </div>
          </CyberCard>

          {/* Additional Information / Hardware Specs */}
          <CyberCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-cyber font-bold text-sm text-white tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                SPESIFIKASI TAMBAHAN // CUSTOM LOADOUT
              </h3>
              <button
                type="button"
                onClick={handleAddInfoField}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Tambah Spek
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {(profile.additionalInfo || []).map((info, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={info.label}
                    onChange={(e) => handleUpdateInfoField(idx, 'label', e.target.value)}
                    placeholder="Nama Label"
                    className="w-1/3 bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={info.value}
                    onChange={(e) => handleUpdateInfoField(idx, 'value', e.target.value)}
                    placeholder="Nilai Spek / Keterangan"
                    className="flex-1 bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInfoField(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CyberCard>

        </div>

      </div>

    </form>
  );
};
