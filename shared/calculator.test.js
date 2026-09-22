import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate, computeUsage, validateInputs, classifyBand, defaultInputs, NORMS,
} from './calculator.js';

/** The worked example from docs/REQUIREMENTS.md §7.4 — test case TC-C01. */
const TC_C01 = {
  ...defaultInputs(),
  adults: 2,
  children: 2,
  cityType: 'metro',
  bathingMode: 'shower',
  showersPerPersonPerDay: 1,
  showerMinutes: 7.8,
  showerType: 'standard',
  toiletType: 'standard',
  machineLoadsPerWeek: 5,
  machineType: 'standard',
  gardenAreaM2: 0,
  tapMinutesPerPersonPerDay: 2,
  tapType: 'standard',
  drippingTaps: 1,
};

test('TC-C01: worked example matches the requirements doc line by line', () => {
  const r = computeUsage(TC_C01);
  assert.equal(r.byActivity.bath, 295.15);
  assert.equal(r.byActivity.toilet, 121.2);
  assert.equal(r.byActivity.laundry, 54.08);
  assert.equal(r.byActivity.garden, 0);
  assert.equal(r.byActivity.tap, 66.64);
  assert.equal(r.byActivity.drinkCook, 30);
  assert.equal(r.byActivity.utensilsClean, 80);
  assert.equal(r.byActivity.leak, 31.11);
  assert.equal(r.totalLitresPerDay, 678.18);
  assert.equal(r.perCapitaLpcd, 169.55);
  assert.equal(r.normLpcd, 150);
  assert.equal(r.band, 'overuse');
  assert.deepEqual(r.flags, ['overuse']);
});

test('TC-C02: efficient fixtures bring the same household inside the norm', () => {
  const r = computeUsage({ ...TC_C01, showerType: 'efficient', toiletType: 'efficient', machineType: 'efficient', drippingTaps: 0 });
  // §7.4 quotes 578.79 L/day with the leak still present; without it, 31.11 L less.
  assert.equal(r.totalLitresPerDay, 578.79 - 31.11);
  assert.ok(r.perCapitaLpcd < 150, 'per-capita use should fall below the metro norm');
  assert.deepEqual(r.flags, []);
});

test('the activity breakdown always sums to the total', () => {
  const r = computeUsage(TC_C01);
  const sum = Object.values(r.byActivity).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - r.totalLitresPerDay) <= 0.01, `${sum} vs ${r.totalLitresPerDay}`);
});

test('a single person with minimal use falls in the under-supply bands', () => {
  const lean = {
    ...defaultInputs(), adults: 1, children: 0, bathingMode: 'bucket',
    bucketBathsPerPersonPerDay: 0.5, toiletType: 'efficient', machineLoadsPerWeek: 0,
    tapMinutesPerPersonPerDay: 0, drippingTaps: 0,
  };
  // Go through calculate(), not computeUsage(), so bathingMode actually zeroes the shower term.
  const { results: r } = calculate(lean);
  // 10 (bucket) + 24.25 (toilet) + 7.5 (drink/cook) + 20 (utensils) = 61.75 → "basic", just above JJM 55.
  assert.equal(r.totalLitresPerDay, 61.75);
  assert.equal(r.band, 'basic');

  const { results: barer } = calculate({ ...lean, bucketBathsPerPersonPerDay: 0 });
  assert.equal(barer.totalLitresPerDay, 51.75);
  assert.equal(barer.band, 'undersupply');
  assert.deepEqual(barer.flags, ['undersupply_norm']);
});

