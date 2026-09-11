import React, { useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Check, Globe } from 'lucide-react';

interface PlaybackModalProps {
  title: string;
  type: 'episode' | 'trailer';
  language?: string;
  onClose: () => void;
}

export const PlaybackModal: React.FC<PlaybackModalProps> = ({
  title,
  type,
  language = 'en',
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(12);

  // Auto-progress simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="playback-backdrop-overlay" onClick={onClose}>
      <div
        className="playback-player-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button className="playback-close-btn" onClick={onClose} title="Exit Playback">
          <X size={22} />
        </button>

        {/* Video Canvas Simulation */}
        <div className="player-canvas">
          <div className="player-pulse-ring" />
          <div className="player-brand-watermark">PEBLO TV</div>

          <div className="player-center-info">
            <span className="player-media-badge">
              {type === 'trailer' ? 'OFFICIAL TEASER' : 'NOW PLAYING'}
            </span>
            <h3 className="player-media-title">{title}</h3>
            <span className="player-audio-track">
              <Globe size={13} className="inline-icon" />
              Audio Track: {language === 'hi' ? 'Hindi (हिंदी)' : 'English (Stereo)'}
            </span>
          </div>

          {/* Bottom Video Controls Bar */}
          <div className="player-controls-dock">
            {/* Progress Bar */}
            <div className="player-timeline-bar">
              <div className="player-timeline-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="player-dock-buttons">
              <div className="dock-left">
                <button
                  className="dock-ctrl-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>

                <button
                  className="dock-ctrl-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <span className="dock-time-text">0:45 / 12:30</span>
              </div>

              <div className="dock-right">
                <span className="dock-quality-pill">1080p HD</span>
                <button className="dock-ctrl-btn" title="Fullscreen">
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
