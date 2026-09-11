import React, { useState, useEffect } from 'react';
import { X, Play, Film, Sparkles, Layers, Volume2 } from 'lucide-react';
import { CatalogShow, CollapsedEpisode, EpisodeVariant, Trailer } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { EpisodeList } from './EpisodeList';
import { TrailerSection } from './TrailerSection';

interface ShowDetailModalProps {
  show: CatalogShow | null;
  onClose: () => void;
  onPlayMedia: (title: string, type: 'episode' | 'trailer', lang?: string) => void;
}

export const ShowDetailModal: React.FC<ShowDetailModalProps> = ({
  show,
  onClose,
  onPlayMedia
}) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'trailers'>('episodes');
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      // Reset to first season and episodes tab
      setActiveTab('episodes');
      const firstSeasonNum = show.seasons?.[0]?.season_number || 1;
      setSelectedSeasonNumber(firstSeasonNum);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const bannerUrl = show.artwork?.banner;
  const regularSeasons = show.seasons?.filter((s) => s.season_number > 0) || [];
  const trailers = show.trailers || [];
  const currentSeason = regularSeasons.find((s) => s.season_number === selectedSeasonNumber) || regularSeasons[0];

  const handlePlayFirstEpisode = () => {
    const firstEp = currentSeason?.episodes?.[0];
    if (firstEp) {
      onPlayMedia(`${show.title} — ${firstEp.title}`, 'episode', firstEp.languages?.[0]);
    } else {
      onPlayMedia(show.title, 'episode');
    }
  };

  const handlePlayEpisodeItem = (ep: CollapsedEpisode, variant?: EpisodeVariant) => {
    const title = variant ? `${show.title} — ${variant.title}` : `${show.title} — ${ep.title}`;
    onPlayMedia(title, 'episode', variant?.language || ep.languages?.[0]);
  };

  const handlePlayTrailerItem = (tr: Trailer) => {
    onPlayMedia(`${show.title} — ${tr.title} (Official Trailer)`, 'trailer', tr.language);
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="show-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
          <X size={20} />
        </button>

        {/* 16:9 Banner Header with Dark Gradient Overlay */}
        <div className="modal-hero-header">
          <ImageWithSkeleton
            src={bannerUrl}
            alt={show.title}
            aspectRatio="16/9"
            className="modal-banner-image"
            fallbackTitle={show.title}
            priority={true}
          />
          <div className="modal-hero-gradient" />

          {/* Floating Actions on Header */}
          <div className="modal-hero-content">
            <div className="modal-hero-badge-row">
              {show.section && (
                <span className={`modal-section-pill section-${show.section.toLowerCase()}`}>
                  {show.section.toUpperCase()}
                </span>
              )}
              {show.categories?.map((c) => (
                <span key={c} className="modal-cat-chip">{c}</span>
              ))}
            </div>

            <h2 className="modal-show-title">{show.title}</h2>

            <div className="modal-hero-buttons">
              <button className="btn-modal-play" onClick={handlePlayFirstEpisode}>
                <Play size={20} fill="currentColor" />
                <span>Play Episode 1</span>
              </button>

              {trailers.length > 0 && (
                <button
                  className="btn-modal-trailers-quick"
                  onClick={() => setActiveTab('trailers')}
                >
                  <Film size={18} />
                  <span>Trailers ({trailers.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-scroll-body">
          {/* Show Synopsis & Metadata Overview */}
          <div className="modal-meta-section">
            <p className="modal-synopsis-text">
              {show.synopsis || "An enchanting adventure filled with joyful music, delightful discoveries, and heartwarming stories for young minds."}
            </p>

            <div className="modal-quick-stats">
              <div className="quick-stat-item">
                <span className="stat-name">Total Seasons:</span>
                <span className="stat-val">{regularSeasons.length || 1}</span>
              </div>
              <div className="quick-stat-item">
                <span className="stat-name">Total Episodes:</span>
                <span className="stat-val">
                  {regularSeasons.reduce((acc, s) => acc + s.episodes.length, 0)}
                </span>
              </div>
              {trailers.length > 0 && (
                <div className="quick-stat-item">
                  <span className="stat-name">Bonus Trailers:</span>
                  <span className="stat-val text-gold">{trailers.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subtabs: Episodes vs Trailers (Rule 5: Season 0 isolated from normal seasons!) */}
          <div className="modal-nav-tabs">
            <button
              className={`modal-tab-pill ${activeTab === 'episodes' ? 'active' : ''}`}
              onClick={() => setActiveTab('episodes')}
            >
              <Layers size={16} className="mr-1" />
              <span>Episodes</span>
            </button>

            {trailers.length > 0 && (
              <button
                className={`modal-tab-pill ${activeTab === 'trailers' ? 'active' : ''}`}
                onClick={() => setActiveTab('trailers')}
              >
                <Film size={16} className="mr-1" />
                <span>Trailers & Teasers ({trailers.length})</span>
              </button>
            )}
          </div>

          {/* Tab 1: Episodes with Seasons Dropdown */}
          {activeTab === 'episodes' && (
            <div className="modal-episodes-view">
              {regularSeasons.length > 1 && (
                <div className="season-selector-row">
                  <label htmlFor="season-select" className="season-label">Season:</label>
                  <select
                    id="season-select"
                    className="season-dropdown"
                    value={selectedSeasonNumber}
                    onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                  >
                    {regularSeasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        {s.title || `Season ${s.season_number}`} ({s.episodes.length} episodes)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {currentSeason ? (
                <EpisodeList
                  episodes={currentSeason.episodes}
                  onPlayEpisode={handlePlayEpisodeItem}
                />
              ) : (
                <div className="episodes-empty-box">No episodes found.</div>
              )}
            </div>
          )}

          {/* Tab 2: Isolated Season 0 Trailers (Rule 5) */}
          {activeTab === 'trailers' && (
            <div className="modal-trailers-view">
              <TrailerSection
                trailers={trailers}
                onPlayTrailer={handlePlayTrailerItem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
