import React, { useState } from 'react';
import { Achievement } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CyberCard } from '../ui/CyberCard';
import { Trophy, Calendar, Award, Gamepad2, Sparkles, ExternalLink, ShieldCheck, X } from 'lucide-react';

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ achievements }) => {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="achievements" className="py-24 relative bg-[#05070d] border-t border-slate-900">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-3">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            HALL OF FAME // COMPETITIVE MILESTONES
          </div>
          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white">
            GAMING <span className={theme.text}>PRESTASI</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-4" />
          <p className="text-slate-400 text-sm mt-3 font-sans">
            Rekam jejak turnamen, medali kejuaraan, penghargaan clutch, dan rekor rank kompetitif.
          </p>
        </div>

        {/* Empty state check */}
        {achievements.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg max-w-md mx-auto">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-cyber text-slate-300">Belum Ada Prestasi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Admin dapat menambahkan daftar kejuaraan dan pencapaian melalui dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((item) => (
              <CyberCard
                key={item.id}
                highlight={item.highlighted}
                glow={item.highlighted}
                className="p-5 sm:p-6 flex flex-col justify-between group hover:border-cyan-400/80 transition-all duration-300"
              >
                <div>
                  {/* Top Bar: Badge and Date */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-[11px] font-cyber font-bold tracking-wider">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      {item.badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      {item.date}
                    </span>
                  </div>

                  {/* Thumbnail / Proof Image if provided */}
                  {item.imageUrl && (
                    <div 
                      onClick={() => setSelectedImage(item.imageUrl || null)}
                      className="relative w-full h-44 mb-4 rounded overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group/img"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover/img:opacity-40 transition-opacity" />
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Klik untuk Zoom
                      </div>
                    </div>
                  )}

                  {/* Game or Event Label */}
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    {item.gameOrEvent}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-cyber font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-300 text-sm leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Bottom cyber indicator */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    CERTIFIED TOURNAMENT
                  </span>
                  <span className="text-cyan-500 font-bold">MATCH RECORD</span>
                </div>
              </CyberCard>
            ))}
          </div>
        )}

      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl w-full bg-[#090d16] border border-cyan-500/60 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/80 border border-slate-700 rounded-full text-white hover:text-cyan-400"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Bukti Prestasi" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </section>
  );
};
