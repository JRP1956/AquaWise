import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/societyController.js';
import { handleValidation, asyncRoute } from '../middleware/validate.js';
import { requireAuth, requireRole, requireSociety } from '../middleware/auth.js';
import { COMPLAINT_CATEGORIES } from '../models/Society.js';

const router = Router();
router.use(asyncRoute(requireAuth));

router.post('/', [
  body('name').trim().isLength({ min: 3, max: 80 }).withMessage('Society name must be 3-80 characters'),
  body('address.line1').trim().isLength({ min: 5, max: 120 }).withMessage('Address line must be 5-120 characters'),
  body('address.area').trim().isLength({ min: 2, max: 60 }).withMessage('Enter the area'),
  body('address.city').trim().isLength({ min: 2, max: 60 }).withMessage('Enter the city'),
  body('address.pincode').trim().matches(/^[1-9]\d{5}$/).withMessage('Enter a 6-digit pincode'),
  body('cityType').isIn(['metro', 'city_sewered', 'town_unsewered']).withMessage('Choose a city type'),
  body('flatNo').trim().isLength({ min: 1, max: 10 }).withMessage('Enter your flat number'),
  body('wing').optional({ values: 'falsy' }).trim().isLength({ max: 10 }),
  body('municipalHelpline').optional({ values: 'falsy' }).trim().matches(/^\d{3,15}$/).withMessage('Enter a valid helpline number'),
  handleValidation,
], asyncRoute(ctrl.createSociety));

router.post('/join', [
  body('joinCode').trim().toUpperCase().matches(/^[A-Z2-9]{6}$/).withMessage('A join code is 6 letters and digits'),
  body('flatNo').trim().isLength({ min: 1, max: 10 }).withMessage('Enter your flat number'),
  body('wing').optional({ values: 'falsy' }).trim().isLength({ max: 10 }),
  handleValidation,
], asyncRoute(ctrl.joinSociety));

router.get('/mine', requireSociety, asyncRoute(ctrl.getMySociety));
router.get('/mine/members', requireSociety, asyncRoute(ctrl.listMembers));

router.post('/mine/join-code', requireSociety, requireRole('society_admin', 'system_admin'), asyncRoute(ctrl.regenerateJoinCode));

router.post('/mine/contacts', requireSociety, requireRole('society_admin', 'system_admin'), [
  body('role').trim().isLength({ min: 2, max: 40 }).withMessage('Role must be 2-40 characters'),
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('phone').trim().matches(/^\d{3,15}$/).withMessage('Enter a valid phone number'),
  body('categories').isArray({ min: 1 }).withMessage('Choose at least one category'),
  body('categories.*').isIn(COMPLAINT_CATEGORIES).withMessage('Unknown category'),
  handleValidation,
], asyncRoute(ctrl.addContact));

router.delete('/mine/contacts/:contactId', requireSociety, requireRole('society_admin', 'system_admin'), asyncRoute(ctrl.deleteContact));

export default router;