test('band boundaries are classified per §7.3, first match wins', () => {
  const N = NORMS.metro;
  assert.equal(classifyBand(19.99, N), 'critical_undersupply');
  assert.equal(classifyBand(20, N), 'undersupply');
  assert.equal(classifyBand(54.99, N), 'undersupply');
  assert.equal(classifyBand(55, N), 'basic');
  assert.equal(classifyBand(99.99, N), 'basic');
  assert.equal(classifyBand(100, N), 'within_norm');
  assert.equal(classifyBand(150, N), 'within_norm');
  assert.equal(classifyBand(150.01, N), 'overuse');
  assert.equal(classifyBand(200, N), 'overuse');
  assert.equal(classifyBand(200.01, N), 'severe_overuse');
  // A town has a lower norm, so the same usage reads as over-use there.
  assert.equal(classifyBand(120, NORMS.town_unsewered), 'overuse');
  assert.equal(classifyBand(120, NORMS.city_sewered), 'within_norm');
});

test('FR-C8: the supply check flags both the JJM shortfall and the gap against need', () => {
  const r = computeUsage({ ...TC_C01, suppliedLitresPerDay: 200 });
  assert.equal(r.supply.lpcd, 50);
  assert.equal(r.supply.shortfall, 478.18);
  assert.ok(r.flags.includes('undersupply_norm'));
  assert.ok(r.flags.includes('supply_below_need'));

  const ample = computeUsage({ ...TC_C01, suppliedLitresPerDay: 900 });
  assert.equal(ample.supply.shortfall, 0);
  assert.ok(!ample.flags.includes('supply_below_need'));
});

test('FR-C9: the top three activities come back sorted, with real savings', () => {
  const r = computeUsage(TC_C01);
  assert.deepEqual(r.savings.map((s) => s.activity), ['bath', 'toilet', 'utensilsClean']);
  assert.equal(r.savings[0].saves, 58.97);  // 4 × 7.8 min × (9.46 − 7.57)
  assert.equal(r.savings[1].saves, 24.2);   // 4 × 5 × (6.06 − 4.85)
  assert.ok(r.savings[0].percent > r.savings[1].percent);
});

test('FR-C12: invalid input is rejected field by field, and nothing is computed', () => {
  const bad = calculate({ ...TC_C01, adults: 0, children: 'two', showerMinutes: 999 });
  assert.equal(bad.valid, false);
  assert.equal(bad.results, null);
  assert.match(bad.errors.adults, /between 1 and 20/);
  assert.match(bad.errors.children, /number/);
  assert.match(bad.errors.showerMinutes, /between 1 and 60/);
});

test('missing optional fields fall back to the documented defaults', () => {
  const { value, valid } = validateInputs({ adults: 3, children: 1, cityType: 'city_sewered', bathingMode: 'shower', toiletType: 'standard', machineLoadsPerWeek: 4, gardenAreaM2: 0, tapMinutesPerPersonPerDay: 2, tapType: 'standard', drippingTaps: 0 });
  assert.equal(valid, true);
  assert.equal(value.showerMinutes, 7.8);
  assert.equal(value.showersPerPersonPerDay, 1);
  assert.equal(value.suppliedLitresPerDay, null);
});

test('a required field left blank is an error, not a silent default', () => {
  const { errors, valid } = validateInputs({ ...TC_C01, adults: '', cityType: '' });
  assert.equal(valid, false);
  assert.match(errors.adults, /required/);
  assert.match(errors.cityType, /required/);
});

test('bathing mode zeroes the irrelevant term so the two modes never double-count', () => {
  const bucketOnly = validateInputs({ ...TC_C01, bathingMode: 'bucket', bucketBathsPerPersonPerDay: 1, showersPerPersonPerDay: 2 });
  assert.equal(bucketOnly.value.showersPerPersonPerDay, 0);
  const showerOnly = validateInputs({ ...TC_C01, bathingMode: 'shower', bucketBathsPerPersonPerDay: 2 });
  assert.equal(showerOnly.value.bucketBathsPerPersonPerDay, 0);
});

test('household size cap is enforced across fields', () => {
  const { errors } = validateInputs({ ...TC_C01, adults: 20, children: 20 });
  assert.match(errors.children, /cannot exceed 30/);
});
