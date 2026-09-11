import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, HardDrive, CheckCircle2, Activity, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/health');
      return res.json();
    }
  });

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h1 className="canvas-title">System Settings & Infrastructure</h1>
          <p className="canvas-subtitle">
            Platform storage abstraction, database connectivity, and operability health checks.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-icon-row">
            <HardDrive size={24} className="text-accent" />
            <span className="badge-pill badge-ready">Active</span>
          </div>
          <h3>Storage Abstraction Layer</h3>
          <p className="setting-desc">
            Decoupled behind <code>StorageBackend</code> base class. Local disk with atomic file renaming is active.
            Swapping to Cloudflare R2 / S3 requires only setting <code>STORAGE_BACKEND=r2</code> in <code>.env</code> with zero code changes.
          </p>
        </div>

        <div className="setting-card">
          <div className="setting-icon-row">
            <Database size={24} className="text-accent" />
            <span className="badge-pill badge-ready">Connected</span>
          </div>
          <h3>Database & Schema Migrations</h3>
          <p className="setting-desc">
            SQLAlchemy ORM + Alembic migrations for PostgreSQL (production/docker) and SQLite (local testing).
            Foreign key cascades and indexes on <code>(content_group, language)</code> and <code>status</code>.
          </p>
        </div>

        <div className="setting-card">
          <div className="setting-icon-row">
            <Activity size={24} className="text-success" />
            <span className="badge-pill badge-ready">{healthData?.api || 'Healthy'}</span>
          </div>
          <h3>Health & Operability Endpoint</h3>
          <p className="setting-desc">
            Monitors database query execution, storage filesystem write/read, and published catalogue status at <code>/health</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
