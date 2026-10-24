import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PrivateNote, CategoryType } from '../../types';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  Save, 
  Clock, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Globe, 
  Share2, 
  Tv, 
  Gamepad2, 
  X,
  Sparkles,
  ChevronLeft
} from 'lucide-react';

interface PrivateNotesVaultProps {
  notes: PrivateNote[];
  onCreate: (item: Omit<PrivateNote, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<PrivateNote>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const PrivateNotesVault: React.FC<PrivateNotesVaultProps> = ({
  notes,
  onCreate,
  onUpdate,
  onDelete,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);

  // Editor states
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCategory, setEditorCategory] = useState<CategoryType>('Game');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories: CategoryType[] = ['Web', 'Sosmed', 'Aplikasi', 'Game'];

  // Current active note
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Sync editor when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditorTitle(activeNote.title);
      setEditorContent(activeNote.content);
      setEditorCategory(activeNote.category);
      setAutoSaveStatus('saved');
    }
  }, [activeNoteId]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = selectedCategory === 'ALL' || n.category === selectedCategory;
      const matchSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const getCategoryBadge = (cat: CategoryType) => {
    switch (cat) {
      case 'Game': return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'Sosmed': return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'Aplikasi': return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'Web': return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Game': return <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'Sosmed': return <Share2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Aplikasi': return <Tv className="w-3.5 h-3.5 text-blue-400" />;
      case 'Web': return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleCreateNewNote = async () => {
    const newNoteData = {
      title: 'Catatan Baru Tanpa Judul',
      content: 'Mulai ketikkan ide, taktik match, atau catatan pribadi di sini...',
      category: selectedCategory === 'ALL' ? 'Game' : selectedCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const newId = await onCreate(newNoteData);
      setActiveNoteId(newId);
      onShowToast('Catatan Dibuat', 'Catatan baru telah dibuat dan disinkronkan ke Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Membuat Catatan', err.message, 'error');
    }
  };

  // Auto-save trigger
  const triggerAutoSave = (title: string, content: string, category: CategoryType) => {
    if (!activeNoteId) return;
    setAutoSaveStatus('unsaved');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await onUpdate(activeNoteId, {
          title,
          content,
          category,
          updatedAt: new Date().toISOString(),
        });
        setAutoSaveStatus('saved');
      } catch (e) {
        setAutoSaveStatus('unsaved');
      }
    }, 1200);
  };

  const handleTitleChange = (val: string) => {
    setEditorTitle(val);
    triggerAutoSave(val, editorContent, editorCategory);
  };

  const handleContentChange = (val: string) => {
    setEditorContent(val);
    triggerAutoSave(editorTitle, val, editorCategory);
  };

  const handleCategoryChange = (val: CategoryType) => {
    setEditorCategory(val);
    triggerAutoSave(editorTitle, editorContent, val);
  };

  const handleManualSave = async () => {
    if (!activeNoteId) return;
    setAutoSaveStatus('saving');
    try {
      await onUpdate(activeNoteId, {
        title: editorTitle,
        content: editorContent,
        category: editorCategory,
        updatedAt: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      onShowToast('Catatan Disimpan', 'Tersimpan aman di Cloud Firestore.', 'success');
    } catch (err: any) {
      setAutoSaveStatus('unsaved');
      onShowToast('Gagal Menyimpan', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus catatan rahasia "${title}" secara permanen?`)) return;
    try {
      await onDelete(id);
      if (activeNoteId === id) {
        const remaining = notes.filter(n => n.id !== id);
        setActiveNoteId(remaining[0]?.id || null);
      }
      onShowToast('Catatan Dihapus', 'Catatan telah dihapus dari Cloud Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner with Strict Privacy Notice */}
      <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cyber font-bold text-white text-base sm:text-lg">
                CATATAN PRIBADI // PRIVATE JOURNAL & STRATS
              </h2>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-600/40 text-[10px] font-mono font-bold">
                KHUSUS ADMIN
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Ide turnamen, setup overclock, taktik rotasi, dan catatan rahasia. Dilengkapi fitur Auto-Save ke Firestore.
            </p>
          </div>
        </div>

        <CyberButton
          onClick={handleCreateNewNote}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + CATATAN BARU
        </CyberButton>
      </div>

      {/* Main Dual-Pane Notes Interface (Comfortable on both Mobile and Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Notes List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Filters & Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dalam catatan..."
                className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-1 font-mono text-[11px]">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2 py-1 rounded border ${selectedCategory === 'ALL' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                ALL
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 ${selectedCategory === cat ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes List Scrollable */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded text-slate-500 text-xs font-mono">
                Tidak ada catatan dalam kategori ini.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`
                      p-3 rounded border cursor-pointer transition-all
                      ${isActive 
                        ? 'bg-slate-850 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)] text-white' 
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 ${getCategoryBadge(note.category)}`}>
                        {getCategoryIcon(note.category)}
                        {note.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="font-cyber font-bold text-xs sm:text-sm truncate mb-1">
                      {note.title || 'Tanpa Judul'}
                    </h4>

                    <p className="text-slate-400 text-xs line-clamp-2 font-sans">
                      {note.content || 'Catatan kosong...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Comfortable Note Editor (8 Cols) */}
        <div className="lg:col-span-8">
          {activeNote ? (
            <CyberCard className="p-5 sm:p-6 space-y-4">
              
              {/* Top Editor Bar: Auto-Save Status, Category, Manual Save, Delete */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">KATEGORI:</span>
                  <div className="flex items-center gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`
                          px-2 py-1 rounded text-[11px] font-mono border transition-all
                          ${editorCategory === cat 
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                        `}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  {/* Auto Save Status Indicator */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {autoSaveStatus === 'saving' && (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        Menyimpan...
                      </span>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tersimpan di Cloud
                      </span>
                    )}
                    {autoSaveStatus === 'unsaved' && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Perubahan belum disimpan
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleManualSave}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400"
                    title="Simpan Sekarang"
                  >
                    <Save className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(activeNote.id, activeNote.title)}
                    className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100"
                    title="Hapus Catatan Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Judul Catatan..."
                  className="w-full bg-transparent font-cyber font-bold text-lg sm:text-2xl text-white placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-cyan-500/40 pb-2 transition-colors"
                />
              </div>

              {/* Content Textarea with Comfortable Height & Font */}
              <div>
                <textarea
                  rows={14}
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Ketikkan isi catatan lengkap Anda di sini..."
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-mono leading-relaxed resize-y"
                />
              </div>

              {/* Metadata Footer */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                <div>
                  ID: {activeNote.id}
                </div>
                <div className="flex items-center gap-3">
                  <span>Dibuat: {new Date(activeNote.createdAt).toLocaleString('id-ID')}</span>
                  {activeNote.updatedAt && (
                    <span>Diupdate: {new Date(activeNote.updatedAt).toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>

            </CyberCard>
          ) : (
            <div className="p-16 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-lg">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-cyber text-slate-300">Pilih atau Buat Catatan</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Pilih salah satu catatan di sisi kiri atau buat catatan baru.
              </p>
              <CyberButton onClick={handleCreateNewNote} variant="primary" size="sm">
                + BUAT CATATAN BARU
              </CyberButton>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
