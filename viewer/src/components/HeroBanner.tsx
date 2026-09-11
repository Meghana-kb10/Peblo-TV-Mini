import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Sparkles, Film, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CatalogShow } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface HeroBannerProps {
  shows: CatalogShow[];
  onOpenDetail: (show: CatalogShow) => void;
  onPlayEpisode: (show: CatalogShow) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  shows,
  onOpenDetail,
  onPlayEpisode
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If only 1 show or empty, fallback
  const featuredShows = shows.length > 0 ? shows.slice(0, 5) : [];
  const currentShow = featuredShows[activeIndex] || featuredShows[0];

  // Auto-advance hero banner every 7 seconds when not hovered
  useEffect(() => {
    if (isPaused || featuredShows.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredShows.length);
    }, 7000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, featuredShows.length, activeIndex]);

  const handleNext = () => {
    kidsAudio.playPop();
    setActiveIndex((prev) => (prev + 1) % featuredShows.length);
  };

  const handlePrev = () => {
    kidsAudio.playPop();
    setActiveIndex((prev) => (prev - 1 + featuredShows.length) % featuredShows.length);
  };

  const handleDotClick = (idx: number) => {
    kidsAudio.playPop();
    setActiveIndex(idx);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    kidsAudio.playFanfare();
    launchKidsConfetti(e.clientX, e.clientY);
    onPlayEpisode(currentShow);
  };

  const handleInfoClick = () => {
    kidsAudio.playChime();
    onOpenDetail(currentShow);
  };

  if (!currentShow) return null;

  const bannerUrl = currentShow.artwork?.banner;
  const hasTrailers = currentShow.trailers && currentShow.trailers.length > 0;
  const episodeCount = currentShow.seasons?.reduce((acc, s) => acc + s.episodes.length, 0) || 0;

  return (
    <div
      className="hero-banner-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 16:9 Backdrop Image with Skeleton */}
      <div className="hero-backdrop-container">
        <ImageWithSkeleton
          key={currentShow.id}
          src={bannerUrl}
          alt={currentShow.title}
          aspectRatio="16/9"
          className="hero-banner-image animate-fade-in"
          fallbackTitle={currentShow.title}
          priority={true}
        />
        <div className="hero-vignette-overlay" />

        {/* Floating Magical Star Particles */}
        <div className="magical-particles-layer">
          <span className="star-particle p1">✨</span>
          <span className="star-particle p2">⭐</span>
          <span className="star-particle p3">🌟</span>
          <span className="star-particle p4">✨</span>
        </div>
      </div>

      {/* Floating Slider Navigation Chevrons */}
      {featuredShows.length > 1 && (
        <>
          <button
            className="hero-carousel-arrow arrow-left"
            onClick={handlePrev}
            aria-label="Previous featured adventure"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            className="hero-carousel-arrow arrow-right"
            onClick={handleNext}
            aria-label="Next featured adventure"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Hero Content Information */}
      <div className="hero-content-container animate-slide-up" key={currentShow.slug}>
        <div className="hero-badge-row">
          <span className="hero-featured-pill">
            <Sparkles size={13} className="inline-icon" />
            KID’S CHOICE ADVENTURE
          </span>
          {currentShow.categories?.slice(0, 3).map((cat) => (
            <span key={cat} className="hero-cat-pill">
              {cat}
            </span>
          ))}
          {episodeCount > 0 && (
            <span className="hero-meta-text">{episodeCount} Fun Episodes</span>
          )}
        </div>

        <h1 className="hero-title">{currentShow.title}</h1>

        <p className="hero-synopsis">
          {currentShow.synopsis || "Immerse yourself in delightful stories, joyful learning, and heartwarming adventures on Peblo TV."}
        </p>

        <div className="hero-actions-row">
          <button
            className="btn-hero-primary bouncy"
            onClick={handlePlayClick}
            title={`Play ${currentShow.title}`}
          >
            <Play size={20} fill="currentColor" />
            <span>Play Episode 1</span>
          </button>

          <button
            className="btn-hero-secondary bouncy"
            onClick={handleInfoClick}
            title="More Information & Episode Guide"
          >
            <Info size={20} />
            <span>More Info</span>
          </button>

          {hasTrailers && (
            <button
              className="btn-hero-trailer bouncy"
              onClick={handleInfoClick}
              title="Watch Official Trailer"
            >
              <Film size={18} />
              <span>Watch Trailer</span>
            </button>
          )}
        </div>

        {/* Slider Dots / Slide Indicators */}
        {featuredShows.length > 1 && (
          <div className="hero-slider-dots">
            {featuredShows.map((s, idx) => (
              <button
                key={s.id}
                className={`slider-dot-btn ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
