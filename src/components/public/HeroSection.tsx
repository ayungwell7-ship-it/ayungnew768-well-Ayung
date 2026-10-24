import React from 'react';
import { UserProfile } from '../../types';
import { CyberButton } from '../ui/CyberButton';
import { 
  Trophy, 
  Music, 
  Gamepad2,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface HeroSectionProps {
  profile: UserProfile;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ profile }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Online':
        return { dot: 'bg-emerald-400', label: 'Online' };
      case 'In-Game':
        return { dot: 'bg-cyan-400', label: 'In-Game' };
      case 'Streaming':
        return { dot: 'bg-purple-400', label: 'Live Streaming' };
      default:
        return { dot: 'bg-slate-400', label: status || 'Available' };
    }
  };

  const statusInfo = getStatusBadge(profile.status);

  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Subtle modern background texture */}
      <div className="absolute inset-0 modern-grid opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-cyan-900/10 to-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 mb-6 shadow-xs">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="font-medium text-slate-200">{statusInfo.label}</span>
          {profile.currentPlaying && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300 font-medium truncate max-w-xs">
                {profile.currentPlaying}
              </span>
            </>
          )}
        </div>

        {/* Clean Avatar */}
        <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 mb-6">
          <div className="w-full h-full rounded-full p-1 bg-slate-900 border-2 border-slate-700/80 hover:border-cyan-500/60 shadow-md transition-colors overflow-hidden flex items-center justify-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name || 'Syahrul Gunawan'}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                <Gamepad2 className="w-10 h-10 text-cyan-400" />
                <span className="text-[10px] mt-1 font-medium">Avatar</span>
              </div>
            )}
          </div>
        </div>

        {/* Name, Tagline & Gamer Tag */}
        <div className="space-y-3 mb-5">
          {profile.gamerTag && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
              <span>TAG: {profile.gamerTag}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            {profile.name || 'Syahrul Gunawan'}
          </h1>

          {profile.tagline && (
            <p className="max-w-xl mx-auto text-sm sm:text-base text-cyan-300 font-medium">
              {profile.tagline}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="max-w-xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
            {profile.bio}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <CyberButton
            onClick={() => scrollTo('achievements')}
            variant="primary"
            size="md"
            icon={<Trophy className="w-4 h-4 text-slate-950" />}
          >
            Lihat Prestasi
          </CyberButton>

          <CyberButton
            onClick={() => scrollTo('music')}
            variant="secondary"
            size="md"
            icon={<Music className="w-4 h-4 text-cyan-400" />}
          >
            Putar Musik
          </CyberButton>
          
          <CyberButton
            onClick={() => scrollTo('identity')}
            variant="ghost"
            size="md"
            icon={<User className="w-4 h-4 text-slate-400" />}
          >
            Biodata &amp; Spek
          </CyberButton>
        </div>

        {/* Key Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-slate-800/60">
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-cyan-400">74.2%</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5">Win Rate Turnamen</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-blue-400">#1 MVP</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5">National Cup</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-indigo-400">240 Hz</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5">Display Setup</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">800 DPI</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5">Aim Precision</div>
          </div>
        </div>

      </div>
    </section>
  );
};
