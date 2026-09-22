/**
 * One labelled form control with its help text and error message. Used everywhere so
 * validation errors always land in the same place and read the same way (NFR-U3).
 */
export function Field({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="form-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <div className="form-text">{hint}</div>}
      {error && (
        <div className="invalid-feedback d-block">
          <i className="bi bi-exclamation-circle me-1" />{error}
        </div>
      )}
    </div>
  );
}

export function Alert({ tone = 'danger', icon = 'exclamation-triangle', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${tone} d-flex gap-2 align-items-start`} role="alert">
      <i className={`bi bi-${icon} mt-1`} />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="text-center py-5">
      <span className="aw-icon-tile mb-3"><i className={`bi bi-${icon}`} /></span>
      <h3 className="h4">{title}</h3>
      <p className="text-secondary mb-3">{children}</p>
    </div>
  );
}
