import React, { useRef } from 'react';
import { Play, Clock, ChevronLeft, ChevronRight, Sparkles, Tv } from 'lucide-react';
import { CatalogShow, CollapsedEpisode } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface FeaturedEpisodeItem {
  show: CatalogShow;
  episode: CollapsedEpisode;
}

interface KidsEpisodeSliderProps {
  catalogShows: CatalogShow[];
  onPlayEpisode: (show: CatalogShow, episode: CollapsedEpisode) => void;
  onOpenShow: (show: CatalogShow) => void;
}

export const KidsEpisodeSlider: React.FC<KidsEpisodeSliderProps> = ({
  catalogShows,
  onPlayEpisode,
  onOpenShow
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Extract a curated selection of top published episodes
  const featuredEpisodes: FeaturedEpisodeItem[] = [];
  for (const show of catalogShows) {
    if (show.seasons) {
      for (const s of show.seasons) {
        if (s.season_number > 0 && s.episodes) {
          for (const ep of s.episodes.slice(0, 2)) {
            featuredEpisodes.push({ show, episode: ep });
          }
        }
      }
    }
  }

  const handleScrollLeft = () => {
    kidsAudio.playPop();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -420, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    kidsAudio.playPop();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 420, behavior: 'smooth' });
    }
  };

  const handlePlay = (item: FeaturedEpisodeItem, e: React.MouseEvent) => {
    kidsAudio.playFanfare();
    launchKidsConfetti(e.clientX, e.clientY);
    onPlayEpisode(item.show, item.episode);
  };

  if (featuredEpisodes.length === 0) return null;

  return (
    <section className="kids-episode-slider-section">
      <div className="section-header-wrap">
        <div className="section-title-box">
          <span className="kids-slider-badge">
            <Sparkles size={14} className="inline-icon text-gold" />
            POPULAR EPISODES
          </span>
          <h3 className="section-title">Jump Straight Into An Episode! 🍿</h3>
          <p className="section-subtitle">
            Kid-favorite episodes ready to watch right now with one tap.
          </p>
        </div>

        <div className="slider-nav-buttons">
          <button
            className="slider-arrow-btn"
            onClick={handleScrollLeft}
            title="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="slider-arrow-btn"
            onClick={handleScrollRight}
            title="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Track */}
      <div className="kids-episodes-track" ref={scrollRef}>
        {featuredEpisodes.map((item, idx) => {
          const ep = item.episode;
          const show = item.show;
          const thumb = ep.artwork?.thumbnail || ep.artwork?.banner || show.artwork?.banner;
          const durationSec = ep.duration_seconds || 600;
          const durationText = `${Math.floor(durationSec / 60)}m`;

          return (
            <div
              key={`${show.id}-${ep.content_group}`}
              className="kids-episode-card"
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={(e) => handlePlay(item, e)}
              role="button"
              tabIndex={0}
            >
              {/* 16:9 Thumbnail Frame */}
              <div className="kids-ep-thumb-frame">
                <ImageWithSkeleton
                  src={thumb}
                  alt={ep.title}
                  aspectRatio="16/9"
                  fallbackTitle={ep.title}
                />
                <div className="kids-ep-play-circle">
                  <Play size={24} fill="currentColor" />
                </div>
                <span className="kids-ep-num-pill">
                  Ep {ep.episode_number}
                </span>
                <span className="kids-ep-time-pill">
                  <Clock size={11} className="inline-icon" />
                  {durationText}
                </span>
              </div>

              {/* Episode Info */}
              <div className="kids-ep-meta-box">
                <div className="kids-ep-show-tag" onClick={(e) => {
                  e.stopPropagation();
                  onOpenShow(show);
                }}>
                  <Tv size={12} className="inline-icon" />
                  <span>{show.title}</span>
                </div>
                <h4 className="kids-ep-card-title">{ep.title}</h4>
                <div className="kids-ep-footer-row">
                  <span className="kids-audio-badge">
                    {ep.languages?.join(' • ').toUpperCase() || 'EN • HI'}
                  </span>
                  <span className="kids-ep-tap-action">Tap to Play ▶</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
