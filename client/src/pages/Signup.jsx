import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Alert } from '../components/Field.jsx';

const EMPTY = { name: '', email: '', phone: '', password: '', confirm: '' };

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  /** Client-side first pass; the server validates all of this again (NFR-V1). */
  function localCheck() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'At least 8 characters, with a letter and a digit.';
    }
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMessage('');
    const local = localCheck();
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      await signup({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/society', { replace: true });
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
        <div className="col-md-8 col-lg-6">
          <div className="text-center mb-4">
            <h1 className="h2">Create your account</h1>
            <p style={{ color: 'var(--aw-muted)' }}>
              You only need an account for the society portal. The calculator and advisory are open to everyone.
            </p>
          </div>

          <div className="card">
            <div className="card-body">
              <Alert tone="danger">{message}</Alert>
              <form onSubmit={onSubmit} noValidate className="row g-3">
                <Field className="col-12" label="Full name" htmlFor="name" error={errors.name}>
                  <input id="name" autoComplete="name" required className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name} onChange={set('name')} />
                </Field>
                <Field className="col-sm-7" label="Email" htmlFor="email" error={errors.email}>
                  <input id="email" type="email" autoComplete="email" required className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email} onChange={set('email')} />
                </Field>
                <Field className="col-sm-5" label="Mobile" htmlFor="phone" error={errors.phone} hint="10 digits">
                  <input id="phone" inputMode="numeric" autoComplete="tel-national" required
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={form.phone} onChange={set('phone')} />
                </Field>
                <Field className="col-sm-6" label="Password" htmlFor="password" error={errors.password}
                  hint="8+ characters, a letter and a digit">
                  <input id="password" type="password" autoComplete="new-password" required
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    value={form.password} onChange={set('password')} />
                </Field>
                <Field className="col-sm-6" label="Confirm password" htmlFor="confirm" error={errors.confirm}>
                  <input id="confirm" type="password" autoComplete="new-password" required
                    className={`form-control ${errors.confirm ? 'is-invalid' : ''}`}
                    value={form.confirm} onChange={set('confirm')} />
                </Field>
                <div className="col-12">
                  <button className="btn btn-primary btn-lg w-100" type="submit" disabled={busy}>
                    {busy ? 'Creating account…' : 'Create account'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="text-center mt-3">Already registered? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
