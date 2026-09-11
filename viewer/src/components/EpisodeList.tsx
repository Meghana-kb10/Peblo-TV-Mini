import React, { useState, useEffect, useRef } from 'react';
import { Play, Clock, Globe, Check, Sparkles, Star, Heart } from 'lucide-react';
import { CollapsedEpisode, EpisodeVariant } from '../api/types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface EpisodeListProps {
  episodes: CollapsedEpisode[];
  onPlayEpisode: (ep: CollapsedEpisode, activeVariant?: EpisodeVariant) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  onPlayEpisode
}) => {
  // Store selected language variant per content_group
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Kids favorited / starred episodes
  const [starredEps, setStarredEps] = useState<Record<string, boolean>>({});
  // Track visible items via IntersectionObserver
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Setup IntersectionObserver so episodes appear dynamically as you scroll down
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) {
              setVisibleItems((prev) => ({ ...prev, [id]: true }));
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.15
      }
    );

    const elements = document.querySelectorAll('.episode-item-row');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [episodes]);

  const handleLanguageSelect = (contentGroup: string, lang: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kidsAudio.playPop();
    setSelectedVariants((prev) => ({
      ...prev,
      [contentGroup]: lang
    }));
  };

  const handleToggleStar = (contentGroup: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kidsAudio.playChime();
    launchKidsConfetti(e.clientX, e.clientY);
    setStarredEps((prev) => ({
      ...prev,
      [contentGroup]: !prev[contentGroup]
    }));
  };

  const handlePlay = (ep: CollapsedEpisode, variant?: EpisodeVariant, e?: React.MouseEvent) => {
    kidsAudio.playFanfare();
    if (e) {
      launchKidsConfetti(e.clientX, e.clientY);
    }
    onPlayEpisode(ep, variant);
  };

  if (!episodes || episodes.length === 0) {
    return (
      <div className="episodes-empty-box">
        <p>No episodes available in this season.</p>
      </div>
    );
  }

  return (
    <div className="episodes-list-container">
      {/* Scroll Hint for Children */}
      <div className="episodes-scroll-hint-bar">
        <span className="scroll-hint-text">
          <Sparkles size={14} className="inline-icon text-gold" />
          Scroll down to discover more fun episodes! ({episodes.length} Total)
        </span>
      </div>

      {episodes.map((ep, index) => {
        const activeLang = selectedVariants[ep.content_group] || (ep.languages && ep.languages[0]) || 'en';
        const currentVariant = ep.variants?.find((v) => v.language === activeLang) || ep.variants?.[0];

        const displayTitle = currentVariant?.title || ep.title;
        const durationSec = currentVariant?.duration_seconds || ep.duration_seconds;
        const durationText = durationSec
          ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
          : '10m';
        const thumbUrl = currentVariant?.artwork?.thumbnail || ep.artwork?.thumbnail || ep.artwork?.banner;

        const isVisible = visibleItems[ep.content_group] || index === 0;
        const isStarred = Boolean(starredEps[ep.content_group]);

        return (
          <div
            key={ep.content_group}
            data-id={ep.content_group}
            className={`episode-item-row scroll-reveal-card ${isVisible ? 'revealed' : 'waiting'}`}
            style={{ transitionDelay: `${(index % 4) * 80}ms` }}
            onClick={(e) => handlePlay(ep, currentVariant, e)}
            role="button"
            tabIndex={0}
          >
            {/* Episode Number Index with playful badge */}
            <div className="ep-index-col">
              <span className="ep-index-circle">{ep.episode_number}</span>
            </div>

            {/* 16:9 Thumbnail (Artwork per surface specification) */}
            <div className="ep-thumb-col">
              <div className="ep-thumb-frame">
                <ImageWithSkeleton
                  src={thumbUrl}
                  alt={displayTitle}
                  aspectRatio="16/9"
                  fallbackTitle={displayTitle}
                />
                <div className="ep-play-hover-btn">
                  <Play size={22} fill="currentColor" />
                </div>
                <span className="ep-duration-badge">
                  <Clock size={11} className="inline-icon" />
                  {durationText}
                </span>
              </div>
            </div>

            {/* Episode Details & Multilingual Language Selector */}
            <div className="ep-info-col">
              <div className="ep-title-row">
                <h4 className="ep-title-text">{displayTitle}</h4>
                <div className="ep-title-right-actions">
                  <button
                    className={`btn-star-episode ${isStarred ? 'starred' : ''}`}
                    onClick={(e) => handleToggleStar(ep.content_group, e)}
                    title={isStarred ? 'Unstar episode' : 'Star this favorite episode!'}
                  >
                    <Star size={16} fill={isStarred ? '#f59e0b' : 'none'} color={isStarred ? '#f59e0b' : '#94a3b8'} />
                  </button>
                  <span className="ep-duration-text">{durationText}</span>
                </div>
              </div>

              <p className="ep-synopsis-text">
                Join this delightful adventure! Tap to start watching with playful music and voices.
              </p>

              {/* Multilingual Selector (Rule 4: Collapsed Content Group with Language Variants) */}
              {ep.languages && ep.languages.length > 0 && (
                <div className="ep-multilingual-box">
                  <span className="audio-label">
                    <Globe size={12} className="inline-icon" /> Audio:
                  </span>
                  <div className="lang-pill-group">
                    {ep.languages.map((lang) => {
                      const isSelected = activeLang === lang;
                      return (
                        <button
                          key={lang}
                          className={`btn-lang-toggle ${isSelected ? 'active' : ''}`}
                          onClick={(e) => handleLanguageSelect(ep.content_group, lang, e)}
                          title={`Switch audio to ${lang === 'en' ? 'English' : 'Hindi'}`}
                        >
                          {isSelected && <Check size={11} className="inline-icon" />}
                          {lang === 'en' ? 'English' : 'Hindi (हिंदी)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
