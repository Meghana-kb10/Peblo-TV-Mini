import React, { useState, useRef, useEffect } from 'react';
import { Tv, ChevronDown, Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TopHeader: React.FC = () => {
  const { role, setRole, username } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="studio-topheader">
      <div className="topheader-left">
        <div className="retro-tv-icon-box">
          <Tv size={20} className="retro-tv-icon" />
        </div>
        <div className="topheader-brand">
          <span className="brand-name">Peblo TV Studio</span>
          <span className="brand-sep">|</span>
          <span className="brand-context">Content Management</span>
        </div>
      </div>

      <div className="topheader-right" ref={dropdownRef}>
        <button
          className="user-profile-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
        >
          <div className="user-avatar-circle">
            <span>MK</span>
          </div>
          <div className="user-profile-text">
            <span className="user-name">Meghana</span>
            <span className="user-role-badge">
              {role === 'admin' ? 'Administrator' : 'Editor'}
            </span>
          </div>
          <ChevronDown size={14} className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="role-dropdown-menu">
            <div className="dropdown-header">
              <span className="dropdown-label">Simulate Role Permission:</span>
            </div>

            <button
              className={`role-option-item ${role === 'editor' ? 'active' : ''}`}
              onClick={() => {
                setRole('editor');
                setDropdownOpen(false);
              }}
            >
              <div className="role-option-left">
                <ShieldAlert size={16} className="text-amber" />
                <div>
                  <div className="role-option-title">Content Editor</div>
                  <div className="role-option-desc">Can create, edit & delete content. Cannot publish (403).</div>
                </div>
              </div>
              {role === 'editor' && <Check size={16} className="text-accent" />}
            </button>

            <button
              className={`role-option-item ${role === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setRole('admin');
                setDropdownOpen(false);
              }}
            >
              <div className="role-option-left">
                <ShieldCheck size={16} className="text-success" />
                <div>
                  <div className="role-option-title">Platform Admin</div>
                  <div className="role-option-desc">Full access including atomic catalogue publication.</div>
                </div>
              </div>
              {role === 'admin' && <Check size={16} className="text-accent" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
