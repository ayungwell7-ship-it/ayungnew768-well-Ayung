import React from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Music, 
  Link2, 
  BookOpen, 
  Database, 
  Activity, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardOverviewProps {
  stats: {
    achievementsCount: number;
    hobbiesCount: number;
    musicCount: number;
    linksCount: number;
    notesCount: number;
  };
  onNavigate: (tab: string) => void;
  onSeedData: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  onNavigate,
  onSeedData,
}) => {
  const { theme } = useTheme();
  const { isFirebaseActive, user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-xl bg-gradient-to-r from-slate-900 via-[#0a0f1e] to-slate-900 border border-cyan-500/40 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>COMMAND CENTER ACTIVE // SYAHRUL GUNAWAN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-cyber font-black text-white tracking-wide">
              GAMING <span className={theme.text}>CONTROL PANEL</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-sans max-w-xl">
              Kelola profil publik, koleksi musik, daftar prestasi, serta brankas link & catatan rahasia dengan sinkronisasi Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CyberButton
              onClick={() => onNavigate('profile')}
              variant="glow"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
            >
              EDIT PROFIL
            </CyberButton>

            <CyberButton
              onClick={() => onNavigate('notes')}
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4 text-black" />}
            >
              BUAT CATATAN
            </CyberButton>
          </div>
        </div>
      </div>

      {/* Sync Status Strip */}
      <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="text-slate-400">DATABASE STATUS: </span>
            {isFirebaseActive ? (
              <span className="text-emerald-400 font-bold">ONLINE (CLOUDFIRESTORE SYNCHRONIZED)</span>
            ) : (
              <span className="text-cyan-300 font-semibold">LOCAL ENGINE // SIAP DIHUBUNGKAN KE FIREBASE</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSeedData}
            className="text-[11px] text-rose-400 hover:text-rose-300 underline underline-offset-4 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Seluruh Data
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => onNavigate('settings')}
            className="text-[11px] text-purple-400 hover:text-purple-300 underline underline-offset-4"
          >
            Panduan & Konfigurasi
          </button>
        </div>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Achievements Card */}
        <CyberCard
          onClick={() => onNavigate('achievements')}
          className="p-5 cursor-pointer hover:border-yellow-400/80 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded bg-yellow-950/80 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-yellow-400 uppercase">PUBLIK</span>
          </div>
          <div className="text-2xl font-cyber font-bold text-white mb-0.5">
            {stats.achievementsCount}
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Total Prestasi
          </div>
        </CyberCard>

        {/* Hobbies Card */}
        <CyberCard
          onClick={() => onNavigate('hobbies')}
          className="p-5 cursor-pointer hover:border-purple-400/80 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 uppercase">PUBLIK</span>
          </div>
          <div className="text-2xl font-cyber font-bold text-white mb-0.5">
            {stats.hobbiesCount}
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Total Hobi
          </div>
        </CyberCard>

        {/* Music Card */}
        <CyberCard
          onClick={() => onNavigate('music')}
          className="p-5 cursor-pointer hover:border-cyan-400/80 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase">PLAYLIST</span>
          </div>
          <div className="text-2xl font-cyber font-bold text-white mb-0.5">
            {stats.musicCount}
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Lagu Musik
          </div>
        </CyberCard>

        {/* Private Links Card */}
        <CyberCard
          onClick={() => onNavigate('links')}
          className="p-5 cursor-pointer hover:border-emerald-400/80 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Link2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">RAHASIA</span>
          </div>
          <div className="text-2xl font-cyber font-bold text-white mb-0.5">
            {stats.linksCount}
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Koleksi Website
          </div>
        </CyberCard>

        {/* Private Notes Card */}
        <CyberCard
          onClick={() => onNavigate('notes')}
          className="p-5 cursor-pointer hover:border-blue-400/80 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">2 PILIHAN</span>
          </div>
          <div className="text-2xl font-cyber font-bold text-white mb-0.5">
            {stats.notesCount}
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Kata-Kata &amp; Rahasia
          </div>
        </CyberCard>

      </div>

      {/* Quick Launchpad Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fast Content Creation Panel */}
        <CyberCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cyber font-bold text-white text-sm tracking-wider">
              AKSI CEPAT // QUICK CONTENT MANAGER
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <button
              onClick={() => onNavigate('achievements')}
              className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-yellow-400/60 text-left hover:bg-slate-850 transition-all"
            >
              <div className="text-yellow-400 font-bold flex items-center gap-1.5 mb-1">
                <Trophy className="w-3.5 h-3.5" /> + Prestasi Baru
              </div>
              <p className="text-[11px] text-slate-400 font-sans">Tambah sertifikat atau piala turnamen</p>
            </button>

            <button
              onClick={() => onNavigate('music')}
              className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-cyan-400/60 text-left hover:bg-slate-850 transition-all"
            >
              <div className="text-cyan-400 font-bold flex items-center gap-1.5 mb-1">
                <Music className="w-3.5 h-3.5" /> + Tambah Lagu
              </div>
              <p className="text-[11px] text-slate-400 font-sans">Input audio URL langsung & cover art</p>
            </button>

            <button
              onClick={() => onNavigate('links')}
              className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-emerald-400/60 text-left hover:bg-slate-850 transition-all"
            >
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
                <Link2 className="w-3.5 h-3.5" /> + Simpan Link Rahasia
              </div>
              <p className="text-[11px] text-slate-400 font-sans">Web, sosmed, aplikasi, game</p>
            </button>

            <button
              onClick={() => onNavigate('notes')}
              className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-purple-400/60 text-left hover:bg-slate-850 transition-all"
            >
              <div className="text-purple-400 font-bold flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5" /> + Tulis Catatan Baru
              </div>
              <p className="text-[11px] text-slate-400 font-sans">Strategi, ide konten, preset gear</p>
            </button>
          </div>
        </CyberCard>

        {/* Security & Multi-Device Sync Card */}
        <CyberCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-cyber font-bold text-white text-sm tracking-wider">
              SINKRONISASI ANTARPERANGKAT & KEAMANAN
            </h3>
          </div>

          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Satu Database untuk Semua Perangkat:</strong> Data yang diubah dari HP Anda otomatis terupdate saat dibuka dari laptop atau PC lain.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Privasi Terproteksi:</strong> Koleksi Website dan Catatan hanya diakses setelah token admin diverifikasi oleh Firestore Security Rules.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Real-Time Listeners:</strong> Menggunakan Cloud Firestore Snapshot, perubahan data seketika muncul tanpa perlu me-reload halaman browser.
              </span>
            </div>
          </div>
        </CyberCard>

      </div>

    </div>
  );
};
