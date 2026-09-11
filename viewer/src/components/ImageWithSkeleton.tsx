import React, { useState } from 'react';
import { Film, ImageOff } from 'lucide-react';

interface ImageWithSkeletonProps {
  src?: string;
  alt: string;
  aspectRatio?: '2/3' | '16/9';
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  aspectRatio = '2/3',
  className = '',
  fallbackTitle,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const ratioClass = aspectRatio === '16/9' ? 'aspect-16-9' : 'aspect-2-3';

  if (!src || hasError) {
    return (
      <div className={`img-container ${ratioClass} img-fallback-box ${className}`}>
        <div className="img-fallback-content">
          <Film size={28} className="fallback-icon" />
          {fallbackTitle && <span className="fallback-title">{fallbackTitle}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`img-container ${ratioClass} ${className}`}>
      {/* Shimmer skeleton placeholder */}
      {!isLoaded && <div className="img-shimmer-skeleton" />}

      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`img-asset ${isLoaded ? 'loaded' : 'loading'}`}
      />
    </div>
  );
};
