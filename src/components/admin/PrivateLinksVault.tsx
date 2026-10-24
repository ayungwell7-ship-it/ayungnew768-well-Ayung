import React, { useState, useMemo } from 'react';
import { PrivateLink, CategoryType } from '../../types';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  Link2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Filter, 
  ArrowUpDown, 
  Globe, 
  Share2, 
  Tv, 
  Gamepad2, 
  X,
  Sparkles
} from 'lucide-react';

interface PrivateLinksVaultProps {
  links: PrivateLink[];
  onCreate: (item: Omit<PrivateLink, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<PrivateLink>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export const PrivateLinksVault: React.FC<PrivateLinksVaultProps> = ({
  links,
  onCreate,
  onUpdate,
  onDelete,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<PrivateLink, 'id'>>({
    name: '',
    url: '',
    description: '',
    category: 'Game',
    icon: 'Gamepad2',
    tags: [],
    createdAt: new Date().toISOString(),
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
      case 'Game': return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'Sosmed': return <Share2 className="w-4 h-4 text-cyan-400" />;
      case 'Aplikasi': return <Tv className="w-4 h-4 text-blue-400" />;
      case 'Web': return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        const matchesCategory = selectedCategory === 'ALL' || link.category === selectedCategory;
        const matchesSearch = 
          link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.url.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          const comp = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? comp : -comp;
        } else {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }
      });
  }, [links, selectedCategory, searchQuery, sortBy, sortOrder]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onShowToast('Tautan Disalin', url, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      url: 'https://',
      description: '',
      category: 'Web',
      icon: 'Globe',
      tags: [],
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PrivateLink) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      url: item.url,
      description: item.description,
      category: item.category,
      icon: item.icon || 'Globe',
      tags: item.tags || [],
      createdAt: item.createdAt,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      onShowToast('Validasi Gagal', 'Harap isi nama dan URL website.', 'error');
      return;
    }

    // Basic URL sanitize
    let validUrl = formData.url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, { ...formData, url: validUrl });
        onShowToast('Link Diperbarui', 'Tautan rahasia berhasil disimpan.', 'success');
      } else {
        await onCreate({ ...formData, url: validUrl });
        onShowToast('Link Ditambahkan', 'Tautan rahasia baru berhasil disimpan di brankas Firestore.', 'success');
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus tautan rahasia "${name}" dari brankas Firestore?`)) return;
    try {
      await onDelete(id);
      onShowToast('Link Dihapus', 'Tautan telah dihapus dari brankas.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner with Strict Privacy Notice */}
      <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cyber font-bold text-white text-base sm:text-lg">
                KOLEKSI WEBSITE // PRIVATE VAULT
              </h2>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-600/40 text-[10px] font-mono font-bold">
                KHUSUS ADMIN
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Tautan penting & bookmark pribadi ini dienkripsi dan tersembunyi dari pengunjung biasa.
            </p>
          </div>
        </div>

        <CyberButton
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + TAMBAH LINK
        </CyberButton>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
        
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded border transition-colors ${selectedCategory === 'ALL' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            SEMUA ({links.length})
          </button>
          {categories.map((cat) => {
            const count = links.filter(l => l.category === cat).length;
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

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tautan..."
              className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (sortBy === 'date') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('date');
              }
            }}
            className={`p-2 rounded border transition-colors ${sortBy === 'date' ? 'bg-slate-800 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            title="Urutkan Tanggal"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
          <Link2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-cyber text-slate-300">Tidak Ada Link Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan tombol "+ TAMBAH LINK" di atas untuk menyimpan tautan penting Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <CyberCard
              key={link.id}
              className="p-5 flex flex-col justify-between group hover:border-cyan-500/70 transition-all duration-300"
            >
              <div>
                {/* Category & Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1.5 ${getCategoryBadge(link.category)}`}>
                    {getCategoryIcon(link.category)}
                    {link.category}
                  </span>

                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-cyber font-bold text-white text-base group-hover:text-cyan-300 transition-colors mb-1.5 truncate">
                  {link.name}
                </h4>

                {/* URL preview */}
                <div className="text-xs font-mono text-cyan-400 truncate mb-2 opacity-80 group-hover:opacity-100">
                  {link.url}
                </div>

                {/* Description */}
                <p className="text-slate-400 text-xs line-clamp-2 font-sans mb-3">
                  {link.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>

              {/* Bottom Actions: Open Link, Copy, Edit, Delete */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                
                {/* Direct Open in new tab with protection */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>BUKA LINK</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(link.url, link.id)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    title="Salin URL"
                  >
                    {copiedId === link.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(link)}
                    className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400"
                    title="Edit Link"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(link.id, link.name)}
                    className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100"
                    title="Hapus Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
              <Lock className="w-5 h-5 text-rose-400" />
              {editingId ? 'EDIT LINK RAHASIA' : 'TAMBAH LINK BARU'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  NAMA WEBSITE / LAYANAN
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Steam Community Market Tracker"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  URL WEBSITE
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://steamcommunity.com"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-300 focus:outline-none"
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
                        py-2 px-1 rounded border text-center transition-all
                        ${formData.category === cat 
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  DESKRIPSI SINGKAT / KEGUNAAN
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Catatan mengenai akun, kegunaan link, atau panduan akses..."
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans"
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan ke Brankas'}
                </CyberButton>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
