import React from 'react';
import { SearchX, RotateCcw, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
  selectedCategory?: string;
  selectedLanguage?: string;
  onClearFilters: () => void;
  onSelectSuggestion?: (term: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  selectedCategory,
  selectedLanguage,
  onClearFilters,
  onSelectSuggestion
}) => {
  const suggestions = ['Moti', 'Cubs', 'Songs', 'Rhyme', 'Tales'];

  return (
    <div className="viewer-empty-state-card">
      <div className="empty-state-icon-box">
        <SearchX size={44} className="text-muted" />
      </div>

      <h3 className="empty-state-title">No Shows Found</h3>

      <p className="empty-state-description">
        {searchQuery ? (
          <>
            We couldn't find any shows matching <span className="highlight-term">"{searchQuery}"</span>
            {selectedCategory && selectedCategory !== 'all' && ` in ${selectedCategory}`}
            {selectedLanguage && selectedLanguage !== 'all' && ` (${selectedLanguage.toUpperCase()})`}.
          </>
        ) : (
          <>No titles match the selected category and audio filters.</>
        )}
      </p>

      {/* Suggested Search Terms */}
      <div className="empty-suggestions-box">
        <span className="suggestions-label">
          <Sparkles size={13} className="inline-icon text-gold" /> Popular searches:
        </span>
        <div className="suggestions-chips">
          {suggestions.map((term) => (
            <button
              key={term}
              className="suggestion-chip"
              onClick={() => onSelectSuggestion && onSelectSuggestion(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Action */}
      <button className="btn-clear-filters" onClick={onClearFilters}>
        <RotateCcw size={16} />
        <span>Clear All Filters</span>
      </button>
    </div>
  );
};
