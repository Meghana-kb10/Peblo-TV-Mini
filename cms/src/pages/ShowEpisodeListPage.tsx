import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  MoreVertical,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  Globe2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { fetchShows, fetchEpisodes, deleteShow, deleteEpisode } from '../api/client';
import { Show, Episode } from '../api/types';
import { ShowModal } from '../components/ShowModal';
import { EpisodeModal } from '../components/EpisodeModal';

const CATEGORIES = [
  'adventure', 'folk', 'friendship', 'india', 'language', 'learning',
  'maths', 'music', 'nature', 'reading', 'science', 'singalong',
  'stories', 'travel', 'values'
];

interface Props {
  initialTab?: 'shows' | 'episodes';
}

export const ShowEpisodeListPage: React.FC<Props> = ({ initialTab = 'shows' }) => {
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<'shows' | 'episodes'>(initialTab);

  // Filters matching screenshot
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isNewShowOpen, setIsNewShowOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

  const [isNewEpisodeOpen, setIsNewEpisodeOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);

  // Dropdown actions menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Query shows
  const {
    data: allShows = [],
    isLoading: isShowsLoading,
    error: showsError
  } = useQuery({
    queryKey: ['shows', selectedSection, selectedStatus, searchTerm],
    queryFn: () =>
      fetchShows({
        section: selectedSection,
        status: selectedStatus,
        search: searchTerm
      })
  });

  // Client-side category filter on shows
  const filteredShows = allShows.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.categories && s.categories.includes(selectedCategory);
  });

  // Query episodes
  const {
    data: episodesData,
    isLoading: isEpisodesLoading,
    error: episodesError
  } = useQuery({
    queryKey: ['episodes', selectedSection, selectedStatus, selectedLanguage, searchTerm, page],
    queryFn: () =>
      fetchEpisodes({
        section: selectedSection,
        status: selectedStatus,
        language: selectedLanguage,
        search: searchTerm,
        page,
        limit: 15
      }),
    enabled: activeSubTab === 'episodes'
  });

  // Delete mutations
  const deleteShowMutation = useMutation({
    mutationFn: deleteShow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
    }
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
    }
  });

  const handleDeleteShow = async (show: Show) => {
    if (window.confirm(`Are you sure you want to delete show "${show.title}" and all its seasons/episodes?`)) {
      try {
        await deleteShowMutation.mutateAsync(show.id);
      } catch (err: any) {
        alert(err.detail || 'Failed to delete show');
      }
    }
  };

  const handleDeleteEpisode = async (episode: Episode) => {
    if (window.confirm(`Are you sure you want to delete episode "${episode.episode_title}" (${episode.id})?`)) {
      try {
        await deleteEpisodeMutation.mutateAsync(episode.id);
      } catch (err: any) {
        alert(err.detail || 'Failed to delete episode');
      }
    }
  };

  // Pagination calculations for shows
  const totalShows = filteredShows.length;
  const paginatedShows = filteredShows.slice((page - 1) * pageSize, page * pageSize);
  const totalShowPages = Math.ceil(totalShows / pageSize) || 1;

  // Pagination for episodes
  const totalEpisodePages = episodesData ? Math.ceil(episodesData.total / 15) : 1;

  return (
    <div className="canvas-card">
      {/* Page Header */}
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h1 className="canvas-title">Catalog Inventory</h1>
          <p className="canvas-subtitle">Manage shows, seasons, episodes and artwork for Peblo TV.</p>
        </div>

        {activeSubTab === 'shows' ? (
          <button className="btn-dark-pill" onClick={() => setIsNewShowOpen(true)}>
            <Plus size={16} />
            <span>Add Show</span>
          </button>
        ) : (
          <button className="btn-dark-pill" onClick={() => setIsNewEpisodeOpen(true)}>
            <Plus size={16} />
            <span>Add Episode</span>
          </button>
        )}
      </div>

      {/* Subtabs: Shows (8) | Episodes (95) */}
      <div className="canvas-subtabs">
        <button
          className={`subtab-pill ${activeSubTab === 'shows' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('shows');
            setPage(1);
          }}
        >
          <LayoutGrid size={15} />
          <span>Shows ({filteredShows.length})</span>
        </button>

        <button
          className={`subtab-pill ${activeSubTab === 'episodes' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('episodes');
            setPage(1);
          }}
        >
          <PlayCircle size={15} />
          <span>Episodes ({episodesData?.total ?? 95})</span>
        </button>
      </div>

      {/* Filter Toolbar matching screenshot */}
      <div className="inventory-toolbar">
        <div className="search-pill-box">
          <Search size={16} className="search-icon-muted" />
          <input
            type="text"
            className="search-input-bare"
            placeholder={
              activeSubTab === 'shows'
                ? 'Search shows by title or slug...'
                : 'Search episodes by title, episode ID, or show...'
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="dropdown-filter-group">
          <div className="select-with-label">
            <span className="select-label">Section</span>
            <select
              className="styled-select"
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Sections</option>
              <option value="featured">Featured</option>
              <option value="series">Series</option>
              <option value="minisodes">Minisodes</option>
              <option value="songs">Songs</option>
            </select>
          </div>

          <div className="select-with-label">
            <span className="select-label">Status</span>
            <select
              className="styled-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {activeSubTab === 'shows' ? (
            <div className="select-with-label">
              <span className="select-label">Category</span>
              <select
                className="styled-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="select-with-label">
              <span className="select-label">Language</span>
              <select
                className="styled-select"
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Languages</option>
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Shows Table View matching screenshot */}
      {activeSubTab === 'shows' && (
        <div className="table-wrapper">
          {isShowsLoading ? (
            <div className="table-feedback-box">Loading shows catalogue...</div>
          ) : showsError ? (
            <div className="table-feedback-box error">Failed to load shows: {(showsError as any).message}</div>
          ) : filteredShows.length === 0 ? (
            <div className="table-feedback-box">No shows found matching your filters.</div>
          ) : (
            <table className="editorial-table">
              <thead>
                <tr>
                  <th style={{ width: '64px' }}>Poster</th>
                  <th>Title & Slug</th>
                  <th>Section</th>
                  <th>Categories</th>
                  <th>Episodes</th>
                  <th>Status</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShows.map((show) => {
                  const sectionClass = show.section ? `section-${show.section.toLowerCase()}` : 'section-missing';

                  return (
                    <tr key={show.id}>
                      <td>
                        <div className="table-poster-thumb">
                          {show.artwork?.poster ? (
                            <img src={show.artwork.poster} alt={show.title} />
                          ) : (
                            <div className="poster-fallback">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="title-and-slug">
                          <span className="table-item-title">{show.title}</span>
                          <span className="table-item-slug">{show.slug}</span>
                        </div>
                      </td>
                      <td>
                        {show.section ? (
                          <span className={`pill-section ${sectionClass}`}>
                            {show.section.toUpperCase()}
                          </span>
                        ) : (
                          <span className="pill-section section-missing" title="Missing section blocks catalogue publish!">
                            NO SECTION
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="categories-chips-row">
                          {show.categories?.map((cat) => (
                            <span key={cat} className="chip-category">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="text-episodes-count">{show.episodes_count || 0} episodes</span>
                      </td>
                      <td>
                        {show.status === 'published' ? (
                          <span className="status-indicator-dot published">
                            <span className="dot-symbol">●</span> Published
                          </span>
                        ) : (
                          <span className="status-indicator-dot draft">
                            <span className="dot-symbol">!</span> Draft
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell">
                          <button
                            className="btn-action-icon"
                            title="Edit Show"
                            onClick={() => setEditingShow(show)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <div className="more-menu-wrapper">
                            <button
                              className="btn-action-icon"
                              title="Options"
                              onClick={() => setActiveMenuId(activeMenuId === show.id ? null : show.id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeMenuId === show.id && (
                              <div className="floating-action-menu">
                                <button
                                  className="menu-option delete"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDeleteShow(show);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Show</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination Footer */}
          <div className="table-pagination-row">
            <span className="pagination-text">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalShows)} of {totalShows} shows
            </span>

            <div className="pagination-controls-box">
              <button
                className="page-btn-arrow"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalShowPages }, (_, idx) => idx + 1).map((pNum) => (
                <button
                  key={pNum}
                  className={`page-btn-number ${page === pNum ? 'active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                className="page-btn-arrow"
                onClick={() => setPage((p) => Math.min(totalShowPages, p + 1))}
                disabled={page >= totalShowPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episodes Table View */}
      {activeSubTab === 'episodes' && (
        <div className="table-wrapper">
          {isEpisodesLoading ? (
            <div className="table-feedback-box">Loading episodes inventory...</div>
          ) : episodesError ? (
            <div className="table-feedback-box error">Failed to load episodes: {(episodesError as any).message}</div>
          ) : !episodesData || episodesData.items.length === 0 ? (
            <div className="table-feedback-box">No episodes found matching your filters.</div>
          ) : (
            <>
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>ID</th>
                    <th>Show & Episode Title</th>
                    <th>Season / Ep</th>
                    <th>Lang</th>
                    <th>Content Group</th>
                    <th>Duration</th>
                    <th>Artwork Slots</th>
                    <th>Status</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {episodesData.items.map((ep) => {
                    const hasPoster = ep.artwork?.poster;
                    const hasBanner = ep.artwork?.banner;
                    const hasThumbnail = ep.artwork?.thumbnail;

                    return (
                      <tr key={ep.id}>
                        <td>
                          <span className="id-code-tag">{ep.id}</span>
                        </td>
                        <td>
                          <div className="title-and-slug">
                            <span className="table-item-title">{ep.episode_title}</span>
                            <span className="table-item-slug">{ep.show_title}</span>
                          </div>
                        </td>
                        <td>
                          <span className="season-number-tag">
                            {ep.season_number === 0 ? 'S00 (Trailer)' : `S${String(ep.season_number).padStart(2, '0')} E${String(ep.episode_number).padStart(2, '0')}`}
                          </span>
                        </td>
                        <td>
                          <span className={`chip-lang lang-${ep.language}`}>
                            {ep.language.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="cg-code-text" title="Content group key for multilingual collapsing">
                            {ep.content_group}
                          </span>
                        </td>
                        <td>
                          <span className="duration-tag">
                            <Clock size={12} className="mr-1" />
                            {ep.duration_seconds
                              ? `${Math.floor(ep.duration_seconds / 60)}m ${ep.duration_seconds % 60}s`
                              : <span className="text-danger font-semibold">Missing</span>}
                          </span>
                        </td>
                        <td>
                          <div className="art-slot-indicators" title="Slots: Poster, Banner, Thumbnail">
                            <span className={`slot-dot ${hasPoster ? 'ok' : 'miss'}`}>P</span>
                            <span className={`slot-dot ${hasBanner ? 'ok' : 'miss'}`}>B</span>
                            <span className={`slot-dot ${hasThumbnail ? 'ok' : 'miss'}`}>T</span>
                          </div>
                        </td>
                        <td>
                          {ep.status === 'published' ? (
                            <span className="status-indicator-dot published">
                              <span className="dot-symbol">●</span> Published
                            </span>
                          ) : (
                            <span className="status-indicator-dot draft">
                              <span className="dot-symbol">!</span> Draft
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell">
                            <button
                              className="btn-action-icon"
                              title="Edit Episode & Upload Artwork"
                              onClick={() => setEditingEpisode(ep)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <div className="more-menu-wrapper">
                              <button
                                className="btn-action-icon"
                                title="Options"
                                onClick={() => setActiveMenuId(activeMenuId === ep.id ? null : ep.id)}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === ep.id && (
                                <div className="floating-action-menu">
                                  <button
                                    className="menu-option delete"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDeleteEpisode(ep);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Episode</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Episodes Pagination */}
              <div className="table-pagination-row">
                <span className="pagination-text">
                  Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, episodesData.total)} of {episodesData.total} episodes
                </span>

                <div className="pagination-controls-box">
                  <button
                    className="page-btn-arrow"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalEpisodePages) }, (_, idx) => idx + 1).map((pNum) => (
                    <button
                      key={pNum}
                      className={`page-btn-number ${page === pNum ? 'active' : ''}`}
                      onClick={() => setPage(pNum)}
                    >
                      {pNum}
                    </button>
                  ))}
                  <button
                    className="page-btn-arrow"
                    onClick={() => setPage((p) => Math.min(totalEpisodePages, p + 1))}
                    disabled={page >= totalEpisodePages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Show Modal */}
      <ShowModal
        isOpen={isNewShowOpen || Boolean(editingShow)}
        show={editingShow}
        onClose={() => {
          setIsNewShowOpen(false);
          setEditingShow(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['shows'] });
          queryClient.invalidateQueries({ queryKey: ['validation-report'] });
        }}
      />

      {/* Episode Modal */}
      <EpisodeModal
        isOpen={isNewEpisodeOpen || Boolean(editingEpisode)}
        episode={editingEpisode}
        onClose={() => {
          setIsNewEpisodeOpen(false);
          setEditingEpisode(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['episodes'] });
          queryClient.invalidateQueries({ queryKey: ['validation-report'] });
        }}
      />
    </div>
  );
};
