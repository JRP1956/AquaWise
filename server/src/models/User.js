import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/** §9.1 — a resident of a society, or a guest who has signed up but not joined one yet. */
const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'], trim: true,
    minlength: [2, 'Name must be at least 2 characters'], maxlength: [60, 'Name must be at most 60 characters'],
    match: [/^[A-Za-z .'-]+$/, "Name may contain letters, spaces and . ' - only"],
  },
  email: {
    type: String, required: [true, 'Email is required'], trim: true, lowercase: true, unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
  },
  phone: {
    type: String, required: [true, 'Phone is required'], trim: true,
    match: [/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'],
  },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['resident', 'society_admin', 'system_admin'], default: 'resident' },
  society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', default: null },
  flatNo: { type: String, trim: true, maxlength: 10, default: null },
  wing: { type: String, trim: true, maxlength: 10, default: null },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

/** Hashing lives on the model so no controller can forget it (NFR-S1). */
userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);
userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/** The only shape of a user that ever leaves the server — no hash, ever. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id, name: this.name, email: this.email, phone: this.phone,
    role: this.role, society: this.society, flatNo: this.flatNo, wing: this.wing,
  };
};

export default mongoose.model('User', userSchema);
