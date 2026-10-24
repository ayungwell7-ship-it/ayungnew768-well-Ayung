import React, { useState, useMemo } from 'react';
import { PrivateNote, CategoryType } from '../../../types';
import { CyberCard } from '../../ui/CyberCard';
import { CyberButton } from '../../ui/CyberButton';
import { 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  Clock, 
  Smile, 
  Globe, 
  Share2, 
  Tv, 
  Gamepad2, 
  X, 
  ArrowLeft,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2
} from 'lucide-react';

interface WordsNotesVaultProps {
  notes: PrivateNote[];
  onCreate: (item: Omit<PrivateNote, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<PrivateNote>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBackToHub: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const WordsNotesVault: React.FC<WordsNotesVaultProps> = ({
  notes,
  onCreate,
  onUpdate,
  onDelete,
  onBackToHub,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<PrivateNote, 'id'>>({
    title: '',
    content: '',
    category: 'Web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const categories: CategoryType[] = ['Web', 'Sosmed', 'Aplikasi', 'Game'];

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

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchCat = selectedCategory === 'ALL' || n.category === selectedCategory;
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      category: selectedCategory === 'ALL' ? 'Web' : selectedCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PrivateNote) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      onShowToast('Validasi Gagal', 'Harap isi judul dan isi tulisan.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Catatan Diperbarui', 'Kata-kata berhasil disimpan ke Firestore.', 'success');
      } else {
        await onCreate({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        onShowToast('Catatan Ditambahkan', 'Catatan kata-kata baru berhasil disimpan ke Firestore.', 'success');
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus catatan "${title}" secara permanen?`)) return;
    try {
      await onDelete(id);
      onShowToast('Catatan Dihapus', 'Catatan kata-kata berhasil dihapus.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Navigation */}
      <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-2 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Kembali ke Pilihan Catatan"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">😎</span>
              <h2 className="font-cyber font-bold text-white text-base sm:text-lg">
                CATATAN KATA-KATA &amp; INSPIRASI
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Simpan kata-kata motivasi, ide, kutipan, dan catatan tulisan pribadi Anda.
            </p>
          </div>
        </div>

        <CyberButton
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + TAMBAH CATATAN
        </CyberButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded border transition-colors ${selectedCategory === 'ALL' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            SEMUA ({notes.length})
          </button>
          {categories.map((cat) => {
            const count = notes.filter(n => n.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${selectedCategory === cat ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search by Title */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul..."
            className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

      </div>

      {/* Cards Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
          <Smile className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-cyber text-slate-300">Belum Ada Catatan Kata-Kata</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tekan tombol "+ TAMBAH CATATAN" di atas untuk menambahkan kata-kata inspiratif Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <CyberCard
              key={note.id}
              className="p-5 flex flex-col justify-between group hover:border-cyan-400/80 transition-all duration-300"
            >
              <div>
                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1.5 ${getCategoryBadge(note.category)}`}>
                    {getCategoryIcon(note.category)}
                    {note.category}
                  </span>

                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-cyber font-bold text-white text-base group-hover:text-cyan-300 transition-colors mb-2">
                  {note.title}
                </h4>

                {/* Content */}
                <div className="p-3 rounded bg-black/50 border border-slate-800/80 text-slate-300 text-xs sm:text-sm leading-relaxed font-sans italic border-l-2 border-l-cyan-400 whitespace-pre-wrap">
                  "{note.content}"
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  ID: #{note.id.substring(0, 8)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                    title="Edit Catatan"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(note.id, note.title)}
                    className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100 hover:bg-rose-900 transition-colors"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CyberCard>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#090d18] border border-cyan-500/60 rounded-xl p-6 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-cyber font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-lg">😎</span>
              {editingId ? 'EDIT CATATAN KATA-KATA' : 'TAMBAH KATA-KATA BARU'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  JUDUL CATATAN
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Kata-kata hari ini"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  KATEGORI
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`
                        py-2 px-1 rounded border text-center transition-all flex items-center justify-center gap-1
                        ${formData.category === cat 
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                      `}
                    >
                      {getCategoryIcon(cat)}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  ISI TULISAN / KATA-KATA
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Jangan menyerah hanya karena prosesmu lebih lambat daripada orang lain..."
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-900 text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <CyberButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan ke Firestore'}
                </CyberButton>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
