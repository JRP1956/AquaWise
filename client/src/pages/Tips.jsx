import { useState } from 'react';
import { Link } from 'react-router-dom';

/** Savings are the same arithmetic the calculator uses, stated per household member. */
const TIPS = [
  { cat: 'Bathroom', icon: 'bi-moisture', title: 'Fit a WaterSense shower head', saving: '~14.7 L per 7.8-min shower',
    detail: 'A standard head runs at 9.46 L/min, an efficient one at 7.57 L/min. Over a 7.8-minute shower that is 14.7 L, every time.' },
  { cat: 'Bathroom', icon: 'bi-stopwatch', title: 'Cut one minute off your shower', saving: '~9.5 L per shower',
    detail: 'The average shower runs 7.8 minutes. One minute less, at a standard 9.46 L/min, saves 9.5 L a day per person.' },
  { cat: 'Bathroom', icon: 'bi-badge-wc', title: 'Switch to a dual-flush cistern', saving: '~6 L per person per day',
    detail: 'At 5 flushes a day, moving from a 6.06 L cistern to a 4.85 L one saves about 6 L per person daily. From an old 22.71 L cistern it is nearer 89 L.' },
  { cat: 'Leaks', icon: 'bi-droplet', title: 'Fix every dripping tap', saving: '~31 L per tap per day',
    detail: 'A tap dripping about once a second wastes roughly 11,000 L a year. A washer costs a few rupees.' },
  { cat: 'Leaks', icon: 'bi-speedometer2', title: 'Run a meter leak test', saving: 'Finds hidden losses',
    detail: 'Close every tap, note the meter, wait two hours. If it has moved, water is going somewhere you cannot see.' },
  { cat: 'Kitchen', icon: 'bi-water', title: 'Wash utensils in a filled basin', saving: '~5-8 L per wash',
    detail: 'A running tap at 8.33 L/min empties faster than you think. Fill a basin to rinse instead.' },
  { cat: 'Kitchen', icon: 'bi-cup-straw', title: 'Keep drinking water in the fridge', saving: '~2 L per person per day',
    detail: 'Running the tap until it turns cold wastes several litres a day in a warm climate.' },
  { cat: 'Laundry', icon: 'bi-basket', title: 'Only run full loads', saving: '~75 L per skipped load',
    detail: 'A standard machine uses about 75.71 L per load regardless of how full it is. Two half loads cost double.' },
  { cat: 'Laundry', icon: 'bi-arrow-left-right', title: 'Choose front-load next time', saving: '~23 L per load',
    detail: 'Front-loaders average 53 L a load against 75.71 L for a standard machine, and 117 L for an older top-loader.' },
  { cat: 'Taps', icon: 'bi-funnel', title: 'Fit aerators on every tap', saving: '~5.3 L per person per day',
    detail: 'Aerators cut flow from 8.33 to 5.68 L/min without any noticeable difference in washing.' },
  { cat: 'Garden', icon: 'bi-flower1', title: 'Water before 10 a.m.', saving: 'Up to 30% of garden use',
    detail: 'Watering in the heat of the day loses much of it to evaporation. Early morning, at the roots, is the efficient time.' },
  { cat: 'Garden', icon: 'bi-recycle', title: 'Reuse rinse water on plants', saving: '~10-20 L per day',
    detail: 'Water used to rinse vegetables or rice is perfectly good for plants. Do not reuse water with detergent or bleach in it.' },
  { cat: 'Community', icon: 'bi-buildings', title: 'Get the society tanks cleaned twice a year', saving: 'Protects water quality',
    detail: 'Uncleaned tanks are the most common cause of the taste, smell and colour complaints in the advisory.' },
  { cat: 'Community', icon: 'bi-clipboard-data', title: 'Report leaks in common areas immediately', saving: 'Hundreds of litres a day',
    detail: 'A leaking common line or overflowing overhead tank wastes far more than anything inside a single flat.' },
];

const CATEGORIES = ['All', ...new Set(TIPS.map((t) => t.cat))];

export default function Tips() {
  const [active, setActive] = useState('All');
  const shown = active === 'All' ? TIPS : TIPS.filter((t) => t.cat === active);

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <div className="aw-overline mb-2">Conservation</div>
        <h1>Water-saving tips that are worth the effort</h1>
        <p className="lead mx-auto" style={{ color: 'var(--aw-muted)', maxWidth: '44rem' }}>
          Every saving below is calculated with the same figures the calculator uses, so you can
          check them against your own result.
        </p>
      </div>

      <div className="d-flex gap-2 flex-wrap justify-content-center mb-4">
        {CATEGORIES.map((c) => (
          <button key={c} type="button"
            className={`btn btn-sm aw-chip ${active === c ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActive(c)} aria-pressed={active === c}>
            {c}
          </button>
        ))}
      </div>

      <div className="row g-4">
        {shown.map((t) => (
          <div className="col-md-6 col-lg-4" key={t.title}>
            <div className="card h-100">
              <div className="card-body d-flex flex-column gap-2">
                <div className="d-flex gap-3">
                  <span className="aw-icon-tile teal flex-shrink-0"><i className={`bi ${t.icon}`} /></span>
                  <div>
                    <div className="aw-overline mb-1">{t.cat}</div>
                    <h2 className="h4 mb-0">{t.title}</h2>
                  </div>
                </div>
                <p className="small mb-0 flex-grow-1" style={{ color: 'var(--aw-muted)' }}>{t.detail}</p>
                <span className="badge rounded-pill aw-badge-resolved align-self-start">{t.saving}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-5">
        <div className="card-body text-center p-4 p-lg-5">
          <h2 className="mb-2">Which of these matter most for you?</h2>
          <p style={{ color: 'var(--aw-muted)' }}>
            The calculator ranks your top three by how much water they would actually save in your home.
          </p>
          <Link className="btn btn-primary btn-lg" to="/calculator">
            <i className="bi bi-calculator me-2" />Calculate my usage
          </Link>
        </div>
      </div>
    </div>
  );
}
