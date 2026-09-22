import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, EmptyState } from '../components/Field.jsx';

export const STATUS_META = {
  active: { label: 'Active', cls: 'aw-badge-active', icon: 'exclamation-circle' },
  in_progress: { label: 'In progress', cls: 'aw-badge-progress', icon: 'arrow-repeat' },
  resolved: { label: 'Resolved', cls: 'aw-badge-resolved', icon: 'check-circle' },
};

export const CATEGORY_LABELS = {
  leakage: 'Leakage',
  no_supply: 'No supply',
  unsafe_drinking_water: 'Unsafe drinking water',
  low_pressure: 'Low pressure',
  contamination: 'Contamination',
  other: 'Other',
};

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [society, setSociety] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [error, setError] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      const [complaints, mine] = await Promise.all([
        api.get(`/complaints${qs ? `?${qs}` : ''}`),
        api.get('/societies/mine'),
      ]);
      setData(complaints);
      setSociety(mine.society);
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function regenerateCode() {
    setCodeBusy(true);
    try {
      const { joinCode } = await api.post('/societies/mine/join-code');
      setSociety((s) => ({ ...s, joinCode }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCodeBusy(false);
    }
  }

  if (error) return <div className="container py-5"><Alert tone="danger">{error}</Alert></div>;
  if (!data || !society) {
    return (
      <div className="container py-5">
        <div className="row g-3">
          {[1, 2, 3].map((n) => <div className="col-md-4" key={n}><div className="card"><div className="card-body"><div className="aw-skeleton" style={{ height: '4rem' }} /></div></div></div>)}
        </div>
      </div>
    );
  }

  const { summary, complaints } = data;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="aw-overline mb-1">Society dashboard</div>
          <h1 className="mb-1">{society.name}</h1>
          <p className="mb-0" style={{ color: 'var(--aw-muted)' }}>
            {society.address.area}, {society.address.city} · {society.memberCount} member{society.memberCount === 1 ? '' : 's'}
            {isAdmin && <span className="badge aw-badge-progress ms-2">You are the admin</span>}
          </p>
        </div>
        <Link className="btn btn-primary" to="/report"><i className="bi bi-plus-lg me-1" />File a complaint</Link>
      </div>

      <div className="row g-3 mb-4">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div className="col-md-4" key={key}>
            <button className="card w-100 text-start aw-card-link border-0 p-0"
              onClick={() => setFilters((f) => ({ ...f, status: f.status === key ? '' : key }))}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <div className="aw-overline mb-1">{meta.label}</div>
                  <div className="aw-num display-6" style={{ fontSize: '2rem' }}>{summary[key] ?? 0}</div>
                </div>
                <span className={`badge ${meta.cls} fs-6`}><i className={`bi bi-${meta.icon}`} /></span>
              </div>
            </button>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>{data.scope === 'society' ? 'All complaints' : 'My complaints'} ({data.total})</span>
              <div className="d-flex gap-2 flex-wrap">
                <select className="form-select form-select-sm" style={{ width: 'auto' }}
                  value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">All statuses</option>
                  {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}
                  value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">All categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="card-body">
                <EmptyState icon="clipboard-check" title="Nothing here">
                  {filters.status || filters.category
                    ? 'No complaints match these filters.'
                    : 'No complaints have been filed yet. That is a good sign.'}
                </EmptyState>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {complaints.map((c) => (
                  <li className="list-group-item" key={c._id}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="flex-grow-1">
                        <div className="d-flex gap-2 align-items-center mb-1 flex-wrap">
                          <span className={`badge ${STATUS_META[c.status].cls}`}>{STATUS_META[c.status].label}</span>
                          <span className={`badge aw-sev-${c.severity}`}>{c.severity}</span>
                          <span className="aw-caption">{c.complaintNo}</span>
                        </div>
                        <Link to={`/complaints/${c._id}`} className="fw-semibold text-decoration-none">{c.title}</Link>
                        <div className="small" style={{ color: 'var(--aw-muted)' }}>
                          {CATEGORY_LABELS[c.category]} · filed by {c.filedBy?.name ?? 'a member'}
                          {c.filedBy?.flatNo ? ` (${c.filedBy.wing ?? ''}${c.filedBy.flatNo})` : ''}
                          {' · '}{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <Link className="btn btn-outline-primary btn-sm" to={`/complaints/${c._id}`}>Open</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {isAdmin && (
            <div className="card mb-4">
              <div className="card-header"><i className="bi bi-key me-2" />Join code</div>
              <div className="card-body text-center">
                <div className="aw-num display-6 mb-2" style={{ letterSpacing: '.2em' }}>{society.joinCode}</div>
                <p className="aw-caption">Share this with residents so they can join. Regenerating it stops the old code working.</p>
                <button className="btn btn-outline-primary btn-sm" onClick={regenerateCode} disabled={codeBusy}>
                  <i className="bi bi-arrow-repeat me-1" />{codeBusy ? 'Generating…' : 'Regenerate'}
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><i className="bi bi-telephone me-2" />Local contacts</div>
            {society.contacts.length === 0 ? (
              <div className="card-body">
                <p className="small mb-0" style={{ color: 'var(--aw-muted)' }}>
                  No contacts yet. {isAdmin
                    ? 'Add them so complaints route to the right person automatically.'
                    : 'Ask your society admin to add them.'}
                </p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {society.contacts.map((c) => (
                  <li className="list-group-item" key={c._id}>
                    <div className="fw-semibold">{c.name}</div>
                    <div className="small" style={{ color: 'var(--aw-muted)' }}>{c.role}</div>
                    <div className="small">
                      <a href={`tel:${c.phone}`}>{c.phone}</a> ·{' '}
                      {c.categories.map((cat) => CATEGORY_LABELS[cat]).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="card-footer small">
              <div><strong>Municipal helpline:</strong> <a href={`tel:${society.municipalHelpline}`}>{society.municipalHelpline}</a></div>
              <div><strong>Emergency:</strong> <a href="tel:112">112</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
