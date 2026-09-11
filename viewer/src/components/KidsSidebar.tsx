import React from 'react';
import {
  X,
  Home,
  Star,
  Tv,
  Film,
  Music,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { kidsAudio } from '../utils/kidsAudio';

interface KidsSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeSection: string;
  onSectionSelect: (sec: string) => void;
  themeMode: 'sunny' | 'bedtime';
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenQuiz: () => void;
  currentMascot: { id: string; name: string; emoji: string; color: string };
  onCycleMascot: (e: React.MouseEvent) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onLogoClick: () => void;
}

export const KidsSidebar: React.FC<KidsSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeSection,
  onSectionSelect,
  themeMode,
  onToggleTheme,
  isMuted,
  onToggleSound,
  onOpenQuiz,
  currentMascot,
  onCycleMascot,
  selectedLanguage,
  onLanguageChange,
  onLogoClick
}) => {
  const handleNav = (sec: string) => {
    kidsAudio.playPop();
    onSectionSelect(sec);
    if (isMobileOpen) onCloseMobile();
  };

  const handleQuizClick = () => {
    kidsAudio.playChime();
    if (isMobileOpen) onCloseMobile();
    onOpenQuiz();
  };

  const handleMeetHeroesClick = () => {
    kidsAudio.playPop();
    const el = document.getElementById('section-kids-heroes');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    if (isMobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (only visible on mobile drawer open) */}
      {isMobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />
      )}

      {/* Main Sidebar (Docked on desktop, drawer on mobile) */}
      <aside
        className={`kids-persistent-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Kids Navigation Sidebar"
      >
        {/* Sidebar Header / Brand Logo & Collapse Button */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <>
              <button
                className="sidebar-brand-btn"
                onClick={() => {
                  kidsAudio.playFanfare();
                  onLogoClick();
                  if (isMobileOpen) onCloseMobile();
                }}
                title="Peblo TV Kids Home"
              >
                <div className="brand-badge-icon">
                  <Tv size={18} />
                </div>
                <div className="sidebar-brand-text">
                  <span className="brand-title-text">
                    PEBLO<span className="brand-accent">TV</span>
                  </span>
                  <span className="kids-club-tag">KIDS</span>
                </div>
              </button>

              {/* Desktop Collapse Button */}
              <button
                className="sidebar-collapse-toggle-btn desktop-only"
                onClick={onToggleCollapse}
                title="Collapse sidebar to icon rail"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Mobile Close Button */}
              <button
                className="sidebar-close-btn mobile-only"
                onClick={onCloseMobile}
                title="Close menu"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <div className="sidebar-collapsed-header">
              <button
                className="brand-badge-icon collapsed-logo-btn"
                onClick={() => {
                  kidsAudio.playFanfare();
                  onLogoClick();
                }}
                title="Peblo TV Kids"
              >
                <Tv size={18} />
              </button>
              <button
                className="sidebar-expand-toggle-btn"
                onClick={onToggleCollapse}
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Mascot Explorer Card */}
        {!isCollapsed ? (
          <div
            className="sidebar-mascot-card bouncy"
            style={{ borderColor: currentMascot.color }}
            onClick={onCycleMascot}
            role="button"
            tabIndex={0}
            title="Click to switch your mascot buddy!"
          >
            <div
              className="sidebar-mascot-avatar"
              style={{ backgroundColor: `${currentMascot.color}25` }}
            >
              <span className="mascot-big-emoji">{currentMascot.emoji}</span>
            </div>
            <div className="sidebar-mascot-info">
              <div className="mascot-status-row">
                <span className="mascot-tag" style={{ color: currentMascot.color }}>
                  Buddy
                </span>
                <span className="mascot-switch-hint">Switch ↻</span>
              </div>
              <h4 className="sidebar-mascot-name">{currentMascot.name}</h4>
            </div>
          </div>
        ) : (
          <button
            className="sidebar-collapsed-mascot-btn bouncy"
            onClick={onCycleMascot}
            style={{ borderColor: currentMascot.color }}
            title={`Active Buddy: ${currentMascot.name} (Tap to change)`}
          >
            <span className="collapsed-mascot-emoji">{currentMascot.emoji}</span>
          </button>
        )}

        {/* Scrollable Navigation Area */}
        <div className="sidebar-scrollable-content">
          {/* Main Navigation */}
          <div className="sidebar-nav-section">
            {!isCollapsed && <span className="sidebar-section-title">EXPLORE</span>}
            <nav className="sidebar-nav-menu">
              <button
                className={`sidebar-nav-button ${
                  activeSection === 'home' ? 'active' : ''
                }`}
                onClick={() => handleNav('home')}
                title="Home"
              >
                <Home size={19} className="nav-btn-icon" />
                {!isCollapsed && <span className="nav-btn-text">Home</span>}
                {activeSection === 'home' && <span className="active-dot" />}
              </button>

              <button
                className={`sidebar-nav-button ${
                  activeSection === 'featured' ? 'active' : ''
                }`}
                onClick={() => handleNav('featured')}
                title="Featured Adventures"
              >
                <Star size={19} className="nav-btn-icon" />
                {!isCollapsed && <span className="nav-btn-text">Featured</span>}
                {activeSection === 'featured' && <span className="active-dot" />}
              </button>

              <button
                className={`sidebar-nav-button ${
                  activeSection === 'series' ? 'active' : ''
                }`}
                onClick={() => handleNav('series')}
                title="Series & Shows"
              >
                <Tv size={19} className="nav-btn-icon" />
                {!isCollapsed && <span className="nav-btn-text">Series</span>}
                {activeSection === 'series' && <span className="active-dot" />}
              </button>

              <button
                className={`sidebar-nav-button ${
                  activeSection === 'minisodes' ? 'active' : ''
                }`}
                onClick={() => handleNav('minisodes')}
                title="Short Minisodes"
              >
                <Film size={19} className="nav-btn-icon" />
                {!isCollapsed && <span className="nav-btn-text">Minisodes</span>}
                {activeSection === 'minisodes' && <span className="active-dot" />}
              </button>

              <button
                className={`sidebar-nav-button ${
                  activeSection === 'songs' ? 'active' : ''
                }`}
                onClick={() => handleNav('songs')}
                title="Songs & Sing-Along"
              >
                <Music size={19} className="nav-btn-icon" />
                {!isCollapsed && <span className="nav-btn-text">Songs</span>}
                {activeSection === 'songs' && <span className="active-dot" />}
              </button>
            </nav>
          </div>

          {/* Kid Fun Zone */}
          <div className="sidebar-nav-section">
            {!isCollapsed && <span className="sidebar-section-title">KID FUN ZONE 🎈</span>}
            <div className="sidebar-fun-list">
              <button
                className="sidebar-fun-item quiz-highlight bouncy"
                onClick={handleQuizClick}
                title="Hero Quiz: Which Hero Are You?"
              >
                <span className="fun-item-emoji">🧩</span>
                {!isCollapsed && (
                  <div className="fun-item-text">
                    <span className="fun-item-title">Hero Quiz</span>
                    <span className="fun-item-sub">Discover your buddy!</span>
                  </div>
                )}
              </button>

              <button
                className="sidebar-fun-item bouncy"
                onClick={handleMeetHeroesClick}
                title="Meet the Heroes"
              >
                <span className="fun-item-emoji">🦸</span>
                {!isCollapsed && (
                  <div className="fun-item-text">
                    <span className="fun-item-title">Meet Heroes</span>
                    <span className="fun-item-sub">Voice greetings & trivia</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Settings & Routine Section */}
          <div className="sidebar-nav-section">
            {!isCollapsed && <span className="sidebar-section-title">ROUTINE & AUDIO</span>}
            <div className="sidebar-controls-list">
              {/* Bedtime / Day Mode Toggle */}
              {!isCollapsed ? (
                <div className="sidebar-control-row">
                  <div className="control-label-col">
                    <span className="control-label-title">
                      {themeMode === 'bedtime' ? '🌙 Bedtime Mode' : '☀️ Sunny Day'}
                    </span>
                    <span className="control-label-sub">
                      {themeMode === 'bedtime' ? 'Calming stars & lullabies' : 'Playful daytime energy'}
                    </span>
                  </div>
                  <button
                    className={`sidebar-toggle-switch ${themeMode === 'bedtime' ? 'active' : ''}`}
                    onClick={() => {
                      kidsAudio.playChime();
                      onToggleTheme();
                    }}
                    title="Toggle Bedtime Mode"
                  >
                    <span className="switch-thumb">
                      {themeMode === 'bedtime' ? '🌙' : '☀️'}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  className={`sidebar-collapsed-control-btn bouncy ${
                    themeMode === 'bedtime' ? 'active-bedtime' : ''
                  }`}
                  onClick={() => {
                    kidsAudio.playChime();
                    onToggleTheme();
                  }}
                  title={themeMode === 'bedtime' ? 'Switch to Sunny Day' : 'Switch to Bedtime Mode'}
                >
                  {themeMode === 'bedtime' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              )}

              {/* Sound FX Toggle */}
              {!isCollapsed ? (
                <div className="sidebar-control-row">
                  <div className="control-label-col">
                    <span className="control-label-title">
                      {isMuted ? '🔇 Sound: Muted' : '🔊 Sound: Active'}
                    </span>
                    <span className="control-label-sub">Pops, chimes & fanfares</span>
                  </div>
                  <button
                    className={`sidebar-toggle-switch ${!isMuted ? 'active' : ''}`}
                    onClick={onToggleSound}
                    title="Toggle Sound FX"
                  >
                    <span className="switch-thumb">{!isMuted ? '🔊' : '🔇'}</span>
                  </button>
                </div>
              ) : (
                <button
                  className="sidebar-collapsed-control-btn bouncy"
                  onClick={onToggleSound}
                  title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
                >
                  {!isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              )}

              {/* Audio Language Filter */}
              {!isCollapsed && (
                <div className="sidebar-control-row">
                  <div className="control-label-col">
                    <span className="control-label-title">Audio Language</span>
                    <span className="control-label-sub">Filter catalogue tracks</span>
                  </div>
                  <div className="sidebar-lang-chips">
                    <button
                      className={`lang-chip ${selectedLanguage === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        kidsAudio.playPop();
                        onLanguageChange('all');
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`lang-chip ${selectedLanguage === 'en' ? 'active' : ''}`}
                      onClick={() => {
                        kidsAudio.playPop();
                        onLanguageChange('en');
                      }}
                    >
                      EN
                    </button>
                    <button
                      className={`lang-chip ${selectedLanguage === 'hi' ? 'active' : ''}`}
                      onClick={() => {
                        kidsAudio.playPop();
                        onLanguageChange('hi');
                      }}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Mascot Quote Footer (Only in expanded mode) */}
        {!isCollapsed && (
          <div className="sidebar-quote-box">
            <span className="quote-badge">Tip</span>
            <p className="sidebar-quote-text">
              {currentMascot.id === 'moti' && '“Pack your backpack! Every corner of India has a story!”'}
              {currentMascot.id === 'barnaby' && '“Curious cubs ask the best questions in the woods!”'}
              {currentMascot.id === 'banyan-dadi' && '“Sit beneath the roots, the moon has sweet dreams for you.”'}
              {currentMascot.id === 'pip' && '“One, two, three and four, sing and learn forever more!”'}
              {currentMascot.id === 'rusty' && '“Paws on the trail! Rhyme Rangers never fail!”'}
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
