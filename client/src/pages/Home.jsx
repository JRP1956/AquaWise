import { Link } from 'react-router-dom';

const STATS = [
  { value: '2.1 billion', text: 'people worldwide lacked safely managed drinking water in 2024', src: 'WHO/UNICEF JMP, 2025' },
  { value: '600 million', text: 'Indians face high to extreme water stress', src: 'NITI Aayog CWMI, 2018' },
  { value: '135–150 L', text: 'per person per day is the urban planning norm in India', src: 'CPHEEO Manual' },
];

const TOOLS = [
  { to: '/calculator', icon: 'bi-calculator', tint: '', title: 'Water Usage Calculator', cta: 'Calculate my usage',
    text: "Estimate your household's daily litres by activity and compare them with WHO and CPHEEO norms." },
  { to: '/advisory', icon: 'bi-life-preserver', tint: 'teal', title: 'Crisis Advisory', cta: 'Get guidance',
    text: 'Leak, no supply, unsafe or contaminated water? Get step-by-step guidance and who to call.' },
  { to: '/dashboard', icon: 'bi-buildings', tint: '', title: 'Society Portal', cta: 'Open dashboard',
    text: 'Join your housing society, report problems and track them until they are resolved.' },
];

const STEPS = [
  { n: 1, title: 'Measure', text: 'Enter your household details once. It takes about 2 minutes.' },
  { n: 2, title: 'Understand', text: 'See where every litre goes and how you compare with the norm.' },
  { n: 3, title: 'Act', text: 'Apply the top saving tips, or report problems to your society.' },
];

const QUICK_TIPS = [
  { cat: 'Bathroom', icon: 'bi-moisture', title: 'Fit an efficient shower head', saving: 'Saves ~14.7 L per 7.8-min shower' },
  { cat: 'Leaks', icon: 'bi-droplet', title: 'Fix a dripping tap', saving: 'Saves ~31 L per tap per day' },
  { cat: 'Kitchen', icon: 'bi-water', title: 'Turn the tap off while brushing', saving: 'Saves ~16.7 L per person per day' },
];

