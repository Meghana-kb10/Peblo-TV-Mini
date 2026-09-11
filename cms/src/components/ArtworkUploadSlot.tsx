import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { uploadArtwork } from '../api/client';

export type ArtworkSlotType = 'poster' | 'banner' | 'thumbnail';

interface SlotSpec {
  name: string;
  aspect: string;
  targetPx: string;
  maxKb: number;
  description: string;
}

const SLOT_SPECS: Record<ArtworkSlotType, SlotSpec> = {
  poster: {
    name: 'Poster (2:3)',
    aspect: '2:3 Portrait',
    targetPx: '~600 × 900 px',
    maxKb: 200,
    description: 'Used on browse rows, search results & catalogue rails'
  },
  banner: {
    name: 'Hero Banner (16:9)',
    aspect: '16:9 Widescreen',
    targetPx: '~1280 × 720 px',
    maxKb: 200,
    description: 'Featured hero background & show header marquee'
  },
  thumbnail: {
    name: 'Episode Thumbnail (16:9)',
    aspect: '16:9 Widescreen',
    targetPx: '~640 × 360 px',
    maxKb: 200,
    description: 'Shown in episode browser lists & player cards'
  }
};

interface Props {
  artworkType: ArtworkSlotType;
  currentUrl?: string | null;
  showId?: string;
  episodeId?: string;
  onUploaded?: (url: string) => void;
}

export const ArtworkUploadSlot: React.FC<Props> = ({
  artworkType,
  currentUrl,
  showId,
  episodeId,
  onUploaded
}) => {
  const spec = SLOT_SPECS[artworkType];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setErrorMsg(null);
    setSuccessMsg(null);

    // Immediate client check for 200 KB ceiling to provide fast feedback
    if (file.size > 200 * 1024) {
      const sizeKb = (file.size / 1024).toFixed(1);
      setErrorMsg(`File size (${sizeKb} KB) exceeds the 200 KB limit. Please compress the image before uploading.`);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadArtwork(file, artworkType, showId, episodeId);
      setPreviewUrl(result.url);
      setSuccessMsg(`Uploaded (${result.width}×${result.height} px, ${(result.file_size_bytes / 1024).toFixed(1)} KB)`);
      if (onUploaded) {
        onUploaded(result.url);
      }
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Artwork upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`artwork-slot-card ${errorMsg ? 'has-error' : ''} ${previewUrl ? 'has-image' : ''}`}>
      <div className="artwork-slot-header">
        <div className="artwork-title-group">
          <span className="artwork-label">{spec.name}</span>
          <span className="artwork-desc">{spec.description}</span>
        </div>
        <div className="artwork-badges">
          <span className="spec-badge aspect-badge">{spec.aspect}</span>
          <span className="spec-badge px-badge">{spec.targetPx}</span>
          <span className="spec-badge kb-badge">Max {spec.maxKb} KB</span>
        </div>
      </div>

      <div className="artwork-dropzone" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {previewUrl ? (
          <div className="artwork-preview-container">
            <img src={previewUrl} alt={spec.name} className="artwork-preview-img" />
            <div className="artwork-overlay">
              <RefreshCw size={20} className={isUploading ? 'spin' : ''} />
              <span>{isUploading ? 'Validating...' : 'Replace Image'}</span>
            </div>
          </div>
        ) : (
          <div className="artwork-empty-state">
            {isUploading ? (
              <RefreshCw size={28} className="spin text-accent" />
            ) : (
              <UploadCloud size={28} className="text-muted" />
            )}
            <p className="dropzone-text">
              {isUploading ? 'Validating dimensions & aspect ratio...' : 'Click or drop image to upload'}
            </p>
            <span className="dropzone-sub">JPG, PNG, or WebP</span>
          </div>
        )}
      </div>

      {/* Editor-actionable feedback */}
      {errorMsg && (
        <div className="artwork-alert alert-error">
          <AlertCircle size={16} className="alert-icon" />
          <div className="alert-content">
            <strong>Upload Rejected:</strong> {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="artwork-alert alert-success">
          <CheckCircle2 size={16} className="alert-icon" />
          <div className="alert-content">{successMsg}</div>
        </div>
      )}
    </div>
  );
};
