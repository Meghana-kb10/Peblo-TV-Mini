import React from 'react';
import {
  LayoutGrid,
  PlayCircle,
  Send,
  Image as ImageIcon,
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchValidationReport } from '../api/client';

export type SidebarTab = 'catalog' | 'episodes' | 'publish' | 'media' | 'users' | 'settings';

interface Props {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const { data: validationReport } = useQuery({
    queryKey: ['validation-report'],
    queryFn: fetchValidationReport,
    refetchInterval: 15000
  });

  const blockingCount = validationReport?.blocking_count ?? 0;

  return (
    <aside className="studio-sidebar">
      <div className="sidebar-menu-top">
        <button
          className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => onTabChange('catalog')}
        >
          <LayoutGrid size={18} className="sidebar-icon" />
          <span>Catalog</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'episodes' ? 'active' : ''}`}
          onClick={() => onTabChange('episodes')}
        >
          <PlayCircle size={18} className="sidebar-icon" />
          <span>Episodes</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'publish' ? 'active' : ''}`}
          onClick={() => onTabChange('publish')}
        >
          <Send size={18} className="sidebar-icon" />
          <span>Publish & Integrity</span>
          {blockingCount > 0 && (
            <span className="sidebar-badge-count" title={`${blockingCount} blocking issues`}>
              {blockingCount}
            </span>
          )}
        </button>

        <button
          className={`sidebar-item ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => onTabChange('media')}
        >
          <ImageIcon size={18} className="sidebar-icon" />
          <span>Media Library</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => onTabChange('users')}
        >
          <Users size={18} className="sidebar-icon" />
          <span>Users</span>
        </button>

        <div className="sidebar-divider" />

        <button
          className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={18} className="sidebar-icon" />
          <span>Settings</span>
        </button>
      </div>

      {/* Bottom Vignette & Quote */}
      <div className="sidebar-footer-vignette">
        <div className="vignette-artwork">
          <svg viewBox="0 0 200 130" className="vignette-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shelf */}
            <rect x="0" y="115" width="200" height="15" fill="#1b120d" />
            <rect x="0" y="113" width="200" height="3" fill="#2d1e16" />
            {/* Plant Pot */}
            <path d="M35 88 L52 88 L48 113 L38 113 Z" fill="#8c5835" />
            <ellipse cx="43.5" cy="88" rx="8.5" ry="3" fill="#714528" />
            {/* Plant leaves */}
            <path d="M43 86 Q30 65 24 50 Q36 60 43 86" fill="#3b5936" opacity="0.9" />
            <path d="M44 86 Q48 55 58 40 Q53 62 44 86" fill="#4d7246" />
            <path d="M43 86 Q38 50 42 35 Q48 54 43 86" fill="#2d4529" />
            <path d="M42 86 Q20 75 14 70 Q30 78 42 86" fill="#588250" />
            <path d="M44 86 Q62 70 70 65 Q56 78 44 86" fill="#40633b" />
            {/* Books Stack */}
            <rect x="75" y="103" width="62" height="10" rx="2" fill="#523223" />
            <rect x="76" y="105" width="60" height="1" fill="#c49a6c" opacity="0.4" />
            <rect x="78" y="93" width="56" height="10" rx="2" fill="#3a2318" />
            <rect x="79" y="95" width="54" height="1" fill="#c49a6c" opacity="0.4" />
            <rect x="82" y="84" width="50" height="9" rx="2" fill="#6d432f" />
          </svg>
        </div>
        <p className="vignette-quote">
          Great stories<br />
          <em>find their way.</em>
        </p>
      </div>
    </aside>
  );
};
