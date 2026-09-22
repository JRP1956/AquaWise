import { Link } from 'react-router-dom';

const SOURCES = [
  { n: 1, text: 'WHO/UNICEF JMP (2025). 1 in 4 people globally still lack access to safe drinking water.', url: 'https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef' },
  { n: 2, text: 'NITI Aayog (2018). Composite Water Management Index.', url: 'https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=195635&reg=48&lang=2' },
  { n: 3, text: 'CPHEEO Manual on Water Supply and Treatment; BIS IS 1172:1993 — per-capita planning norms.', url: 'https://urbanwaters.in/uw_resource/water-demand/' },
  { n: 4, text: 'Howard, G. & Bartram, J. (2003). Domestic Water Quantity, Service Level and Health. WHO.', url: 'https://iris.who.int/handle/10665/67884' },
  { n: 5, text: 'Ministry of Jal Shakti — Jal Jeevan Mission (55 lpcd service level).', url: 'https://jaljeevanmission.gov.in/sites/default/files/publication_and_reports/jjm-brochure.pdf' },
  { n: 6, text: 'US EPA WaterSense — showerheads, faucets, toilets, leaks and watering.', url: 'https://www.epa.gov/watersense' },
  { n: 7, text: 'Water Research Foundation (2016). Residential End Uses of Water, Version 2.', url: 'https://www.circleofblue.org/wp-content/uploads/2016/04/WRF_REU2016.pdf' },
  { n: 8, text: 'US CDC — How to Make Water Safe in an Emergency.', url: 'https://www.cdc.gov/water-emergency/about/index.html' },
  { n: 9, text: 'Ministry of Home Affairs — Emergency Response Support System (112).', url: 'https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss' },
];

const ASSUMPTIONS = [
  'A bucket bath is taken as 20 L — measure your own bucket for a better figure.',
  'Utensils and house cleaning are taken as 10 L + 10 L per person per day, a widely taught IS 1172 breakup we could not verify against the standard text.',
  'Children are assumed to use the same per-person amounts as adults; no authoritative child-specific figure was found.',
  'Fixture flow rates come from US sources (EPA, ENERGY STAR, WRF) because no Indian open dataset gives per-fixture litres. They suit Indian urban flats with Western fixtures, but they are not India-measured.',
  'The advisory time thresholds (24 h, 72 h, 6 months) and severity labels are our own design choices, not from any standard.',
  'The municipal helpline defaults to BMC 1916; societies outside Mumbai should set their own.',
];

export default function About() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="aw-overline mb-2">UN Sustainable Development Goal 6</div>
          <h1 className="mb-3">Clean water and sanitation for all</h1>
          <p className="lead" style={{ color: 'var(--aw-body)' }}>
            SDG 6 commits the world to universal, equitable access to safe and affordable drinking
            water by 2030, and to a substantial increase in water-use efficiency. AquaWise works on
            two of its targets at household scale: <strong>6.1</strong> — safe drinking water for
            all, and <strong>6.4</strong> — water-use efficiency.
          </p>

          <div className="row g-4 my-4">
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <span className="aw-icon-tile mb-3"><i className="bi bi-globe2" /></span>
                <h2 className="h4">The global picture</h2>
                <p className="small mb-0" style={{ color: 'var(--aw-muted)' }}>
                  In 2024, 2.1 billion people — one in four — still lacked safely managed drinking
                  water, and 106 million drank untreated surface water.
                </p>
              </div></div>
            </div>
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <span className="aw-icon-tile teal mb-3"><i className="bi bi-geo-alt" /></span>
                <h2 className="h4">India</h2>
                <p className="small mb-0" style={{ color: 'var(--aw-muted)' }}>
                  NITI Aayog's Composite Water Management Index puts nearly 600 million Indians under
                  high to extreme water stress, and ranks India 120th of 122 on water quality.
                </p>
              </div></div>
            </div>
            <div className="col-md-4">
              <div className="card h-100"><div className="card-body">
                <span className="aw-icon-tile red mb-3"><i className="bi bi-exclamation-triangle" /></span>
                <h2 className="h4">Why a portal</h2>
                <p className="small mb-0" style={{ color: 'var(--aw-muted)' }}>
                  Households rarely know what they use, what to do when supply fails, or who to call.
                  AquaWise answers all three in one place.
                </p>
              </div></div>
            </div>
          </div>

          <h2 className="mt-5 mb-3">How the numbers are produced</h2>
          <p>
            Daily household use is the sum of eight activity terms — bathing, toilet, laundry, garden,
            running taps, drinking and cooking, utensils and cleaning, and leaks. Per-capita use is that
            total divided by household size, then compared against the CPHEEO planning norm for your city
            type (70, 135 or 150 lpcd) and the WHO service levels. The full formulas, constants and band
            definitions are in the project's requirements document, and the same module runs in your browser
            and on our server, so the two can never disagree.
          </p>

          <h2 className="mt-5 mb-3">Assumptions we made</h2>
          <p style={{ color: 'var(--aw-muted)' }}>
            These are our own choices or secondary sources. They are stated openly so you can judge the
            estimate for yourself.
          </p>
          <ul className="d-grid gap-2">
            {ASSUMPTIONS.map((a) => <li key={a}>{a}</li>)}
          </ul>

          <h2 className="mt-5 mb-3">References</h2>
          <ol className="d-grid gap-2">
            {SOURCES.map((s) => (
              <li key={s.n}>
                {s.text}{' '}
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  Source <i className="bi bi-box-arrow-up-right small" />
                </a>
              </li>
            ))}
          </ol>

          <div className="card mt-5">
            <div className="card-body text-center p-4">
              <h2 className="h3 mb-2">See where your own water goes</h2>
              <Link className="btn btn-primary btn-lg" to="/calculator">
                <i className="bi bi-calculator me-2" />Open the calculator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
