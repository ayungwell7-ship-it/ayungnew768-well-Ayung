import React from 'react';
import { Hobby } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CyberCard } from '../ui/CyberCard';
import { 
  Crosshair, 
  Cpu, 
  Headphones, 
  Radio, 
  Gamepad2, 
  Flame, 
  Zap, 
  Target, 
  Tv, 
  Wrench, 
  Code, 
  Layers,
  Sparkles
} from 'lucide-react';

interface HobbiesSectionProps {
  hobbies: Hobby[];
}

export const HobbiesSection: React.FC<HobbiesSectionProps> = ({ hobbies }) => {
  const { theme } = useTheme();

  const renderIcon = (iconName: string) => {
    const props = { className: "w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" };
    switch (iconName?.toLowerCase()) {
      case 'crosshair': return <Crosshair {...props} />;
      case 'cpu': return <Cpu {...props} />;
      case 'headphones': return <Headphones {...props} />;
      case 'radio': return <Radio {...props} />;
      case 'flame': return <Flame {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'target': return <Target {...props} />;
      case 'tv': return <Tv {...props} />;
      case 'wrench': return <Wrench {...props} />;
      case 'code': return <Code {...props} />;
      default: return <Gamepad2 {...props} />;
    }
  };

  return (
    <section id="hobbies" className="py-24 relative bg-[#070a13] border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-mono tracking-widest uppercase mb-3">
            <Gamepad2 className="w-3.5 h-3.5" />
            PASSION & INTERESTS // LOADOUT
          </div>
          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white">
            HOBI & <span className={theme.text}>AKTIVITAS</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-4" />
          <p className="text-slate-400 text-sm mt-3 font-sans">
            Aktivitas di luar turnamen: eksplorasi hardware custom, kreasi audio musik synth, dan game modding.
          </p>
        </div>

        {/* Hobbies Cards Grid */}
        {hobbies.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg max-w-md mx-auto">
            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-cyber text-slate-300">Belum Ada Hobi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Admin dapat menambahkan daftar hobi dan aktivitas gaming melalui dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hobbies.map((hobby) => (
            <CyberCard
              key={hobby.id}
              className="p-5 flex flex-col justify-between group hover:border-cyan-400/80 transition-all duration-300"
            >
              <div>
                {/* Image Header if provided */}
                {hobby.imageUrl ? (
                  <div className="relative w-full h-36 mb-4 rounded overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={hobby.imageUrl}
                      alt={hobby.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-2 left-2 p-2 rounded bg-black/80 border border-cyan-500/40 backdrop-blur-md">
                      {renderIcon(hobby.icon)}
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-shadow">
                    {renderIcon(hobby.icon)}
                  </div>
                )}

                {/* Category Badge */}
                <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {hobby.category || 'GAMING SUITE'}
                </div>

                {/* Name */}
                <h3 className="text-base sm:text-lg font-cyber font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                  {hobby.name}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
                  {hobby.description}
                </p>
              </div>

              {/* Card Footer Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>ACTIVITY LVL</span>
                <span className="text-cyan-400 font-bold">MAX FREQUENCY</span>
              </div>
            </CyberCard>
          ))}
        </div>
      )}

      </div>
    </section>
  );
};
