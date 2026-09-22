import mongoose from 'mongoose';
import { COMPLAINT_CATEGORIES } from './Society.js';

export const STATUSES = ['active', 'in_progress', 'resolved'];
export const SEVERITIES = ['low', 'medium', 'high', 'critical'];

/** §9.3 — status history is append-only; it is the audit trail shown on the dashboard. */
const historySchema = new mongoose.Schema({
  from: { type: String, enum: [...STATUSES, null], default: null },
  to: { type: String, enum: STATUSES, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  at: { type: Date, default: Date.now },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  complaintNo: { type: String, required: true, unique: true, match: /^AQW-\d{4}-\d{4}$/ },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
  severity: { type: String, enum: SEVERITIES, required: true, default: 'medium' },
  advisoryRuleId: { type: String, match: /^[A-Z]{2}-\d$/, default: null },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  location: {
    type: String, required: true,
    enum: ['own_flat', 'common_area', 'overhead_tank', 'underground_tank', 'road_main'],
  },
  assignedContact: {
    role: String, name: String, phone: String,
  },
  status: { type: String, enum: STATUSES, default: 'active' },
  statusHistory: { type: [historySchema], default: [] },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

complaintSchema.index({ society: 1, status: 1, createdAt: -1 });
complaintSchema.index({ filedBy: 1, createdAt: -1 });

/** FR-S13/S15 — the only moves the state machine allows. */
export const ALLOWED_MOVES = {
  active: ['in_progress', 'resolved'],
  in_progress: ['resolved'],
  resolved: ['active'], // reopen, filer only, within 7 days — enforced in the controller
};

export default mongoose.model('Complaint', complaintSchema);
