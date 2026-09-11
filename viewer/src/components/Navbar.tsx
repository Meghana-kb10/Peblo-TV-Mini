import React, { useState, useEffect } from 'react';
import { Search, X, Globe, Menu, Sparkles } from 'lucide-react';
import { kidsAudio } from '../utils/kidsAudio';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  activeSection: string;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  themeMode: 'sunny' | 'bedtime';
  onToggleTheme: () => void;
  onOpenQuiz: () => void;
  currentMascot: { id: string; name: string; emoji: string; color: string };
  onCycleMascot: (e: React.MouseEvent) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  activeSection,
  onToggleSidebar,
  isSidebarCollapsed,
  themeMode,
  onToggleTheme,
  onOpenQuiz,
  currentMascot,
  onCycleMascot
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`viewer-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Left: Sidebar Toggle & Playful Section Heading */}
        <div className="navbar-left">
          <button
            className="navbar-menu-btn bouncy"
            onClick={() => {
              kidsAudio.playPop();
              onToggleSidebar();
            }}
            title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle navigation sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="navbar-heading-wrap">
            <Sparkles size={15} className="navbar-heading-sparkle" />
            <span className="navbar-heading-text">
              {activeSection === 'home' && 'Kids Universe'}
              {activeSection === 'featured' && 'Featured Adventures'}
              {activeSection === 'series' && 'Story Series'}
              {activeSection === 'minisodes' && 'Short Minisodes'}
              {activeSection === 'songs' && 'Sing-Along Songs'}
            </span>
          </div>
        </div>

        {/* Center: Wide, Centered, Clean Search Bar */}
        <div className="navbar-center">
          <div className="navbar-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search shows, characters, songs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="navbar-search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Aligned Utility Actions with Equal Heights & Clean Breathing Room */}
        <div className="navbar-right">
          {/* Hero Quiz Quick Pill */}
          <button
            className="navbar-pill-btn navbar-quiz-pill bouncy"
            onClick={() => {
              kidsAudio.playChime();
              onOpenQuiz();
            }}
            title="Take the Which Hero Are You? Quiz"
          >
            <span className="pill-emoji">🧩</span>
            <span className="pill-text">Hero Quiz</span>
          </button>

          {/* Routine Mode Switch (Bedtime vs Sunny Day) */}
          <button
            className={`navbar-pill-btn navbar-theme-pill bouncy ${
              themeMode === 'bedtime' ? 'is-bedtime' : 'is-sunny'
            }`}
            onClick={() => {
              kidsAudio.playChime();
              onToggleTheme();
            }}
            title={
              themeMode === 'bedtime'
                ? 'Bedtime Mode Active (Click for Sunny Day)'
                : 'Sunny Day Active (Click for Bedtime Mode)'
            }
          >
            <span className="pill-emoji">{themeMode === 'bedtime' ? '🌙' : '☀️'}</span>
            <span className="pill-text">{themeMode === 'bedtime' ? 'Bedtime' : 'Sunny'}</span>
          </button>

          {/* Audio Language Dropdown Pill */}
          <div className="navbar-lang-pill">
            <Globe size={14} className="lang-icon" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                kidsAudio.playPop();
                onLanguageChange(e.target.value);
              }}
              className="navbar-lang-select"
              title="Filter catalog by audio language"
            >
              <option value="all">All Audio</option>
              <option value="en">English (EN)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>

          {/* Active Mascot Avatar Pill */}
          <button
            className="navbar-pill-btn navbar-mascot-pill bouncy"
            onClick={onCycleMascot}
            style={{ borderColor: currentMascot.color }}
            title={`Active Buddy: ${currentMascot.name} (Tap to change)`}
          >
            <span className="mascot-pill-emoji">{currentMascot.emoji}</span>
            <span className="mascot-pill-name">{currentMascot.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
