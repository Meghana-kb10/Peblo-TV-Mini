import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Layers,
  Film,
  AlertCircle,
  ExternalLink,
  History,
  FileCheck
} from 'lucide-react';
import { fetchValidationReport, publishCatalog, fetchPublishHistory } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const PublishPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role, setRole, isAdmin } = useAuth();

  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState<string | null>(null);
  const [publishSuccessToast, setPublishSuccessToast] = useState<{
    message: string;
    durationMs: number;
    showCount: number;
    episodeCount: number;
  } | null>(null);

  // Queries
  const {
    data: report,
    isLoading: isReportLoading,
    error: reportError,
    refetch: refetchReport,
    isFetching: isReportFetching
  } = useQuery({
    queryKey: ['validation-report'],
    queryFn: fetchValidationReport
  });

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['publish-history'],
    queryFn: () => fetchPublishHistory(15)
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: publishCatalog,
    onSuccess: (data) => {
      setPermissionDeniedMessage(null);
      setPublishSuccessToast({
        message: 'Catalog published successfully to storage!',
        durationMs: data.duration_ms,
        showCount: data.show_count,
        episodeCount: data.episode_count
      });
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
      queryClient.invalidateQueries({ queryKey: ['validation-report'] });
    },
    onError: (err: any) => {
      if (err.status === 403) {
        setPermissionDeniedMessage(
          err.detail || 'Permission denied: Publishing requires the Admin role. You are currently acting as Editor.'
        );
      } else {
        alert(`Publish Failed: ${err.detail || err.message}`);
      }
    }
  });

  const handlePublishClick = () => {
    setPermissionDeniedMessage(null);
    setPublishSuccessToast(null);

    // If currently Editor, this triggers the backend 403 to prove backend enforcement!
    publishMutation.mutate();
  };

  const isPublishable = report?.is_publishable ?? false;
  const blockingCount = report?.blocking_count ?? 0;

  return (
    <div className="canvas-card">
      {/* Canvas Header */}
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h1 className="canvas-title">Publish & Pipeline Integrity</h1>
          <p className="canvas-subtitle">
            Compile the atomic static catalogue file for child viewers. Blockers prevent publication to guarantee viewer stability.
          </p>
        </div>

        <button
          className="btn-dark-pill"
          onClick={() => {
            refetchReport();
            refetchHistory();
          }}
          disabled={isReportFetching}
        >
          <RefreshCw size={15} className={isReportFetching ? 'spin' : ''} />
          <span>Refresh Integrity Status</span>
        </button>
      </div>

      {/* Permission Denied Alert (Rule 8 Enforcement) */}
      {permissionDeniedMessage && (
        <div className="permission-alert-banner">
          <div className="permission-alert-left">
            <div className="permission-alert-icon-box">
              <ShieldAlert size={22} className="text-danger" />
            </div>
            <div>
              <h4 className="permission-alert-title">HTTP 403 Forbidden — Role Permission Enforced</h4>
              <p className="permission-alert-desc">{permissionDeniedMessage}</p>
            </div>
          </div>
          <button className="btn-dark-pill btn-sm" onClick={() => setRole('admin')}>
            <ShieldCheck size={14} />
            <span>Switch to Admin Role to Publish</span>
          </button>
        </div>
      )}

      {/* Publish Success Toast */}
      {publishSuccessToast && (
        <div className="publish-success-banner">
          <div className="publish-success-left">
            <div className="publish-success-icon-box">
              <CheckCircle2 size={24} className="text-success" />
            </div>
            <div>
              <h4 className="publish-success-title">{publishSuccessToast.message}</h4>
              <p className="publish-success-desc">
                Atomic compile finished in <strong>{publishSuccessToast.durationMs} ms</strong>. Published{' '}
                <strong>{publishSuccessToast.showCount} shows</strong> and{' '}
                <strong>{publishSuccessToast.episodeCount} episodes</strong> to static storage.
              </p>
            </div>
          </div>
          <a href="/catalog" target="_blank" rel="noreferrer" className="btn-dark-pill btn-sm">
            <ExternalLink size={14} />
            <span>View Raw Catalogue JSON</span>
          </a>
        </div>
      )}

      {/* Publish Gatekeeper Card */}
      <div className={`gatekeeper-card ${isPublishable ? 'status-ready' : 'status-blocked'}`}>
        <div className="gatekeeper-left">
          <div className="gatekeeper-icon-box">
            {isPublishable ? (
              <CheckCircle2 size={32} className="text-success" />
            ) : (
              <AlertTriangle size={32} className="text-amber" />
            )}
          </div>
          <div className="gatekeeper-info">
            <div className="status-headline-row">
              <h2 className="gatekeeper-title">
                {isPublishable ? 'Catalogue Ready for Release' : 'Publishing Blocked by Integrity Gate'}
              </h2>
              <span className={`badge-pill ${isPublishable ? 'badge-ready' : 'badge-blockers'}`}>
                {isPublishable ? '0 Blockers' : `${blockingCount} Critical Issue${blockingCount === 1 ? '' : 's'}`}
              </span>
            </div>
            <p className="status-explanation">
              {isPublishable
                ? 'All published shows have assigned sections, complete artwork, positive durations, and unique content groups. Releasing will atomically update the live viewer feed.'
                : 'The pipeline halts release when deliberate seed flaws or incomplete assets exist. Review the action list below to resolve.'}
            </p>
          </div>
        </div>

        <div className="gatekeeper-actions">
          <div className="publish-button-wrapper">
            <button
              className={`btn-publish-action ${!isPublishable ? 'btn-disabled' : ''}`}
              onClick={handlePublishClick}
              disabled={publishMutation.isPending || (!isPublishable && isAdmin)}
            >
              {publishMutation.isPending ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  <span>Compiling & Publishing...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {!isPublishable
                      ? `Publish Blocked (${blockingCount} Issue${blockingCount === 1 ? '' : 's'})`
                      : 'Publish Catalogue Now'}
                  </span>
                </>
              )}
            </button>

            {!isPublishable && (
              <div className="publish-note-badge blocked">
                <AlertCircle size={13} />
                <span>{blockingCount} blocking issue{blockingCount === 1 ? '' : 's'} must be resolved.</span>
              </div>
            )}

            {role === 'editor' && (
              <div className="publish-note-badge warning">
                <ShieldAlert size={13} />
                <span>Acting as <strong>Editor</strong> (Triggers 403 test).</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Report: Detailed Issues List */}
      <div className="pipeline-section">
        <div className="pipeline-section-header">
          <div className="pipeline-section-title-group">
            <h2 className="pipeline-section-title">
              <FileCheck size={20} className="text-accent" />
              <span>Validation Report</span>
            </h2>
            <p className="pipeline-section-desc">
              {report?.summary || 'Scanning database integrity...'}
            </p>
          </div>
          {blockingCount > 0 && (
            <span className="badge-pill badge-blockers">
              {blockingCount} Blocker{blockingCount === 1 ? '' : 's'} Detected
            </span>
          )}
        </div>

        {isReportLoading ? (
          <div className="table-feedback-box">Scanning database for publication blockers...</div>
        ) : reportError ? (
          <div className="table-feedback-box error">
            <AlertCircle size={20} />
            <span>Failed to load validation report: {(reportError as any).message}</span>
          </div>
        ) : blockingCount === 0 ? (
          <div className="clean-report-card">
            <div className="clean-report-icon-box">
              <CheckCircle2 size={26} className="text-success" />
            </div>
            <div>
              <h3 className="clean-report-heading">All Integrity Checks Passed</h3>
              <p className="clean-report-text">
                No missing sections, incomplete artwork, or colliding language groups detected.
              </p>
            </div>
          </div>
        ) : (
          <div className="blockers-grid">
            {Object.entries(report?.grouped_by_show || {}).map(([showTitle, items]) => (
              <div key={showTitle} className="show-blocker-card">
                <div className="show-blocker-header">
                  <div className="show-title-badge">
                    <Film size={16} />
                    <span>{showTitle}</span>
                  </div>
                  <span className="badge-pill badge-blockers">
                    {items.length} issue{items.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="show-blocker-list">
                  {items.map((b, idx) => (
                    <div key={idx} className="blocker-item">
                      <div className="blocker-icon-col">
                        <AlertCircle size={18} className="text-danger" />
                      </div>
                      <div className="blocker-details">
                        <div className="blocker-meta">
                          <span className="blocker-code-badge">{b.issue_type}</span>
                          {b.entity_id && <span className="blocker-id-text">ID: {b.entity_id}</span>}
                        </div>
                        <p className="blocker-message">{b.message}</p>
                        <div className="blocker-resolution">
                          <span className="resolution-label">Resolution:</span>
                          <span className="resolution-text">{b.resolution}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish History Audit Log */}
      <div className="pipeline-section">
        <div className="pipeline-section-header">
          <div className="pipeline-section-title-group">
            <h2 className="pipeline-section-title">
              <History size={20} className="text-accent" />
              <span>Publish Run History (Audit Log)</span>
            </h2>
            <p className="pipeline-section-desc">
              Recorded release events with executor identity, execution time, and storage outcome.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          {isHistoryLoading ? (
            <div className="table-feedback-box">Loading publish run history...</div>
          ) : history.length === 0 ? (
            <div className="table-feedback-box">
              <Clock size={28} className="text-muted" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-dark-primary)' }}>No publish runs recorded yet</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>
                Trigger your first release above to create an audit record.
              </span>
            </div>
          ) : (
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Triggered By</th>
                  <th>Shows</th>
                  <th>Episodes</th>
                  <th>Duration</th>
                  <th>Catalogue Path</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <span className={`badge-pill ${run.status === 'success' ? 'badge-ready' : 'badge-danger'}`}>
                        {run.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark-primary)' }}>{run.triggered_by}</span>
                    </td>
                    <td>{run.show_count}</td>
                    <td>{run.episode_count}</td>
                    <td>
                      <span className="duration-cell">
                        <Clock size={12} className="text-muted mr-1" />
                        {run.duration_ms} ms
                      </span>
                    </td>
                    <td>
                      <span className="table-code-badge">{run.catalogue_path || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="text-timestamp">
                        {run.created_at ? new Date(run.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
