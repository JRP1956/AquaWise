import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="aw-footer mt-5 pt-5 pb-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="aw-logo-mark"><i className="bi bi-droplet-half" /></span>
              <span className="fw-bold text-white fs-5" style={{ fontFamily: 'Manrope' }}>AquaWise</span>
            </div>
            <p className="small mb-0">
              Smart water conservation and awareness portal. Mapped to UN Sustainable
              Development Goal 6: Clean Water and Sanitation.
            </p>
          </div>

          <div className="col-6 col-lg-2">
            <div className="aw-overline mb-2" style={{ color: '#9CC6EC' }}>Tools</div>
            <ul className="list-unstyled small d-grid gap-1">
              <li><Link to="/calculator">Calculator</Link></li>
              <li><Link to="/advisory">Crisis Advisory</Link></li>
              <li><Link to="/tips">Tips</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <div className="aw-overline mb-2" style={{ color: '#9CC6EC' }}>Society</div>
            <ul className="list-unstyled small d-grid gap-1">
              <li><Link to="/report">Report a Problem</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/society">Join a society</Link></li>
            </ul>
          </div>

          <div className="col-lg-4">
            <div className="aw-overline mb-2" style={{ color: '#9CC6EC' }}>Emergency</div>
            <p className="small mb-1">Police, fire, ambulance: <a href="tel:112" className="fw-bold">112</a></p>
            <p className="small mb-0">Mumbai water complaints (BMC): <a href="tel:1916" className="fw-bold">1916</a></p>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: 'rgba(214,232,248,.25)' }} />
        <div className="d-flex flex-column flex-md-row justify-content-between small gap-2">
          <span>© 2026 AquaWise · Web Programming Laboratory mini-project, K J Somaiya</span>
          <Link to="/about">Data sources &amp; methodology</Link>
        </div>
      </div>
    </footer>
  );
}
