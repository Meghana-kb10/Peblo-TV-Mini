import React from 'react';
import { Play, Info, Sparkles, Star } from 'lucide-react';
import { CatalogShow } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

const CATEGORY_EMOJIS: Record<string, string> = {
  adventure: '🧭',
  learning: '🧠',
  nature: '🌿',
  science: '🔬',
  stories: '📖',
  music: '🎵',
  singalong: '🎤',
  travel: '🗺️',
  friendship: '🤝',
  maths: '🔢',
  values: '💛'
};

interface ShowCardProps {
  show: CatalogShow;
  onSelect: (show: CatalogShow) => void;
  onPlay?: (show: CatalogShow) => void;
  index?: number;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  onSelect,
  onPlay,
  index = 0
}) => {
  const posterUrl = show.artwork?.poster;
  const episodeCount = show.seasons?.reduce((acc, s) => acc + s.episodes.length, 0) || 0;
  const animDelay = `${Math.min(index * 70, 500)}ms`;

  const handleClick = () => {
    kidsAudio.playPop();
    onSelect(show);
  };

  const handlePlayDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    kidsAudio.playFanfare();
    launchKidsConfetti(e.clientX, e.clientY);
    onPlay ? onPlay(show) : onSelect(show);
  };

  return (
    <div
      className="show-card-item scroll-reveal-card"
      style={{ animationDelay: animDelay }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${show.title}`}
    >
      {/* 2:3 Aspect Ratio Poster Surface */}
      <div className="card-poster-frame">
        <ImageWithSkeleton
          src={posterUrl}
          alt={show.title}
          aspectRatio="2/3"
          fallbackTitle={show.title}
        />

        {/* Section Ribbon Badge */}
        {show.section && (
          <span className={`card-section-badge section-${show.section.toLowerCase()}`}>
            {show.section === 'featured' && '⭐ '}
            {show.section === 'songs' && '🎵 '}
            {show.section}
          </span>
        )}

        {/* Interactive Hover Overlay with Kids Badge */}
        <div className="card-hover-overlay">
          <div className="overlay-top-meta">
            <h4 className="card-hover-title">{show.title}</h4>
            <div className="card-hover-chips">
              {show.categories?.slice(0, 2).map((c) => (
                <span key={c} className="hover-cat-chip">
                  {CATEGORY_EMOJIS[c] || '✨'} {c}
                </span>
              ))}
            </div>
          </div>

          <div className="overlay-bottom-actions">
            <button
              className="btn-quick-play bouncy"
              onClick={handlePlayDirect}
              title="Play Now"
            >
              <Play size={16} fill="currentColor" />
            </button>

            <button
              className="btn-quick-info bouncy"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              title="Show Details"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer Labels */}
      <div className="card-bottom-info">
        <h3 className="card-title-text" title={show.title}>
          {show.title}
        </h3>
        <div className="card-sub-row">
          <span className="card-category-tag">
            {show.categories?.[0] ? `${CATEGORY_EMOJIS[show.categories[0]] || '✨'} ${show.categories[0]}` : 'Kids Show'}
          </span>
          {episodeCount > 0 && (
            <span className="card-ep-count">
              {episodeCount} eps
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
