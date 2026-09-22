import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Alert } from '../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({}); setMessage(''); setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from ?? (user.society ? '/dashboard' : '/society'), { replace: true });
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
        <div className="col-md-7 col-lg-5">
          <div className="text-center mb-4">
            <span className="aw-logo-mark mb-3" style={{ width: '3rem', height: '3rem', fontSize: '1.5rem' }}>
              <i className="bi bi-droplet-half" />
            </span>
            <h1 className="h2">Welcome back</h1>
            <p style={{ color: 'var(--aw-muted)' }}>Log in to your society portal.</p>
          </div>

          <div className="card">
            <div className="card-body">
              <Alert tone="danger">{message}</Alert>
              <form onSubmit={onSubmit} noValidate className="d-grid gap-3">
                <Field label="Email" htmlFor="email" error={errors.email}>
                  <input id="email" type="email" autoComplete="email" required
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email} onChange={set('email')} />
                </Field>
                <Field label="Password" htmlFor="password" error={errors.password}>
                  <input id="password" type="password" autoComplete="current-password" required
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    value={form.password} onChange={set('password')} />
                </Field>
                <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                  {busy ? 'Logging in…' : 'Log in'}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center mt-3">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
