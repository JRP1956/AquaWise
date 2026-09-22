import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Alert } from '../components/Field.jsx';

/** FR-S4/S6 — one page, two paths: join an existing society, or create one and run it. */
export default function Society() {
  const { refresh, hasSociety } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('join');
  const [join, setJoin] = useState({ joinCode: '', flatNo: '', wing: '' });
  const [create, setCreate] = useState({
    name: '', flatNo: '', wing: '', cityType: 'metro', municipalHelpline: '',
    address: { line1: '', area: '', city: 'Mumbai', pincode: '' },
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (hasSociety) navigate('/dashboard', { replace: true });

  async function submit(e, path, payload) {
    e.preventDefault();
    setErrors({}); setMessage(''); setBusy(true);
    try {
      await api.post(path, payload);
      await refresh();
      navigate('/dashboard', { replace: true });
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
          <div className="text-center mb-4">
            <h1 className="h2">Connect to your society</h1>
            <p style={{ color: 'var(--aw-muted)' }}>
              Complaints, local contacts and the society dashboard all live inside a society.
            </p>
          </div>

          <ul className="nav nav-pills justify-content-center mb-4 gap-2">
            <li className="nav-item">
              <button className={`nav-link ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
                <i className="bi bi-key me-1" />I have a join code
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                <i className="bi bi-buildings me-1" />Register my society
              </button>
            </li>
          </ul>

          <Alert tone="danger">{message}</Alert>

          {tab === 'join' ? (
            <form className="card" onSubmit={(e) => submit(e, '/societies/join', join)} noValidate>
              <div className="card-header">Join with a code</div>
              <div className="card-body row g-3">
                <Field className="col-sm-4" label="Join code" htmlFor="joinCode" error={errors.joinCode}
                  hint="6 characters from your society admin">
                  <input id="joinCode" required maxLength={6} style={{ textTransform: 'uppercase', letterSpacing: '.2em' }}
                    className={`form-control ${errors.joinCode ? 'is-invalid' : ''}`}
                    value={join.joinCode} onChange={(e) => setJoin({ ...join, joinCode: e.target.value.toUpperCase() })} />
                </Field>
                <Field className="col-sm-4" label="Flat number" htmlFor="jflat" error={errors.flatNo}>
                  <input id="jflat" required className={`form-control ${errors.flatNo ? 'is-invalid' : ''}`}
                    value={join.flatNo} onChange={(e) => setJoin({ ...join, flatNo: e.target.value })} />
                </Field>
                <Field className="col-sm-4" label="Wing" htmlFor="jwing" error={errors.wing} hint="Optional">
                  <input id="jwing" className="form-control" value={join.wing}
                    onChange={(e) => setJoin({ ...join, wing: e.target.value })} />
                </Field>
                <div className="col-12">
                  <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                    {busy ? 'Joining…' : 'Join society'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form className="card" onSubmit={(e) => submit(e, '/societies', create)} noValidate>
              <div className="card-header">Register a society — you become its admin</div>
              <div className="card-body row g-3">
                <Field className="col-12" label="Society name" htmlFor="sname" error={errors.name}>
                  <input id="sname" required className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} />
                </Field>
                <Field className="col-12" label="Address" htmlFor="line1" error={errors['address.line1']}>
                  <input id="line1" required className={`form-control ${errors['address.line1'] ? 'is-invalid' : ''}`}
                    value={create.address.line1}
                    onChange={(e) => setCreate({ ...create, address: { ...create.address, line1: e.target.value } })} />
                </Field>
                <Field className="col-sm-4" label="Area" htmlFor="area" error={errors['address.area']}>
                  <input id="area" required className={`form-control ${errors['address.area'] ? 'is-invalid' : ''}`}
                    value={create.address.area}
                    onChange={(e) => setCreate({ ...create, address: { ...create.address, area: e.target.value } })} />
                </Field>
                <Field className="col-sm-4" label="City" htmlFor="city" error={errors['address.city']}>
                  <input id="city" required className={`form-control ${errors['address.city'] ? 'is-invalid' : ''}`}
                    value={create.address.city}
                    onChange={(e) => setCreate({ ...create, address: { ...create.address, city: e.target.value } })} />
                </Field>
                <Field className="col-sm-4" label="Pincode" htmlFor="pincode" error={errors['address.pincode']}>
                  <input id="pincode" required inputMode="numeric" maxLength={6}
                    className={`form-control ${errors['address.pincode'] ? 'is-invalid' : ''}`}
                    value={create.address.pincode}
                    onChange={(e) => setCreate({ ...create, address: { ...create.address, pincode: e.target.value } })} />
                </Field>
                <Field className="col-sm-6" label="City type" htmlFor="cityType" error={errors.cityType}
                  hint="Sets the per-capita norm used by the calculator">
                  <select id="cityType" className="form-select" value={create.cityType}
                    onChange={(e) => setCreate({ ...create, cityType: e.target.value })}>
                    <option value="metro">Metropolitan (150 lpcd)</option>
                    <option value="city_sewered">City with sewerage (135 lpcd)</option>
                    <option value="town_unsewered">Town without sewerage (70 lpcd)</option>
                  </select>
                </Field>
                <Field className="col-sm-6" label="Municipal water helpline" htmlFor="muni" error={errors.municipalHelpline}
                  hint="Defaults to BMC 1916 for Mumbai">
                  <input id="muni" inputMode="numeric" className={`form-control ${errors.municipalHelpline ? 'is-invalid' : ''}`}
                    value={create.municipalHelpline} placeholder="1916"
                    onChange={(e) => setCreate({ ...create, municipalHelpline: e.target.value })} />
                </Field>
                <Field className="col-sm-6" label="Your flat number" htmlFor="cflat" error={errors.flatNo}>
                  <input id="cflat" required className={`form-control ${errors.flatNo ? 'is-invalid' : ''}`}
                    value={create.flatNo} onChange={(e) => setCreate({ ...create, flatNo: e.target.value })} />
                </Field>
                <Field className="col-sm-6" label="Your wing" htmlFor="cwing" error={errors.wing} hint="Optional">
                  <input id="cwing" className="form-control" value={create.wing}
                    onChange={(e) => setCreate({ ...create, wing: e.target.value })} />
                </Field>
                <div className="col-12">
                  <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                    {busy ? 'Creating…' : 'Create society'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
