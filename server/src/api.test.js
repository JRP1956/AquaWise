/**
 * End-to-end API tests for AquaWise.
 *
 * Boots the real Express app against an in-process MongoDB, then walks the whole
 * journey: sign up, create a society, join it, file a complaint, route it, move it
 * through its states, and check that every permission boundary holds. Test IDs match
 * docs/testing.md so the report and the code stay in step.
 *
 * Run: npm --prefix server test
 */
import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from './app.js';
import { calculate } from '../../shared/calculator.js';

let mongo;
let app;

/** A supertest agent keeps the session cookie, which is how a real browser behaves. */
const agent = () => request.agent(app);

const ADMIN = { name: 'Asha Menon', email: 'asha@example.com', phone: '9876543210', password: 'water1234' };
const RESIDENT = { name: 'Vikram Rao', email: 'vikram@example.com', phone: '9876500011', password: 'water1234' };
const OUTSIDER = { name: 'Neha Shah', email: 'neha@example.com', phone: '9876500022', password: 'water1234' };

const SOCIETY = {
  name: 'Sagar Darshan CHS',
  address: { line1: '12 Link Road', area: 'Andheri West', city: 'Mumbai', pincode: '400058' },
  cityType: 'metro',
  flatNo: '701',
  wing: 'A',
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri('aquawise_test');
  await mongoose.connect(uri);
  app = createApp({ mongoUri: uri, sessionSecret: 'test-secret', clientOrigin: true, isProduction: false });
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('TC-API-00 — service', () => {
  test('health check responds', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.ok, true);
  });

  test('an unknown route returns the standard error shape', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});

describe('TC-API-01..06 — signup, login, session', () => {
  test('TC-API-01: signup creates an account and never returns the password hash', async () => {
    const res = await agent().post('/api/auth/signup').send(ADMIN).expect(201);
    assert.equal(res.body.user.email, ADMIN.email);
    assert.equal(res.body.user.role, 'resident');
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.society, null);
  });

  test('TC-API-02: a duplicate email is rejected with 409 and a field message', async () => {
    const res = await agent().post('/api/auth/signup').send(ADMIN).expect(409);
    assert.equal(res.body.error.code, 'CONFLICT');
    assert.ok(res.body.error.fields.email);
  });

  test('TC-API-03: weak passwords and bad phone numbers are rejected field by field', async () => {
    const res = await agent().post('/api/auth/signup')
      .send({ ...RESIDENT, email: 'x@example.com', password: 'short', phone: '12345' })
      .expect(400);
    assert.ok(res.body.error.fields.password);
    assert.ok(res.body.error.fields.phone);
  });

  test('TC-API-04: a wrong password is rejected without revealing which field was wrong', async () => {
    const res = await agent().post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrongpassword1' })
      .expect(401);
    assert.match(res.body.error.message, /Email or password is incorrect/);
  });

  test('TC-API-05: a protected route without a session returns 401', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/complaints').expect(401);
  });

  test('TC-API-06: login starts a session that /me can read, and logout ends it', async () => {
    const a = agent();
    await a.post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password }).expect(200);

    const me = await a.get('/api/auth/me').expect(200);
    assert.equal(me.body.user.email, ADMIN.email);

    await a.post('/api/auth/logout').expect(200);
    await a.get('/api/auth/me').expect(401);
  });
});

