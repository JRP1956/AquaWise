import { Router } from 'express';
import { body } from 'express-validator';
import * as calc from '../controllers/calculatorController.js';
import * as advisory from '../controllers/advisoryController.js';
import { handleValidation, asyncRoute } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * The calculator and advisory are open to guests (§4), so these routes do not
 * require a session — they only use one if it happens to be there.
 */
const router = Router();

router.post('/calculator', asyncRoute(calc.runCalculation));
router.get('/calculator/history', asyncRoute(requireAuth), asyncRoute(calc.history));

router.get('/advisory/rules', advisory.getRules);
router.post('/advisory/evaluate', [
  body('problemType').trim().notEmpty().withMessage('Choose a problem type'),
  body('answers').optional().isObject().withMessage('Answers must be an object'),
  handleValidation,
], asyncRoute(advisory.evaluateAdvisory));

export default router;
