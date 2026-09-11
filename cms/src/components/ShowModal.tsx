import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Sparkles } from 'lucide-react';
import { Show } from '../api/types';
import { createShow, updateShow } from '../api/client';
import { ArtworkUploadSlot } from './ArtworkUploadSlot';

const ALLOWED_SECTIONS = ['featured', 'series', 'minisodes', 'songs'];
const ALLOWED_CATEGORIES = [
  'adventure', 'folk', 'friendship', 'india', 'language', 'learning',
  'maths', 'music', 'nature', 'reading', 'science', 'singalong',
  'stories', 'travel', 'values'
];

interface Props {
  show?: Show | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ShowModal: React.FC<Props> = ({ show, isOpen, onClose, onSaved }) => {
  const isEditing = Boolean(show?.id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [section, setSection] = useState<string>('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [categories, setCategories] = useState<string[]>([]);
  const [synopsis, setSynopsis] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setTitle(show.title);
      setSlug(show.slug);
      setSection(show.section || '');
      setStatus(show.status);
      setCategories(show.categories || []);
      setSynopsis(show.synopsis || '');
    } else {
      setTitle('');
      setSlug('');
      setSection('series');
      setStatus('published');
      setCategories(['adventure']);
      setSynopsis('');
    }
    setErrorMessage(null);
  }, [show, isOpen]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing) {
      // Auto-generate slug
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side guidance check
    if (status === 'published' && !section) {
      setErrorMessage('A published show must have a section assigned (e.g. Featured, Series, Minisodes, Songs).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && show) {
        await updateShow(show.id, {
          title,
          slug,
          section: section || null,
          status,
          categories,
          synopsis
        });
      } else {
        await createShow({
          title,
          slug,
          section: section || null,
          status,
          categories,
          synopsis
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Failed to save show.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-large">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{isEditing ? `Edit Show: ${show?.title}` : 'Create New Show'}</h2>
            <span className="modal-subtitle">Configure show metadata, taxonomy, and promotional artwork</span>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && (
            <div className="artwork-alert alert-error">
              <AlertCircle size={18} className="alert-icon" />
              <div className="alert-content">{errorMessage}</div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Show Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. The Story Tree"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">URL Slug *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. the-story-tree"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Catalogue Section {status === 'published' ? '*' : '(Optional for Draft)'}
              </label>
              <select
                className={`form-select ${status === 'published' && !section ? 'input-warning' : ''}`}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="">-- No Section (Unassigned) --</option>
                {ALLOWED_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec.toUpperCase()} Row
                  </option>
                ))}
              </select>
              {status === 'published' && !section && (
                <span className="field-hint text-amber">Published shows require an assigned section to appear in the viewer.</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Publication Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
              >
                <option value="published">Published (Visible in catalogue once published)</option>
                <option value="draft">Draft (Hidden from catalogue)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Categories (Select all that apply)</label>
            <div className="tags-selector">
              {ALLOWED_CATEGORIES.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`tag-chip ${selected ? 'tag-selected' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {selected && <Sparkles size={12} className="mr-1" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Synopsis / Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brief description for the viewer hero and show detail card..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
            />
          </div>

          {/* Show-Level Artwork Upload (Poster and Hero Banner) */}
          {isEditing && show && (
            <div className="form-section">
              <h3 className="section-subtitle">Show Artwork Assets</h3>
              <p className="section-caption">
                Upload promotional artwork for browse rows (Poster) and the viewer featured hero (Banner).
              </p>
              <div className="artwork-slots-grid">
                <ArtworkUploadSlot
                  artworkType="poster"
                  currentUrl={show.artwork?.poster}
                  showId={show.id}
                  onUploaded={() => onSaved()}
                />
                <ArtworkUploadSlot
                  artworkType="banner"
                  currentUrl={show.artwork?.banner}
                  showId={show.id}
                  onUploaded={() => onSaved()}
                />
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Show' : 'Create Show'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
