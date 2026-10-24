import React, { useState, useRef, useEffect } from 'react';
import { MusicTrack } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CyberCard } from '../ui/CyberCard';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Disc, 
  Radio, 
  AlertCircle,
  Sparkles,
  ListMusic
} from 'lucide-react';

interface MusicPlayerSectionProps {
  tracks: MusicTrack[];
}

export const MusicPlayerSection: React.FC<MusicPlayerSectionProps> = ({ tracks }) => {
  const { theme } = useTheme();
  
  // Filter only public tracks for public viewer
  const publicTracks = tracks.filter(t => t.isPublic !== false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = publicTracks[currentIndex] || null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle track change
  const handleSelectTrack = (index: number) => {
    setCurrentIndex(index);
    setAudioError(null);
    setCurrentTime(0);
    setIsPlaying(true);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => {
          console.warn('Playback blocked or failed:', e);
          setIsPlaying(false);
        });
      }
    }, 50);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    setAudioError(null);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play error:', err);
        setAudioError('Gagal memutar audio. Pastikan URL audio langsung valid dan format MP3/AAC didukung browser.');
        setIsPlaying(false);
      });
    }
  };

  const handlePrev = () => {
    if (publicTracks.length === 0) return;
    const nextIdx = (currentIndex - 1 + publicTracks.length) % publicTracks.length;
    handleSelectTrack(nextIdx);
  };

  const handleNext = () => {
    if (publicTracks.length === 0) return;
    const nextIdx = (currentIndex + 1) % publicTracks.length;
    handleSelectTrack(nextIdx);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <section id="music" className="py-24 relative bg-[#05070d] border-t border-slate-900">
      
      {/* Background radial synth glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-3">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            CYBERPUNK AUDIO TRANSMISSION // SOUND ENGINE
          </div>
          <h2 className="text-3xl sm:text-5xl font-cyber font-black tracking-wider text-white">
            MUSIK <span className={theme.text}>FAVORIT</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-4" />
          <p className="text-slate-400 text-sm mt-3 font-sans">
            Playlist musik fokus, synthwave, dan lofi cyberpunk yang menemani sesi gaming & streaming Syahrul Gunawan.
          </p>
        </div>

        {/* Audio Element Hidden */}
        {currentTrack && (
          <audio
            ref={audioRef}
            src={currentTrack.audioUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
              }
            }}
            onEnded={handleNext}
            onError={() => {
              setAudioError(`Format lagu "${currentTrack.title}" tidak dapat dimuat atau URL tidak valid.`);
              setIsPlaying(false);
            }}
          />
        )}

        {publicTracks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg max-w-md mx-auto">
            <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-cyber text-slate-300">Belum Ada Lagu Dipublikasikan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Admin dapat menambahkan lagu favorit dengan URL audio langsung melalui dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Player Main Console (Left 7 Cols) */}
            <div className="lg:col-span-7">
              <CyberCard highlight={true} glow={true} className="p-6 sm:p-8 space-y-6">
                
                {/* Error Banner */}
                {audioError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{audioError}</span>
                  </div>
                )}

                {/* Track Info & Visualizer */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  
                  {/* Rotating Vinyl/Album Cover */}
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                    <div 
                      className={`w-full h-full rounded-full p-1.5 bg-[#080d1a] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] overflow-hidden ${isPlaying ? 'animate-spin' : ''}`}
                      style={{ animationDuration: '8s' }}
                    >
                      {currentTrack?.coverUrl ? (
                        <img
                          src={currentTrack.coverUrl}
                          alt={currentTrack?.title}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center text-cyan-400">
                          <Disc className="w-14 h-14 animate-pulse" />
                        </div>
                      )}
                      {/* Center spindle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#05070d] border border-cyan-400 flex items-center justify-center">
                        <Disc className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>

                  {/* Track Titles & Equalizer Waves */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      NOW TRANSMITTING // TRACK #{currentIndex + 1}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wide truncate">
                      {currentTrack?.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-sans truncate">
                      {currentTrack?.artist}
                    </p>

                    {/* Animated Neon Audio Equalizer Bars */}
                    <div className="flex items-end gap-1 h-8 pt-2 justify-center sm:justify-start">
                      {[12, 24, 18, 30, 16, 26, 22, 14, 28, 20].map((baseHeight, i) => (
                        <div
                          key={i}
                          className={`w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t transition-all duration-150 ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
                          style={{
                            height: isPlaying ? `${Math.max(6, (baseHeight * (i % 2 === 0 ? 1.2 : 0.8)))}px` : '4px',
                            animationDelay: `${i * 70}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scrubber Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls (Prev, Play/Pause, Next, Volume) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
                  
                  {/* Center Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      className="p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 hover:bg-slate-800 transition-all active:scale-95"
                      title="Lagu Sebelumnya"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-black flex items-center justify-center font-bold shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:brightness-110 active:scale-95 transition-all"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-black" />
                      ) : (
                        <Play className="w-6 h-6 fill-black ml-1" />
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      className="p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 hover:bg-slate-800 transition-all active:scale-95"
                      title="Lagu Berikutnya"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
                    <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                </div>

              </CyberCard>
            </div>

            {/* Playlist Queue (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 font-cyber text-sm font-bold text-white">
                  <ListMusic className="w-4 h-4 text-cyan-400" />
                  <span>PLAYLIST TRACKLIST</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{publicTracks.length} TRACKS</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {publicTracks.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(idx)}
                      className={`
                        p-3 rounded border flex items-center justify-between gap-3 cursor-pointer transition-all
                        ${isCurrent 
                          ? 'bg-cyan-950/60 border-cyan-400/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'}
                      `}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`
                          w-8 h-8 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs
                          ${isCurrent ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400'}
                        `}>
                          {isCurrent && isPlaying ? <Play className="w-3.5 h-3.5 fill-black" /> : idx + 1}
                        </div>
                        <div className="truncate">
                          <div className={`text-xs sm:text-sm font-cyber truncate ${isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                            {track.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate font-sans">
                            {track.artist}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-500 flex-shrink-0">
                        {track.duration || 'LIVE'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Tekan lagu apa saja untuk langsung memainkan. Bebas lag & responsif di mobile.</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
