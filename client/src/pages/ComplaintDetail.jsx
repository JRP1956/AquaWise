import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Field.jsx';
import { STATUS_META, CATEGORY_LABELS } from './Dashboard.jsx';

const LOCATION_LABELS = {
  own_flat: 'Own flat', common_area: 'Common area', overhead_tank: 'Overhead tank',
  underground_tank: 'Underground tank', road_main: 'Road main',
};

/** FR-S13/S14/S15 — the status timeline and the moves each role is allowed to make. */
export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const justFiled = useLocation().state?.justFiled;

  const [complaint, setComplaint] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/complaints/${id}`).then((d) => setComplaint(d.complaint)).catch((e) => setError(e.message));
  }, [id]);

  async function move(to) {
    setBusy(true); setError('');
    try {
      const { complaint: updated } = await api.patch(`/complaints/${id}/status`, { to, note });
      setComplaint(updated);
      setNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !complaint) return <div className="container py-5"><Alert tone="danger">{error}</Alert></div>;
  if (!complaint) return <div className="container py-5"><div className="aw-skeleton" style={{ height: '12rem' }} /></div>;

  const isFiler = complaint.filedBy?._id === user?.id;
  const daysSinceResolved = complaint.resolvedAt
    ? (Date.now() - new Date(complaint.resolvedAt)) / 86_400_000 : null;
  const canReopen = isFiler && complaint.status === 'resolved' && daysSinceResolved <= 7;
  const canAdvance = isAdmin && complaint.status !== 'resolved';
  const showStatusPanel = canAdvance || canReopen;

  return (
    <div className="container py-5">
      <Link className="btn btn-link px-0 mb-3" to="/dashboard"><i className="bi bi-arrow-left me-1" />Back to dashboard</Link>

      {justFiled && (
        <Alert tone="success" icon="check-circle">
          Complaint <strong>{complaint.complaintNo}</strong> filed and routed to{' '}
          <strong>{complaint.assignedContact?.name}</strong> ({complaint.assignedContact?.role}).
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="aw-num">{complaint.complaintNo}</span>
              <span className="d-flex gap-2">
                <span className={`badge aw-sev-${complaint.severity}`}>{complaint.severity}</span>
                <span className={`badge ${STATUS_META[complaint.status].cls}`}>{STATUS_META[complaint.status].label}</span>
              </span>
            </div>
            <div className="card-body">
              <h1 className="h2 mb-3">{complaint.title}</h1>
              <dl className="row small mb-4">
                <dt className="col-sm-3">Category</dt><dd className="col-sm-9">{CATEGORY_LABELS[complaint.category]}</dd>
                <dt className="col-sm-3">Location</dt><dd className="col-sm-9">{LOCATION_LABELS[complaint.location]}</dd>
                <dt className="col-sm-3">Filed by</dt>
                <dd className="col-sm-9">
                  {complaint.filedBy?.name}
                  {complaint.filedBy?.flatNo && ` · ${complaint.filedBy.wing ?? ''}${complaint.filedBy.flatNo}`}
                </dd>
                <dt className="col-sm-3">Filed on</dt>
                <dd className="col-sm-9">{new Date(complaint.createdAt).toLocaleString('en-IN')}</dd>
                {complaint.advisoryRuleId && (
                  <>
                    <dt className="col-sm-3">Advisory</dt>
                    <dd className="col-sm-9">Filed from rule <strong>{complaint.advisoryRuleId}</strong></dd>
                  </>
                )}
              </dl>
              <p style={{ whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header"><i className="bi bi-clock-history me-2" />Status history</div>
            <div className="card-body">
              <div className="aw-timeline">
                {complaint.statusHistory.map((h, i) => (
                  <div className="aw-timeline-item" key={`${h.at}-${i}`}>
                    <div className="fw-semibold">
                      {h.from ? `${STATUS_META[h.from].label} → ` : ''}{STATUS_META[h.to].label}
                    </div>
                    <div className="small" style={{ color: 'var(--aw-muted)' }}>
                      {h.by?.name ?? 'A member'} · {new Date(h.at).toLocaleString('en-IN')}
                    </div>
                    {h.note && <div className="small mt-1">{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header"><i className="bi bi-person-check me-2" />Routed to</div>
            <div className="card-body">
              <div className="fw-semibold">{complaint.assignedContact?.name}</div>
              <div className="small" style={{ color: 'var(--aw-muted)' }}>{complaint.assignedContact?.role}</div>
              {complaint.assignedContact?.phone && (
                <a className="btn btn-outline-primary btn-sm mt-2" href={`tel:${complaint.assignedContact.phone}`}>
                  <i className="bi bi-telephone me-1" />{complaint.assignedContact.phone}
                </a>
              )}
            </div>
          </div>

          {showStatusPanel && (
            <div className="card">
              <div className="card-header"><i className="bi bi-arrow-left-right me-2" />Update status</div>
              <div className="card-body d-grid gap-2">
                {isAdmin && complaint.status === 'active' && (
                  <>
                    <textarea className="form-control" rows={2} placeholder="Note (required)" value={note}
                      onChange={(e) => setNote(e.target.value)} maxLength={300} />
                    <button className="btn btn-primary" disabled={busy} onClick={() => move('in_progress')}>
                      Mark in progress
                    </button>
                    <button className="btn btn-outline-primary" disabled={busy} onClick={() => move('resolved')}>
                      Mark resolved
                    </button>
                  </>
                )}
                {isAdmin && complaint.status === 'in_progress' && (
                  <>
                    <textarea className="form-control" rows={2} placeholder="Resolution note (required)" value={note}
                      onChange={(e) => setNote(e.target.value)} maxLength={300} />
                    <button className="btn btn-primary" disabled={busy} onClick={() => move('resolved')}>
                      Mark resolved
                    </button>
                  </>
                )}
                {canReopen && (
                  <>
                    <p className="small mb-0" style={{ color: 'var(--aw-muted)' }}>
                      Not actually fixed? You can reopen this for {Math.max(0, Math.ceil(7 - daysSinceResolved))} more day(s).
                    </p>
                    <textarea className="form-control" rows={2} placeholder="Why are you reopening it?" value={note}
                      onChange={(e) => setNote(e.target.value)} maxLength={300} />
                    <button className="btn btn-outline-danger" disabled={busy} onClick={() => move('active')}>
                      Reopen complaint
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
