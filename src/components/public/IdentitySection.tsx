import React from 'react';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CyberCard } from '../ui/CyberCard';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Cpu, 
  Monitor, 
  Sliders, 
  ShieldAlert, 
  Mail, 
  Hash, 
  BadgeCheck 
} from 'lucide-react';

interface IdentitySectionProps {
  profile: UserProfile;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({ profile }) => {
  const { theme } = useTheme();

  return (
    <section id="identity" className="py-24 relative border-t border-slate-900 bg-[#070a12]">
      {/* Background cyber accent */}
      <div className="absolute inset-0 cyber-grid-dense opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono tracking-widest uppercase mb-3">
            <BadgeCheck className="w-3.5 h-3.5" />
            IDENTITAS & SPECIFICATION
          </div>
          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white">
            PLAYER <span className={theme.text}>DOSSIER</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-4" />
          <p className="text-slate-400 text-sm mt-3 font-sans">
            Informasi resmi gamer, domisili, profil diri, dan konfigurasi battle station Syahrul Gunawan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Core Identity Card */}
          <div className="lg:col-span-5 space-y-6">
            <CyberCard highlight={true} className="p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">OFFICIAL ID</span>
                    <h3 className="text-lg font-cyber font-bold text-white tracking-wide">
                      {profile.fullName || profile.name || 'Belum Diatur'}
                    </h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono">
                  VERIFIED
                </span>
              </div>

              {/* Data fields */}
              <div className="space-y-4 font-mono text-sm">
                
                <div className="flex items-start justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-2 text-xs">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" /> Nama Panggilan:
                  </span>
                  <span className="text-white font-semibold text-right">
                    {profile.nickname || '-'}
                  </span>
                </div>

                {profile.domicile && (
                  <div className="flex items-start justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" /> Domisili:
                    </span>
                    <span className="text-white font-semibold text-right">
                      {profile.domicile}
                    </span>
                  </div>
                )}

                {profile.emailContact && (
                  <div className="flex items-start justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-2 text-xs">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> Kontak Resmi:
                    </span>
                    <span className="text-cyan-300 font-semibold text-right truncate max-w-[200px]">
                      {profile.emailContact}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-2 text-xs">
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Status Akun:
                  </span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                    ACTIVE // SYNCED
                  </span>
                </div>

              </div>

              {/* Cyber Graphic Bar */}
              <div className="p-3 bg-black/60 rounded border border-cyan-900/40 space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>COMPETITIVE READINESS</span>
                  <span className="text-cyan-400">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 w-full animate-pulse" />
                </div>
              </div>

            </CyberCard>
          </div>

          {/* Right Column: About Me & Custom Specs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* About Me Card */}
            <CyberCard className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-cyber font-bold tracking-wider text-white">
                  DESKRIPSI DIRI // PERSONAL STATEMENT
                </h3>
              </div>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                {profile.aboutMe || profile.bio || 'Profil gaming. Kelola detail melalui Control Panel Admin.'}
              </p>
            </CyberCard>

            {/* Additional Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(profile.additionalInfo || []).length > 0 ? (
                profile.additionalInfo?.map((info, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded clip-gaming-card hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                      {info.label}
                    </div>
                    <div className="text-sm font-semibold text-slate-100 font-sans">
                      {info.value}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded text-center text-xs font-mono text-slate-500">
                  Belum ada spesifikasi tambahan yang dimasukkan.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
