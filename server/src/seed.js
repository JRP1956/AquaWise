/**
 * Demo data for the viva. Wipes the four AquaWise collections and rebuilds a society
 * with an admin, two residents, routing contacts and complaints in all three states.
 *
 * Run: npm --prefix server run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Society from './models/Society.js';
import Complaint from './models/Complaint.js';
import CalculatorLog from './models/CalculatorLog.js';
import Counter from './models/Counter.js';
import { calculate } from '../../shared/calculator.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/aquawise';
const PASSWORD = 'water1234';

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${mongoose.connection.name}`);

  await Promise.all([
    User.deleteMany({}), Society.deleteMany({}), Complaint.deleteMany({}),
    CalculatorLog.deleteMany({}), Counter.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const passwordHash = await User.hashPassword(PASSWORD);

  const admin = await User.create({
    name: 'Asha Menon', email: 'asha@aquawise.test', phone: '9876543210',
    passwordHash, role: 'society_admin', flatNo: '701', wing: 'A',
  });

  const society = await Society.create({
    name: 'Sagar Darshan CHS',
    joinCode: 'AQUA26',
    address: { line1: '12 Link Road', area: 'Andheri West', city: 'Mumbai', pincode: '400058' },
    cityType: 'metro',
    municipalHelpline: '1916',
    admin: admin._id,
    memberCount: 3,
    contacts: [
      { role: 'Maintenance in-charge', name: 'Sunil Pawar', phone: '9812345678', categories: ['leakage', 'low_pressure', 'no_supply'] },
      { role: 'Empanelled plumber', name: 'Imran Shaikh', phone: '9823456789', categories: ['leakage', 'low_pressure'] },
      { role: 'Tank & water quality', name: 'Priya Nair', phone: '9834567890', categories: ['unsafe_drinking_water', 'contamination'] },
    ],
  });

  admin.society = society._id;
  await admin.save();

  const [vikram, meera] = await User.create([
    { name: 'Vikram Rao', email: 'vikram@aquawise.test', phone: '9876500011', passwordHash, society: society._id, flatNo: '402', wing: 'B' },
    { name: 'Meera Joshi', email: 'meera@aquawise.test', phone: '9876500022', passwordHash, society: society._id, flatNo: '105', wing: 'A' },
  ]);

  const year = new Date().getFullYear();
  const no = async () => `AQW-${year}-${String(await Counter.next(`complaint-${year}`)).padStart(4, '0')}`;

  await Complaint.create([
    {
      complaintNo: await no(), society: society._id, filedBy: vikram._id,
      category: 'leakage', severity: 'medium', advisoryRuleId: 'LK-2',
      title: 'Wet patch spreading on 4th floor corridor wall',
      description: 'A damp patch near the B-wing lift lobby has been spreading since Tuesday. It looks like a joint behind the wall rather than anything inside a flat.',
      location: 'common_area',
      assignedContact: { role: 'Maintenance in-charge', name: 'Sunil Pawar', phone: '9812345678' },
      status: 'active',
      statusHistory: [{ from: null, to: 'active', by: vikram._id, note: 'Complaint filed', at: daysAgo(2) }],
      createdAt: daysAgo(2),
    },
    {
      complaintNo: await no(), society: society._id, filedBy: meera._id,
      category: 'low_pressure', severity: 'low', advisoryRuleId: 'LP-2',
      title: 'Very low pressure in flat A-105 since the weekend',
      description: 'Every tap in the flat runs at a trickle. Neighbours on the same line say theirs is normal, so it is probably our inlet filter.',
      location: 'own_flat',
      assignedContact: { role: 'Empanelled plumber', name: 'Imran Shaikh', phone: '9823456789' },
      status: 'in_progress',
      statusHistory: [
        { from: null, to: 'active', by: meera._id, note: 'Complaint filed', at: daysAgo(5) },
        { from: 'active', to: 'in_progress', by: admin._id, note: 'Plumber visiting Thursday morning to check the inlet filter.', at: daysAgo(3) },
      ],
      createdAt: daysAgo(5),
    },
    {
      complaintNo: await no(), society: society._id, filedBy: vikram._id,
      category: 'contamination', severity: 'high', advisoryRuleId: 'CT-1',
      title: 'Brown water from the overhead tank on Monday morning',
      description: 'Water ran brown with visible sediment for about ten minutes. It cleared after running the tap, but the tank has not been cleaned since March.',
      location: 'overhead_tank',
      assignedContact: { role: 'Tank & water quality', name: 'Priya Nair', phone: '9834567890' },
      status: 'resolved',
      resolvedAt: daysAgo(1),
      statusHistory: [
        { from: null, to: 'active', by: vikram._id, note: 'Complaint filed', at: daysAgo(9) },
        { from: 'active', to: 'in_progress', by: admin._id, note: 'Tank cleaning scheduled with the agency.', at: daysAgo(7) },
        { from: 'in_progress', to: 'resolved', by: admin._id, note: 'Both tanks cleaned and disinfected. Sample sent for IS 10500 testing; report awaited.', at: daysAgo(1) },
      ],
      createdAt: daysAgo(9),
    },
  ]);

  // A short calculator history for Vikram, so the history panel is not empty in the demo.
  // Each run improves on the last, which is the story to tell in the viva.
  const runs = [
    { showerMinutes: 10, drippingTaps: 2, showerType: 'standard', toiletType: 'old', age: 20 },
    { showerMinutes: 8.5, drippingTaps: 1, showerType: 'standard', toiletType: 'standard', age: 10 },
    { showerMinutes: 7, drippingTaps: 0, showerType: 'efficient', toiletType: 'efficient', age: 2 },
  ];

  for (const run of runs) {
    const { results, inputs } = calculate({
      adults: 2, children: 2, cityType: 'metro', bathingMode: 'shower',
      showersPerPersonPerDay: 1, showerMinutes: run.showerMinutes, showerType: run.showerType,
      toiletType: run.toiletType, machineLoadsPerWeek: 5, machineType: 'standard',
      gardenAreaM2: 0, tapMinutesPerPersonPerDay: 2, tapType: 'standard', drippingTaps: run.drippingTaps,
    });

    await CalculatorLog.create({
      user: vikram._id,
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
      createdAt: daysAgo(run.age),
    });
  }

  console.log(`
Seeded:
  Society     ${society.name}  ·  join code ${society.joinCode}
  Admin       ${admin.email}   (password: ${PASSWORD})
  Residents   ${vikram.email}, ${meera.email}   (password: ${PASSWORD})
  Complaints  3 — one active, one in progress, one resolved
  Contacts    3 routing contacts covering all five advisory categories
`);

  await mongoose.disconnect();
}

seed()
  .then(() => { console.log('Seed complete.'); process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
