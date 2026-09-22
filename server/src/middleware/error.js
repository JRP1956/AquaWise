/** FR-G3 — one JSON error shape for the whole API: { error: { code, message, fields? } }. */
export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message, fields) => new ApiError(400, 'BAD_REQUEST', message, fields);
export const unauthorized = (message = 'Please log in to continue.') => new ApiError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have access to this.') => new ApiError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Not found.') => new ApiError(404, 'NOT_FOUND', message);
export const conflict = (message, fields) => new ApiError(409, 'CONFLICT', message, fields);

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}` } });
}

/** Translates Mongoose and thrown ApiErrors into the one response shape. */
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    });
  }
  if (err?.name === 'ValidationError') {
    const fields = {};
    for (const [field, detail] of Object.entries(err.errors)) fields[field] = detail.message;
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Some fields need attention.', fields } });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? { value: 1 })[0];
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `That ${field} is already in use.`, fields: { [field]: 'Already in use.' } },
    });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: { code: 'BAD_ID', message: 'That identifier is not valid.' } });
  }

  console.error('[unhandled]', err);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong on our side.' } });
}