describe('TC-API-07..12 — societies', () => {
  let adminAgent;
  let residentAgent;
  let joinCode;

  test('TC-API-07: creating a society makes the creator its admin and issues a join code', async () => {
    adminAgent = agent();
    await adminAgent.post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password }).expect(200);

    const res = await adminAgent.post('/api/societies').send(SOCIETY).expect(201);
    assert.match(res.body.society.joinCode, /^[A-Z2-9]{6}$/);
    assert.equal(res.body.user.role, 'society_admin');
    assert.equal(res.body.society.memberCount, 1);
    joinCode = res.body.society.joinCode;
  });

  test('TC-API-08: an invalid pincode or missing flat number is rejected', async () => {
    const a = agent();
    await a.post('/api/auth/signup').send(OUTSIDER).expect(201);
    const res = await a.post('/api/societies')
      .send({ ...SOCIETY, address: { ...SOCIETY.address, pincode: '12' }, flatNo: '' })
      .expect(400);
    assert.ok(res.body.error.fields['address.pincode']);
    assert.ok(res.body.error.fields.flatNo);
  });

  test('TC-API-09: a resident joins with the code and appears in the member list', async () => {
    residentAgent = agent();
    await residentAgent.post('/api/auth/signup').send(RESIDENT).expect(201);

    const res = await residentAgent.post('/api/societies/join')
      .send({ joinCode, flatNo: '402', wing: 'B' })
      .expect(200);
    assert.equal(res.body.society.name, SOCIETY.name);
    assert.equal(res.body.user.flatNo, '402');

    const members = await adminAgent.get('/api/societies/mine/members').expect(200);
    assert.equal(members.body.members.length, 2);
  });

  test('TC-API-10: a wrong join code is rejected', async () => {
    const a = agent();
    await a.post('/api/auth/login').send({ email: OUTSIDER.email, password: OUTSIDER.password }).expect(200);
    await a.post('/api/societies/join').send({ joinCode: 'ZZZZZZ', flatNo: '101' }).expect(404);
  });

  test('TC-API-11: only the society admin can add routing contacts', async () => {
    const contact = { role: 'Maintenance in-charge', name: 'S. Pawar', phone: '9812345678', categories: ['leakage', 'low_pressure'] };

    await residentAgent.post('/api/societies/mine/contacts').send(contact).expect(403);

    const res = await adminAgent.post('/api/societies/mine/contacts').send(contact).expect(201);
    assert.equal(res.body.contacts.length, 1);
    assert.equal(res.body.contacts[0].name, 'S. Pawar');
  });

  test('TC-API-12: regenerating the join code stops the old one working', async () => {
    const res = await adminAgent.post('/api/societies/mine/join-code').expect(200);
    assert.notEqual(res.body.joinCode, joinCode);

    const a = agent();
    await a.post('/api/auth/login').send({ email: OUTSIDER.email, password: OUTSIDER.password }).expect(200);
    await a.post('/api/societies/join').send({ joinCode, flatNo: '101' }).expect(404);
    await a.post('/api/societies/join').send({ joinCode: res.body.joinCode, flatNo: '101' }).expect(200);
  });
});

