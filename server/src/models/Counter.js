import mongoose from 'mongoose';

/** Atomic sequence source for readable complaint numbers (FR-S10). */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // e.g. "complaint-2026"
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function next(key) {
  const doc = await this.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
};

export default mongoose.model('Counter', counterSchema);
