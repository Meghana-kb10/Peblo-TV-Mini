import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublishedCatalog, searchCatalog } from './api/catalogClient';
import { CatalogShow } from './api/types';
import { Navbar } from './components/Navbar';
import { KidsSidebar } from './components/KidsSidebar';
import { HeroBanner } from './components/HeroBanner';
import { CharacterSpotlight } from './components/CharacterSpotlight';
import { KidsEpisodeSlider } from './components/KidsEpisodeSlider';
import { SectionRow } from './components/SectionRow';
import { ShowDetailModal } from './components/ShowDetailModal';
import { SearchResultsGrid } from './components/SearchResultsGrid';
import { PlaybackModal } from './components/PlaybackModal';
import { FloatingDecorations } from './components/FloatingDecorations';
import { HeroQuizModal } from './components/HeroQuizModal';
import { Film, AlertCircle, Sparkles, Compass } from 'lucide-react';
import { kidsAudio } from './utils/kidsAudio';
import { launchKidsConfetti } from './utils/confetti';
import './styles/viewer.css';

const KID_MASCOTS = [
  { id: 'moti', name: 'Moti', emoji: '🐕', color: '#f59e0b' },
  { id: 'barnaby', name: 'Barnaby', emoji: '🐻', color: '#10b981' },
  { id: 'banyan-dadi', name: 'Dadi', emoji: '👵✨', color: '#8b5cf6' },
  { id: 'pip', name: 'Pip', emoji: '🐥', color: '#ec4899' },
  { id: 'rusty', name: 'Rusty', emoji: '🦊', color: '#f97316' }
];