describe('TC-API-13..20 — complaints', () => {
  let adminAgent;
  let residentAgent;
  let complaintId;

  before(async () => {
    adminAgent = agent();
    await adminAgent.post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password }).expect(200);
    residentAgent = agent();
    await residentAgent.post('/api/auth/login').send({ email: RESIDENT.email, password: RESIDENT.password }).expect(200);
  });

  test('TC-API-13: filing a complaint numbers it and routes it by category', async () => {
    const res = await residentAgent.post('/api/complaints').send({
      category: 'leakage',
      severity: 'medium',
      title: 'Wet patch on the corridor wall',
      description: 'A damp patch has been spreading on the 4th floor corridor wall since Tuesday.',
      location: 'common_area',
      advisoryRuleId: 'LK-2',
    }).expect(201);

    const c = res.body.complaint;
    assert.match(c.complaintNo, new RegExp(`^AQW-${new Date().getFullYear()}-\\d{4}$`));
    assert.equal(c.status, 'active');
    assert.equal(c.assignedContact.name, 'S. Pawar', 'leakage should route to the maintenance contact');
    assert.equal(c.statusHistory.length, 1);
    assert.equal(c.statusHistory[0].from, null);
    complaintId = c._id;
  });

  test('TC-API-14: a category with no matching contact falls back to the society admin', async () => {
    const res = await residentAgent.post('/api/complaints').send({
      category: 'contamination',
      severity: 'critical',
      title: 'Sewage smell from the overhead tank',
      description: 'Water from the tank smells of sewage this morning across the whole B wing.',
      location: 'overhead_tank',
    }).expect(201);
    assert.equal(res.body.complaint.assignedContact.name, ADMIN.name);
  });

  test('TC-API-15: a short description is rejected before anything is stored', async () => {
    const res = await residentAgent.post('/api/complaints').send({
      category: 'leakage', severity: 'low', title: 'Drip', description: 'tap', location: 'own_flat',
    }).expect(400);
    assert.ok(res.body.error.fields.title);
    assert.ok(res.body.error.fields.description);
  });

  test('TC-API-16: residents see only their own complaints, admins see the whole society', async () => {
    const mine = await residentAgent.get('/api/complaints').expect(200);
    assert.equal(mine.body.scope, 'own');
    assert.equal(mine.body.complaints.length, 2);
    assert.equal(mine.body.summary.active, 2, 'society-wide counts are visible to everyone');

    const all = await adminAgent.get('/api/complaints').expect(200);
    assert.equal(all.body.scope, 'society');
    assert.equal(all.body.complaints.length, 2);
  });

  test('TC-API-17: filtering by status and category narrows the list', async () => {
    const res = await adminAgent.get('/api/complaints?category=leakage&status=active').expect(200);
    assert.equal(res.body.complaints.length, 1);
    assert.equal(res.body.complaints[0].category, 'leakage');
  });

  test('TC-API-18: a resident cannot change a complaint status; the admin must supply a note', async () => {
    await residentAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'in_progress', note: 'fixing' }).expect(403);

    const noNote = await adminAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'in_progress' }).expect(400);
    assert.ok(noNote.body.error.fields.note);

    const ok = await adminAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'in_progress', note: 'Plumber booked for Thursday morning.' }).expect(200);
    assert.equal(ok.body.complaint.status, 'in_progress');
    assert.equal(ok.body.complaint.statusHistory.length, 2);
    assert.equal(ok.body.complaint.statusHistory[1].from, 'active');

    // Regression (D4): the entry just pushed must come back populated, or the timeline
    // renders the newest change as an anonymous "A member".
    assert.equal(ok.body.complaint.statusHistory[1].by.name, ADMIN.name);
  });

  test('TC-API-19: the state machine refuses a move it does not allow', async () => {
    // §9.3 allows in_progress → resolved only. Going back to active is not a reopen,
    // and the state machine rejects it before any ownership rule is considered.
    const backwards = await adminAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'active', note: 'undo' }).expect(400);
    assert.match(backwards.body.error.message, /cannot go from in progress to active/);

    const sideways = await adminAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'in_progress', note: 'again' }).expect(400);
    assert.match(sideways.body.error.message, /already in progress/);
  });

  test('TC-API-20: the filer can reopen within the 7-day window; nobody else can', async () => {
    await adminAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'resolved', note: 'Joint resealed and wall dried.' }).expect(200);

    const resolved = await adminAgent.get(`/api/complaints/${complaintId}`).expect(200);
    assert.ok(resolved.body.complaint.resolvedAt);

    const reopened = await residentAgent.patch(`/api/complaints/${complaintId}/status`)
      .send({ to: 'active', note: 'The patch is back.' }).expect(200);
    assert.equal(reopened.body.complaint.status, 'active');
    assert.equal(reopened.body.complaint.resolvedAt, null);
    assert.equal(reopened.body.complaint.statusHistory.length, 4);
  });

  test('TC-API-21: a member of another society cannot read this one\'s complaints', async () => {
    const outsider = agent();
    await outsider.post('/api/auth/login').send({ email: OUTSIDER.email, password: OUTSIDER.password }).expect(200);
    await outsider.get(`/api/complaints/${complaintId}`).expect(403);
  });
});

