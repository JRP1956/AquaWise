import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listProblems, evaluate } from '@shared/advisory.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const PROBLEMS = listProblems();

const SEVERITY_COPY = {
  low: 'Inconvenience — fix it when you can.',
  medium: 'Fix this within a few days.',
  high: 'Health or property risk — act today.',
  critical: 'Act now.',
};

export default function Advisory() {
  const { user, hasSociety } = useAuth();
  const navigate = useNavigate();

  const [problemType, setProblemType] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const problem = PROBLEMS.find((p) => p.id === problemType) ?? null;

  function pickProblem(id) {
    setProblemType(id);
    setAnswers({});
    setErrors({});
    setResult(null);
  }

  async function onSubmit(e) {
    e.preventDefault();

    // Resolve locally first so guests get an instant answer, then ask the server, which
    // swaps in the caller's own society contacts when they are logged in (FR-A4).
    const local = evaluate(problemType, answers);
    setErrors(local.errors);
    if (!local.valid) return;

    setResult(local);
    setBusy(true);
    try {
      const server = await api.post('/advisory/evaluate', { problemType, answers });
      setResult(server);
    } catch {
      /* The local result already stands; the server call only personalises contacts. */
    } finally {
      setBusy(false);
      setTimeout(() => document.getElementById('aw-guidance')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  }

  function reportToSociety() {
    // FR-A8 — hand the complaint form a pre-filled category and severity.
    navigate('/report', {
      state: {
        category: result.rule.complaintCategory,
        severity: result.rule.severity,
        advisoryRuleId: result.rule.id,
        title: result.rule.title,
      },
    });
  }

  const copySteps = () => {
    const text = `${result.rule.title}\n\n${result.rule.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="container py-5">
      <div className="aw-overline mb-2">Functionality 2</div>
      <h1 className="mb-2">Crisis advisory</h1>
      <p className="lead mb-4" style={{ color: 'var(--aw-muted)' }}>
        Tell us what is wrong. You get ordered steps to take right now and the right number to call —
        no guessing, no searching.
      </p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card mb-4">
            <div className="card-header"><i className="bi bi-1-circle me-2" />What is the problem?</div>
            <div className="card-body d-grid gap-2">
              {PROBLEMS.map((p) => (
                <button
                  key={p.id} type="button"
                  className={`card aw-card-link text-start border ${problemType === p.id ? 'aw-card-selected' : ''}`}
                  onClick={() => pickProblem(p.id)}
                  aria-pressed={problemType === p.id}
                >
                  <div className="card-body py-3 d-flex gap-3 align-items-center">
                    <span className="aw-icon-tile teal flex-shrink-0"><i className={`bi ${p.icon}`} /></span>
                    <div>
                      <div className="fw-semibold" style={{ color: 'var(--aw-ink)' }}>{p.label}</div>
                      <div className="small" style={{ color: 'var(--aw-muted)' }}>{p.summary}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {problem && (
            <form className="card" onSubmit={onSubmit} noValidate>
              <div className="card-header"><i className="bi bi-2-circle me-2" />A few quick questions</div>
              <div className="card-body d-grid gap-4">
                {problem.questions.map((q) => (
                  <fieldset key={q.id}>
                    <legend className="form-label">{q.text}</legend>
                    <div className="d-grid gap-2">
                      {q.options.map((o) => (
                        <div className="form-check" key={o.value}>
                          <input
                            className={`form-check-input ${errors[q.id] ? 'is-invalid' : ''}`}
                            type="radio" name={q.id} id={`${q.id}-${o.value}`} value={o.value}
                            checked={answers[q.id] === o.value}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                          />
                          <label className="form-check-label" htmlFor={`${q.id}-${o.value}`}>{o.label}</label>
                        </div>
                      ))}
                    </div>
                    {errors[q.id] && <div className="invalid-feedback d-block"><i className="bi bi-exclamation-circle me-1" />{errors[q.id]}</div>}
                  </fieldset>
                ))}
                <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                  <i className="bi bi-life-preserver me-2" />Get my steps
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="col-lg-7" id="aw-guidance">
          {!result ? (
            <div className="card h-100">
              <div className="card-body d-flex flex-column justify-content-center text-center py-5">
                <span className="aw-icon-tile teal mx-auto mb-3"><i className="bi bi-signpost-split" /></span>
                <h3 className="h4">Your guidance appears here</h3>
                <p style={{ color: 'var(--aw-muted)' }}>
                  Pick a problem on the left and answer the questions. 14 rules across 5 problem types.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* FR-A5 — the emergency banner only for critical rules. */}
              {result.rule.emergency && (
                <div className="aw-emergency rounded-3 p-4 mb-3 d-flex flex-column flex-md-row align-items-md-center gap-3">
                  <span className="aw-icon-tile red flex-shrink-0"><i className="bi bi-exclamation-octagon" /></span>
                  <div className="flex-grow-1">
                    <h2 className="h4 mb-1">This is an emergency</h2>
                    <p className="mb-0">If anyone is hurt, ill or in danger, call 112 before anything else.</p>
                  </div>
                  <a className="btn btn-danger btn-lg" href="tel:112"><i className="bi bi-telephone me-1" />Call 112</a>
                </div>
              )}

              <div className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span>{result.problem.label} · rule {result.rule.id}</span>
                  <span className={`badge aw-sev-${result.rule.severity}`}>
                    {result.rule.severity.toUpperCase()}
                  </span>
                </div>
                <div className="card-body">
                  <h2 className="h3 mb-1">{result.rule.title}</h2>
                  <p style={{ color: 'var(--aw-muted)' }}>{SEVERITY_COPY[result.rule.severity]}</p>

                  <h3 className="h4 mt-4 mb-3">Do these, in this order</h3>
                  <ol className="list-unstyled d-grid gap-3 mb-0">
                    {result.rule.steps.map((step, i) => (
                      <li className="d-flex gap-3" key={step}>
                        <span className="aw-step-num">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header"><i className="bi bi-telephone me-2" />Who to contact</div>
                <ul className="list-group list-group-flush">
                  {result.rule.contacts.map((c) => (
                    <li className="list-group-item d-flex justify-content-between align-items-center gap-3 flex-wrap" key={c.key}>
                      <div>
                        <div className="fw-semibold">{c.name}</div>
                        <div className="small" style={{ color: 'var(--aw-muted)' }}>{c.when}</div>
                      </div>
                      {/^\d+$/.test(c.phone)
                        ? <a className="btn btn-outline-primary btn-sm" href={`tel:${c.phone}`}><i className="bi bi-telephone me-1" />{c.phone}</a>
                        : <span className="small text-secondary">{c.phone}</span>}
                    </li>
                  ))}
                </ul>
                {!hasSociety && (
                  <div className="card-footer small" style={{ color: 'var(--aw-muted)' }}>
                    <i className="bi bi-info-circle me-1" />
                    {user
                      ? <>Join your society to see your building's own contacts here. <Link to="/society">Join a society</Link></>
                      : <>Showing general contacts. <Link to="/login">Log in</Link> to see your society's own numbers.</>}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {hasSociety && (
                  <button className="btn btn-primary" type="button" onClick={reportToSociety}>
                    <i className="bi bi-megaphone me-2" />Report this to my society
                  </button>
                )}
                <button className="btn btn-outline-primary" type="button" onClick={copySteps}>
                  <i className="bi bi-clipboard me-2" />Copy steps
                </button>
                <button className="btn btn-outline-primary" type="button" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2" />Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
