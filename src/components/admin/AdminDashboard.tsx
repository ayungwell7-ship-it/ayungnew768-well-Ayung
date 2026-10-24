import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  Trophy, 
  Gamepad2, 
  Music, 
  Link2, 
  BookOpen, 
  Settings, 
  Eye, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  Database,
  Sparkles,
  Zap,
  KeyRound,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  UserProfile, 
  Achievement, 
  Hobby, 
  MusicTrack, 
  PrivateLink, 
  PrivateNote,
  SecretAccountNote
} from '../../types';

import { DashboardOverview } from './DashboardOverview';
import { ProfileEditor } from './ProfileEditor';
import { AchievementsManager } from './AchievementsManager';
import { HobbiesManager } from './HobbiesManager';
import { MusicManager } from './MusicManager';
import { PrivateLinksVault } from './PrivateLinksVault';
import { NotesHub } from './notes/NotesHub';
import { AccountSettings } from './AccountSettings';
import { FirebaseSettingsGuide } from './FirebaseSettingsGuide';
import { CyberButton } from '../ui/CyberButton';

interface AdminDashboardProps {
  profile: UserProfile;
  achievements: Achievement[];
  hobbies: Hobby[];
  music: MusicTrack[];
  privateLinks: PrivateLink[];
  privateNotes: PrivateNote[];
  secretNotes: SecretAccountNote[];
  
  onSaveProfile: (p: Partial<UserProfile>) => Promise<void>;
  
  onCreateAchievement: (item: Omit<Achievement, 'id'>) => Promise<string>;
  onUpdateAchievement: (id: string, item: Partial<Achievement>) => Promise<void>;
  onDeleteAchievement: (id: string) => Promise<void>;
  
  onCreateHobby: (item: Omit<Hobby, 'id'>) => Promise<string>;
  onUpdateHobby: (id: string, item: Partial<Hobby>) => Promise<void>;
  onDeleteHobby: (id: string) => Promise<void>;
  
  onCreateMusic: (item: Omit<MusicTrack, 'id'>) => Promise<string>;
  onUpdateMusic: (id: string, item: Partial<MusicTrack>) => Promise<void>;
  onDeleteMusic: (id: string) => Promise<void>;
  
  onCreatePrivateLink: (item: Omit<PrivateLink, 'id'>) => Promise<string>;
  onUpdatePrivateLink: (id: string, item: Partial<PrivateLink>) => Promise<void>;
  onDeletePrivateLink: (id: string) => Promise<void>;
  
  onCreatePrivateNote: (item: Omit<PrivateNote, 'id'>) => Promise<string>;
  onUpdatePrivateNote: (id: string, item: Partial<PrivateNote>) => Promise<void>;
  onDeletePrivateNote: (id: string) => Promise<void>;

  onCreateSecretNote: (item: Omit<SecretAccountNote, 'id'>) => Promise<string>;
  onUpdateSecretNote: (id: string, item: Partial<SecretAccountNote>) => Promise<void>;
  onDeleteSecretNote: (id: string) => Promise<void>;
  
