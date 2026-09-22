import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { handleValidation, asyncRoute } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** NFR-S4 — 5 failed attempts per 15 minutes per IP. Successful logins do not count. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many failed attempts. Try again in 15 minutes.' } },
});

const password = (field = 'password') => body(field)
  .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters')
  .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
  .matches(/\d/).withMessage('Password must contain a digit');

router.post('/signup', [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters')
    .matches(/^[A-Za-z .'-]+$/).withMessage("Name may contain letters, spaces and . ' - only"),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a 10-digit Indian mobile number'),
  password(),
  handleValidation,
], asyncRoute(ctrl.signup));

router.post('/login', loginLimiter, [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password'),
  handleValidation,
], asyncRoute(ctrl.login));

router.post('/logout', asyncRoute(ctrl.logout));
router.get('/me', asyncRoute(requireAuth), asyncRoute(ctrl.me));

router.patch('/password', asyncRoute(requireAuth), [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  password('newPassword'),
  handleValidation,
], asyncRoute(ctrl.changePassword));

export default router;
