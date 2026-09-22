/**
 * One fetch wrapper for the whole app. Every call sends the session cookie and
 * turns the API's { error: { code, message, fields } } shape into a thrown ApiError,
 * so pages only ever handle `err.fields` and `err.message`.
 */
const BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? 'Something went wrong. Please try again.');
    this.status = status;
    this.code = body?.error?.code ?? 'UNKNOWN';
    this.fields = body?.error?.fields ?? {};
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: { code: 'NETWORK', message: 'Cannot reach the server. Is the API running?' } });
  }

  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};
