import React, { useState, useRef } from 'react';
import { MusicTrack } from '../../types';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { ImageUploadField } from '../ui/ImageUploadField';
import { uploadMediaFile, getMediaDuration, extractAudioFromVideo } from '../../services/storageService';
import { 
  Music, 
  Plus, 
  Pencil, 
  Trash2, 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  Disc,
  ArrowUp,
  ArrowDown,
  Volume2,
  Upload,
  Link as LinkIcon,
  Smartphone,
  Monitor,
  Loader2,
  CheckCircle2,
  FileAudio,
  Film,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface MusicManagerProps {
  tracks: MusicTrack[];
  onCreate: (item: Omit<MusicTrack, 'id'>) => Promise<string>;
  onUpdate: (id: string, item: Partial<MusicTrack>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MusicManager: React.FC<MusicManagerProps> = ({
  tracks,
  onCreate,
  onUpdate,
  onDelete,
  onShowToast,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab mode in modal: 'local_file' | 'url'
  const [inputMode, setInputMode] = useState<'local_file' | 'url'>('local_file');

  // Local file upload states
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [localAudioPreviewUrl, setLocalAudioPreviewUrl] = useState<string | null>(null);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Live Audio Preview Testing state (both in table and in modal)
  const [testTrackUrl, setTestTrackUrl] = useState<string | null>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const [formData, setFormData] = useState<Omit<MusicTrack, 'id'>>({
    title: '',
    artist: '',
    audioUrl: '',
    coverUrl: '',
    duration: '',
    isPublic: true,
    order: tracks.length + 1,
  });

  const [urlWarning, setUrlWarning] = useState<string | null>(null);

  // Clean filename to human title
  const cleanTitleFromFileName = (fileName: string): string => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    return withoutExt
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setInputMode('local_file');
    setSelectedAudioFile(null);
    if (localAudioPreviewUrl && localAudioPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localAudioPreviewUrl);
    }
    setLocalAudioPreviewUrl(null);
    setIsVideoFile(false);
    setUploadProgress(0);

    setFormData({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
      duration: '',
      isPublic: true,
      order: tracks.length + 1,
    });
    setUrlWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MusicTrack) => {
    setEditingId(item.id);
    setInputMode('url');
    setSelectedAudioFile(null);
    if (localAudioPreviewUrl && localAudioPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localAudioPreviewUrl);
    }
    setLocalAudioPreviewUrl(null);
    setIsVideoFile(false);
    setUploadProgress(0);

    setFormData({
      title: item.title,
      artist: item.artist,
      audioUrl: item.audioUrl,
      coverUrl: item.coverUrl || '',
      duration: item.duration || '03:00',
      isPublic: item.isPublic,
      order: item.order || 1,
    });
    setUrlWarning(null);
    setIsModalOpen(true);
  };

  // Handle local audio file selection
  const handleSelectAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check valid audio or video format
    const isVideo = file.type.startsWith('video/') || !!file.name.match(/\.(mp4|webm|mov)$/i);
    const isAudio = file.type.startsWith('audio/') || !!file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i);

    if (!isAudio && !isVideo) {
      onShowToast(
        'Format Tidak Didukung',
        'Gunakan format file audio (MP3, WAV, OGG, M4A, AAC) atau video musik (MP4, WebM).',
        'error'
      );
      return;
    }

    const maxSize = 60 * 1024 * 1024; // 60MB
    if (file.size > maxSize) {
      onShowToast(
        'Ukuran File Terlalu Besar',
        `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas maksimal 60MB.`,
        'error'
      );
      return;
    }

    setSelectedAudioFile(file);
    setIsVideoFile(isVideo);

    // Auto-generate title if currently empty or default
    const autoTitle = cleanTitleFromFileName(file.name);
    setFormData(prev => ({
      ...prev,
      title: prev.title.trim() === '' ? autoTitle : prev.title,
    }));

    // Create object URL for instant preview testing
    const blobUrl = URL.createObjectURL(file);
    setLocalAudioPreviewUrl(blobUrl);

    // Read media duration automatically
    try {
      const dur = await getMediaDuration(file, isVideo);
      if (dur && dur !== '00:00') {
        setFormData(prev => ({ ...prev, duration: dur }));
      }
    } catch (err) {
      console.warn('Could not read duration', err);
    }

    onShowToast(
      'File Audio Dipilih',
      `${file.name} siap diuji dan diunggah.`,
      'info'
    );
  };

  const handleAudioUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, audioUrl: url }));
    
    // Validate if user enters YouTube or Spotify normal web link
    if (url.includes('youtube.com/watch') || url.includes('youtu.be') || url.includes('open.spotify.com/track')) {
      setUrlWarning('Peringatan: Link halaman web YouTube/Spotify bukan URL file audio stream langsung (.mp3/.aac). Masukkan direct audio link atau unggah file langsung dari perangkat.');
    } else {
      setUrlWarning(null);
    }
  };

  const handleTestAudio = (url: string) => {
    if (!url) return;
    if (testTrackUrl === url && isTestPlaying) {
      testAudioRef.current?.pause();
      setIsTestPlaying(false);
    } else {
      setTestTrackUrl(url);
      setIsTestPlaying(true);
      setTimeout(() => {
        if (testAudioRef.current) {
          testAudioRef.current.currentTime = 0;
          testAudioRef.current.play().catch(err => {
            onShowToast('Gagal Memutar Audio', 'URL audio tidak dapat diakses atau bukan file audio yang valid.', 'error');
            setIsTestPlaying(false);
          });
        }
      }, 50);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      onShowToast('Validasi Gagal', 'Harap isi judul lagu.', 'error');
      return;
    }

    // Check if user selected a local file or provided a URL
    if (inputMode === 'local_file' && !selectedAudioFile && !formData.audioUrl) {
      onShowToast('Validasi Gagal', 'Harap pilih file audio dari perangkat Anda terlebih dahulu.', 'error');
      return;
    }

    if (inputMode === 'url' && !formData.audioUrl.trim()) {
      onShowToast('Validasi Gagal', 'Harap isi URL audio langsung.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAudioUrl = formData.audioUrl;

      // If user selected a local file, upload it first
      if (selectedAudioFile) {
        setUploadProgress(15);

        // If it's a video file, we can optionally extract the audio track into a WAV blob
        let fileToUpload: File | Blob = selectedAudioFile;
        if (isVideoFile) {
          try {
            onShowToast('Memproses Video', 'Mengekstrak audio stream dari video...', 'info');
            const extracted = await extractAudioFromVideo(selectedAudioFile, (p) => setUploadProgress(Math.round(p * 0.4)));
            fileToUpload = extracted.audioBlob;
            if (extracted.durationFormatted) {
              formData.duration = extracted.durationFormatted;
            }
          } catch (extractErr) {
            console.warn('Direct audio extraction skipped, uploading raw file:', extractErr);
          }
        }

        const uploadRes = await uploadMediaFile(
          fileToUpload,
          'audio',
          selectedAudioFile.name,
          (percent) => setUploadProgress(Math.max(20, percent))
        );

        finalAudioUrl = uploadRes.url;
      }

      const submissionData: Omit<MusicTrack, 'id'> = {
        ...formData,
        audioUrl: finalAudioUrl,
        title: formData.title.trim(),
        artist: formData.artist.trim() || 'Syahrul Gunawan',
      };

      if (editingId) {
        await onUpdate(editingId, submissionData);
        onShowToast('Lagu Diperbarui', `Lagu "${formData.title}" berhasil diperbarui di Cloud Firestore.`, 'success');
      } else {
        await onCreate(submissionData);
        onShowToast('Lagu Ditambahkan', `Lagu "${formData.title}" berhasil disimpan ke playlist!`, 'success');
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      if (isTestPlaying) {
        testAudioRef.current?.pause();
        setIsTestPlaying(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('Gagal Menyimpan Lagu', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus lagu "${title}" dari playlist?`)) return;
    try {
      await onDelete(id);
      onShowToast('Lagu Dihapus', 'Lagu telah dihapus dari Cloud Firestore.', 'success');
    } catch (err: any) {
      onShowToast('Gagal Menghapus', err.message, 'error');
    }
  };

  const togglePublic = async (track: MusicTrack) => {
    await onUpdate(track.id, { isPublic: !track.isPublic });
    onShowToast('Visibilitas Diubah', `Lagu sekarang ${!track.isPublic ? 'Tampil di Pemutar Publik' : 'Disembunyikan'}`, 'success');
  };

  const moveOrder = async (track: MusicTrack, direction: 'up' | 'down') => {
    const currentOrder = track.order || 1;
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    await onUpdate(track.id, { order: newOrder });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hidden test audio element */}
      {testTrackUrl && (
        <audio
          ref={testAudioRef}
          src={testTrackUrl}
          onEnded={() => setIsTestPlaying(false)}
          onError={() => {
            setIsTestPlaying(false);
            onShowToast('Audio Error', 'File audio tidak dapat diputar. Pastikan format didukung browser.', 'error');
          }}
        />
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wider flex items-center gap-2">
            <Music className="w-6 h-6 text-cyan-400" />
            KELOLA MUSIK // PLAYLIST TRANSMISSION
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Total {tracks.length} track lagu. Unggah file musik langsung dari HP/PC atau gunakan URL online.
          </p>
        </div>

        <CyberButton
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 text-black" />}
        >
          + TAMBAH LAGU
        </CyberButton>
      </div>

      {/* Tracks List Table/Cards */}
      <div className="space-y-3">
        {tracks.map((track) => (
          <CyberCard
            key={track.id}
            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-cyan-500/50 flex-shrink-0 bg-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <img
                  src={track.coverUrl || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80'}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-cyber font-bold text-white text-sm sm:text-base">
                    {track.title}
                  </h4>
                  {track.isPublic ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                      PUBLIK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                      DRAF
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Artis: {track.artist} | Durasi: {track.duration || '03:00'}
                </div>
              </div>
            </div>

            {/* Actions: Re-order, Test Play, Toggle Public, Edit, Delete */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              
              {/* Order Controls */}
              <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
                <button
                  type="button"
                  onClick={() => moveOrder(track, 'up')}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                  title="Naikkan Urutan"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrder(track, 'down')}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                  title="Turunkan Urutan"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestAudio(track.audioUrl)}
                className={`
                  px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border transition-all
                  ${testTrackUrl === track.audioUrl && isTestPlaying
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-slate-900 text-cyan-300 border-slate-700 hover:border-cyan-400'}
                `}
                title="Uji Pemutaran Audio"
              >
                {testTrackUrl === track.audioUrl && isTestPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-black" />
                    <span>HENTIKAN</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-cyan-400" />
                    <span>TES AUDIO</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => togglePublic(track)}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                title={track.isPublic ? 'Sembunyikan dari Publik' : 'Tampilkan di Publik'}
              >
                {track.isPublic ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              </button>

              <button
                onClick={() => handleOpenEdit(track)}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400"
                title="Edit Lagu"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(track.id, track.title)}
                className="p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:text-rose-100"
                title="Hapus Lagu"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </CyberCard>
        ))}
      </div>

      {/* Add / Edit Track Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#090d18] border border-cyan-500/70 rounded-xl p-6 shadow-[0_0_35px_rgba(6,182,212,0.25)] font-mono text-xs max-h-[92vh] overflow-y-auto">
            
            <button
              onClick={() => {
                setIsModalOpen(false);
                if (isTestPlaying) {
                  testAudioRef.current?.pause();
                  setIsTestPlaying(false);
                }
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-cyber font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              {editingId ? 'EDIT INFORMASI LAGU' : 'TAMBAH LAGU KE PLAYLIST'}
            </h3>

            {/* Mode Switch Tabs: Upload File vs URL */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setInputMode('local_file')}
                className={`
                  py-2 px-3 rounded text-xs font-cyber font-bold flex items-center justify-center gap-2 transition-all
                  ${inputMode === 'local_file'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'}
                `}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>PILIHAN A: FILE DARI HP/PC</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`
                  py-2 px-3 rounded text-xs font-cyber font-bold flex items-center justify-center gap-2 transition-all
                  ${inputMode === 'url'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'}
                `}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>PILIHAN B: URL AUDIO</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Option A: Local File Selection */}
              {inputMode === 'local_file' && (
                <div className="p-4 rounded-lg bg-[#050812] border border-cyan-500/40 space-y-3">
                  <input
                    type="file"
                    ref={audioFileInputRef}
                    onChange={handleSelectAudioFile}
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/*,video/mp4,video/webm,video/*"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="w-full sm:w-auto flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-950 via-[#0e2747] to-purple-950 hover:from-cyan-900 hover:to-purple-900 border border-cyan-400 text-cyan-300 font-cyber font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer group"
                    >
                      <Smartphone className="w-4 h-4 sm:hidden text-cyan-400" />
                      <Monitor className="w-4 h-4 hidden sm:inline-block text-cyan-400" />
                      <FileAudio className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span>PILIH FILE AUDIO</span>
                    </button>

                    {selectedAudioFile && (
                      <button
                        type="button"
                        onClick={() => audioFileInputRef.current?.click()}
                        className="py-2 px-3 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ganti File</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans">
                    Format didukung: <strong>MP3, M4A, AAC, WAV, OGG</strong> dan video musik (<strong>MP4, WebM</strong>). Maksimal 60MB.
                  </p>

                  {/* Selected File Details & Preview */}
                  {selectedAudioFile && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-cyan-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-300 font-semibold truncate max-w-[280px]">
                          {isVideoFile ? <Film className="w-4 h-4 text-purple-400 flex-shrink-0" /> : <FileAudio className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                          <span className="truncate">{selectedAudioFile.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {(selectedAudioFile.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      {isVideoFile && (
                        <div className="p-1.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-200 text-[10px] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                          <span>Video terdeteksi. Sistem akan otomatis mengekstrak &amp; memutar audio stream-nya.</span>
                        </div>
                      )}

                      {/* Live Audio Preview before upload */}
                      {localAudioPreviewUrl && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Preview Pemutaran:</span>
                          <button
                            type="button"
                            onClick={() => handleTestAudio(localAudioPreviewUrl)}
                            className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-900 flex items-center gap-1.5"
                          >
                            {testTrackUrl === localAudioPreviewUrl && isTestPlaying ? (
                              <>
                                <Pause className="w-3 h-3 fill-cyan-300" />
                                <span>Hentikan Preview</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-cyan-300" />
                                <span>Putar Preview</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Progress Indicator */}
                  {isSubmitting && selectedAudioFile && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-slate-300 text-xs">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Mengunggah file ke Firebase Storage...
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
                </div>
              )}

              {/* Option B: Direct URL Input */}
              {inputMode === 'url' && (
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    URL AUDIO LANGSUNG (DIRECT MP3 / STREAM / FIREBASE)
                  </label>
                  <input
                    type="url"
                    value={formData.audioUrl}
                    onChange={(e) => handleAudioUrlChange(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  
                  {urlWarning && (
                    <div className="mt-2 p-2.5 bg-amber-950/80 border border-amber-500/50 rounded text-amber-200 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{urlWarning}</span>
                    </div>
                  )}

                  {formData.audioUrl && (
                    <div className="mt-2 p-2.5 bg-slate-950 rounded border border-cyan-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300">Uji URL Audio:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestAudio(formData.audioUrl)}
                        className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-900"
                      >
                        {testTrackUrl === formData.audioUrl && isTestPlaying ? 'Hentikan' : 'Putar Audio'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Title & Artist & Duration */}
              <div>
                <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                  JUDUL LAGU
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Neon Cyber Overdrive"
                  className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    NAMA PENYANYI / ARTIS
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    placeholder="Syahrul Gunawan"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 uppercase tracking-wider">
                    DURASI (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="03:20"
                    className="w-full bg-[#05070d] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Cover Photo Upload using ImageUploadField */}
              <div>
                <ImageUploadField
                  label="COVER GAMBAR LAGU"
                  value={formData.coverUrl || ''}
                  onChange={(url) => setFormData({ ...formData, coverUrl: url })}
                  folder="covers"
                  shape="rounded"
                  onShowToast={onShowToast}
                  helperText="Pilih cover gambar lagu dari galeri perangkat atau masukkan URL gambar."
                />
              </div>

              {/* Visibility Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <label htmlFor="isPublic" className="text-slate-300 cursor-pointer">
                  Tampilkan lagu ini di pemutar musik halaman publik pengunjung
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Batal
                </button>
                <CyberButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-black" />}
                >
                  {isSubmitting ? (uploadProgress > 0 ? `Mengunggah ${uploadProgress}%...` : 'Menyimpan...') : 'Upload dan Simpan Lagu'}
                </CyberButton>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
