import { CloudinaryConfig } from '../types';
import { getCloudinaryConfig } from './firestoreService';

export interface UploadResult {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  duration?: string;
}

// Format validations
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 120 * 1024 * 1024; // 120MB

/**
 * Uploads a local File or Blob directly to Cloudinary (Free Tier)
 * using an unsigned upload preset.
 * No API Secret is exposed in frontend code.
 */
export async function uploadMediaFile(
  file: File | Blob,
  folder: 'avatars' | 'achievements' | 'hobbies' | 'covers' | 'audio' | 'videos',
  originalFileName?: string,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  const fileName = originalFileName || (file instanceof File ? file.name : `media_${Date.now()}`);
  const fileSize = file.size;

  // 1. Validation checks
  if (folder === 'avatars' || folder === 'achievements' || folder === 'hobbies' || folder === 'covers') {
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) && !fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
      throw new Error(`Format foto tidak didukung (${file.type}). Gunakan format JPG, JPEG, PNG, atau WEBP.`);
    }
    if (fileSize > MAX_IMAGE_SIZE) {
      throw new Error(`Ukuran foto terlalu besar (${(fileSize / (1024 * 1024)).toFixed(1)}MB). Batas maksimal adalah 10MB.`);
    }
  } else if (folder === 'audio') {
    if (file.type && !ALLOWED_AUDIO_TYPES.includes(file.type.toLowerCase()) && !fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      throw new Error(`Format audio tidak didukung (${file.type}). Gunakan format MP3, WAV, OGG, atau M4A/AAC.`);
    }
    if (fileSize > MAX_AUDIO_SIZE) {
      throw new Error(`Ukuran file musik terlalu besar (${(fileSize / (1024 * 1024)).toFixed(1)}MB). Batas maksimal adalah 50MB.`);
    }
  } else if (folder === 'videos') {
    if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase()) && !fileName.match(/\.(mp4|webm|mov)$/i)) {
      throw new Error(`Format video tidak didukung (${file.type}). Gunakan format MP4 atau WebM.`);
    }
    if (fileSize > MAX_VIDEO_SIZE) {
      throw new Error(`Ukuran video terlalu besar (${(fileSize / (1024 * 1024)).toFixed(1)}MB). Batas maksimal adalah 120MB.`);
    }
  }

  // 2. Fetch Cloudinary config (from Firestore or local fallback)
  const config = await getCloudinaryConfig();
  const cloudName = config.cloudName?.trim();
  const uploadPreset = config.uploadPreset?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Konfigurasi Cloudinary belum lengkap. Harap masukkan Cloud Name dan Unsigned Upload Preset Anda di menu Pengaturan Cloudinary (atau gunakan tombol "Gunakan URL Online").'
    );
  }

  // 3. Upload using XMLHttpRequest to support upload progress monitoring
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`;

  return new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `syahrul_gaming/${folder}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          resolve({
            url: response.secure_url,
            storagePath: response.public_id || '',
            fileName: response.original_filename || fileName,
            fileSize: response.bytes || fileSize,
          });
        } else {
          let errorMsg = 'Upload ke Cloudinary gagal.';
          if (response?.error?.message) {
            errorMsg = `Cloudinary: ${response.error.message}`;
            if (response.error.message.includes('Upload preset must be whitelisted for unsigned uploads')) {
              errorMsg = 'Upload Preset Cloudinary belum disetel ke mode "Unsigned". Buka Cloudinary Console -> Settings -> Upload -> Edit Preset -> Ubah Signing Mode ke "Unsigned".';
            }
          }
          reject(new Error(errorMsg));
        }
      } catch (parseError) {
        reject(new Error(`Respon server tidak valid (${xhr.status}): ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Koneksi ke server Cloudinary gagal. Periksa koneksi internet atau nama Cloud Name Anda.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Waktu koneksi upload ke Cloudinary habis (timeout). Silakan coba lagi.'));
    };

    xhr.send(formData);
  });
}

/**
 * Removes file identifier reference (client-side deletion in Cloudinary is restricted for security)
 */
export async function deleteStorageFile(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  // Cloudinary unsigned deletion from client-side is deliberately blocked by Cloudinary to protect user assets.
  // The document in Firestore simply updates its URL to the new permanent photo.
}

/**
 * Reads duration from audio or video file
 */
export async function getMediaDuration(file: File | Blob, isVideo = false): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const media = isVideo ? document.createElement('video') : document.createElement('audio');
    
    media.src = url;
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const totalSecs = Math.floor(media.duration);
      if (isNaN(totalSecs) || totalSecs <= 0) {
        resolve('00:00');
        return;
      }
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      resolve(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('03:00');
    };
  });
}

/**
 * Extracts video thumbnail from a video file
 */
export async function captureVideoThumbnail(videoFile: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, video.videoWidth || 640);
        canvas.height = Math.min(360, video.videoHeight || 360);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);
          resolve(thumb);
          return;
        }
      } catch (e) {
        console.warn('Thumbnail generation error', e);
      }
      URL.revokeObjectURL(url);
      resolve('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80');
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80');
    };
  });
}

/**
 * Genuine Web Audio API Audio Extraction from Video.
 * Decodes the video's audio track and encodes it into a standard WAV audio blob.
 */
export async function extractAudioFromVideo(
  videoFile: File | Blob,
  onProgress?: (percent: number) => void
): Promise<{ audioBlob: Blob; durationFormatted: string }> {
  if (onProgress) onProgress(15);
  
  const arrayBuffer = await videoFile.arrayBuffer();
  if (onProgress) onProgress(45);

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  // Decode audio data from video container
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  if (onProgress) onProgress(75);

  // Encode to WAV format
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  if (onProgress) onProgress(100);

  const totalSecs = Math.floor(audioBuffer.duration);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  audioCtx.close();
  return { audioBlob: wavBlob, durationFormatted };
}

// Helper: Converts AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  // Interleave channels
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt Subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample
  
  // data Subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write PCM audio data
  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }
  
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
