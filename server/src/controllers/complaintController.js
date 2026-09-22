import Complaint, { ALLOWED_MOVES } from '../models/Complaint.js';
import Society from '../models/Society.js';
import Counter from '../models/Counter.js';
import User from '../models/User.js';
import { badRequest, notFound, forbidden } from '../middleware/error.js';

const REOPEN_WINDOW_DAYS = 7; // §4, assumption A12

/** FR-S10 — AQW-YYYY-NNNN, sequential per year, from an atomic counter. */
async function nextComplaintNo() {
  const year = new Date().getFullYear();
  const seq = await Counter.next(`complaint-${year}`);
  return `AQW-${year}-${String(seq).padStart(4, '0')}`;
}

/** FR-S9/S11/S12 — file a complaint; society and filer come from the session, never the body. */
export async function createComplaint(req, res) {
  const society = await Society.findById(req.user.society);
  if (!society) throw notFound('Society not found.');

  const admin = await User.findById(society.admin).select('name phone');
  const complaint = await Complaint.create({
    complaintNo: await nextComplaintNo(),
    society: society._id,
    filedBy: req.user._id,
    category: req.body.category,
    severity: req.body.severity,
    advisoryRuleId: req.body.advisoryRuleId || null,
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    assignedContact: society.routeFor(req.body.category, admin),
    status: 'active',
    statusHistory: [{ from: null, to: 'active', by: req.user._id, note: 'Complaint filed', at: new Date() }],
  });

  res.status(201).json({ complaint });
}

/**
 * FR-S16/S17 — admins see every complaint in their society, residents see their own.
 * Counts are society-wide for everyone, which is what the dashboard cards show.
 */
export async function listComplaints(req, res) {
  const { status, category, page = 1 } = req.query;
  const perPage = 20; // NFR-P4
  const isAdmin = req.user.role === 'society_admin' || req.user.role === 'system_admin';

  const filter = { society: req.user.society };
  if (!isAdmin) filter.filedBy = req.user._id;
  if (status) filter.status = status;
  if (category) filter.category = category;

  const [complaints, total, counts] = await Promise.all([
    Complaint.find(filter)
      .populate('filedBy', 'name flatNo wing')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * perPage)
      .limit(perPage),
    Complaint.countDocuments(filter),
    Complaint.aggregate([
      { $match: { society: req.user.society } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]),
  ]);

  const summary = { active: 0, in_progress: 0, resolved: 0 };
  for (const row of counts) summary[row._id] = row.n;

  res.json({ complaints, summary, page: Number(page), perPage, total, scope: isAdmin ? 'society' : 'own' });
}

async function loadVisibleComplaint(req) {
  const complaint = await Complaint.findById(req.params.id)
    .populate('filedBy', 'name flatNo wing')
    .populate('statusHistory.by', 'name role');
  if (!complaint) throw notFound('Complaint not found.');

  // Ownership is checked on the server even though the UI hides other people's complaints.
  if (!complaint.society.equals(req.user.society)) throw forbidden('That complaint belongs to another society.');
  const isAdmin = req.user.role === 'society_admin' || req.user.role === 'system_admin';
  if (!isAdmin && !complaint.filedBy._id.equals(req.user._id)) throw forbidden('You can only open your own complaints.');

  return complaint;
}

export async function getComplaint(req, res) {
  res.json({ complaint: await loadVisibleComplaint(req) });
}

/**
 * FR-S13/S14/S15 — the one place status changes. Admins move forward, the filer may
 * reopen within 7 days, and every move is appended to the history.
 */
export async function updateStatus(req, res) {
  const complaint = await loadVisibleComplaint(req);
  const { to, note = '' } = req.body;
  const from = complaint.status;

  if (from === to) throw badRequest(`This complaint is already ${to.replace('_', ' ')}.`);
  if (!ALLOWED_MOVES[from]?.includes(to)) {
    throw badRequest(`A complaint cannot go from ${from.replace('_', ' ')} to ${to.replace('_', ' ')}.`);
  }

  const isAdmin = req.user.role === 'society_admin' || req.user.role === 'system_admin';
  const isReopen = from === 'resolved' && to === 'active';

  if (isReopen) {
    if (!complaint.filedBy._id.equals(req.user._id)) throw forbidden('Only the person who filed it can reopen a complaint.');
    const days = (Date.now() - new Date(complaint.resolvedAt ?? complaint.updatedAt)) / 86_400_000;
    if (days > REOPEN_WINDOW_DAYS) throw badRequest(`Complaints can only be reopened within ${REOPEN_WINDOW_DAYS} days of being resolved.`);
  } else {
    if (!isAdmin) throw forbidden('Only the society admin can change a complaint\'s status.');
    if (!note.trim()) throw badRequest('Add a note explaining the change.', { note: 'A note is required.' });
  }

  complaint.status = to;
  complaint.resolvedAt = to === 'resolved' ? new Date() : null;
  complaint.statusHistory.push({ from, to, by: req.user._id, note: note.trim(), at: new Date() });
  await complaint.save();

  // The entry we just pushed holds a raw id, so repopulate before returning — otherwise
  // the timeline renders the newest change as an anonymous "A member".
  await complaint.populate('statusHistory.by', 'name role');

  res.json({ complaint });
}
