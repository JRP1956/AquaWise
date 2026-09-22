import mongoose from 'mongoose';

/**
 * §9.4 — a saved calculator run. `results` is always recomputed on the server from
 * `inputs`; anything the client sends under `results` is discarded in the controller.
 */
const calculatorLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputs: { type: mongoose.Schema.Types.Mixed, required: true },
  results: {
    byActivity: { type: Map, of: Number, required: true },
    totalLitresPerDay: { type: Number, required: true, min: 0 },
    perCapitaLpcd: { type: Number, required: true, min: 0 },
    normLpcd: { type: Number, required: true, enum: [70, 135, 150] },
    band: {
      type: String, required: true,
      enum: ['critical_undersupply', 'undersupply', 'basic', 'within_norm', 'overuse', 'severe_overuse'],
    },
    flags: [{ type: String, enum: ['overuse', 'undersupply_norm', 'supply_below_need'] }],
  },
  formulaVersion: { type: String, required: true },
}, { timestamps: true });

calculatorLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('CalculatorLog', calculatorLogSchema);
