import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Smartphone, 
  Monitor, 
  X, 
  Check, 
  RefreshCw, 
  Loader2, 
  ExternalLink,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { uploadMediaFile } from '../../services/storageService';
import { CyberButton } from './CyberButton';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string, storagePath?: string) => void;
  folder: 'avatars' | 'achievements' | 'hobbies' | 'covers';
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  helperText?: string;
  shape?: 'circle' | 'rounded';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  folder,
  onShowToast,
  helperText,
  shape = 'rounded',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal / Preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [onlineUrlInput, setOnlineUrlInput] = useState(value || '');

  React.useEffect(() => {
    setOnlineUrlInput(value || '');
  }, [value]);

  // Validate file
  const validateAndSelectFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      onShowToast(
        'Format Foto Tidak Didukung',
        `File ${file.name} bukan format gambar yang valid. Gunakan format JPG, JPEG, PNG, atau WEBP.`,
        'error'
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onShowToast(
        'Ukuran File Terlalu Besar',
        `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas maksimal 10MB.`,
        'error'
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSaveUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const result = await uploadMediaFile(
        selectedFile,
        folder,
        selectedFile.name,
        (progress) => setUploadProgress(progress)
      );

      onChange(result.url, result.storagePath);
      onShowToast(
        'Foto Berhasil Diunggah',
        'Foto profil berhasil diunggah ke Cloudinary dan tersimpan di Cloud Firestore.',
        'success'
      );
      handleCancelPreview();
    } catch (err: any) {
      setIsUploading(false);
      onShowToast(
        'Gagal Mengunggah Foto',
        err.message || 'Terjadi kesalahan saat memproses file ke Cloudinary.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Label and Mode Switch */}
      <div className="flex items-center justify-between">
        <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          {label}
        </label>
        
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-sans flex items-center gap-1"
        >
          {showUrlInput ? '« Gunakan File Lokal' : 'Gunakan URL Online »'}
        </button>
      </div>

      {/* Hidden File Input supporting Mobile Gallery/Camera & PC */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Current Photo Preview Card + Upload Trigger Button */}
      <div className="p-3 bg-[#050811] rounded-lg border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-center gap-4">
        
        {/* Thumbnail Preview */}
        <div className={`relative w-20 h-20 ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border-2 border-cyan-500/50 bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]`}>
          {value ? (
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80';
              }}
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-600" />
          )}
          {value && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={handleOpenPicker}>
              <RefreshCw className="w-5 h-5 text-cyan-400" />
            </div>
          )}
        </div>

        {/* Buttons / Input Area */}
        <div className="flex-1 w-full space-y-2">
          {!showUrlInput ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleOpenPicker}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-950/80 via-[#0e223d] to-purple-950/80 hover:from-cyan-900/90 hover:to-purple-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-cyber font-bold tracking-wider text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-4 h-4 sm:hidden" />
                  <Monitor className="w-4 h-4 hidden sm:inline-block" />
                  <Upload className="w-4 h-4" />
                </div>
                <span>PILIH FOTO DARI PERANGKAT</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Dukung: JPG, PNG, WEBP (Maks. 10MB)</span>
                {value && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Foto Aktif
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={onlineUrlInput}
                  onChange={(e) => setOnlineUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (onlineUrlInput.trim()) {
                        onChange(onlineUrlInput.trim());
                      }
                    }
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 bg-[#03060d] border border-cyan-500/40 focus:border-cyan-400 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onlineUrlInput.trim()) {
                      onChange(onlineUrlInput.trim());
                    }
                  }}
                  className="px-3 py-2 rounded bg-cyan-950 border border-cyan-500/60 text-cyan-300 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Masukkan URL gambar online permanen yang langsung disinkronkan ke Cloud Firestore.
              </p>
            </div>
          )}

          {helperText && (
            <p className="text-[10px] text-slate-400 font-sans">
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Confirmation & Upload Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#090d18] border border-cyan-500 rounded-xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] font-mono text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-cyber font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>PREVIEW &amp; KONFIRMASI FOTO</span>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  className="p-1 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Preview Box */}
            <div className="space-y-4">
              <div className="w-full h-56 rounded-lg overflow-hidden border border-cyan-500/60 bg-black flex items-center justify-center relative shadow-inner">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Nama File:</span>
                    <span className="truncate max-w-[200px] text-white font-semibold">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Ukuran:</span>
                    <span className="text-cyan-300">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Tipe Format:</span>
                    <span className="text-purple-300 uppercase">{selectedFile.type.replace('image/', '') || 'IMAGE'}</span>
                  </div>
                </div>
              )}

              {/* Upload Progress Bar if Uploading */}
              {isUploading && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-slate-300 text-xs">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengunggah ke Cloudinary (Paket Gratis)...
                    </span>
                    <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-cyan-900">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: Ganti Foto, Simpan, Batal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleCancelPreview}
                  className="px-3 py-2 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleOpenPicker}
                  className="px-3 py-2 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti Foto</span>
                </button>

                <CyberButton
                  type="button"
                  variant="primary"
                  disabled={isUploading}
                  onClick={handleSaveUpload}
                  icon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-black" />}
                >
                  {isUploading ? 'Mengunggah...' : 'Simpan Foto'}
                </CyberButton>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
