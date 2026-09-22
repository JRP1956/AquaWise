import { listProblems, evaluate } from '../../../shared/advisory.js';
import Society from '../models/Society.js';
import User from '../models/User.js';
import { badRequest } from '../middleware/error.js';

/** FR-A7 — the rule catalogue, so the client can render the questions. */
export function getRules(req, res) {
  res.json({ problems: listProblems() });
}

/**
 * FR-A7/A4 — evaluate answers server-side. When the caller is logged in and belongs
 * to a society, their own contacts replace the generic directory entries.
 */
export async function evaluateAdvisory(req, res) {
  let society = null;
  if (req.session?.userId) {
    const user = await User.findById(req.session.userId).select('society');
    if (user?.society) {
      const doc = await Society.findById(user.society).populate('admin', 'name phone');
      if (doc) {
        society = {
          municipalHelpline: doc.municipalHelpline,
          address: doc.address,
          contacts: doc.contacts,
          adminContact: doc.admin ? { name: doc.admin.name, phone: doc.admin.phone } : null,
        };
      }
    }
  }

  const result = evaluate(req.body.problemType, req.body.answers ?? {}, society);
  if (!result.valid) throw badRequest('Answer every question to get guidance.', result.errors);

  res.json(result);
}
