import React from 'react';
import { Tv, ShieldCheck, ShieldAlert, AlertTriangle, Layers, Send } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchValidationReport } from '../api/client';

interface Props {
  activeTab: 'catalog' | 'publish';
  onTabChange: (tab: 'catalog' | 'publish') => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const { role, setRole, isAdmin } = useAuth();

  const { data: validationReport } = useQuery({
    queryKey: ['validation-report'],
    queryFn: fetchValidationReport,
    refetchInterval: 15000
  });

  const blockingCount = validationReport?.blocking_count ?? 0;

  return (
    <header className="cms-navbar">
      <div className="navbar-brand">
        <div className="brand-logo-container">
          <Tv className="brand-icon" size={24} />
        </div>
        <div className="brand-text">
          <span className="brand-title">Peblo TV Studio</span>
          <span className="brand-subtitle">Internal CMS & Pipeline</span>
        </div>
      </div>

      <nav className="navbar-links">
        <button
          className={`nav-link-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => onTabChange('catalog')}
        >
          <Layers size={18} />
          <span>Content Catalog</span>
        </button>

        <button
          className={`nav-link-btn ${activeTab === 'publish' ? 'active' : ''}`}
          onClick={() => onTabChange('publish')}
        >
          <Send size={18} />
          <span>Publish & Integrity</span>
          {blockingCount > 0 ? (
            <span className="badge-pill badge-blockers" title={`${blockingCount} blocking issues prevent publish`}>
              <AlertTriangle size={12} />
              {blockingCount}
            </span>
          ) : (
            <span className="badge-pill badge-ready" title="Catalog is ready to publish">
              Ready
            </span>
          )}
        </button>
      </nav>

      <div className="navbar-actions">
        <div className="role-selector-wrapper">
          <span className="role-label">Active Role:</span>
          <div className="role-pill-toggle">
            <button
              type="button"
              className={`role-pill ${role === 'editor' ? 'role-active editor' : ''}`}
              onClick={() => setRole('editor')}
              title="Editor: can view, create, edit and delete shows/episodes, but CANNOT publish"
            >
              <ShieldAlert size={14} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              className={`role-pill ${role === 'admin' ? 'role-active admin' : ''}`}
              onClick={() => setRole('admin')}
              title="Admin: full privileges including atomic catalogue publication"
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
