import React from 'react';
import { Gamepad2, Shield, Heart, Radio, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FooterProps {
  onOpenLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLogin }) => {
  const { theme } = useTheme();

  return (
    <footer className="relative bg-[#04060a] border-t border-slate-900 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-cyber font-bold text-white tracking-wider text-base">
                SYAHRUL GUNAWAN <span className={theme.text}>| GAMING PROFILE</span>
              </div>
              <p className="text-xs font-mono text-slate-500">
                PRO ESPORTS // DIGITAL PROFILE // REAL-TIME CLOUD DATABASE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>PORTAL ADMIN</span>
            </button>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SERVER ONLINE</span>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Syahrul Gunawan. Hak Cipta Dilindungi.
          </div>
          <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
            BUILT WITH CYBERPUNK AESTHETICS & FIRESTORE CLOUD ENGINE
          </div>
        </div>

      </div>
    </footer>
  );
};
