import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
  HelpCircle,
  Award,
  Heart,
  Shuffle,
  RefreshCw,
  Star
} from 'lucide-react';
import { CatalogShow } from '../api/types';
import { kidsAudio } from '../utils/kidsAudio';
import { launchKidsConfetti } from '../utils/confetti';

interface TriviaCard {
  question: string;
  answer: string;
  emoji: string;
}

interface Character {
  id: string;
  name: string;
  title: string;
  species: string;
  showSlug: string;
  avatar: string;
  greetingText: string;
  superpower: string;
  superpowerStats: { label: string; score: number; icon: string }[];
  trivia: TriviaCard[];
  favorites: { label: string; value: string; emoji: string }[];
  quote: string;
  color: string;
  badgeBg: string;
  bgGradient: string;
}

const HERO_CHARACTERS: Character[] = [
  {
    id: 'moti',
    name: 'Moti the Dog',
    title: 'India’s Adventurous Explorer Dog',
    species: 'Golden Indian Indie Pup 🐕',
    showSlug: 'discover-india-with-moti',
    avatar: '/static/artwork/thumb_discover-india-with-moti.jpg',
    greetingText: 'Woof woof! Pack your backpack, we are exploring India together!',
    superpower: 'Can sniff out ancient secrets & make friends in all 28 states!',
    superpowerStats: [
      { label: 'Super Sniffer', score: 98, icon: '👃' },
      { label: 'Tail-Wag Energy', score: 100, icon: '⚡' },
      { label: 'Friendship Magic', score: 99, icon: '💖' }
    ],
    trivia: [
      {
        question: 'Why does Moti wear a golden compass collar?',
        answer: 'It was gifted by a wise desert camel in Rajasthan to help him navigate!',
        emoji: '🧭'
      },
      {
        question: 'What is Moti’s secret culinary talent?',
        answer: 'He can balance a crispy warm samosa on his nose for 10 full seconds!',
        emoji: '🥟'
      },
      {
        question: 'What happens when Moti hears train whistles?',
        answer: 'He does his signature three-hop happy dance and wags to the beat!',
        emoji: '🚂'
      }
    ],
    favorites: [
      { label: 'Favorite Snack', value: 'Crispy vegetable samosas & fresh milk', emoji: '🥟' },
      { label: 'Favorite Place', value: 'Amber Fort ramparts & the Ghats of Varanasi', emoji: '🏰' },
      { label: 'Best Skill', value: 'Speaking puppy language to peacocks & elephants', emoji: '🦚' }
    ],
    quote: '“Every corner of India has a story waiting to be wagged!”',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 100%)'
  },
  {
    id: 'barnaby',
    name: 'Barnaby Bear Cub',
    title: 'Chief Nature Investigator',
    species: 'Fluffy Brown Bear Cub 🐻',
    showSlug: 'curious-cubs',
    avatar: '/static/artwork/thumb_curious-cubs.jpg',
    greetingText: 'Hello explorer! Did you know trees whisper secret stories in the wind?',
    superpower: 'Can hear tiny bugs whispering under oak leaves & find the sweetest berries!',
    superpowerStats: [
      { label: 'Curiosity Level', score: 100, icon: '🔍' },
      { label: 'Fluffy Hugs', score: 97, icon: '🧸' },
      { label: 'Berry Finding', score: 95, icon: '🫐' }
    ],
    trivia: [
      {
        question: 'Why are Barnaby’s ears always twitching?',
        answer: 'He is listening to bumblebees explaining how honeycombs are built!',
        emoji: '🐝'
      },
      {
        question: 'What is Barnaby’s favorite rain activity?',
        answer: 'Puddle-jumping in muddy boots while singing forest rhythms!',
        emoji: '🌧️'
      },
      {
        question: 'How many questions does Barnaby ask each day?',
        answer: 'At least 127! His favorite is: “Why does morning dew taste so fresh?”',
        emoji: '❓'
      }
    ],
    favorites: [
      { label: 'Favorite Snack', value: 'Wild mountain blackberries & clover honey', emoji: '🍯' },
      { label: 'Favorite Spot', value: 'The Great Whispering Hollow Pine Tree', emoji: '🌲' },
      { label: 'Best Buddy', value: 'Pip the bluebird and Sammy the red squirrel', emoji: '🐿️' }
    ],
    quote: '“Why do birds sing? Why does rain smell like magic? Let’s find out!”',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.08) 100%)'
  },
  {
    id: 'banyan-dadi',
    name: 'Banyan Dadi',
    title: 'Keeper of Ancient Fairy Tales',
    species: 'Wise Grandmother Storyteller 👵✨',
    showSlug: 'tiny-tales-banyan-dadi',
    avatar: '/static/artwork/thumb_tiny-tales-banyan-dadi.jpg',
    greetingText: 'Come sit beneath the roots, little one. The stars have a bedtime secret.',
    superpower: 'Brings ancient folklore to life with glowing magical tree fireflies!',
    superpowerStats: [
      { label: 'Story Wisdom', score: 100, icon: '📜' },
      { label: 'Magic Fireflies', score: 96, icon: '✨' },
      { label: 'Comfort & Love', score: 100, icon: '🌙' }
    ],
    trivia: [
      {
        question: 'What is inside Dadi’s velvet potli pouch?',
        answer: 'Sweet sesame jaggery bites and glowing stardust gathered from full moons!',
        emoji: '👝'
      },
      {
        question: 'How old is Dadi’s sacred Banyan tree?',
        answer: 'Over 300 years old, with roots that have sheltered ten generations of birds!',
        emoji: '🌳'
      },
      {
        question: 'What happens when Dadi hums her lullaby?',
        answer: 'Even the rustling leaves go quiet, and gentle dreams glow in technicolor!',
        emoji: '🎶'
      }
    ],
    favorites: [
      { label: 'Favorite Treat', value: 'Warm cardamom milk with golden saffron', emoji: '🥛' },
      { label: 'Favorite Hour', value: 'Twilight hour when the evening fireflies awaken', emoji: '🌌' },
      { label: 'Greatest Wish', value: 'For every child in the world to sleep with peaceful dreams', emoji: '🌟' }
    ],
    quote: '“Come sit by the roots, my child. The moon has a bedtime story for you.”',
    color: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(109, 40, 217, 0.08) 100%)'
  },
  {
    id: 'pip-robin',
    name: 'Pip & Sunny Chicks',
    title: 'The Math Melody Songbirds',
    species: 'Cheerful Singing Songbirds 🐥🐣',
    showSlug: 'number-nest',
    avatar: '/static/artwork/thumb_number-nest.jpg',
    greetingText: 'Chirp chirp! One, two, three and four, let’s count until we sing for more!',
    superpower: 'Turns counting and arithmetic into catchy, bouncy musical games!',
    superpowerStats: [
      { label: 'Musical Pitch', score: 99, icon: '🎵' },
      { label: 'Math Speed', score: 94, icon: '🔢' },
      { label: 'Wing Flutter', score: 98, icon: '🪶' }
    ],
    trivia: [
      {
        question: 'How high can Pip count?',
        answer: 'All the way to a million, counting one apple blossom at a time!',
        emoji: '🍎'
      },
      {
        question: 'What is the Feather Hopscotch game?',
        answer: 'Hop on one leaf, chirp on two leaves, do a loop-the-loop on three!',
        emoji: '🍃'
      },
      {
        question: 'Where do Pip and Sunny sleep at night?',
        answer: 'In a nest woven from lavender twigs, fluffy dandelion down, and soft moss!',
        emoji: '🪺'
      }
    ],
    favorites: [
      { label: 'Favorite Food', value: 'Sweet sunflower seeds and juicy wild elderberries', emoji: '🌻' },
      { label: 'Favorite Number', value: 'The number 7, because it has all 7 rainbow colors', emoji: '🌈' },
      { label: 'Favorite Song', value: '“The Bouncing Acorn March in C Major”', emoji: '🎺' }
    ],
    quote: '“One, two, three and four, count with us and learn much more!”',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(219, 39, 119, 0.08) 100%)'
  },
  {
    id: 'ranger-rusty',
    name: 'Ranger Rusty Fox',
    title: 'Squad Captain of the Rhyme Rangers',
    species: 'Clever Red Fox Superhero 🦊⚡',
    showSlug: 'rhyme-rangers',
    avatar: '/static/artwork/thumb_rhyme-rangers.jpg',
    greetingText: 'Paws on the trail! Whenever mystery strikes the land, we lend a hand!',
    superpower: 'Solves tricky forest riddles with lightning-fast rhyming superpowers!',
    superpowerStats: [
      { label: 'Rhyme Agility', score: 98, icon: '⚡' },
      { label: 'Hero Bravery', score: 96, icon: '🛡️' },
      { label: 'Trail Speed', score: 99, icon: '🐾' }
    ],
    trivia: [
      {
        question: 'Why does Rusty wear a golden cape?',
        answer: 'It transforms into a hang-glider when leaping across canyon treetops!',
        emoji: '🦸'
      },
      {
        question: 'What is the Rhyme Rangers pledge?',
        answer: '“Always be kind, sharpen your mind, leave no friend behind!”',
        emoji: '🤝'
      },
      {
        question: 'Can Rusty outsmart forest mazes?',
        answer: 'Every single time! He follows compass moss and solves tree riddle gates!',
        emoji: '🧩'
      }
    ],
    favorites: [
      { label: 'Hero Gadget', value: 'The Golden Solar Rhyme Compass & Grappling Vine', emoji: '⚙️' },
      { label: 'Favorite Snack', value: 'Crunchy red honeycrisp apples with cinnamon', emoji: '🍎' },
      { label: 'Ranger Catchphrase', value: '“No mystery too tall, we solve them one and all!”', emoji: '🦊' }
    ],
    quote: '“Whenever mystery strikes the land, the Rhyme Rangers lend a hand!”',
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(234, 88, 12, 0.08) 100%)'
  },
  {
    id: 'tusker',
    name: 'Tusker the Elephant',
    title: 'Master Drummer & Rhythm King',
    species: 'Baby Musical Elephant 🐘🥁',
    showSlug: 'peblo-songs',
    avatar: '/static/artwork/thumb_peblo-songs.jpg',
    greetingText: 'Boom-chaka-boom! Tap your feet, feel the groove, Peblo songs make you move!',
    superpower: 'Can make a thunderstorm sound like an irresistible festive dance beat!',
    superpowerStats: [
      { label: 'Rhythm Groove', score: 100, icon: '🥁' },
      { label: 'Trunk Trumpet', score: 97, icon: '🎺' },
      { label: 'Joy Factor', score: 100, icon: '🎉' }
    ],
    trivia: [
      {
        question: 'What is Tusker’s trunk used for during concerts?',
        answer: 'Blasting triumphant trumpet fanfares and showering the crowd with confetti water!',
        emoji: '💦'
      },
      {
        question: 'What is Tusker’s drum set made of?',
        answer: 'Hollowed giant coconut shells, mahogany wood, and tight bamboo skins!',
        emoji: '🥥'
      },
      {
        question: 'What happens at Tusker’s jungle dance parties?',
        answer: 'Even the sleepiest sloth hangs upside down and taps their claws to the beat!',
        emoji: '🦥'
      }
    ],
    favorites: [
      { label: 'Favorite Snack', value: 'Sweet sugarcane bundles and roasted peanuts', emoji: '🥜' },
      { label: 'Favorite Beat', value: 'The 4/4 Jungle Polka Stamp', emoji: '🪘' },
      { label: 'Signature Move', value: 'The Double-Ear Flap and 360 Trunk Spin', emoji: '🎪' }
    ],
    quote: '“Tap your feet, feel the groove, Peblo songs will make you move!”',
    color: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(8, 145, 178, 0.08) 100%)'
  }
];

