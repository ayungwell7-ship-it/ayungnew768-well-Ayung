import React, { useState } from 'react';
import { Shield, LayoutDashboard, Menu, X, Gamepad2, Trophy, Music, UserCheck, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CyberButton } from '../ui/CyberButton';

interface NavbarProps {
  onOpenLogin: () => void;
  onNavigateToDashboard?: () => void;
  currentSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onNavigateToDashboard, currentSection }) => {
  const { isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'hero', label: 'Beranda', icon: Flame },
    { id: 'identity', label: 'Profil', icon: UserCheck },
    { id: 'achievements', label: 'Prestasi', icon: Trophy },
    { id: 'hobbies', label: 'Hobi', icon: Gamepad2 },
    { id: 'music', label: 'Musik', icon: Music },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => scrollTo('hero')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                Syahrul Gunawan
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 rounded-full">
                Gaming
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
              Personal Profile &amp; Dossier
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                  ${isActive 
                    ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button: Login Admin or Open Dashboard */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin ? (
            <CyberButton
              onClick={onNavigateToDashboard}
              variant="primary"
              size="sm"
              icon={<LayoutDashboard className="w-4 h-4 text-slate-950" />}
            >
              Control Panel
            </CyberButton>
          ) : (
            <CyberButton
              onClick={onOpenLogin}
              variant="secondary"
              size="sm"
              icon={<Shield className="w-4 h-4 text-cyan-400" />}
            >
              Login Admin
            </CyberButton>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAdmin && (
            <button
              onClick={onNavigateToDashboard}
              className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 active:scale-95"
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white active:scale-95 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/98 border-b border-slate-800 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`
                    flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer
                    ${isActive 
                      ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200' 
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            {isAdmin ? (
              <CyberButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onNavigateToDashboard) onNavigateToDashboard();
                }}
                variant="primary"
                fullWidth
                size="md"
                icon={<LayoutDashboard className="w-4 h-4 text-slate-950" />}
              >
                Buka Control Panel Admin
              </CyberButton>
            ) : (
              <CyberButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                variant="secondary"
                fullWidth
                size="md"
                icon={<Shield className="w-4 h-4 text-cyan-400" />}
              >
                Login Admin
              </CyberButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