export default function Home() {
  return (
    <>
      <section className="aw-hero pt-5 pb-5">
        <div className="container position-relative pt-lg-4 pb-5">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              <div className="aw-overline mb-3" style={{ color: '#9CC6EC' }}>
                <i className="bi bi-globe2 me-1" />UN SDG 6 · Clean water and sanitation
              </div>
              <h1 className="display-5 mb-3">Know your water.<br />Act when it fails.</h1>
              <p className="lead mb-4">
                AquaWise shows how much water your household uses, what to do in a water crisis,
                and gives your housing society one place to report and fix problems.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Link className="btn btn-light btn-lg" to="/calculator">
                  <i className="bi bi-calculator me-2" />Calculate my usage
                </Link>
                <Link className="btn btn-outline-light btn-lg" to="/advisory">
                  <i className="bi bi-life-preserver me-2" />Water emergency? Get steps
                </Link>
              </div>
            </div>

            <div className="col-lg-5 offset-lg-1">
              <div className="card border-0 shadow-lg">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="aw-caption">Example household · 4 people · Mumbai</div>
                      <div className="aw-num" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
                        169.6 <span className="fs-6 fw-semibold" style={{ color: 'var(--aw-muted)' }}>L / person / day</span>
                      </div>
                    </div>
                    <span className="badge aw-sev-high"><i className="bi bi-arrow-up-circle me-1" />Over-use</span>
                  </div>
                  <div className="aw-gauge mb-2"><span className="aw-gauge-marker" style={{ left: '84.8%' }} /></div>
                  <div className="d-flex justify-content-between aw-caption mb-3">
                    <span>0</span><span>55</span><span>100</span><span>150 norm</span><span>200+</span>
                  </div>
                  <div className="small d-grid gap-2">
                    {[['Bathing', 295, 100], ['Toilet', 121, 41], ['Utensils & cleaning', 80, 27]].map(([label, litres, pct]) => (
                      <div key={label}>
                        <div className="d-flex justify-content-between">
                          <span>{label}</span>
                          <span className="fw-semibold aw-num" style={{ fontWeight: 700 }}>{litres} L</span>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div className="progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <svg className="aw-wave" viewBox="0 0 1440 72" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C240,72 480,8 720,32 C960,56 1200,16 1440,36 L1440,72 L0,72 Z" fill="#F4F8FC" />
          <path d="M0,52 C300,30 520,70 760,50 C1000,30 1220,62 1440,48 L1440,72 L0,72 Z" fill="#1BB3CF" opacity=".18" />
        </svg>
      </section>

      <div className="container">
        <section className="py-5">
          <div className="row g-4">
            {STATS.map((s) => (
              <div className="col-md-4" key={s.value}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="aw-num display-6 mb-1" style={{ fontSize: '2rem' }}>{s.value}</div>
                    <p className="mb-2" style={{ color: 'var(--aw-body)' }}>{s.text}</p>
                    <div className="aw-caption"><i className="bi bi-journal-text me-1" />Source: {s.src}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-5">
          <div className="text-center mb-4">
            <div className="aw-overline mb-2">What you can do</div>
            <h2>Three tools, one portal</h2>
          </div>
          <div className="row g-4">
            {TOOLS.map((t) => (
              <div className="col-md-4" key={t.to}>
                <div className="card h-100 aw-card-link">
                  <div className="card-body d-flex flex-column">
                    <span className={`aw-icon-tile ${t.tint} mb-3`}><i className={`bi ${t.icon}`} /></span>
                    <h3 className="h4">{t.title}</h3>
                    <p className="flex-grow-1" style={{ color: 'var(--aw-muted)' }}>{t.text}</p>
                    <Link to={t.to} className="fw-semibold text-decoration-none">
                      {t.cta} <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-5">
          <div className="card">
            <div className="card-body p-4 p-lg-5">
              <h2 className="mb-4">How it works</h2>
              <div className="row g-4">
                {STEPS.map((s) => (
                  <div className="col-md-4" key={s.n}>
                    <div className="d-flex gap-3">
                      <span className="aw-step-num">{s.n}</span>
                      <div>
                        <h3 className="h4 mb-1">{s.title}</h3>
                        <p className="mb-0" style={{ color: 'var(--aw-muted)' }}>{s.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-5">
          <div className="aw-emergency rounded-3 p-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
            <span className="aw-icon-tile red flex-shrink-0"><i className="bi bi-exclamation-octagon" /></span>
            <div className="flex-grow-1">
              <h3 className="h4 mb-1">Burst pipe, no water or unsafe water?</h3>
              <p className="mb-0">Get ordered first steps and the right contact in under a minute.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link className="btn btn-danger" to="/advisory">Open Crisis Advisory</Link>
              <a className="btn btn-outline-danger" href="tel:112"><i className="bi bi-telephone me-1" />Emergency 112</a>
            </div>
          </div>
        </section>

        <section className="pb-4">
          <div className="d-flex justify-content-between align-items-end mb-3">
            <h2 className="mb-0">Quick saving tips</h2>
            <Link to="/tips" className="fw-semibold text-decoration-none">All tips <i className="bi bi-arrow-right" /></Link>
          </div>
          <div className="row g-4">
            {QUICK_TIPS.map((t) => (
              <div className="col-md-4" key={t.title}>
                <div className="card h-100">
                  <div className="card-body d-flex gap-3">
                    <span className="aw-icon-tile teal flex-shrink-0"><i className={`bi ${t.icon}`} /></span>
                    <div>
                      <div className="aw-overline mb-1">{t.cat}</div>
                      <div className="fw-semibold mb-1" style={{ color: 'var(--aw-ink)' }}>{t.title}</div>
                      <span className="badge rounded-pill aw-badge-resolved">{t.saving}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
