import React from 'react';
import { Play, Film, Clock, Globe } from 'lucide-react';
import { Trailer } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface TrailerSectionProps {
  trailers?: Trailer[];
  onPlayTrailer: (trailer: Trailer) => void;
}

export const TrailerSection: React.FC<TrailerSectionProps> = ({
  trailers,
  onPlayTrailer
}) => {
  if (!trailers || trailers.length === 0) {
    return (
      <div className="trailers-empty-box">
        <Film size={28} className="text-muted" />
        <p>No official trailers or teasers available for this title.</p>
      </div>
    );
  }

  return (
    <div className="trailers-grid">
      {trailers.map((tr) => {
        const thumbUrl = tr.artwork?.thumbnail || tr.artwork?.banner;
        const durationText = tr.duration_seconds
          ? `${Math.floor(tr.duration_seconds / 60)}m ${tr.duration_seconds % 60}s`
          : 'Preview';

        return (
          <div
            key={tr.episode_id}
            className="trailer-card"
            onClick={() => onPlayTrailer(tr)}
            role="button"
            tabIndex={0}
          >
            {/* 16:9 Thumbnail preview */}
            <div className="trailer-thumb-frame">
              <ImageWithSkeleton
                src={thumbUrl}
                alt={tr.title}
                aspectRatio="16/9"
                fallbackTitle={tr.title}
              />
              <div className="trailer-play-badge">
                <Play size={20} fill="currentColor" />
              </div>
              <span className="trailer-duration-tag">
                <Clock size={11} className="inline-icon" />
                {durationText}
              </span>
            </div>

            <div className="trailer-meta">
              <h4 className="trailer-title">{tr.title}</h4>
              <div className="trailer-sub-row">
                <span className="trailer-type-pill">Official Teaser</span>
                {tr.language && (
                  <span className={`trailer-lang-pill lang-${tr.language}`}>
                    <Globe size={11} className="inline-icon" />
                    {tr.language.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