  onSeedData: () => Promise<void>;
  onViewPublic: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profile,
  achievements,
  hobbies,
  music,
  privateLinks,
  privateNotes,
  secretNotes,
  onSaveProfile,
  onCreateAchievement,
  onUpdateAchievement,
  onDeleteAchievement,
  onCreateHobby,
  onUpdateHobby,
  onDeleteHobby,
  onCreateMusic,
  onUpdateMusic,
  onDeleteMusic,
  onCreatePrivateLink,
  onUpdatePrivateLink,
  onDeletePrivateLink,
  onCreatePrivateNote,
  onUpdatePrivateNote,
  onDeletePrivateNote,
  onCreateSecretNote,
  onUpdateSecretNote,
  onDeleteSecretNote,
  onSeedData,
  onViewPublic,
  onShowToast,
}) => {
  const { logout, user } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: '2. Edit Profil', icon: UserCheck },
    { id: 'achievements', label: '3. Prestasi', icon: Trophy },
    { id: 'hobbies', label: '4. Hobi', icon: Gamepad2 },
    { id: 'music', label: '5. Musik Favorit', icon: Music },
    { id: 'links', label: '6. Koleksi Website', icon: Link2, badge: 'RAHASIA' },
    { id: 'notes', label: '7. Catatan (2 Pilihan)', icon: BookOpen, badge: '😎 & 🔐' },
    { id: 'account', label: '8. Pengaturan Akun', icon: KeyRound },
    { id: 'settings', label: '9. Firebase & Cloudinary', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  // Unified Logout State & Modal (Eliminates window.confirm which is blocked on mobile)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleOpenLogout = () => {
    setShowLogoutModal(true);
  };

  const handleExecuteLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await logout();
      if (res.success) {
        setShowLogoutModal(false);
        setMobileSidebarOpen(false);
        onViewPublic();
        onShowToast('Berhasil Logout', 'Anda telah berhasil keluar dari Control Panel Admin.', 'success');
      } else {
        setIsLoggingOut(false);
        onShowToast('Gagal Logout', res.error || 'Terjadi kesalahan saat proses logout.', 'error');
      }
    } catch (err: any) {
      setIsLoggingOut(false);
      onShowToast('Gagal Logout', err.message || 'Terjadi kesalahan sistem saat logout.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Mobile Top Navbar with hamburger & quick logout */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#090d16] border-b border-cyan-950 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-400 active:scale-95 touch-manipulation cursor-pointer flex items-center justify-center min-w-[38px] min-h-[38px]"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-cyber font-bold text-xs sm:text-sm text-white tracking-wider truncate max-w-[140px]">
            SG // CONTROL PANEL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewPublic}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 hover:text-white active:scale-95 touch-manipulation cursor-pointer min-h-[36px]"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono">Publik</span>
          </button>
          <button
            type="button"
            onClick={handleOpenLogout}
            disabled={isLoggingOut}
            className="px-3 py-1.5 rounded bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border border-rose-600/80 text-xs text-rose-200 hover:text-white hover:border-rose-400 flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50 min-h-[36px]"
            title="Keluar dari Admin"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 text-rose-300 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-[11px] font-mono font-bold tracking-wide">
              {isLoggingOut ? 'Keluar...' : 'Keluar'}
            </span>
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm md:hidden cursor-pointer touch-manipulation"
          aria-hidden="true"
        />
      )}

      {/* Futuristic Gaming Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#070a13] border-r border-cyan-950/80 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 h-screen max-h-screen overflow-hidden
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Scrollable upper section: header, user info, nav */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header & Logo */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#070a13] rounded flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="font-cyber font-black text-sm text-white tracking-wider">
                  SYAHRUL GUNAWAN
                </div>
                <div className="text-[10px] font-mono text-cyan-400 tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ADMIN PANEL // v2.6
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded active:scale-95 touch-manipulation cursor-pointer"
              aria-label="Tutup Menu Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Dossier */}
          <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full border border-cyan-400 overflow-hidden bg-slate-900 flex items-center justify-center flex-shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="truncate">
              <div className="text-xs font-cyber font-bold text-white truncate">
                SUPER ADMIN
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                STATUS: TERVERIFIKASI
              </div>
            </div>
          </div>

          {/* Navigation Items (1 through 9) - scrollable on mobile */}
          <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1 font-cyber text-xs">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded transition-all duration-200 text-left active:scale-[0.98] touch-manipulation cursor-pointer
                    ${isActive 
                      ? 'bg-cyan-950/80 text-white border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-600/40 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions (Lihat Website Publik & Logout) - always pinned */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 font-cyber text-xs bg-[#070a13] flex-shrink-0">
          <button
            type="button"
            onClick={onViewPublic}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors active:scale-[0.98] touch-manipulation cursor-pointer min-h-[40px]"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Lihat Website Publik</span>
          </button>

          <button
            type="button"
            onClick={handleOpenLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border border-rose-600/60 text-rose-200 hover:text-white hover:border-rose-400 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] active:scale-[0.98] touch-manipulation cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 text-rose-300 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 text-rose-400" />
            )}
            <span className="font-bold tracking-wide">
              {isLoggingOut ? 'Sedang Logout...' : 'Logout Admin'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {activeTab === 'overview' && (
          <DashboardOverview
            stats={{
              achievementsCount: achievements.length,
              hobbiesCount: hobbies.length,
              musicCount: music.length,
              linksCount: privateLinks.length,
              notesCount: privateNotes.length + secretNotes.length,
            }}
            onNavigate={(tab) => setActiveTab(tab)}
            onSeedData={onSeedData}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileEditor
            initialProfile={profile}
            onSave={onSaveProfile}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsManager
            achievements={achievements}
            onCreate={onCreateAchievement}
            onUpdate={onUpdateAchievement}
            onDelete={onDeleteAchievement}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'hobbies' && (
          <HobbiesManager
            hobbies={hobbies}
            onCreate={onCreateHobby}
            onUpdate={onUpdateHobby}
            onDelete={onDeleteHobby}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'music' && (
          <MusicManager
            tracks={music}
            onCreate={onCreateMusic}
            onUpdate={onUpdateMusic}
            onDelete={onDeleteMusic}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'links' && (
          <PrivateLinksVault
            links={privateLinks}
            onCreate={onCreatePrivateLink}
            onUpdate={onUpdatePrivateLink}
            onDelete={onDeletePrivateLink}
            onShowToast={onShowToast}
          />
        )}

        {/* 7. CATATAN DUA PILIHAN: KATA-KATA 😎 & RAHASIA 🔐 */}
        {activeTab === 'notes' && (
          <NotesHub
            wordsNotes={privateNotes}
            secretNotes={secretNotes}
            onCreateWordsNote={onCreatePrivateNote}
            onUpdateWordsNote={onUpdatePrivateNote}
            onDeleteWordsNote={onDeletePrivateNote}
            onCreateSecretNote={onCreateSecretNote}
            onUpdateSecretNote={onUpdateSecretNote}
            onDeleteSecretNote={onDeleteSecretNote}
            onShowToast={onShowToast}
          />
        )}

        {/* 8. PENGATURAN AKUN (USERNAME, PASSWORD ADMIN, PASSWORD CATATAN RAHASIA) */}
        {activeTab === 'account' && (
          <AccountSettings
            onShowToast={onShowToast}
          />
        )}

        {/* 9. PENGATURAN FIREBASE */}
        {activeTab === 'settings' && (
          <FirebaseSettingsGuide
            onShowToast={onShowToast}
          />
        )}
      </main>

      {/* Cyberpunk Logout Confirmation Modal (Guaranteed response on HP / Mobile & Desktop) */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoggingOut) setShowLogoutModal(false);
          }}
        >
          <div className="relative w-full max-w-sm bg-[#090d18] border border-rose-500/80 rounded-xl p-5 shadow-[0_0_30px_rgba(244,63,94,0.35)] font-cyber">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-rose-950/80">
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  KONFIRMASI KELUAR
                </h3>
                <p className="text-[10px] font-mono text-rose-400/90 tracking-wider">
                  CONTROL PANEL // TERMINATE SESSION
                </p>
              </div>
            </div>

            {/* Message Body */}
            <div className="py-4 space-y-2 text-xs font-sans text-slate-300">
              <p className="leading-relaxed">
                Yakin ingin logout dari Control Panel Admin?
              </p>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Profil, prestasi, musik &amp; hobi tetap aman.
                </div>
                <div className="text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Dashboard admin akan dikunci kembali.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 font-mono text-xs">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer min-h-[38px] active:scale-95 touch-manipulation"
              >
                BATAL
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleExecuteLogout}
                className="px-4 py-2 rounded bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50 transition-all cursor-pointer min-h-[38px] active:scale-95 touch-manipulation"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span>MEMPROSES...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 text-white" />
                    <span>YA, KELUAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
