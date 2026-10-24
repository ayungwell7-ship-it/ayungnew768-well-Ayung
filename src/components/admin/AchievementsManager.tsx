import React, { useState } from 'react';
import { Achievement } from '../../types';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  Trophy, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  Gamepad2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { ImageUploadField } from '../ui/ImageUploadField';

interface AchievementsManagerProps {
  achievements: Achievement[];
  onCreate: (item: Omit<Achievement, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<Achievement>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AchievementsManager: React.FC<AchievementsManagerProps> = ({
  achievements,
  onCreate,
  onUpdate,
  onDelete,
  onShowToast,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<Achievement, 'id'>>({
    title: '',
    gameOrEvent: '',
    description: '',
    date: '',
    badge: 'CHAMPION',
    imageUrl: '',
    order: achievements.length + 1,
    highlighted: true,
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      gameOrEvent: 'Valorant / MLBB',
      description: '',
      date: 'Oktober 2024',
      badge: 'CHAMPION // MVP',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      order: achievements.length + 1,
      highlighted: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Achievement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      gameOrEvent: item.gameOrEvent,
      description: item.description,
      date: item.date,
      badge: item.badge,
      imageUrl: item.imageUrl || '',
      order: item.order || 1,
      highlighted: item.highlighted ?? false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.gameOrEvent) {
      onShowToast('Validasi Gagal', 'Harap isi judul prestasi dan nama turnamen/game.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
        onShowToast('Prestasi Diperbarui', 'Data prestasi berhasil disimpan ke Cloud Firestore.', 'success');
      } else {
        await onCreate(formData);
        onShowToast('Prestasi Ditambahkan', 'Prestasi baru berhasil dibuat di database.', 'success');
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus prestasi "${title}" secara permanen dari database?`)) return;

    try {
      await onDelete(id);
      onShowToast('Prestasi Dihapus', 'Prestasi telah dihapus dari Cloud Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  const handleMoveOrder = async (item: Achievement, direction: 'up' | 'down') => {
    const currentOrder = item.order || 0;
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    await onUpdate(item.id, { order: newOrder });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wider flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            KELOLA PRESTASI // HALL OF FAME
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Total {achievements.length} pencapaian turnamen tersimpan di database.
          </p>
        </div>

        <CyberButton
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + TAMBAH PRESTASI
        </CyberButton>
      </div>

      {/* Achievements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((item, idx) => (
          <CyberCard key={item.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-xs font-cyber font-bold">
                  {item.badge}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {item.date}
                </span>
              </div>

              {item.imageUrl && (
                <div className="w-full h-32 rounded bg-slate-950 mb-3 overflow-hidden border border-slate-800">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                {item.gameOrEvent}
              </div>

              <h4 className="text-base font-cyber font-bold text-white mb-2">
                {item.title}
              </h4>

              <p className="text-slate-400 text-xs line-clamp-3 font-sans">
                {item.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                <span>URUTAN: #{item.order}</span>
                <button
                  onClick={() => handleMoveOrder(item, 'up')}
                  className="p-1 hover:text-cyan-400 rounded"
                  title="Pindah ke Atas"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveOrder(item, 'down')}
                  className="p-1 hover:text-cyan-400 rounded"
                  title="Pindah ke Bawah"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                  title="Edit Prestasi"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100 hover:bg-rose-900 transition-colors"
                  title="Hapus Prestasi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CyberCard>
        ))}
      </div>

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
              <Trophy className="w-5 h-5 text-yellow-400" />
              {editingId ? 'EDIT PRESTASI GAMER' : 'TAMBAH PRESTASI BARU'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  NAMA PRESTASI / JUARA
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Juara 1 Valorant National Cup"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    GAME / EVENT
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.gameOrEvent}
                    onChange={(e) => setFormData({ ...formData, gameOrEvent: e.target.value })}
                    placeholder="Valorant / Apex Legends"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    TANGGAL / PERIODE
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Desember 2024"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    BADGE // TINGKAT
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="CHAMPION // MVP"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-yellow-300 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    URUTAN PRIORITAS
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="FOTO / SCREENSHOT BUKTI PRESTASI"
                  value={formData.imageUrl || ''}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="achievements"
                  shape="rounded"
                  onShowToast={onShowToast}
                  helperText="Pilih foto bukti piala / sertifikat / victory screen langsung dari galeri HP atau PC."
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  DESKRIPSI LENGKAP PENCAPAIAN
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan performa match, KDA, clutch momen, atau jumlah tim kompetitor..."
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="highlighted"
                  checked={formData.highlighted}
                  onChange={(e) => setFormData({ ...formData, highlighted: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <label htmlFor="highlighted" className="text-slate-300 cursor-pointer">
                  Tandai sebagai Prestasi Unggulan (Efek Neon Glow di Halaman Depan)
                </label>
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
