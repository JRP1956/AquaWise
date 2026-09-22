import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Field, Alert } from '../components/Field.jsx';

const CATEGORIES = [
  { value: 'leakage', label: 'Leakage' },
  { value: 'no_supply', label: 'No supply' },
  { value: 'unsafe_drinking_water', label: 'Unsafe drinking water' },
  { value: 'low_pressure', label: 'Low pressure' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'other', label: 'Other' },
];

const LOCATIONS = [
  { value: 'own_flat', label: 'My own flat' },
  { value: 'common_area', label: 'Common area' },
  { value: 'overhead_tank', label: 'Overhead tank' },
  { value: 'underground_tank', label: 'Underground tank' },
  { value: 'road_main', label: 'Road main / outside' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low — inconvenience' },
  { value: 'medium', label: 'Medium — fix within days' },
  { value: 'high', label: 'High — health or property risk' },
  { value: 'critical', label: 'Critical — act now' },
];

export default function Report() {
  const navigate = useNavigate();
  // FR-A8 — the advisory hands us a pre-filled category, severity and rule reference.
  const prefill = useLocation().state ?? {};

  const [form, setForm] = useState({
    category: prefill.category ?? 'leakage',
    severity: prefill.severity ?? 'medium',
    advisoryRuleId: prefill.advisoryRuleId ?? '',
    title: prefill.title ?? '',
    description: '',
    location: 'own_flat',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({}); setMessage(''); setBusy(true);
    try {
      const { complaint } = await api.post('/complaints', form);
      navigate(`/complaints/${complaint._id}`, { state: { justFiled: true } });
    } catch (err) {
      setErrors(err.fields);
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="aw-overline mb-2">Functionality 3</div>
          <h1 className="mb-2">Report a water problem</h1>
          <p className="lead mb-4" style={{ color: 'var(--aw-muted)' }}>
            Your complaint is routed to the right person in your society and tracked until it is resolved.
          </p>

          {prefill.advisoryRuleId && (
            <Alert tone="primary" icon="info-circle">
              Pre-filled from crisis advisory rule <strong>{prefill.advisoryRuleId}</strong>. Edit anything before you send it.
            </Alert>
          )}
          <Alert tone="danger">{message}</Alert>

          <form className="card" onSubmit={onSubmit} noValidate>
            <div className="card-body row g-3">
              <Field className="col-sm-6" label="Category" htmlFor="category" error={errors.category}
                hint="Decides who in your society gets it">
                <select id="category" className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                  value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field className="col-sm-6" label="Severity" htmlFor="severity" error={errors.severity}>
                <select id="severity" className={`form-select ${errors.severity ? 'is-invalid' : ''}`}
                  value={form.severity} onChange={set('severity')}>
                  {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field className="col-12" label="Title" htmlFor="title" error={errors.title} hint="5-80 characters">
                <input id="title" required minLength={5} maxLength={80}
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  value={form.title} onChange={set('title')} placeholder="e.g. Wet patch on the corridor wall, 3rd floor" />
              </Field>
              <Field className="col-12" label="What is happening?" htmlFor="description" error={errors.description}
                hint={`${form.description.length}/1000 characters`}>
                <textarea id="description" rows={5} required minLength={10} maxLength={1000}
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  value={form.description} onChange={set('description')}
                  placeholder="When did it start, what have you already tried, and anything the plumber should know." />
              </Field>
              <Field className="col-sm-6" label="Where is it?" htmlFor="location" error={errors.location}>
                <select id="location" className={`form-select ${errors.location ? 'is-invalid' : ''}`}
                  value={form.location} onChange={set('location')}>
                  {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
              <div className="col-12 d-flex gap-2 flex-wrap">
                <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                  <i className="bi bi-send me-2" />{busy ? 'Filing…' : 'File complaint'}
                </button>
                <Link className="btn btn-outline-primary btn-lg" to="/dashboard">Cancel</Link>
              </div>
            </div>
          </form>

          <p className="form-text mt-3">
            <i className="bi bi-lightbulb me-1" />
            Not sure what to do first? The <Link to="/advisory">crisis advisory</Link> gives you steps before you file.
          </p>
        </div>
      </div>
    </div>
  );
}