describe('TC-API-22..26 — calculator and advisory', () => {
  test('TC-API-22: a guest calculation matches the shared module exactly', async () => {
    const inputs = {
      adults: 2, children: 2, cityType: 'metro', bathingMode: 'shower',
      showersPerPersonPerDay: 1, showerMinutes: 7.8, showerType: 'standard',
      toiletType: 'standard', machineLoadsPerWeek: 5, machineType: 'standard',
      gardenAreaM2: 0, tapMinutesPerPersonPerDay: 2, tapType: 'standard', drippingTaps: 1,
    };
    const res = await request(app).post('/api/calculator').send({ inputs }).expect(200);
    assert.equal(res.body.results.totalLitresPerDay, 678.18);
    assert.equal(res.body.results.perCapitaLpcd, 169.55);
    assert.equal(res.body.results.band, 'overuse');
    assert.equal(res.body.saved, false, 'guests get a result but nothing is stored');

    const local = calculate(inputs);
    assert.equal(res.body.results.totalLitresPerDay, local.results.totalLitresPerDay);
  });

  test('TC-API-23: invalid calculator input returns field errors, not a result', async () => {
    const res = await request(app).post('/api/calculator')
      .send({ inputs: { adults: 0, children: 1, cityType: 'moon', toiletType: 'standard', machineLoadsPerWeek: 0, gardenAreaM2: 0, tapMinutesPerPersonPerDay: 2, tapType: 'standard', drippingTaps: 0, bathingMode: 'shower' } })
      .expect(400);
    assert.ok(res.body.error.fields.adults);
    assert.ok(res.body.error.fields.cityType);
  });

  test('TC-API-24: a logged-in run is saved and appears in history; results sent by the client are ignored', async () => {
    const a = agent();
    await a.post('/api/auth/login').send({ email: RESIDENT.email, password: RESIDENT.password }).expect(200);

    const res = await a.post('/api/calculator').send({
      inputs: { adults: 1, children: 0, cityType: 'city_sewered', bathingMode: 'shower', toiletType: 'standard', machineLoadsPerWeek: 2, machineType: 'standard', gardenAreaM2: 0, tapMinutesPerPersonPerDay: 2, tapType: 'standard', drippingTaps: 0 },
      results: { totalLitresPerDay: 999999 },
    }).expect(200);

    assert.equal(res.body.saved, true);
    assert.notEqual(res.body.results.totalLitresPerDay, 999999);

    const hist = await a.get('/api/calculator/history').expect(200);
    assert.equal(hist.body.logs.length, 1);
    assert.equal(hist.body.logs[0].results.totalLitresPerDay, res.body.results.totalLitresPerDay);
  });

  test('TC-API-25: the advisory rule catalogue is served to guests', async () => {
    const res = await request(app).get('/api/advisory/rules').expect(200);
    assert.equal(res.body.problems.length, 5);
    assert.ok(res.body.problems.every((p) => p.questions.length >= 1));
  });

  test('TC-API-26: evaluation picks the right rule, and a member sees their own contacts', async () => {
    const guest = await request(app).post('/api/advisory/evaluate')
      .send({ problemType: 'leakage', answers: { leakKind: 'burst_pipe', hazard: 'yes' } })
      .expect(200);
    assert.equal(guest.body.rule.id, 'LK-3');
    assert.equal(guest.body.rule.emergency, true);
    assert.equal(guest.body.rule.contacts.find((c) => c.key === 'MUNI').phone, '1916');

    const a = agent();
    await a.post('/api/auth/login').send({ email: RESIDENT.email, password: RESIDENT.password }).expect(200);
    const member = await a.post('/api/advisory/evaluate')
      .send({ problemType: 'leakage', answers: { leakKind: 'pipe_joint', hazard: 'no' } })
      .expect(200);
    assert.equal(member.body.rule.id, 'LK-2');
    assert.equal(member.body.rule.contacts.find((c) => c.key === 'SOC_MAINT').phone, '9812345678');
  });

  test('TC-API-27: an unanswered advisory question returns a field error', async () => {
    const res = await request(app).post('/api/advisory/evaluate')
      .send({ problemType: 'leakage', answers: { leakKind: 'pipe_joint' } })
      .expect(400);
    assert.ok(res.body.error.fields.hazard);
  });
});
