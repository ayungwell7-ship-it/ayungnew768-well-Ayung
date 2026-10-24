import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { 
  UserProfile, 
  Achievement, 
  Hobby, 
  MusicTrack, 
  PrivateLink, 
  PrivateNote,
  SecretAccountNote
} from './types';
import { 
  subscribeToProfile, 
  saveProfile,
  subscribeToAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  subscribeToHobbies,
  createHobby,
  updateHobby,
  deleteHobby,
  subscribeToMusic,
  createMusic,
  updateMusic,
  deleteMusic,
  subscribeToPrivateLinks,
  createPrivateLink,
  updatePrivateLink,
  deletePrivateLink,
  subscribeToPrivateNotes,
  createPrivateNote,
  updatePrivateNote,
  deletePrivateNote,
  subscribeToSecretAccountNotes,
  createSecretAccountNote,
  updateSecretAccountNote,
  deleteSecretAccountNote,
  seedFirebaseCloud
} from './services/firestoreService';
import { 
  INITIAL_PROFILE, 
  INITIAL_ACHIEVEMENTS, 
  INITIAL_HOBBIES, 
  INITIAL_MUSIC, 
  INITIAL_PRIVATE_LINKS, 
  INITIAL_PRIVATE_NOTES 
} from './services/seedData';

// Public Components
import { Navbar } from './components/public/Navbar';
import { HeroSection } from './components/public/HeroSection';
import { IdentitySection } from './components/public/IdentitySection';
import { AchievementsSection } from './components/public/AchievementsSection';
import { HobbiesSection } from './components/public/HobbiesSection';
import { MusicPlayerSection } from './components/public/MusicPlayerSection';
import { Footer } from './components/public/Footer';

// Admin Components
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotificationToast, ToastMessage } from './components/ui/NotificationToast';

