import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, CheckCircle2, ShieldCheck, HardDrive } from 'lucide-react';
import { fetchShows } from '../api/client';

export const MediaLibraryPage: React.FC = () => {
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: () => fetchShows()
  });

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h1 className="canvas-title">Media & Artwork Library</h1>
          <p className="canvas-subtitle">
            Catalog asset repository storing posters (2:3), hero banners (16:9), and thumbnails (16:9).
          </p>
        </div>
      </div>

      <div className="media-stats-grid">
        <div className="media-stat-card">
          <HardDrive size={24} className="text-accent" />
          <div>
            <div className="stat-number">{shows.length * 2}+</div>
            <div className="stat-label">Stored Show Assets</div>
          </div>
        </div>
        <div className="media-stat-card">
          <ShieldCheck size={24} className="text-success" />
          <div>
            <div className="stat-number">200 KB</div>
            <div className="stat-label">Max File Size Enforced</div>
          </div>
        </div>
        <div className="media-stat-card">
          <CheckCircle2 size={24} className="text-success" />
          <div>
            <div className="stat-number">Storage Abstraction</div>
            <div className="stat-label">Cloudflare R2 / Local Disk</div>
          </div>
        </div>
      </div>

      <div className="media-gallery-grid">
        {shows.map((s) => (
          <div key={s.id} className="media-asset-card">
            <div className="media-poster-box">
              {s.artwork?.poster ? (
                <img src={s.artwork.poster} alt={s.title} />
              ) : (
                <div className="poster-fallback">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>
            <div className="media-asset-meta">
              <h4 className="media-show-title">{s.title}</h4>
              <span className="media-slot-pill">Poster (2:3 ~600×900)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
