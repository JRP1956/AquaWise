import User from '../models/User.js';
import { unauthorized, forbidden } from './error.js';

/**
 * NFR-S3 — every protected route goes through these. The session is the only source
 * of identity; nothing is ever read from the request body.
 */
export async function requireAuth(req, res, next) {
  if (!req.session?.userId) return next(unauthorized());
  const user = await User.findById(req.session.userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return next(unauthorized('Your session has ended. Please log in again.'));
  }
  req.user = user;
  return next();
}

export const requireRole = (...roles) => (req, res, next) => (
  roles.includes(req.user.role) ? next() : next(forbidden('This action is for the society admin.'))
);

/** A user with no society cannot touch complaints at all (§4). */
export function requireSociety(req, res, next) {
  if (!req.user.society) return next(forbidden('Join a society before using the complaint portal.'));
  return next();
}
