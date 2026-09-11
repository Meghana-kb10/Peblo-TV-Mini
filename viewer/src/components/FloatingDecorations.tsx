import React from 'react';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface FloatingDecorationsProps {
  themeMode?: 'sunny' | 'bedtime';
}

export const FloatingDecorations: React.FC<FloatingDecorationsProps> = ({
  themeMode = 'sunny'
}) => {
  const handlePop = (e: React.MouseEvent) => {
    kidsAudio.playPop();
    launchKidsConfetti(e.clientX, e.clientY);
  };

  return (
    <div className={`kids-floating-decorations ${themeMode}`} aria-hidden="false">
      {/* Floating Sparkle Stars (Clickable for pops!) */}
      <span className="floating-star star-1" onClick={handlePop} role="button" tabIndex={-1} title="Pop me!">✨</span>
      <span className="floating-star star-2" onClick={handlePop} role="button" tabIndex={-1} title="Pop me!">⭐</span>
      <span className="floating-star star-3" onClick={handlePop} role="button" tabIndex={-1} title="Pop me!">🌟</span>
      <span className="floating-star star-4" onClick={handlePop} role="button" tabIndex={-1} title="Pop me!">✨</span>
      <span className="floating-star star-5" onClick={handlePop} role="button" tabIndex={-1} title="Pop me!">⭐</span>

      {/* Floating Pastel Bubbles (Click to pop with confetti!) */}
      <span className="floating-bubble bubble-1" onClick={handlePop} role="button" tabIndex={-1} title="Pop the bubble!" />
      <span className="floating-bubble bubble-2" onClick={handlePop} role="button" tabIndex={-1} title="Pop the bubble!" />
      <span className="floating-bubble bubble-3" onClick={handlePop} role="button" tabIndex={-1} title="Pop the bubble!" />
      <span className="floating-bubble bubble-4" onClick={handlePop} role="button" tabIndex={-1} title="Pop the bubble!" />

      {/* Mode-Specific Playful Stickers */}
      {themeMode === 'bedtime' ? (
        <>
          <span className="floating-sticker sticker-moon" onClick={handlePop} role="button" tabIndex={-1} title="Nighty night!">🌙</span>
          <span className="floating-sticker sticker-owl" onClick={handlePop} role="button" tabIndex={-1} title="Hoo hoo!">🦉</span>
          <span className="floating-sticker sticker-sleep-cloud" onClick={handlePop} role="button" tabIndex={-1} title="Sweet dreams!">💤</span>
        </>
      ) : (
        <>
          <span className="floating-sticker sticker-cloud" onClick={handlePop} role="button" tabIndex={-1} title="Happy cloud!">☁️</span>
          <span className="floating-sticker sticker-balloon" onClick={handlePop} role="button" tabIndex={-1} title="Pop the balloon!">🎈</span>
          <span className="floating-sticker sticker-rainbow" onClick={handlePop} role="button" tabIndex={-1} title="Rainbow magic!">🌈</span>
        </>
      )}
    </div>
  );
};
