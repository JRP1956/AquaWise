import mongoose from 'mongoose';

export const COMPLAINT_CATEGORIES = [
  'leakage', 'no_supply', 'unsafe_drinking_water', 'low_pressure', 'contamination', 'other',
];

/** §9.2 — contacts are embedded so the dashboard is a single query. */
const contactSchema = new mongoose.Schema({
  role: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  phone: { type: String, required: true, trim: true, match: [/^\d{3,15}$/, 'Enter a valid phone number'] },
  categories: {
    type: [{ type: String, enum: COMPLAINT_CATEGORIES }],
    validate: [(v) => v.length > 0, 'Choose at least one category this contact handles'],
  },
}, { _id: true });

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
  joinCode: { type: String, required: true, unique: true, uppercase: true, match: /^[A-Z2-9]{6}$/ },
  address: {
    line1: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    area: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 60, default: 'Mumbai' },
    pincode: { type: String, required: true, match: [/^[1-9]\d{5}$/, 'Enter a 6-digit pincode'] },
  },
  cityType: { type: String, enum: ['metro', 'city_sewered', 'town_unsewered'], required: true, default: 'metro' },
  municipalHelpline: { type: String, match: /^\d{3,15}$/, default: '1916' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberCount: { type: Number, default: 1, min: 1 },
  contacts: { type: [contactSchema], validate: [(v) => v.length <= 20, 'At most 20 contacts'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

/** Ambiguous characters (0, O, 1, I) are excluded so codes can be read aloud. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
societySchema.statics.generateJoinCode = async function generateJoinCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
    if (!(await this.exists({ joinCode: code }))) return code;
  }
  throw new Error('Could not generate a unique join code');
};

/** FR-S12 — routing target for a category: the first contact that handles it, else the admin. */
societySchema.methods.routeFor = function routeFor(category, adminUser) {
  const match = this.contacts.find((c) => c.categories.includes(category));
  if (match) return { role: match.role, name: match.name, phone: match.phone };
  return { role: 'Society admin', name: adminUser?.name ?? 'Society admin', phone: adminUser?.phone ?? '' };
};

export default mongoose.model('Society', societySchema);
