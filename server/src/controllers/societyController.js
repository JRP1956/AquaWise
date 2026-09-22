import Society from '../models/Society.js';
import User from '../models/User.js';
import { badRequest, notFound, forbidden } from '../middleware/error.js';

/** FR-S4/S5 — the creator becomes the society admin and gets the first join code. */
export async function createSociety(req, res) {
  if (req.user.society) throw badRequest('You already belong to a society. Leave it before creating another.');

  const society = await Society.create({
    name: req.body.name,
    joinCode: await Society.generateJoinCode(),
    address: req.body.address,
    cityType: req.body.cityType,
    municipalHelpline: req.body.municipalHelpline || undefined,
    admin: req.user._id,
    memberCount: 1,
    contacts: [],
  });

  req.user.society = society._id;
  req.user.role = 'society_admin';
  req.user.flatNo = req.body.flatNo;
  req.user.wing = req.body.wing ?? null;
  await req.user.save();

  res.status(201).json({ society, user: req.user.toPublic() });
}

/** FR-S6 — join by code. One society per user (§4, assumption A12). */
export async function joinSociety(req, res) {
  if (req.user.society) throw badRequest('You already belong to a society.');

  const society = await Society.findOne({ joinCode: req.body.joinCode.toUpperCase().trim(), isActive: true });
  if (!society) throw notFound('That join code does not match any society.');

  req.user.society = society._id;
  req.user.flatNo = req.body.flatNo;
  req.user.wing = req.body.wing ?? null;
  await req.user.save();

  society.memberCount = await User.countDocuments({ society: society._id });
  await society.save();

  res.json({ society, user: req.user.toPublic() });
}

export async function getMySociety(req, res) {
  const society = await Society.findById(req.user.society).populate('admin', 'name phone email');
  if (!society) throw notFound('Society not found.');
  res.json({ society });
}

/** FR-S7 — old codes stop working the moment a new one is issued. */
export async function regenerateJoinCode(req, res) {
  const society = await Society.findById(req.user.society);
  if (!society.admin.equals(req.user._id)) throw forbidden('Only the society admin can change the join code.');

  society.joinCode = await Society.generateJoinCode();
  await society.save();
  res.json({ joinCode: society.joinCode });
}

/** FR-S8 — the contacts list drives complaint routing, so only the admin may edit it. */
export async function addContact(req, res) {
  const society = await Society.findById(req.user.society);
  if (society.contacts.length >= 20) throw badRequest('A society can hold at most 20 contacts.');

  society.contacts.push({
    role: req.body.role, name: req.body.name, phone: req.body.phone, categories: req.body.categories,
  });
  await society.save();
  res.status(201).json({ contacts: society.contacts });
}

export async function deleteContact(req, res) {
  const society = await Society.findById(req.user.society);
  const contact = society.contacts.id(req.params.contactId);
  if (!contact) throw notFound('Contact not found.');

  contact.deleteOne();
  await society.save();
  res.json({ contacts: society.contacts });
}

export async function listMembers(req, res) {
  const members = await User.find({ society: req.user.society })
    .select('name flatNo wing role phone email createdAt')
    .sort({ wing: 1, flatNo: 1 });
  res.json({ members });
}
