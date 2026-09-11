import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CatalogShow } from '../api/types';
import { ShowCard } from './ShowCard';

interface SectionRowProps {
  title: string;
  sectionId: string;
  shows: CatalogShow[];
  onSelectShow: (show: CatalogShow) => void;
  onPlayShow?: (show: CatalogShow) => void;
}

export const SectionRow: React.FC<SectionRowProps> = ({
  title,
  sectionId,
  shows,
  onSelectShow,
  onPlayShow
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [shows]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (!shows || shows.length === 0) {
    return null;
  }

  const getSectionIcon = () => {
    switch (sectionId) {
      case 'featured': return '⭐';
      case 'series': return '🚀';
      case 'minisodes': return '✨';
      case 'songs': return '🎵';
      default: return '🍿';
    }
  };

  return (
    <section className="section-row-wrapper" id={`section-${sectionId}`}>
      <div className="section-row-header">
        <h2 className="section-row-title">
          <span className="section-title-emoji mr-2">{getSectionIcon()}</span>
          {title}
        </h2>
        <span className="section-count-tag">{shows.length} shows</span>
      </div>

      <div className="carousel-outer-wrapper">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            className="carousel-arrow arrow-left"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          className="carousel-scroll-track"
          onScroll={checkScroll}
        >
          {shows.map((show, idx) => (
            <ShowCard
              key={show.id}
              show={show}
              index={idx}
              onSelect={onSelectShow}
              onPlay={onPlayShow}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            className="carousel-arrow arrow-right"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </section>
  );
};
