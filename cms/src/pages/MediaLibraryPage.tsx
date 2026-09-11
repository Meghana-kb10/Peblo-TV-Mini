import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, CheckCircle2, ShieldCheck, HardDrive, RefreshCw, Sparkles, LayoutGrid, Layers } from 'lucide-react';
import { fetchShows, syncGeneratedArtwork } from '../api/client';

export const MediaLibraryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'all' | 'posters' | 'banners'>('all');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: () => fetchShows()
  });

  const syncMutation = useMutation({
    mutationFn: syncGeneratedArtwork,
    onSuccess: (data) => {
      setSyncToast(data.message || 'Artwork successfully synced and published!');
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
      setTimeout(() => setSyncToast(null), 6000);
    },
    onError: (err: any) => {
      alert(`Sync Failed: ${err.detail || err.message}`);
    }
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

        <button
          className="btn-dark-pill"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw size={15} className={syncMutation.isPending ? 'spin' : ''} />
          <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Generated Artwork'}</span>
        </button>
      </div>

      {syncToast && (
        <div className="publish-success-banner" style={{ marginBottom: '20px' }}>
          <div className="publish-success-left">
            <div className="publish-success-icon-box">
              <CheckCircle2 size={22} className="text-success" />
            </div>
            <div>
              <h4 className="publish-success-title">Artwork Synchronized</h4>
              <p className="publish-success-desc">{syncToast}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Asset Type Filter Tabs */}
      <div className="canvas-subtabs">
        <button
          className={`subtab-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <Layers size={15} />
          <span>All Assets ({shows.length * 2})</span>
        </button>
        <button
          className={`subtab-pill ${activeFilter === 'posters' ? 'active' : ''}`}
          onClick={() => setActiveFilter('posters')}
        >
          <LayoutGrid size={15} />
          <span>Posters 2:3 ({shows.length})</span>
        </button>
        <button
          className={`subtab-pill ${activeFilter === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveFilter('banners')}
        >
          <Sparkles size={15} />
          <span>Hero Banners 16:9 ({shows.length})</span>
        </button>
      </div>

      <div className={`media-gallery-grid ${activeFilter === 'banners' ? 'banners' : ''}`}>
        {shows.map((s) => (
          <React.Fragment key={s.id}>
            {/* Show Poster */}
            {(activeFilter === 'all' || activeFilter === 'posters') && (
              <div className="media-asset-card">
                <div className="media-poster-box">
                  {s.artwork?.poster ? (
                    <img src={s.artwork.poster} alt={`${s.title} Poster`} />
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
            )}

            {/* Show Banner */}
            {(activeFilter === 'all' || activeFilter === 'banners') && (
              <div className="media-asset-card">
                <div className="media-banner-box">
                  {s.artwork?.banner ? (
                    <img src={s.artwork.banner} alt={`${s.title} Banner`} />
                  ) : (
                    <div className="poster-fallback">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="media-asset-meta">
                  <h4 className="media-show-title">{s.title}</h4>
                  <span className="media-slot-pill">Hero Banner (16:9 ~1280×720)</span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
