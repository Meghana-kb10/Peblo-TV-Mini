import React from 'react';
import { ShieldCheck, ShieldAlert, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { role, setRole } = useAuth();

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h1 className="canvas-title">Role & User Access Control</h1>
          <p className="canvas-subtitle">
            Role-based security rules enforced strictly on the backend API layer.
          </p>
        </div>
      </div>

      <div className="roles-info-grid">
        <div className={`role-card ${role === 'editor' ? 'selected' : ''}`}>
          <div className="role-card-header">
            <ShieldAlert size={28} className="text-amber" />
            <div>
              <h3>Content Editor (CRUD Only)</h3>
              <span className="role-sub">Default content team privileges</span>
            </div>
          </div>
          <ul className="role-features-list">
            <li>✓ Can browse and filter shows and episodes</li>
            <li>✓ Can create and update metadata</li>
            <li>✓ Can upload and validate artwork</li>
            <li>✓ Can view the live validation report</li>
            <li>✗ <strong>Cannot publish catalogue</strong> (Server returns HTTP 403 Forbidden)</li>
          </ul>
          <button
            className={`btn-role-action ${role === 'editor' ? 'active' : ''}`}
            onClick={() => setRole('editor')}
          >
            {role === 'editor' ? 'Active Role' : 'Switch to Editor'}
          </button>
        </div>

        <div className={`role-card ${role === 'admin' ? 'selected' : ''}`}>
          <div className="role-card-header">
            <ShieldCheck size={28} className="text-success" />
            <div>
              <h3>Platform Administrator (CRUD + Publish)</h3>
              <span className="role-sub">Elevated platform engineer & lead privileges</span>
            </div>
          </div>
          <ul className="role-features-list">
            <li>✓ Full access to all CRUD operations</li>
            <li>✓ Can run database migrations and inspections</li>
            <li>✓ <strong>Authorized to trigger atomic catalogue publication</strong></li>
            <li>✓ Full access to publish history and audit logs</li>
          </ul>
          <button
            className={`btn-role-action ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            {role === 'admin' ? 'Active Role' : 'Switch to Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};
