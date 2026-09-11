import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info } from 'lucide-react';
import { Episode, Show } from '../api/types';
import { createEpisode, updateEpisode, fetchShows } from '../api/client';
import { ArtworkUploadSlot } from './ArtworkUploadSlot';

interface Props {
  episode?: Episode | null;
  defaultShowId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EpisodeModal: React.FC<Props> = ({
  episode,
  defaultShowId,
  isOpen,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(episode?.id);

  const [shows, setShows] = useState<Show[]>([]);
  const [showId, setShowId] = useState<string>(defaultShowId || '');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [episodeTitle, setEpisodeTitle] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number | ''>(300);
  const [language, setLanguage] = useState<string>('en');
  const [contentGroup, setContentGroup] = useState<string>('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchShows().then((res) => {
      setShows(res);
      if (!showId && res.length > 0) {
        setShowId(res[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (episode) {
      setShowId(episode.show_id);
      setSeasonNumber(episode.season_number);
      setEpisodeNumber(episode.episode_number);
      setEpisodeTitle(episode.episode_title);
      setDurationSeconds(episode.duration_seconds ?? '');
      setLanguage(episode.language);
      setContentGroup(episode.content_group);
      setStatus(episode.status);
    } else {
      setShowId(defaultShowId || (shows[0]?.id ?? ''));
      setSeasonNumber(1);
      setEpisodeNumber(1);
      setEpisodeTitle('');
      setDurationSeconds(300);
      setLanguage('en');
      setContentGroup(`cg_${Math.random().toString(36).substring(2, 9)}`);
      setStatus('draft');
    }
    setErrorMessage(null);
  }, [episode, defaultShowId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client validation warnings
    if (status === 'published') {
      if (!durationSeconds || Number(durationSeconds) <= 0) {
        setErrorMessage('A published episode must have a duration in seconds greater than 0.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isEditing && episode) {
        await updateEpisode(episode.id, {
          episode_title: episodeTitle,
          duration_seconds: durationSeconds ? Number(durationSeconds) : null,
          language,
          content_group: contentGroup,
          status,
          episode_number: episodeNumber
        });
      } else {
        await createEpisode({
          show_id: showId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          episode_title: episodeTitle,
          duration_seconds: durationSeconds ? Number(durationSeconds) : null,
          language,
          content_group: contentGroup,
          status
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Failed to save episode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-large">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {isEditing ? `Edit Episode: ${episode?.episode_title}` : 'Add New Episode'}
            </h2>
            <span className="modal-subtitle">
              Manage streaming metadata, multilingual variant groupings, and required artwork
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && (
            <div className="artwork-alert alert-error">
              <AlertCircle size={18} className="alert-icon" />
              <div className="alert-content">{errorMessage}</div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Parent Show *</label>
              <select
                className="form-select"
                value={showId}
                onChange={(e) => setShowId(e.target.value)}
                disabled={isEditing}
                required
              >
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.section || 'No Section'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Episode Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. The Giant Cloud"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Season Number *
                {seasonNumber === 0 && <span className="badge-trailer-label">Trailers</span>}
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(Number(e.target.value))}
                disabled={isEditing}
                required
              />
              <span className="field-hint">
                {seasonNumber === 0 ? 'Season 0 is strictly isolated as Trailers' : 'Regular episodic season'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Episode Number *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Seconds) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 420"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value ? Number(e.target.value) : '')}
              />
              <span className="field-hint">
                {durationSeconds ? `${Math.floor(Number(durationSeconds) / 60)}m ${Number(durationSeconds) % 60}s` : 'Must be > 0 to publish'}
              </span>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Language *</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Content Group Key *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. cg_moti_s01e01"
                value={contentGroup}
                onChange={(e) => setContentGroup(e.target.value)}
                required
              />
              <span className="field-hint">
                Language variants of the same episode must share this key!
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Publication Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
              >
                <option value="draft">Draft (Working copy, hidden from viewer)</option>
                <option value="published">Published (Visible in catalogue)</option>
              </select>
            </div>
          </div>

          {/* Three Labelled Artwork Slots */}
          <div className="form-section">
            <div className="section-header-row">
              <h3 className="section-subtitle">Episode Artwork Slots (All 3 Required for Publishing)</h3>
              <span className="badge-pill badge-neutral">
                <Info size={12} />
                Strict 200 KB ceiling enforced per file
              </span>
            </div>
            <p className="section-caption">
              Upload all three required formats. If dimensions, aspect ratio, or file size exceed specifications,
              actionable guidelines will appear below the slot.
            </p>

            {isEditing && episode ? (
              <div className="artwork-slots-grid-3">
                <ArtworkUploadSlot
                  artworkType="poster"
                  currentUrl={episode.artwork?.poster}
                  episodeId={episode.id}
                  onUploaded={() => onSaved()}
                />
                <ArtworkUploadSlot
                  artworkType="banner"
                  currentUrl={episode.artwork?.banner}
                  episodeId={episode.id}
                  onUploaded={() => onSaved()}
                />
                <ArtworkUploadSlot
                  artworkType="thumbnail"
                  currentUrl={episode.artwork?.thumbnail}
                  episodeId={episode.id}
                  onUploaded={() => onSaved()}
                />
              </div>
            ) : (
              <div className="callout-box">
                <Info size={18} className="text-accent" />
                <p>
                  To attach artwork, first create the episode in <strong>Draft</strong> status. You can then upload
                  the 3 required artwork formats before flipping its status to <strong>Published</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Episode' : 'Create Episode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
