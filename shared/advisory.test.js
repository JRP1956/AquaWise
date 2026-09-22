import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, listProblems, rulesFor, resolveContacts, PROBLEMS } from './advisory.js';
import RULES from './advisory-rules.json' with { type: 'json' };

test('all 14 rules from §8 are present and every rule belongs to a real problem type', () => {
  assert.equal(RULES.rules.length, 14);
  const ids = new Set(PROBLEMS.map((p) => p.id));
  for (const rule of RULES.rules) {
    assert.ok(ids.has(rule.problem), `${rule.id} points at unknown problem "${rule.problem}"`);
    assert.ok(rule.steps.length > 0, `${rule.id} has no steps`);
    assert.ok(rule.contacts.length > 0, `${rule.id} has no contacts`);
    for (const key of rule.contacts) {
      assert.ok(RULES.contactDirectory[key], `${rule.id} references unknown contact "${key}"`);
    }
  }
});

test('the five problem types each expose questions whose options cover their rules', () => {
  assert.deepEqual(listProblems().map((p) => p.id), [
    'leakage', 'no_supply', 'unsafe_drinking_water', 'low_pressure', 'contamination',
  ]);
  for (const p of PROBLEMS) {
    assert.ok(p.questions.length >= 1 && p.questions.length <= 3, `${p.id} must ask 1-3 questions (FR-A2)`);
  }
});

test('rules are evaluated most severe first', () => {
  assert.deepEqual(rulesFor('leakage').map((r) => r.id), ['LK-3', 'LK-2', 'LK-1']);
  assert.deepEqual(rulesFor('no_supply').map((r) => r.id), ['NS-3', 'NS-2', 'NS-1']);
});

test('leakage: each answer combination lands on the documented rule', () => {
  assert.equal(evaluate('leakage', { leakKind: 'dripping_tap', hazard: 'no' }).rule.id, 'LK-1');
  assert.equal(evaluate('leakage', { leakKind: 'pipe_joint', hazard: 'no' }).rule.id, 'LK-2');
  assert.equal(evaluate('leakage', { leakKind: 'burst_pipe', hazard: 'no' }).rule.id, 'LK-3');
  // The hazard answer alone escalates to critical, whatever the leak kind.
  assert.equal(evaluate('leakage', { leakKind: 'dripping_tap', hazard: 'yes' }).rule.id, 'LK-3');
});

test('no supply: duration or a vulnerable resident escalates to NS-3', () => {
  assert.equal(evaluate('no_supply', { duration: 'under_24h', vulnerable: 'no' }).rule.id, 'NS-1');
  assert.equal(evaluate('no_supply', { duration: 'over_24h', vulnerable: 'no' }).rule.id, 'NS-2');
  assert.equal(evaluate('no_supply', { duration: 'over_72h', vulnerable: 'no' }).rule.id, 'NS-3');
  assert.equal(evaluate('no_supply', { duration: 'under_24h', vulnerable: 'yes' }).rule.id, 'NS-3');
});

test('the remaining problem types resolve to their rules', () => {
  assert.equal(evaluate('unsafe_drinking_water', { symptoms: 'no', sign: 'taste_smell_colour' }).rule.id, 'UD-1');
  assert.equal(evaluate('unsafe_drinking_water', { symptoms: 'yes', sign: 'tank_uncleaned' }).rule.id, 'UD-2');
  assert.equal(evaluate('low_pressure', { scope: 'one_fixture' }).rule.id, 'LP-1');
  assert.equal(evaluate('low_pressure', { scope: 'whole_flat' }).rule.id, 'LP-2');
  assert.equal(evaluate('low_pressure', { scope: 'whole_building' }).rule.id, 'LP-3');
  assert.equal(evaluate('contamination', { appearance: 'discoloured_sediment' }).rule.id, 'CT-1');
  assert.equal(evaluate('contamination', { appearance: 'sewage_smell' }).rule.id, 'CT-2');
  assert.equal(evaluate('contamination', { appearance: 'chemical_smell' }).rule.id, 'CT-3');
});

test('FR-A5: only critical rules raise the emergency banner', () => {
  assert.equal(evaluate('leakage', { leakKind: 'burst_pipe', hazard: 'yes' }).rule.emergency, true);
  assert.equal(evaluate('leakage', { leakKind: 'dripping_tap', hazard: 'no' }).rule.emergency, false);
  // UD-1 is "high", which is serious but not an emergency call.
  assert.equal(evaluate('unsafe_drinking_water', { symptoms: 'no', sign: 'taste_smell_colour' }).rule.emergency, false);
});

test('FR-A3: steps come back in the order they are stored', () => {
  const stored = RULES.rules.find((r) => r.id === 'LK-3').steps;
  const returned = evaluate('leakage', { leakKind: 'burst_pipe', hazard: 'no' }).rule.steps;
  assert.deepEqual(returned, stored);
});

test('unknown problem types and missing answers are rejected, not guessed at', () => {
  const unknown = evaluate('earthquake', {});
  assert.equal(unknown.valid, false);
  assert.equal(unknown.rule, null);
  assert.match(unknown.errors.problemType, /problem type/);

  const incomplete = evaluate('leakage', { leakKind: 'pipe_joint' });
  assert.equal(incomplete.valid, false);
  assert.match(incomplete.errors.hazard, /answer/);

  const bogus = evaluate('low_pressure', { scope: 'the_moon' });
  assert.equal(bogus.valid, false);
  assert.match(bogus.errors.scope, /listed options/);
});

test('FR-A8: the result carries the complaint category for the pre-filled form', () => {
  const r = evaluate('contamination', { appearance: 'sewage_smell' });
  assert.equal(r.rule.complaintCategory, 'contamination');
  assert.equal(r.problem.complaintCategory, 'contamination');
});

test('FR-A4: society contacts replace the generic ones when a society is supplied', () => {
  const society = {
    municipalHelpline: '1800123456',
    address: { city: 'Pune' },
    adminContact: { name: 'R. Kulkarni', phone: '9876543210' },
    contacts: [{ role: 'Maintenance in-charge', name: 'S. Pawar', phone: '9812345678', categories: ['leakage'] }],
  };
  const generic = resolveContacts(['SOC_ADMIN', 'SOC_MAINT', 'MUNI', 'ERSS']);
  assert.equal(generic[2].phone, '1916');
  assert.match(generic[0].phone, /dashboard/);

  const local = resolveContacts(['SOC_ADMIN', 'SOC_MAINT', 'MUNI', 'ERSS'], society);
  assert.equal(local[0].phone, '9876543210');
  assert.equal(local[1].phone, '9812345678');
  assert.equal(local[2].phone, '1800123456');
  assert.equal(local[3].phone, '112', 'the emergency number is never overridden');
});