function AppContent() {
  const { isAdmin } = useAuth();
  const { setAccent } = useTheme();

  // Navigation View: 'public' | 'dashboard'
  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>('public');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Real-time Cloud Firestore Data States
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [hobbies, setHobbies] = useState<Hobby[]>(INITIAL_HOBBIES);
  const [music, setMusic] = useState<MusicTrack[]>(INITIAL_MUSIC);
  const [privateLinks, setPrivateLinks] = useState<PrivateLink[]>(INITIAL_PRIVATE_LINKS);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>(INITIAL_PRIVATE_NOTES);
  const [secretNotes, setSecretNotes] = useState<SecretAccountNote[]>([]);

  // Active section for Navbar
  const [activeSection, setActiveSection] = useState('hero');

  // Show toast notification
  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Ensure dashboard cannot be reached if not logged in (e.g. via browser back button)
  useEffect(() => {
    if (!isAdmin && currentView === 'dashboard') {
      setCurrentView('public');
      window.history.replaceState({ view: 'public' }, '', window.location.pathname);
    }
  }, [isAdmin, currentView]);

  // Handle browser back / forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view === 'dashboard' && !isAdmin) {
        setCurrentView('public');
        window.history.replaceState({ view: 'public' }, '', window.location.pathname);
      } else if (e.state?.view) {
        setCurrentView(e.state.view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  // 1. Subscribe to Public Profile
  useEffect(() => {
    const unsub = subscribeToProfile((data) => {
      setProfile(data);
      if (data.accentColor) {
        setAccent(data.accentColor);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Achievements
  useEffect(() => {
    const unsub = subscribeToAchievements((data) => {
      setAchievements(data);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Hobbies
  useEffect(() => {
    const unsub = subscribeToHobbies((data) => {
      setHobbies(data);
    });
    return () => unsub();
  }, []);

  // 4. Subscribe to Music
  useEffect(() => {
    const unsub = subscribeToMusic((data) => {
      setMusic(data);
    });
    return () => unsub();
  }, []);

  // 5. Subscribe to Private Vaults (Only when Admin is Authenticated!)
  useEffect(() => {
    if (isAdmin) {
      const unsubLinks = subscribeToPrivateLinks((data) => {
        setPrivateLinks(data);
      });
      const unsubNotes = subscribeToPrivateNotes((data) => {
        setPrivateNotes(data);
      });
      const unsubSecret = subscribeToSecretAccountNotes((data) => {
        setSecretNotes(data);
      });
      return () => {
        unsubLinks();
        unsubNotes();
        unsubSecret();
      };
    } else {
      // Clear private data from memory when not admin
      setPrivateLinks([]);
      setPrivateNotes([]);
      setSecretNotes([]);
    }
  }, [isAdmin]);

  // Handle Clear / Reset Data
  const handleSeedData = async () => {
    if (!window.confirm('Kosongkan semua data profil, prestasi, hobi, musik, dan catatan? Semua data akan dikosongkan secara bersih.')) return;
    const res = await seedFirebaseCloud();
    addToast(res.success ? 'Data Dikosongkan' : 'Gagal Mengosongkan', res.message, res.success ? 'success' : 'error');
  };



  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Toast Notification Container */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentView('dashboard');
          window.history.pushState({ view: 'dashboard' }, '', window.location.pathname);
          addToast('Login Berhasil', 'Selamat datang di Control Panel Admin Syahrul Gunawan.', 'success');
        }}
      />

      {/* View Switch: Admin Dashboard vs Public Profile */}
      {currentView === 'dashboard' && isAdmin ? (
        <AdminDashboard
          profile={profile}
          achievements={achievements}
          hobbies={hobbies}
          music={music}
          privateLinks={privateLinks}
          privateNotes={privateNotes}
          secretNotes={secretNotes}
          onSaveProfile={saveProfile}
          onCreateAchievement={createAchievement}
          onUpdateAchievement={updateAchievement}
          onDeleteAchievement={deleteAchievement}
          onCreateHobby={createHobby}
          onUpdateHobby={updateHobby}
          onDeleteHobby={deleteHobby}
          onCreateMusic={createMusic}
          onUpdateMusic={updateMusic}
          onDeleteMusic={deleteMusic}
          onCreatePrivateLink={createPrivateLink}
          onUpdatePrivateLink={updatePrivateLink}
          onDeletePrivateLink={deletePrivateLink}
          onCreatePrivateNote={createPrivateNote}
          onUpdatePrivateNote={updatePrivateNote}
          onDeletePrivateNote={deletePrivateNote}
          onCreateSecretNote={createSecretAccountNote}
          onUpdateSecretNote={updateSecretAccountNote}
          onDeleteSecretNote={deleteSecretAccountNote}
          onSeedData={handleSeedData}
          onViewPublic={() => {
            setCurrentView('public');
            window.history.replaceState({ view: 'public' }, '', window.location.pathname);
          }}
          onShowToast={addToast}
        />
      ) : (
        <>
          {/* Public Navbar */}
          <Navbar
            currentSection={activeSection}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onNavigateToDashboard={() => {
              if (isAdmin) {
                setCurrentView('dashboard');
                window.history.pushState({ view: 'dashboard' }, '', window.location.pathname);
              } else {
                setIsLoginModalOpen(true);
              }
            }}
          />

          {/* 1. Hero Profile */}
          {profile.sectionVisibility?.hero !== false && (
            <HeroSection profile={profile} />
          )}

          {/* 2. Identitas & Specification */}
          {profile.sectionVisibility?.identity !== false && (
            <IdentitySection profile={profile} />
          )}

          {/* 3. Prestasi Turnamen */}
          {profile.sectionVisibility?.achievements !== false && (
            <AchievementsSection achievements={achievements} />
          )}

          {/* 4. Hobi & Aktivitas Gaming */}
          {profile.sectionVisibility?.hobbies !== false && (
            <HobbiesSection hobbies={hobbies} />
          )}

          {/* 5. Musik Favorit */}
          {profile.sectionVisibility?.music !== false && (
            <MusicPlayerSection tracks={music} />
          )}

          {/* Footer */}
          <Footer onOpenLogin={() => setIsLoginModalOpen(true)} />
        </>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