export const App: React.FC = () => {
  // Theme & Routine Mode (Sunny Day vs Cozy Bedtime)
  const [themeMode, setThemeMode] = useState<'sunny' | 'bedtime'>(() => {
    try {
      const saved = localStorage.getItem('peblo_theme_mode');
      return saved === 'bedtime' ? 'bedtime' : 'sunny';
    } catch {
      return 'sunny';
    }
  });

  // Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [activeSection, setActiveSection] = useState('home');

  // Interactive Modals & Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('peblo_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [detailShow, setDetailShow] = useState<CatalogShow | null>(null);
  const [isMuted, setIsMuted] = useState(kidsAudio.isMuted());
  const [mascotIdx, setMascotIdx] = useState(0);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('peblo_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const [playbackData, setPlaybackData] = useState<{
    title: string;
    type: 'episode' | 'trailer';
    language?: string;
  } | null>(null);

  // Toggle Theme Mode
  const handleToggleTheme = () => {
    const nextMode = themeMode === 'sunny' ? 'bedtime' : 'sunny';
    setThemeMode(nextMode);
    try {
      localStorage.setItem('peblo_theme_mode', nextMode);
    } catch {}
  };

  const handleToggleSound = () => {
    const next = kidsAudio.toggleMute();
    setIsMuted(next);
  };

  const handleCycleMascot = (e: React.MouseEvent) => {
    const next = (mascotIdx + 1) % KID_MASCOTS.length;
    setMascotIdx(next);
    kidsAudio.playPop();
    launchKidsConfetti(e.clientX, e.clientY);
  };

  const currentMascot = KID_MASCOTS[mascotIdx];

  // 1. Fetch Published Catalog (Decoupled from admin/db)
  const {
    data: catalog,
    isLoading: isCatalogLoading,
    error: catalogError,
    refetch: refetchCatalog
  } = useQuery({
    queryKey: ['published-catalog'],
    queryFn: fetchPublishedCatalog,
    staleTime: 60_000
  });

  // 2. Composable Search Query (triggers when search query, category, or language is active)
  const isSearchMode = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'all' ||
    selectedLanguage !== 'all'
  );

  const {
    data: searchData,
    isLoading: isSearchLoading
  } = useQuery({
    queryKey: ['catalog-search', searchQuery, selectedCategory, selectedLanguage],
    queryFn: () =>
      searchCatalog({
        q: searchQuery.trim(),
        category: selectedCategory,
        language: selectedLanguage
      }),
    enabled: isSearchMode
  });

  // Flatten all shows for character spotlight and hero slider
  const allShows = useMemo(() => {
    if (!catalog || !catalog.sections) return [];
    const set = new Map<string, CatalogShow>();
    for (const sec of catalog.sections) {
      for (const show of sec.shows) {
        if (!set.has(show.id)) {
          set.set(show.id, show);
        }
      }
    }
    return Array.from(set.values());
  }, [catalog]);

  // Featured shows for the interactive Hero Slider
  const heroShows = useMemo(() => {
    if (allShows.length === 0) return [];
    return allShows.slice(0, 5);
  }, [allShows]);

  const handleClearFilters = () => {
    kidsAudio.playPop();
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLanguage('all');
    setActiveSection('home');
  };

  const handleSelectSuggestion = (term: string) => {
    kidsAudio.playPop();
    setSearchQuery(term);
  };

  const handleSectionSelect = (secId: string) => {
    setActiveSection(secId);
    if (secId !== 'home') {
      const el = document.getElementById(`section-${secId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlayEpisodeFromHero = (show: CatalogShow) => {
    const firstEp = show.seasons?.[0]?.episodes?.[0];
    const epTitle = firstEp ? `${show.title} — ${firstEp.title}` : show.title;
    setPlaybackData({
      title: epTitle,
      type: 'episode',
      language: firstEp?.languages?.[0] || 'en'
    });
  };

  return (
    <div
      className={`viewer-app-shell ${
        themeMode === 'bedtime' ? 'theme-bedtime' : 'theme-sunny'
      } ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
    >
      {/* Playful Floating Background Atmosphere (Stars, Bubbles, Clouds / Moon) */}
      <FloatingDecorations themeMode={themeMode} />

      {/* Docked Left Sidebar (Persistent on desktop, drawer on mobile) */}
      <KidsSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        activeSection={activeSection}
        onSectionSelect={handleSectionSelect}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onOpenQuiz={() => setIsQuizOpen(true)}
        currentMascot={currentMascot}
        onCycleMascot={handleCycleMascot}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        onLogoClick={() => {
          handleClearFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Content wrapper alongside the sidebar */}
      <div className="viewer-content-wrapper">
        {/* Top Fixed Navbar (Clean, Centered, De-Cluttered) */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          activeSection={activeSection}
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          onOpenQuiz={() => setIsQuizOpen(true)}
          currentMascot={currentMascot}
          onCycleMascot={handleCycleMascot}
        />

        {/* Main Content Area */}
        <main className="viewer-main-content">
        {/* Loading State */}
        {isCatalogLoading && !isSearchMode && (
          <div className="search-grid-loading" style={{ minHeight: '60vh', justifyContent: 'center' }}>
            <div className="loading-spinner-ring" />
            <p>Loading Peblo TV magical universe... 🎈</p>
          </div>
        )}

        {/* Error State */}
        {catalogError && !isSearchMode && (
          <div className="viewer-empty-state-card" style={{ marginTop: '120px' }}>
            <AlertCircle size={44} className="text-muted" style={{ color: '#ef4444' }} />
            <h3 className="empty-state-title">Catalogue Unavailable</h3>
            <p className="empty-state-description">
              {(catalogError as any).message || 'Failed to load published catalog.'}
            </p>
            <button className="btn-clear-filters" onClick={() => refetchCatalog()}>
              Retry
            </button>
          </div>
        )}

        {/* View Mode 1: Search & Filter Grid */}
        {isSearchMode ? (
          <SearchResultsGrid
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            shows={searchData?.results || []}
            isLoading={isSearchLoading}
            onSelectShow={(show) => setDetailShow(show)}
            onClearFilters={handleClearFilters}
            onSelectSuggestion={handleSelectSuggestion}
          />
        ) : (
          /* View Mode 2: Joyful Kids Home (Hero Slider + Character Explorer + Popular Episodes + Section Rows) */
          catalog && (
            <>
              {/* Interactive Multi-Show Hero Slider */}
              {heroShows.length > 0 && (
                <HeroBanner
                  shows={heroShows}
                  onOpenDetail={(s) => setDetailShow(s)}
                  onPlayEpisode={handlePlayEpisodeFromHero}
                />
              )}

              {/* Interactive Character Spotlight & Story Slider for Kids */}
              <CharacterSpotlight
                catalogShows={allShows}
                onSelectShow={(s) => setDetailShow(s)}
                onOpenQuiz={() => setIsQuizOpen(true)}
              />

              {/* Interactive Kids Popular Episodes Slider */}
              <KidsEpisodeSlider
                catalogShows={allShows}
                onPlayEpisode={(show, ep) => {
                  const epTitle = `${show.title} — ${ep.title}`;
                  setPlaybackData({
                    title: epTitle,
                    type: 'episode',
                    language: ep.languages?.[0] || 'en'
                  });
                }}
                onOpenShow={(s) => setDetailShow(s)}
              />

              {/* Horizontal 2:3 Poster Section Rows */}
              <div className="viewer-rows-container">
                {catalog.sections.map((section) => (
                  <SectionRow
                    key={section.section_id}
                    title={section.title}
                    sectionId={section.section_id}
                    shows={section.shows}
                    onSelectShow={(s) => setDetailShow(s)}
                    onPlayShow={handlePlayEpisodeFromHero}
                  />
                ))}
              </div>
            </>
          )
        )}
      </main>

      {/* Show Detail Modal */}
      <ShowDetailModal
        show={detailShow}
        onClose={() => setDetailShow(null)}
        onPlayMedia={(title, type, lang) => {
          setPlaybackData({ title, type, language: lang });
        }}
      />

      {/* "Which Hero Are You?" Interactive Kid Quiz Modal */}
      <HeroQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        catalogShows={allShows}
        onSelectShow={(s) => setDetailShow(s)}
      />

      {/* Playback Simulation Modal */}
      {playbackData && (
        <PlaybackModal
          title={playbackData.title}
          type={playbackData.type}
          language={playbackData.language}
          onClose={() => setPlaybackData(null)}
        />
      )}

      {/* Footer */}
      <footer className="viewer-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            PEBLO<span className="brand-accent">TV</span> <span className="kids-club-tag">KIDS</span>
          </div>
          <p className="footer-copy">
            Pure static catalogue client. Designed for joyful kids, curious minds, and family entertainment.
          </p>
          {catalog && (
            <span className="footer-version-tag">
              Catalog v{catalog.catalogue_version} • Published {new Date(catalog.published_at).toLocaleDateString()} • {catalog.counts.shows} Shows • {catalog.counts.episodes} Episodes
            </span>
          )}
        </div>
      </footer>
      </div>
    </div>
  );
};
