import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as ctrl from '../controllers/complaintController.js';
import { handleValidation, asyncRoute } from '../middleware/validate.js';
import { requireAuth, requireSociety } from '../middleware/auth.js';
import { COMPLAINT_CATEGORIES } from '../models/Society.js';
import { STATUSES, SEVERITIES } from '../models/Complaint.js';

const router = Router();
router.use(asyncRoute(requireAuth), requireSociety);

router.post('/', [
  body('category').isIn(COMPLAINT_CATEGORIES).withMessage('Choose a category'),
  body('severity').isIn(SEVERITIES).withMessage('Choose a severity'),
  body('title').trim().isLength({ min: 5, max: 80 }).withMessage('Title must be 5-80 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Describe the problem in 10-1000 characters'),
  body('location').isIn(['own_flat', 'common_area', 'overhead_tank', 'underground_tank', 'road_main']).withMessage('Choose a location'),
  body('advisoryRuleId').optional({ values: 'falsy' }).matches(/^[A-Z]{2}-\d$/).withMessage('Invalid advisory reference'),
  handleValidation,
], asyncRoute(ctrl.createComplaint));

router.get('/', [
  query('status').optional().isIn(STATUSES),
  query('category').optional().isIn(COMPLAINT_CATEGORIES),
  query('page').optional().isInt({ min: 1 }).toInt(),
  handleValidation,
], asyncRoute(ctrl.listComplaints));

router.get('/:id', param('id').isMongoId(), handleValidation, asyncRoute(ctrl.getComplaint));

router.patch('/:id/status', [
  param('id').isMongoId(),
  body('to').isIn(STATUSES).withMessage('Choose a valid status'),
  body('note').optional().trim().isLength({ max: 300 }).withMessage('Note must be at most 300 characters'),
  handleValidation,
], asyncRoute(ctrl.updateStatus));

export default router;
