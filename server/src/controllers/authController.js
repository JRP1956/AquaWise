import User from '../models/User.js';
import Society from '../models/Society.js';
import { badRequest, unauthorized, conflict } from '../middleware/error.js';

/** Sessions are regenerated on login so a pre-login session ID cannot be reused (NFR-S2). */
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user._id.toString();
      return req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

/** FR-S1 — role and society are never taken from the body, whatever the client sends. */
export async function signup(req, res) {
  const { name, email, phone, password } = req.body;

  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw conflict('An account with that email already exists.', { email: 'Already registered.' });
  }

  const user = await User.create({
    name, email, phone, passwordHash: await User.hashPassword(password), role: 'resident',
  });

  await startSession(req, user);
  res.status(201).json({ user: user.toPublic() });
}

/** FR-S2 — one message for both wrong email and wrong password, so accounts cannot be enumerated. */
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  if (!user || !user.isActive || !(await user.verifyPassword(password))) {
    throw unauthorized('Email or password is incorrect.');
  }

  user.lastLoginAt = new Date();
  await user.save();
  await startSession(req, user);
  res.json({ user: user.toPublic() });
}

/** FR-S3 */
export async function logout(req, res) {
  await new Promise((resolve) => req.session.destroy(resolve));
  res.clearCookie('aquawise.sid');
  res.json({ ok: true });
}

/** Used by the client on boot to restore the session (and by the navbar, FR-G2). */
export async function me(req, res) {
  const society = req.user.society
    ? await Society.findById(req.user.society).select('name joinCode cityType address municipalHelpline admin contacts')
    : null;
  res.json({ user: req.user.toPublic(), society });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(req.body.currentPassword))) {
    throw badRequest('Your current password is not correct.', { currentPassword: 'Incorrect password.' });
  }
  user.passwordHash = await User.hashPassword(req.body.newPassword);
  await user.save();
  res.json({ ok: true });
}
