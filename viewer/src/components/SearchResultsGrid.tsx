import React from 'react';
import { Filter, Sparkles, X } from 'lucide-react';
import { CatalogShow } from '../api/types';
import { ShowCard } from './ShowCard';
import { EmptyState } from './EmptyState';

const POPULAR_CATEGORIES = [
  'all',
  'adventure',
  'learning',
  'nature',
  'science',
  'stories',
  'music',
  'singalong',
  'travel',
  'friendship'
];

interface SearchResultsGridProps {
  searchQuery: string;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  shows: CatalogShow[];
  isLoading: boolean;
  onSelectShow: (show: CatalogShow) => void;
  onClearFilters: () => void;
  onSelectSuggestion: (term: string) => void;
}

export const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  searchQuery,
  selectedCategory,
  onCategoryChange,
  selectedLanguage,
  onLanguageChange,
  shows,
  isLoading,
  onSelectShow,
  onClearFilters,
  onSelectSuggestion
}) => {
  return (
    <div className="search-results-page-container">
      {/* Category Pills Filter Bar */}
      <div className="search-filters-bar">
        <div className="categories-scroll-row">
          <span className="filter-prefix-label">
            <Filter size={14} className="inline-icon" /> Category:
          </span>
          {POPULAR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                className={`category-filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onCategoryChange(cat)}
              >
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="search-results-header">
        <div>
          <h2 className="search-results-headline">
            {searchQuery ? (
              <>Results for <span className="text-white">"{searchQuery}"</span></>
            ) : selectedCategory !== 'all' ? (
              <>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Shows</>
            ) : selectedLanguage !== 'all' ? (
              <>{selectedLanguage.toUpperCase()} Audio Shows</>
            ) : (
              <>All Shows Catalog</>
            )}
          </h2>
          <span className="results-count-text">
            {isLoading ? 'Searching...' : `${shows.length} ${shows.length === 1 ? 'title' : 'titles'} found`}
          </span>
        </div>

        {(searchQuery || selectedCategory !== 'all' || selectedLanguage !== 'all') && (
          <button className="btn-reset-filters-sm" onClick={onClearFilters}>
            <X size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Results Grid or Empty State */}
      {isLoading ? (
        <div className="search-grid-loading">
          <div className="loading-spinner-ring" />
          <p>Searching published catalogue...</p>
        </div>
      ) : shows.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          selectedLanguage={selectedLanguage}
          onClearFilters={onClearFilters}
          onSelectSuggestion={onSelectSuggestion}
        />
      ) : (
        <div className="search-posters-grid">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onSelect={onSelectShow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
