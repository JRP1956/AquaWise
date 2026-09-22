import { calculate } from '../../../shared/calculator.js';
import CalculatorLog from '../models/CalculatorLog.js';
import { badRequest } from '../middleware/error.js';

/**
 * FR-C10/C11 — the server recomputes from inputs using the same shared module the
 * browser used, then stores the result. Any `results` in the body is ignored.
 */
export async function runCalculation(req, res) {
  const { valid, errors, inputs, results } = calculate(req.body?.inputs ?? req.body);
  if (!valid) throw badRequest('Check the highlighted fields.', errors);

  let logId = null;
  if (req.session?.userId) {
    const log = await CalculatorLog.create({
      user: req.session.userId,
      inputs,
      results: {
        byActivity: results.byActivity,
        totalLitresPerDay: results.totalLitresPerDay,
        perCapitaLpcd: results.perCapitaLpcd,
        normLpcd: results.normLpcd,
        band: results.band,
        flags: results.flags,
      },
      formulaVersion: results.formulaVersion,
    });
    logId = log._id;
  }

  res.json({ inputs, results, logId, saved: Boolean(logId) });
}

/** FR-C11 — the user's last 10 runs. */
export async function history(req, res) {
  const logs = await CalculatorLog.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('results.totalLitresPerDay results.perCapitaLpcd results.band results.normLpcd createdAt inputs.adults inputs.children');
  res.json({ logs });
}
