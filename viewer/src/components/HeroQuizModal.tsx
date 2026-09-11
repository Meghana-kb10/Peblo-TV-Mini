import React, { useState } from 'react';
import { X, Sparkles, Check, RotateCcw, Play, Award, Heart } from 'lucide-react';
import { CatalogShow } from '../api/types';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface QuizQuestion {
  title: string;
  subtitle: string;
  options: {
    id: string;
    text: string;
    emoji: string;
    heroId: string;
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    title: 'Pick your dream afternoon treat! 😋',
    subtitle: 'What sounds the yummiest right now?',
    options: [
      { id: 'opt-samosa', text: 'Crispy Warm Samosas', emoji: '🥟', heroId: 'moti' },
      { id: 'opt-honey', text: 'Wild Forest Berries & Honey', emoji: '🫐', heroId: 'barnaby' },
      { id: 'opt-milk', text: 'Warm Cardamom Milk & Jaggery', emoji: '🥛', heroId: 'banyan-dadi' },
      { id: 'opt-seeds', text: 'Sweet Musical Elderberry Seeds', emoji: '🌻', heroId: 'pip' },
      { id: 'opt-apple', text: 'Crunchy Honeycrisp Apples', emoji: '🍎', heroId: 'rusty' },
      { id: 'opt-peanut', text: 'Sugarcane Sticks & Peanuts', emoji: '🥜', heroId: 'tusker' }
    ]
  },
  {
    title: 'Choose your secret superpower! ⚡',
    subtitle: 'If you had one magical gift, what would it be?',
    options: [
      { id: 'opt-sniff', text: 'Super-Sniffing & Wagging Energy', emoji: '🐕', heroId: 'moti' },
      { id: 'opt-listen', text: 'Hearing Bugs Whisper Under Leaves', emoji: '🐻', heroId: 'barnaby' },
      { id: 'opt-firefly', text: 'Story Magic with Glowing Fireflies', emoji: '✨', heroId: 'banyan-dadi' },
      { id: 'opt-math', text: 'Singing Numbers into Bouncy Songs', emoji: '🐥', heroId: 'pip' },
      { id: 'opt-rhyme', text: 'Lightning Rhymes & Heroic Gliding', emoji: '🦊', heroId: 'rusty' },
      { id: 'opt-groove', text: 'Drum Beats that make Animals Dance', emoji: '🥁', heroId: 'tusker' }
    ]
  },
  {
    title: 'Where do you want to explore today? 🚀',
    subtitle: 'Pack your imaginary backpack!',
    options: [
      { id: 'opt-india', text: 'Ancient Palaces & Forts Across India', emoji: '🏰', heroId: 'moti' },
      { id: 'opt-forest', text: 'The Whispering Hollow Oak Forest', emoji: '🌲', heroId: 'barnaby' },
      { id: 'opt-tree', text: 'Under the 300-Year-Old Banyan Tree', emoji: '🌳', heroId: 'banyan-dadi' },
      { id: 'opt-nest', text: 'A Fluffy Moss Nest High in the Sky', emoji: '🪺', heroId: 'pip' },
      { id: 'opt-trail', text: 'Secret Rescue Trails with Canyon Jumps', emoji: '⛰️', heroId: 'rusty' },
      { id: 'opt-stage', text: 'A Rainbow Stage for a Jungle Concert', emoji: '🎪', heroId: 'tusker' }
    ]
  }
];

interface HeroResultInfo {
  id: string;
  name: string;
  title: string;
  species: string;
  avatar: string;
  showSlug: string;
  quote: string;
  badge: string;
  color: string;
}

const HERO_RESULTS: Record<string, HeroResultInfo> = {
  moti: {
    id: 'moti',
    name: 'Moti the Dog 🐕',
    title: 'The Loyal & Adventurous Explorer',
    species: 'Golden Indian Indie Pup',
    avatar: '/static/artwork/thumb_discover-india-with-moti.jpg',
    showSlug: 'discover-india-with-moti',
    quote: '“Every corner of India has a story waiting to be wagged!”',
    badge: '🐾 Chief Explorer of India',
    color: '#f59e0b'
  },
  barnaby: {
    id: 'barnaby',
    name: 'Barnaby Bear Cub 🐻',
    title: 'The Curious Nature Investigator',
    species: 'Fluffy Brown Bear Cub',
    avatar: '/static/artwork/thumb_curious-cubs.jpg',
    showSlug: 'curious-cubs',
    quote: '“Why do birds sing? Why does rain smell so fresh? Let’s find out!”',
    badge: '🌿 Woodland Nature Master',
    color: '#10b981'
  },
  'banyan-dadi': {
    id: 'banyan-dadi',
    name: 'Banyan Dadi 👵✨',
    title: 'The Gentle Keeper of Ancient Fairy Tales',
    species: 'Wise Grandmother Storyteller',
    avatar: '/static/artwork/thumb_tiny-tales-banyan-dadi.jpg',
    showSlug: 'tiny-tales-banyan-dadi',
    quote: '“Come sit by the roots, my child. The moon has a bedtime story for you.”',
    badge: '🌙 Guardian of Sweet Dreams',
    color: '#8b5cf6'
  },
  pip: {
    id: 'pip',
    name: 'Pip & Sunny Songbirds 🐥',
    title: 'The Joyful Math Melody Birds',
    species: 'Singing Songbirds',
    avatar: '/static/artwork/thumb_number-nest.jpg',
    showSlug: 'number-nest',
    quote: '“One, two, three and four, count with us and learn much more!”',
    badge: '🎵 Melody Math Champion',
    color: '#ec4899'
  },
  rusty: {
    id: 'rusty',
    name: 'Ranger Rusty Fox 🦊⚡',
    title: 'Squad Captain of the Rhyme Rangers',
    species: 'Clever Red Fox Superhero',
    avatar: '/static/artwork/thumb_rhyme-rangers.jpg',
    showSlug: 'rhyme-rangers',
    quote: '“Whenever mystery strikes the land, the Rhyme Rangers lend a hand!”',
    badge: '🦸 Superhero Trailblazer',
    color: '#f97316'
  },
  tusker: {
    id: 'tusker',
    name: 'Tusker the Elephant 🐘🥁',
    title: 'Master Drummer & Rhythm King',
    species: 'Baby Musical Elephant',
    avatar: '/static/artwork/thumb_peblo-songs.jpg',
    showSlug: 'peblo-songs',
    quote: '“Tap your feet, feel the groove, Peblo songs will make you move!”',
    badge: '🎉 Rhythm Celebration Master',
    color: '#06b6d4'
  }
};

