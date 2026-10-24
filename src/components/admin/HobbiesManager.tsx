import React, { useState } from 'react';
import { Hobby } from '../../types';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { 
  Gamepad2, 
  Plus, 
  Pencil, 
  Trash2, 
  Crosshair, 
  Cpu, 
  Headphones, 
  Radio, 
  Flame, 
  Zap, 
  Target, 
  X,
  Code
} from 'lucide-react';

import { ImageUploadField } from '../ui/ImageUploadField';

interface HobbiesManagerProps {
  hobbies: Hobby[];
  onCreate: (item: Omit<Hobby, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<Hobby>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const HobbiesManager: React.FC<HobbiesManagerProps> = ({
  hobbies,
  onCreate,
  onUpdate,
  onDelete,
  onShowToast,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<Hobby, 'id'>>({
    name: '',
    category: 'Competitive Gaming',
    description: '',
    icon: 'Crosshair',
    imageUrl: '',
    order: hobbies.length + 1,
  });

  const iconOptions = ['Crosshair', 'Cpu', 'Headphones', 'Radio', 'Gamepad2', 'Flame', 'Zap', 'Target', 'Code'];

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Esports & Gaming',
      description: '',
      icon: 'Crosshair',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      order: hobbies.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Hobby) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      icon: item.icon,
      imageUrl: item.imageUrl || '',
      order: item.order || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      onShowToast('Validasi Gagal', 'Harap isi nama hobi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
        onShowToast('Hobi Diperbarui', 'Data hobi berhasil disimpan ke Cloud Firestore.', 'success');
      } else {
        await onCreate(formData);
        onShowToast('Hobi Ditambahkan', 'Hobi baru berhasil dibuat di database.', 'success');
      }
      setIsSubmitting(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus hobi "${name}" secara permanen?`)) return;
    try {
      await onDelete(id);
      onShowToast('Hobi Dihapus', 'Hobi telah dihapus dari Cloud Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
            KELOLA HOBI // PASSION LOADOUT
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Total {hobbies.length} hobi & aktivitas gaming terdaftar.
          </p>
        </div>

        <CyberButton
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + TAMBAH HOBI
        </CyberButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hobbies.map((item) => (
          <CyberCard key={item.id} className="p-5 flex flex-col justify-between">
            <div>
              {item.imageUrl && (
                <div className="w-full h-32 rounded bg-slate-950 mb-3 overflow-hidden border border-slate-800">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                  {item.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono">
                  IKON: {item.icon}
                </span>
              </div>

              <h4 className="text-base font-cyber font-bold text-white mb-1.5">
                {item.name}
              </h4>

              <p className="text-slate-400 text-xs line-clamp-3 font-sans">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id, item.name)}
                className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </CyberCard>
        ))}
      </div>

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
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              {editingId ? 'EDIT HOBI GAMER' : 'TAMBAH HOBI BARU'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  NAMA HOBI
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Custom Mechanical Keyboard Modding"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    KATEGORI
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Hardware / Audio / Esports"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    PILIHAN IKON
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-cyan-300 focus:outline-none"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="GAMBAR / THUMBNAIL HOBI"
                  value={formData.imageUrl || ''}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="hobbies"
                  shape="rounded"
                  onShowToast={onShowToast}
                  helperText="Pilih foto aktivitas / gear hobi dari HP atau PC Anda."
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  DESKRIPSI HOBI
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan ketertarikan, detail gear, atau apa yang dipelajari..."
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
