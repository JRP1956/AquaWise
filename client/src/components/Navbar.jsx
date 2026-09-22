import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/calculator', label: 'Calculator' },
  { to: '/advisory', label: 'Crisis Advisory' },
  { to: '/tips', label: 'Tips' },
];

/** FR-G2 — the navbar changes with login state and role. */
export default function Navbar() {
  const { user, isAdmin, hasSociety, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg aw-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          <span className="aw-logo-mark"><i className="bi bi-droplet-half" /></span>
          <span>Aqua<span style={{ color: 'var(--aw-primary)' }}>Wise</span></span>
        </Link>

        <button
          className="navbar-toggler border-0 d-lg-none" type="button"
          data-bs-toggle="collapse" data-bs-target="#awNav"
          aria-controls="awNav" aria-expanded="false" aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2" style={{ color: 'var(--aw-ink)' }} />
        </button>

        <div className="collapse navbar-collapse" id="awNav">
          <ul className="navbar-nav mx-auto gap-1">
            {LINKS.map((l) => (
              <li className="nav-item" key={l.to}>
                <NavLink className="nav-link" to={l.to} end={l.end}>{l.label}</NavLink>
              </li>
            ))}
            {hasSociety && (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/report">Report a Problem</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="/dashboard">Dashboard</NavLink></li>
              </>
            )}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person-circle me-1" />{user.name.split(' ')[0]}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="dropdown-header">
                    {user.email}
                    {isAdmin && <span className="badge aw-badge-progress ms-2">Society admin</span>}
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {hasSociety
                    ? <li><Link className="dropdown-item" to="/dashboard">My society</Link></li>
                    : <li><Link className="dropdown-item" to="/society">Join or create a society</Link></li>}
                  <li><Link className="dropdown-item" to="/calculator">My calculator history</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Log out</button></li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="btn btn-outline-primary" to="/login">Log in</Link>
                <Link className="btn btn-primary" to="/signup">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