interface CharacterSpotlightProps {
  catalogShows: CatalogShow[];
  onSelectShow: (show: CatalogShow) => void;
  onOpenQuiz?: () => void;
}

export const CharacterSpotlight: React.FC<CharacterSpotlightProps> = ({
  catalogShows,
  onSelectShow,
  onOpenQuiz
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'superpowers' | 'trivia' | 'favorites'>('superpowers');
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const hero = HERO_CHARACTERS[currentIndex];
  const matchingShow = catalogShows.find((s) => s.slug === hero.showSlug);

  // Auto play timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_CHARACTERS.length);
      setFlippedCards({});
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleSelectHero = (index: number) => {
    kidsAudio.playPop();
    setCurrentIndex(index);
    setFlippedCards({});
  };

  const handleNext = () => {
    kidsAudio.playPop();
    setCurrentIndex((prev) => (prev + 1) % HERO_CHARACTERS.length);
    setFlippedCards({});
  };

  const handlePrev = () => {
    kidsAudio.playPop();
    setCurrentIndex((prev) => (prev - 1 + HERO_CHARACTERS.length) % HERO_CHARACTERS.length);
    setFlippedCards({});
  };

  const handleRandomHero = () => {
    kidsAudio.playChime();
    let nextIdx = Math.floor(Math.random() * HERO_CHARACTERS.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % HERO_CHARACTERS.length;
    }
    setCurrentIndex(nextIdx);
    setFlippedCards({});
  };

  const handleHearGreeting = () => {
    setIsPlayingAudio(true);
    kidsAudio.playCharacterVoice(hero.id);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleFlipCard = (idx: number) => {
    kidsAudio.playChime();
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleWatchShow = (e: React.MouseEvent) => {
    kidsAudio.playFanfare();
    launchKidsConfetti(e.clientX, e.clientY);
    if (matchingShow) {
      onSelectShow(matchingShow);
    }
  };

  return (
    <section className="character-spotlight-section" id="section-kids-heroes">
      {/* Playful Section Header */}
      <div className="spotlight-header">
        <div className="spotlight-title-group">
          <span className="spotlight-badge" style={{ backgroundColor: hero.badgeBg, color: hero.color }}>
            <Sparkles size={15} className="inline-icon" />
            MEET THE HEROES & LEARN THEIR SECRETS!
          </span>
          <h2 className="spotlight-heading">
            Kids Hero Adventure Slider <span className="hero-emoji-accent">✨</span>
          </h2>
          <p className="spotlight-subheading">
            Tap a hero to hear their voice greeting, inspect their superpowers, flip secret trivia cards, and jump into their shows!
          </p>
        </div>

        {/* Header Controls: Quiz + Randomizer + Slider Navigation */}
        <div className="spotlight-controls-dock">
          {onOpenQuiz && (
            <button
              className="spotlight-btn-quiz bouncy"
              onClick={() => {
                kidsAudio.playChime();
                onOpenQuiz();
              }}
              title="Which Hero Are You? Take the fun 10-second quiz!"
            >
              <span className="quiz-tag-icon">🧩</span>
              <span>Take Kid Quiz!</span>
            </button>
          )}

          <button
            className="spotlight-btn-random"
            onClick={handleRandomHero}
            title="Pick a Random Hero Friend!"
          >
            <Shuffle size={15} />
            <span>Random Friend</span>
          </button>

          <div className="spotlight-nav-arrows">
            <button className="spotlight-arrow-btn" onClick={handlePrev} title="Previous Hero">
              <ChevronLeft size={22} />
            </button>
            <span className="spotlight-pager-text">
              {currentIndex + 1} / {HERO_CHARACTERS.length}
            </span>
            <button className="spotlight-arrow-btn" onClick={handleNext} title="Next Hero">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Interactive Hero Avatars Selector Bar */}
      <div className="hero-avatar-picker-bar">
        {HERO_CHARACTERS.map((char, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <button
              key={char.id}
              className={`hero-avatar-pill ${isSelected ? 'active' : ''}`}
              style={{
                borderColor: isSelected ? char.color : 'transparent',
                backgroundColor: isSelected ? `${char.color}25` : 'rgba(255,255,255,0.04)'
              }}
              onClick={() => handleSelectHero(idx)}
            >
              <div className="avatar-pill-circle" style={{ borderColor: char.color }}>
                <img src={char.avatar} alt={char.name} />
              </div>
              <span className="avatar-pill-label">{char.name.split(' ')[0]}</span>
              {isSelected && <span className="avatar-pill-sparkle">★</span>}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Showcase Card */}
      <div
        className="character-card-feature"
        style={{
          background: hero.bgGradient,
          borderColor: hero.color,
          boxShadow: `0 20px 50px ${hero.color}25`
        }}
      >
        {/* Left Column: Big Character Portrait + Greeting Speech Bubble + Audio Button */}
        <div className="character-art-col">
          <div className="character-avatar-halo" style={{ boxShadow: `0 0 50px ${hero.color}45` }}>
            <img src={hero.avatar} alt={hero.name} className="character-avatar-img" />
            <span className="character-species-pill" style={{ backgroundColor: hero.color }}>
              {hero.species}
            </span>
          </div>

          {/* Interactive Speech Greeting Bubble */}
          <div className="character-speech-bubble" style={{ borderColor: `${hero.color}50` }}>
            <p className="speech-quote">“{hero.greetingText}”</p>
            <div className="speech-pointer" style={{ borderTopColor: `${hero.color}50` }} />
          </div>

          {/* Hear My Voice Audio Button */}
          <button
            className={`btn-hear-voice ${isPlayingAudio ? 'anim-pulsing' : ''}`}
            style={{ backgroundColor: hero.color }}
            onClick={handleHearGreeting}
            title="Listen to this character's joyful sound!"
          >
            <Volume2 size={18} className="inline-icon" />
            <span>{isPlayingAudio ? 'Speaking now! 🎶' : `Hear ${hero.name.split(' ')[0]}'s Voice!`}</span>
            {isPlayingAudio && (
              <span className="sound-wave-bars">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </span>
            )}
          </button>
        </div>

        {/* Right Column: Hero Details, Interactive Tabs (Superpowers / Trivia / Favorites), and Watch Button */}
        <div className="character-details-col">
          <div className="char-badge-row">
            <span className="char-role-badge" style={{ backgroundColor: hero.badgeBg, color: hero.color }}>
              <Award size={14} className="inline-icon" /> {hero.title}
            </span>
          </div>

          <h3 className="character-name-display">{hero.name}</h3>

          {/* Interactive Detail Subtabs */}
          <div className="hero-subtabs-row">
            <button
              className={`hero-subtab-btn ${activeTab === 'superpowers' ? 'active' : ''}`}
              style={{
                borderColor: activeTab === 'superpowers' ? hero.color : 'transparent',
                color: activeTab === 'superpowers' ? hero.color : 'var(--text-secondary)'
              }}
              onClick={() => {
                kidsAudio.playPop();
                setActiveTab('superpowers');
              }}
            >
              🌟 Superpowers
            </button>
            <button
              className={`hero-subtab-btn ${activeTab === 'trivia' ? 'active' : ''}`}
              style={{
                borderColor: activeTab === 'trivia' ? hero.color : 'transparent',
                color: activeTab === 'trivia' ? hero.color : 'var(--text-secondary)'
              }}
              onClick={() => {
                kidsAudio.playPop();
                setActiveTab('trivia');
              }}
            >
              💡 Secret Trivia (Tap to Flip!)
            </button>
            <button
              className={`hero-subtab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              style={{
                borderColor: activeTab === 'favorites' ? hero.color : 'transparent',
                color: activeTab === 'favorites' ? hero.color : 'var(--text-secondary)'
              }}
              onClick={() => {
                kidsAudio.playPop();
                setActiveTab('favorites');
              }}
            >
              🎒 Favorites & Treats
            </button>
          </div>

          {/* Subtab 1: Superpowers & Meter Bars */}
          {activeTab === 'superpowers' && (
            <div className="hero-tab-content-panel anim-fade-in">
              <div className="superpower-hero-desc-box">
                <span className="stat-icon-large">⚡</span>
                <p className="superpower-desc-text">{hero.superpower}</p>
              </div>

              <div className="superpower-meters-grid">
                {hero.superpowerStats.map((stat) => (
                  <div key={stat.label} className="power-meter-item">
                    <div className="power-meter-header">
                      <span className="power-meter-title">
                        {stat.icon} {stat.label}
                      </span>
                      <span className="power-meter-val" style={{ color: hero.color }}>
                        {stat.score}%
                      </span>
                    </div>
                    <div className="power-meter-bar-track">
                      <div
                        className="power-meter-bar-fill"
                        style={{ width: `${stat.score}%`, backgroundColor: hero.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab 2: Interactive Flip Cards Trivia */}
          {activeTab === 'trivia' && (
            <div className="hero-tab-content-panel anim-fade-in">
              <div className="trivia-cards-grid">
                {hero.trivia.map((t, idx) => {
                  const isFlipped = Boolean(flippedCards[idx]);
                  return (
                    <div
                      key={idx}
                      className={`trivia-card-flip-wrap ${isFlipped ? 'flipped' : ''}`}
                      onClick={() => handleFlipCard(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="trivia-card-inner">
                        {/* Front: Question */}
                        <div
                          className="trivia-card-front"
                          style={{ borderColor: `${hero.color}40` }}
                        >
                          <span className="trivia-card-emoji">{t.emoji}</span>
                          <p className="trivia-question-text">{t.question}</p>
                          <span className="trivia-tap-hint" style={{ color: hero.color }}>
                            ✨ Tap to reveal answer!
                          </span>
                        </div>

                        {/* Back: Secret Answer */}
                        <div
                          className="trivia-card-back"
                          style={{ backgroundColor: `${hero.color}20`, borderColor: hero.color }}
                        >
                          <span className="trivia-card-emoji">🎉</span>
                          <p className="trivia-answer-text">{t.answer}</p>
                          <span className="trivia-tap-hint">Tap again to flip</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtab 3: Favorites & Treats */}
          {activeTab === 'favorites' && (
            <div className="hero-tab-content-panel anim-fade-in">
              <div className="character-stats-grid">
                {hero.favorites.map((fav) => (
                  <div key={fav.label} className="char-stat-card">
                    <span className="stat-icon-wrapper">{fav.emoji}</span>
                    <div>
                      <span className="char-stat-label">{fav.label}</span>
                      <p className="char-stat-value">{fav.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar: Jump directly into show with Confetti Burst! */}
          <div className="character-action-bar">
            {matchingShow ? (
              <button
                className="btn-watch-hero-show"
                style={{ backgroundColor: hero.color }}
                onClick={handleWatchShow}
              >
                <Play size={20} fill="currentColor" />
                <span>Watch {matchingShow.title}</span>
              </button>
            ) : (
              <button
                className="btn-watch-hero-show"
                style={{ backgroundColor: hero.color }}
                onClick={handleNext}
              >
                <span>Meet Next Friend ➔</span>
              </button>
            )}

            <span className="char-interactive-hint">
              🎈 Flip cards, listen to voices, or click watch for a magical adventure!
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
