import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calculate, defaultInputs, ACTIVITY_LABELS, BAND_META, NORMS, THRESHOLDS,
} from '@shared/calculator.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Alert } from '../components/Field.jsx';

const CITY_TYPES = [
  { value: 'metro', label: 'Metropolitan city (norm 150 lpcd)' },
  { value: 'city_sewered', label: 'City with piped water and sewerage (135 lpcd)' },
  { value: 'town_unsewered', label: 'Town, piped water without sewerage (70 lpcd)' },
];

/** Marker position on the 0–200+ gauge in the design spec. */
const gaugePercent = (lpcd) => Math.min(100, Math.max(0, (lpcd / 200) * 100));

export default function Calculator() {
  const { user } = useAuth();
  const [inputs, setInputs] = useState(defaultInputs);
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) { setHistory([]); return; }
    api.get('/calculator/history').then((d) => setHistory(d.logs)).catch(() => {});
  }, [user, savedNote]);

  const set = (field) => (e) => {
    const raw = e.target.type === 'number' ? e.target.value : e.target.value;
    setInputs((prev) => ({ ...prev, [field]: raw === '' ? '' : raw }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setSavedNote('');

    // FR-C10 — the same shared module the API uses, so the numbers cannot disagree.
    const { valid, errors: fieldErrors, results: computed } = calculate(inputs);
    setErrors(fieldErrors);
    if (!valid) {
      setResults(null);
      document.querySelector('.invalid-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setResults(computed);
    document.getElementById('aw-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (user) {
      setSaving(true);
      try {
        await api.post('/calculator', { inputs });
        setSavedNote('Saved to your history.');
      } catch (err) {
        setSavedNote(`Could not save this run: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }
  }

  const band = results ? BAND_META[results.band] : null;

  return (
    <div className="container py-5">
      <div className="row g-4 g-lg-5">
        <div className="col-lg-7">
          <div className="aw-overline mb-2">Functionality 1</div>
          <h1 className="mb-2">Water requirement &amp; usage calculator</h1>
          <p className="lead mb-4" style={{ color: 'var(--aw-muted)' }}>
            Enter your household once. We estimate litres per day for each activity and compare
            your per-person use against the Indian and WHO service norms.
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div className="card mb-4">
              <div className="card-header"><i className="bi bi-people me-2" />Household</div>
              <div className="card-body row g-3">
                <Field className="col-sm-4" label="Adults" htmlFor="adults" error={errors.adults}>
                  <input id="adults" type="number" min="1" max="20" className={`form-control ${errors.adults ? 'is-invalid' : ''}`}
                    value={inputs.adults} onChange={set('adults')} required />
                </Field>
                <Field className="col-sm-4" label="Children" htmlFor="children" error={errors.children}>
                  <input id="children" type="number" min="0" max="20" className={`form-control ${errors.children ? 'is-invalid' : ''}`}
                    value={inputs.children} onChange={set('children')} required />
                </Field>
                <Field className="col-sm-4" label="City type" htmlFor="cityType" error={errors.cityType}
                  hint={`Sets the norm: ${NORMS[inputs.cityType] ?? 150} lpcd`}>
                  <select id="cityType" className={`form-select ${errors.cityType ? 'is-invalid' : ''}`}
                    value={inputs.cityType} onChange={set('cityType')}>
                    {CITY_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><i className="bi bi-moisture me-2" />Bathing</div>
              <div className="card-body row g-3">
                <Field className="col-sm-6" label="How do you bathe?" htmlFor="bathingMode" error={errors.bathingMode}>
                  <select id="bathingMode" className="form-select" value={inputs.bathingMode} onChange={set('bathingMode')}>
                    <option value="shower">Shower</option>
                    <option value="bucket">Bucket</option>
                    <option value="both">Both</option>
                  </select>
                </Field>

                {inputs.bathingMode !== 'bucket' && (
                  <>
                    <Field className="col-sm-6" label="Showers per person per day" htmlFor="spd" error={errors.showersPerPersonPerDay}>
                      <input id="spd" type="number" step="0.5" min="0" max="5"
                        className={`form-control ${errors.showersPerPersonPerDay ? 'is-invalid' : ''}`}
                        value={inputs.showersPerPersonPerDay} onChange={set('showersPerPersonPerDay')} />
                    </Field>
                    <Field className="col-sm-6" label="Minutes per shower" htmlFor="sm" error={errors.showerMinutes}
                      hint="Default 7.8 min — Water Research Foundation, REU2016">
                      <div className="input-group">
                        <input id="sm" type="number" step="0.1" min="1" max="60"
                          className={`form-control ${errors.showerMinutes ? 'is-invalid' : ''}`}
                          value={inputs.showerMinutes} onChange={set('showerMinutes')} />
                        <span className="input-group-text">min</span>
                      </div>
                    </Field>
                    <Field className="col-sm-6" label="Shower head" htmlFor="st" error={errors.showerType}
                      hint="Standard 9.46 L/min · Efficient 7.57 L/min (US EPA WaterSense)">
                      <select id="st" className="form-select" value={inputs.showerType} onChange={set('showerType')}>
                        <option value="standard">Standard</option>
                        <option value="efficient">Efficient / WaterSense</option>
                      </select>
                    </Field>
                  </>
                )}

                {inputs.bathingMode !== 'shower' && (
                  <Field className="col-sm-6" label="Bucket baths per person per day" htmlFor="bb" error={errors.bucketBathsPerPersonPerDay}
                    hint="One bucket is taken as 20 L — measure yours if you can">
                    <input id="bb" type="number" step="0.5" min="0" max="5"
                      className={`form-control ${errors.bucketBathsPerPersonPerDay ? 'is-invalid' : ''}`}
                      value={inputs.bucketBathsPerPersonPerDay} onChange={set('bucketBathsPerPersonPerDay')} />
                  </Field>
                )}
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header"><i className="bi bi-house-gear me-2" />Fixtures and appliances</div>
              <div className="card-body row g-3">
                <Field className="col-sm-6" label="Toilet cistern" htmlFor="tt" error={errors.toiletType}
                  hint="Old 22.71 L · Standard 6.06 L · Efficient 4.85 L per flush">
                  <select id="tt" className="form-select" value={inputs.toiletType} onChange={set('toiletType')}>
                    <option value="old">Old (pre-1994 style)</option>
                    <option value="standard">Standard</option>
                    <option value="efficient">Efficient / dual-flush</option>
                  </select>
                </Field>
                <Field className="col-sm-3" label="Machine loads per week" htmlFor="ml" error={errors.machineLoadsPerWeek}>
                  <input id="ml" type="number" min="0" max="21" className={`form-control ${errors.machineLoadsPerWeek ? 'is-invalid' : ''}`}
                    value={inputs.machineLoadsPerWeek} onChange={set('machineLoadsPerWeek')} />
                </Field>
                <Field className="col-sm-3" label="Machine type" htmlFor="mt" error={errors.machineType}>
                  <select id="mt" className="form-select" value={inputs.machineType} onChange={set('machineType')}
                    disabled={Number(inputs.machineLoadsPerWeek) === 0}>
                    <option value="older">Older top-load</option>
                    <option value="standard">Standard</option>
                    <option value="efficient">Efficient front-load</option>
                  </select>
                </Field>
                <Field className="col-sm-4" label="Tap minutes per person per day" htmlFor="tm" error={errors.tapMinutesPerPersonPerDay}
                  hint="Brushing, shaving, rinsing under a running tap">
                  <div className="input-group">
                    <input id="tm" type="number" step="0.5" min="0" max="60"
                      className={`form-control ${errors.tapMinutesPerPersonPerDay ? 'is-invalid' : ''}`}
                      value={inputs.tapMinutesPerPersonPerDay} onChange={set('tapMinutesPerPersonPerDay')} />
                    <span className="input-group-text">min</span>
                  </div>
                </Field>
                <Field className="col-sm-4" label="Taps" htmlFor="tpt" error={errors.tapType}
                  hint="Standard 8.33 L/min · Aerated 5.68 L/min">
                  <select id="tpt" className="form-select" value={inputs.tapType} onChange={set('tapType')}>
                    <option value="standard">Standard</option>
                    <option value="aerated">Aerated</option>
                  </select>
                </Field>
                <Field className="col-sm-4" label="Dripping taps" htmlFor="dt" error={errors.drippingTaps}
                  hint="About 31 L wasted per tap per day">
                  <input id="dt" type="number" min="0" max="20" className={`form-control ${errors.drippingTaps ? 'is-invalid' : ''}`}
                    value={inputs.drippingTaps} onChange={set('drippingTaps')} />
                </Field>
                <Field className="col-sm-6" label="Garden area watered" htmlFor="ga" error={errors.gardenAreaM2}>
                  <div className="input-group">
                    <input id="ga" type="number" min="0" max="1000" className={`form-control ${errors.gardenAreaM2 ? 'is-invalid' : ''}`}
                      value={inputs.gardenAreaM2} onChange={set('gardenAreaM2')} />
                    <span className="input-group-text">m²</span>
                  </div>
                </Field>
                <Field className="col-sm-6" label="Litres actually received per day" htmlFor="sl" error={errors.suppliedLitresPerDay}
                  hint="Optional — lets us check for under-supply as well as over-use">
                  <div className="input-group">
                    <input id="sl" type="number" min="0" max="20000" className={`form-control ${errors.suppliedLitresPerDay ? 'is-invalid' : ''}`}
                      value={inputs.suppliedLitresPerDay ?? ''} onChange={set('suppliedLitresPerDay')} placeholder="Leave blank if unknown" />
                    <span className="input-group-text">L</span>
                  </div>
                </Field>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
                <i className="bi bi-calculator me-2" />{saving ? 'Calculating…' : 'Calculate my usage'}
              </button>
              <button className="btn btn-outline-primary btn-lg" type="button"
                onClick={() => { setInputs(defaultInputs()); setResults(null); setErrors({}); }}>
                Reset
              </button>
            </div>
            {!user && (
              <p className="form-text mt-3">
                <i className="bi bi-info-circle me-1" />
                Calculating works without an account. <Link to="/signup">Sign up</Link> to save your runs and see them over time.
              </p>
            )}
          </form>
        </div>

        <div className="col-lg-5">
          <div className="aw-sticky" id="aw-results">
            {!results ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <span className="aw-icon-tile mb-3"><i className="bi bi-bar-chart" /></span>
                  <h3 className="h4">Your result appears here</h3>
                  <p className="mb-0" style={{ color: 'var(--aw-muted)' }}>
                    Fill in the household details and press Calculate.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="aw-caption">{results.people} people · norm {results.normLpcd} lpcd</div>
                        <div className="aw-num" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
                          {results.perCapitaLpcd}{' '}
                          <span className="fs-6 fw-semibold" style={{ color: 'var(--aw-muted)' }}>L / person / day</span>
                        </div>
                      </div>
                      <span className={`badge aw-sev-${band.tone === 'danger' ? 'critical' : band.tone === 'warning' ? 'high' : 'medium'}`}>
                        {band.label}
                      </span>
                    </div>

                    <div className="aw-gauge mb-2" role="img" aria-label={`${results.perCapitaLpcd} litres per person per day, band ${band.label}`}>
                      <span className="aw-gauge-marker" style={{ left: `${gaugePercent(results.perCapitaLpcd)}%` }} />
                    </div>
                    <div className="d-flex justify-content-between aw-caption mb-3">
                      <span>0</span><span>{THRESHOLDS.jjmAdequate}</span><span>{THRESHOLDS.whoOptimal}</span>
                      <span>{results.normLpcd} norm</span><span>{THRESHOLDS.isUpper}+</span>
                    </div>

                    <p className="small mb-2"><i className="bi bi-info-circle me-1" />{band.basis}.</p>
                    <div className="d-flex justify-content-between border-top pt-3">
                      <span className="fw-semibold">Household total</span>
                      <span className="aw-num">{results.totalLitresPerDay} L/day</span>
                    </div>
                  </div>
                </div>

                {results.flags.length > 0 && (
                  <Alert tone={results.flags.includes('overuse') ? 'warning' : 'danger'}>
                    <ul className="mb-0 ps-3">
                      {results.flags.includes('overuse') && <li>You are using more than the planning norm of {results.normLpcd} lpcd.</li>}
                      {results.flags.includes('undersupply_norm') && <li>Your supply is below the Jal Jeevan Mission level of {THRESHOLDS.jjmAdequate} lpcd — that is a health concern, not a saving opportunity.</li>}
                      {results.flags.includes('supply_below_need') && results.supply && <li>You receive {results.supply.shortfall} L/day less than your estimated need.</li>}
                    </ul>
                  </Alert>
                )}

                <div className="card mb-3">
                  <div className="card-header">Where every litre goes</div>
                  <div className="card-body">
                    <table className="table table-sm align-middle mb-0">
                      <caption className="aw-caption">Litres per day and share of your household total.</caption>
                      <thead>
                        <tr><th scope="col">Activity</th><th scope="col" className="text-end">L/day</th><th scope="col" className="text-end">%</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(results.byActivity)
                          .sort((a, b) => b[1] - a[1])
                          .map(([key, litres]) => {
                            const pct = results.totalLitresPerDay ? (litres / results.totalLitresPerDay) * 100 : 0;
                            return (
                              <tr key={key}>
                                <td>
                                  {ACTIVITY_LABELS[key]}
                                  <div className="progress mt-1" style={{ height: 6 }}>
                                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                                  </div>
                                </td>
                                <td className="text-end aw-num">{litres}</td>
                                <td className="text-end">{pct.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card mb-3">
                  <div className="card-header">
                    Your top 3 saving opportunities
                    <span className="badge rounded-pill aw-badge-resolved float-end">
                      up to {results.totalSavable} L/day
                    </span>
                  </div>
                  <ul className="list-group list-group-flush">
                    {results.savings.map((s, i) => (
                      <li className="list-group-item d-flex gap-3" key={s.activity}>
                        <span className="aw-step-num">{i + 1}</span>
                        <div>
                          <div className="fw-semibold">{s.label} — {s.litres} L/day ({s.percent}%)</div>
                          <div className="small" style={{ color: 'var(--aw-muted)' }}>{s.tip}</div>
                          {s.saves > 0 && <span className="badge rounded-pill aw-badge-resolved mt-1">Saves ~{s.saves} L/day</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {savedNote && <p className="small text-secondary"><i className="bi bi-cloud-check me-1" />{savedNote}</p>}

                <p className="aw-caption">
                  Fixture figures come from US EPA WaterSense, ENERGY STAR and the Water Research
                  Foundation; norms from CPHEEO, BIS, Jal Jeevan Mission and WHO. See{' '}
                  <Link to="/about">data sources</Link>.
                </p>
              </>
            )}

            {user && history.length > 0 && (
              <div className="card mt-3">
                <div className="card-header">Your last {history.length} runs</div>
                <ul className="list-group list-group-flush">
                  {history.map((log) => (
                    <li className="list-group-item d-flex justify-content-between align-items-center" key={log._id}>
                      <span className="small">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>
                        <span className="aw-num me-2">{log.results.perCapitaLpcd} lpcd</span>
                        <span className="badge aw-badge-progress">{BAND_META[log.results.band]?.label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
