import { validationResult } from 'express-validator';
import { badRequest } from './error.js';

/**
 * Collapses express-validator output into the { fields } shape the client forms expect.
 * Put it last in a route's middleware chain, after the checks.
 */
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fields = {};
  for (const e of result.array()) {
    if (!fields[e.path]) fields[e.path] = e.msg;
  }
  return next(badRequest('Some fields need attention.', fields));
}

/** Wraps an async handler so a rejected promise reaches the error middleware. */
export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
