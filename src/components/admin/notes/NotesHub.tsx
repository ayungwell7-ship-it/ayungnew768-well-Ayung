import React, { useState } from 'react';
import { PrivateNote, SecretAccountNote } from '../../../types';
import { CyberCard } from '../../ui/CyberCard';
import { CyberButton } from '../../ui/CyberButton';
import { 
  Smile, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Database 
} from 'lucide-react';
import { WordsNotesVault } from './WordsNotesVault';
import { SecretAccountsVault } from './SecretAccountsVault';

interface NotesHubProps {
  wordsNotes: PrivateNote[];
  secretNotes: SecretAccountNote[];
  onCreateWordsNote: (item: Omit<PrivateNote, 'id'>) => Promise<string>;
  onUpdateWordsNote: (id: string, item: Partial<PrivateNote>) => Promise<void>;
  onDeleteWordsNote: (id: string) => Promise<void>;
  onCreateSecretNote: (item: Omit<SecretAccountNote, 'id'>) => Promise<string>;
  onUpdateSecretNote: (id: string, item: Partial<SecretAccountNote>) => Promise<void>;
  onDeleteSecretNote: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const NotesHub: React.FC<NotesHubProps> = ({
  wordsNotes,
  secretNotes,
  onCreateWordsNote,
  onUpdateWordsNote,
  onDeleteWordsNote,
  onCreateSecretNote,
  onUpdateSecretNote,
  onDeleteSecretNote,
  onShowToast,
}) => {
  // Active sub-choice: 'hub' | 'words' | 'secret'
  const [activeChoice, setActiveChoice] = useState<'hub' | 'words' | 'secret'>('hub');

  if (activeChoice === 'words') {
    return (
      <WordsNotesVault
        notes={wordsNotes}
        onCreate={onCreateWordsNote}
        onUpdate={onUpdateWordsNote}
        onDelete={onDeleteWordsNote}
        onBackToHub={() => setActiveChoice('hub')}
        onShowToast={onShowToast}
      />
    );
  }

  if (activeChoice === 'secret') {
    return (
      <SecretAccountsVault
        notes={secretNotes}
        onCreate={onCreateSecretNote}
        onUpdate={onUpdateSecretNote}
        onDelete={onDeleteSecretNote}
        onBackToHub={() => setActiveChoice('hub')}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-gradient-to-r from-slate-900 via-[#0d1222] to-slate-900 border border-cyan-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>VAULT REPOSITORY // SYAHRUL GUNAWAN</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-cyber font-black text-white tracking-wide">
            PUSAT <span className="text-cyan-400">CATATAN</span> &amp; <span className="text-purple-400">BRANKAS</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 font-sans max-w-2xl">
            Pilih jenis catatan yang ingin Anda kelola. Tersedia ruang untuk kata-kata inspirasi dan brankas kredensial akun dengan enkripsi keamanan tingkat tinggi.
          </p>
        </div>
      </div>

      {/* Two Main Choices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PILIHAN A — CATATAN KATA-KATA 😎 */}
        <CyberCard
          onClick={() => setActiveChoice('words')}
          className="p-6 sm:p-8 flex flex-col justify-between group hover:border-cyan-400/80 cursor-pointer transition-all duration-300"
          highlight={true}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform">
                😎
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                PILIHAN A
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-cyber font-black text-white group-hover:text-cyan-300 transition-colors mb-2">
              CATATAN KATA-KATA
            </h3>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans mb-4">
              Untuk menyimpan kata-kata motivasi, ide kreatif, kutipan turnamen, catatan pribadi, atau tulisan harian Anda.
            </p>

            <div className="p-3 bg-black/50 rounded border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>KATEGORI DUKUNGAN:</span>
                <span className="text-cyan-400">Web, Sosmed, Aplikasi, Game</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>TOTAL TULISAN:</span>
                <span className="text-emerald-400 font-bold">{wordsNotes.length} Catatan</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 font-semibold group-hover:underline">
              Buka Catatan Kata-Kata
            </span>
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </CyberCard>

        {/* PILIHAN B — CATATAN RAHASIA 🔐 */}
        <CyberCard
          onClick={() => setActiveChoice('secret')}
          className="p-6 sm:p-8 flex flex-col justify-between group hover:border-purple-500/80 cursor-pointer transition-all duration-300"
          glow={true}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform">
                🔐
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-600/40 text-xs font-mono font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-400" />
                PILIHAN B (TERKUNCI)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-cyber font-black text-white group-hover:text-purple-300 transition-colors mb-2">
              CATATAN RAHASIA
            </h3>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans mb-4">
              Untuk menyimpan akun Mobile Legends, sosmed, aplikasi, dan website dengan autentikasi password khusus &amp; enkripsi AES-GCM 256.
            </p>

            <div className="p-3 bg-black/50 rounded border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>IDENTITAS &amp; KREDENSIAL:</span>
                <span className="text-purple-400">Gmail / User | Pass / PIN</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>STATUS KEAMANAN:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enkripsi Klien Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-purple-400 font-semibold group-hover:underline">
              Buka Brankas Terproteksi
            </span>
            <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300 group-hover:bg-purple-500 group-hover:text-black transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </CyberCard>

      </div>

    </div>
  );
};