interface HeroQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogShows: CatalogShow[];
  onSelectShow: (show: CatalogShow) => void;
}

export const HeroQuizModal: React.FC<HeroQuizModalProps> = ({
  isOpen,
  onClose,
  catalogShows,
  onSelectShow
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedHeroScores, setSelectedHeroScores] = useState<string[]>([]);
  const [resultHero, setResultHero] = useState<HeroResultInfo | null>(null);

  if (!isOpen) return null;

  const currentQ = QUIZ_QUESTIONS[currentStep];

  const handleSelectOption = (heroId: string, e: React.MouseEvent) => {
    kidsAudio.playPop();
    const updated = [...selectedHeroScores, heroId];
    setSelectedHeroScores(updated);

    if (currentStep + 1 < QUIZ_QUESTIONS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Calculate winner
      const counts: Record<string, number> = {};
      for (const h of updated) {
        counts[h] = (counts[h] || 0) + 1;
      }
      let topHero = updated[0];
      let maxCount = 0;
      for (const [h, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          topHero = h;
        }
      }
      const match = HERO_RESULTS[topHero] || HERO_RESULTS.moti;
      setResultHero(match);
      kidsAudio.playFanfare();
      launchKidsConfetti(e.clientX, e.clientY);
    }
  };

  const handleReset = () => {
    kidsAudio.playPop();
    setCurrentStep(0);
    setSelectedHeroScores([]);
    setResultHero(null);
  };

  const handleWatchShow = (showSlug: string, e: React.MouseEvent) => {
    kidsAudio.playFanfare();
    launchKidsConfetti(e.clientX, e.clientY);
    const show = catalogShows.find((s) => s.slug === showSlug);
    if (show) {
      onSelectShow(show);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="quiz-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="Close Quiz">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="quiz-header">
          <span className="quiz-tag-pill">
            <Sparkles size={14} className="inline-icon" />
            10-SECOND KID QUIZ
          </span>
          <h3 className="quiz-modal-title">Which Peblo Hero Are You? 🧩</h3>
          {!resultHero && (
            <div className="quiz-progress-dots">
              {QUIZ_QUESTIONS.map((_, idx) => (
                <span
                  key={idx}
                  className={`quiz-dot ${idx === currentStep ? 'active' : ''} ${
                    idx < currentStep ? 'completed' : ''
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Body: Active Question vs Results */}
        {!resultHero ? (
          <div className="quiz-question-box anim-fade-in" key={currentStep}>
            <h4 className="quiz-question-heading">{currentQ.title}</h4>
            <p className="quiz-question-sub">{currentQ.subtitle}</p>

            <div className="quiz-options-grid">
              {currentQ.options.map((opt) => (
                <button
                  key={opt.id}
                  className="quiz-option-btn bouncy"
                  onClick={(e) => handleSelectOption(opt.heroId, e)}
                >
                  <span className="quiz-opt-emoji">{opt.emoji}</span>
                  <span className="quiz-opt-text">{opt.text}</span>
                </button>
              ))}
            </div>

            <span className="quiz-footer-hint">Tap any answer to jump to the next question! ✨</span>
          </div>
        ) : (
          <div className="quiz-result-box anim-fade-in" style={{ borderColor: resultHero.color }}>
            <div className="quiz-result-header">
              <span className="quiz-result-sparkle">🎉 YOUR PERFECT MATCH IS HERE! 🎉</span>
              <h2 className="quiz-result-name" style={{ color: resultHero.color }}>
                {resultHero.name}
              </h2>
              <span className="quiz-result-badge" style={{ backgroundColor: `${resultHero.color}25`, color: resultHero.color }}>
                <Award size={14} className="inline-icon" /> {resultHero.badge}
              </span>
            </div>

            <div className="quiz-result-avatar-wrap" style={{ boxShadow: `0 0 40px ${resultHero.color}50` }}>
              <img src={resultHero.avatar} alt={resultHero.name} className="quiz-result-img" />
            </div>

            <blockquote className="quiz-result-quote">
              {resultHero.quote}
            </blockquote>

            <div className="quiz-result-actions">
              <button
                className="btn-quiz-watch bouncy"
                style={{ backgroundColor: resultHero.color }}
                onClick={(e) => handleWatchShow(resultHero.showSlug, e)}
              >
                <Play size={18} fill="currentColor" />
                <span>Watch My Show Now!</span>
              </button>

              <button className="btn-quiz-retry" onClick={handleReset}>
                <RotateCcw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
