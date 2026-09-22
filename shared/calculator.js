/**
 * AquaWise — water requirement & usage calculator.
 *
 * Pure functions only: no React, no Express, no Mongoose. The client imports this
 * for guest calculations (FR-C10) and the server imports the same file so a logged-in
 * run cannot disagree with what the browser showed.
 *
 * Every constant, formula and band comes from docs/REQUIREMENTS.md §7.
 */

export const FORMULA_VERSION = '1.0';

/** §7.2 — litres per unit. [SRC n] refer to the References section of the requirements doc. */
export const CONSTANTS = {
  shower: { standard: 9.46, efficient: 7.57 },        // L/min  [SRC 7]
  bucket: 20,                                          // L/bath [ASSUMED A1]
  flushesPerPersonPerDay: 5.0,                         //        [SRC 12]
  flush: { old: 22.71, standard: 6.06, efficient: 4.85 },   // L/flush [SRC 10]
  load: { older: 117.35, standard: 75.71, efficient: 53.0 }, // L/load  [SRC 12][SRC 11]
  gardenPerM2: 3.63,                                   // L/m²/day [SRC 13]
  tap: { standard: 8.33, aerated: 5.68 },              // L/min  [SRC 9]
  drinkCookPerPerson: 7.5,                             // L/p/day [SRC 5]
  utensilsCleanPerPerson: 20,                          // L/p/day [ASSUMED A2]
  drippingTap: 31.11,                                  // L/tap/day [SRC 8]
};

/** §7.1 — CPHEEO planning norm in lpcd, selected by city type. */
export const NORMS = { metro: 150, city_sewered: 135, town_unsewered: 70 };

/** Service levels used by the bands and the supply check. */
export const THRESHOLDS = {
  whoBasic: 20,      // [SRC 5]
  jjmAdequate: 55,   // [SRC 6]
  whoOptimal: 100,   // [SRC 5]
  isUpper: 200,      // [SRC 4]
};

export const ACTIVITY_LABELS = {
  bath: 'Bathing',
  toilet: 'Toilet',
  laundry: 'Laundry',
  garden: 'Garden',
  tap: 'Taps left running',
  drinkCook: 'Drinking & cooking',
  utensilsClean: 'Utensils & cleaning',
  leak: 'Dripping taps',
};

export const BAND_META = {
  critical_undersupply: { label: 'Critical under-supply', tone: 'danger', basis: 'Below the WHO basic-access level of 20 lpcd' },
  undersupply: { label: 'Under-supply', tone: 'warning', basis: 'Below the Jal Jeevan Mission service level of 55 lpcd' },
  basic: { label: 'Basic', tone: 'primary', basis: 'Meets 55 lpcd but below the WHO optimal level of 100 lpcd' },
  within_norm: { label: 'Within norm', tone: 'success', basis: 'Between WHO optimal and the CPHEEO planning norm' },
  overuse: { label: 'Over-use', tone: 'warning', basis: 'Above the CPHEEO planning norm for this city type' },
  severe_overuse: { label: 'Severe over-use', tone: 'danger', basis: 'Above the IS 1172 upper design range of 200 lpcd' },
};

/** §9.4 — the shape and limits of every input, used for validation and for form defaults. */
export const INPUT_SPEC = {
  adults: { type: 'int', min: 1, max: 20, default: 2, required: true },
  children: { type: 'int', min: 0, max: 20, default: 0, required: true },
  cityType: { type: 'enum', values: ['metro', 'city_sewered', 'town_unsewered'], default: 'metro', required: true },
  bathingMode: { type: 'enum', values: ['shower', 'bucket', 'both'], default: 'shower', required: true },
  showersPerPersonPerDay: { type: 'num', min: 0, max: 5, default: 1 },
  showerMinutes: { type: 'num', min: 1, max: 60, default: 7.8 },
  showerType: { type: 'enum', values: ['standard', 'efficient'], default: 'standard' },
  bucketBathsPerPersonPerDay: { type: 'num', min: 0, max: 5, default: 0 },
  toiletType: { type: 'enum', values: ['old', 'standard', 'efficient'], default: 'standard', required: true },
  machineLoadsPerWeek: { type: 'int', min: 0, max: 21, default: 0, required: true },
  machineType: { type: 'enum', values: ['older', 'standard', 'efficient'], default: 'standard' },
  gardenAreaM2: { type: 'num', min: 0, max: 1000, default: 0, required: true },
  tapMinutesPerPersonPerDay: { type: 'num', min: 0, max: 60, default: 2, required: true },
  tapType: { type: 'enum', values: ['standard', 'aerated'], default: 'standard', required: true },
  drippingTaps: { type: 'int', min: 0, max: 20, default: 0, required: true },
  suppliedLitresPerDay: { type: 'num', min: 0, max: 20000, default: null },
};

export function defaultInputs() {
  const out = {};
  for (const [field, spec] of Object.entries(INPUT_SPEC)) out[field] = spec.default;
  return out;
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Validate and coerce raw form/JSON input against INPUT_SPEC (§9.4).
 * Returns { value, errors } — errors is an object keyed by field name, empty when valid.
 * Both the browser form and the API route call this, so the rules cannot drift apart (NFR-V1).
 */
export function validateInputs(raw = {}) {
  const errors = {};
  const value = {};

  for (const [field, spec] of Object.entries(INPUT_SPEC)) {
    let v = raw[field];
    const blank = v === undefined || v === null || v === '';

    if (blank) {
      if (spec.required) {
        errors[field] = 'This field is required.';
        continue;
      }
      value[field] = spec.default;
      continue;
    }

    if (spec.type === 'enum') {
      if (!spec.values.includes(v)) errors[field] = `Choose one of: ${spec.values.join(', ')}.`;
      else value[field] = v;
      continue;
    }

    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) {
      errors[field] = 'Enter a number.';
      continue;
    }
    if (spec.type === 'int' && !Number.isInteger(n)) {
      errors[field] = 'Enter a whole number.';
      continue;
    }
    if (n < spec.min || n > spec.max) {
      errors[field] = `Enter a value between ${spec.min} and ${spec.max}.`;
      continue;
    }
    value[field] = n;
  }

  // Cross-field rules that no single field can catch on its own.
  const people = (value.adults ?? 0) + (value.children ?? 0);
  if (!errors.adults && !errors.children && people > 30) {
    errors.children = 'Adults and children together cannot exceed 30.';
  }
  if (value.bathingMode === 'bucket') value.showersPerPersonPerDay = 0;
  if (value.bathingMode === 'shower') value.bucketBathsPerPersonPerDay = 0;
  if (value.machineLoadsPerWeek === 0) value.machineType = INPUT_SPEC.machineType.default;

  return { value, errors, valid: Object.keys(errors).length === 0 };
}

/** §7.2 — litres per day for each activity. Split out so each term is testable on its own. */
export function activityLitres(i) {
  const people = i.adults + i.children;
  const showerFlow = CONSTANTS.shower[i.showerType] ?? CONSTANTS.shower.standard;
  const tapFlow = CONSTANTS.tap[i.tapType] ?? CONSTANTS.tap.standard;

  return {
    bath: people * (i.showersPerPersonPerDay * i.showerMinutes * showerFlow
      + i.bucketBathsPerPersonPerDay * CONSTANTS.bucket),
    toilet: people * CONSTANTS.flushesPerPersonPerDay * CONSTANTS.flush[i.toiletType],
    laundry: i.machineLoadsPerWeek > 0 ? (i.machineLoadsPerWeek * CONSTANTS.load[i.machineType]) / 7 : 0,
    garden: i.gardenAreaM2 * CONSTANTS.gardenPerM2,
    tap: people * i.tapMinutesPerPersonPerDay * tapFlow,
    drinkCook: CONSTANTS.drinkCookPerPerson * people,
    utensilsClean: CONSTANTS.utensilsCleanPerPerson * people,
    leak: CONSTANTS.drippingTap * i.drippingTaps,
  };
}

/** §7.3 — first match wins, evaluated top to bottom. */
export function classifyBand(lpcd, norm) {
  if (lpcd < THRESHOLDS.whoBasic) return 'critical_undersupply';
  if (lpcd < THRESHOLDS.jjmAdequate) return 'undersupply';
  if (lpcd > THRESHOLDS.isUpper) return 'severe_overuse';
  if (lpcd > norm) return 'overuse';
  if (lpcd < THRESHOLDS.whoOptimal) return 'basic';
  return 'within_norm';
}

/**
 * FR-C9 — the three biggest activities, each with a tip and the litres a fixture swap
 * would save. Savings are recomputed from the formulas, never guessed.
 */
export function savingOpportunities(inputs, byActivity) {
  const people = inputs.adults + inputs.children;
  const candidates = {
    bath: inputs.showerType === 'standard' && inputs.showersPerPersonPerDay > 0
      ? {
          tip: 'Fit a WaterSense-rated shower head (7.57 L/min instead of 9.46 L/min).',
          saves: people * inputs.showersPerPersonPerDay * inputs.showerMinutes
            * (CONSTANTS.shower.standard - CONSTANTS.shower.efficient),
        }
      : { tip: 'Cut one minute off each shower.', saves: people * inputs.showersPerPersonPerDay * (CONSTANTS.shower[inputs.showerType] ?? 0) },
    toilet: inputs.toiletType !== 'efficient'
      ? {
          tip: `Replace the ${inputs.toiletType} cistern with a 4.85 L dual-flush one.`,
          saves: people * CONSTANTS.flushesPerPersonPerDay
            * (CONSTANTS.flush[inputs.toiletType] - CONSTANTS.flush.efficient),
        }
      : { tip: 'Your cistern is already efficient — keep it leak-free.', saves: 0 },
    laundry: inputs.machineLoadsPerWeek > 0 && inputs.machineType !== 'efficient'
      ? {
          tip: 'Run full loads, and choose a front-load machine (53 L/load) next time.',
          saves: (inputs.machineLoadsPerWeek * (CONSTANTS.load[inputs.machineType] - CONSTANTS.load.efficient)) / 7,
        }
      : { tip: 'Wash only full loads.', saves: 0 },
    tap: inputs.tapType === 'standard'
      ? {
          tip: 'Fit tap aerators (5.68 L/min instead of 8.33 L/min).',
          saves: people * inputs.tapMinutesPerPersonPerDay * (CONSTANTS.tap.standard - CONSTANTS.tap.aerated),
        }
      : { tip: 'Turn the tap off while brushing and soaping.', saves: people * Math.min(inputs.tapMinutesPerPersonPerDay, 1) * CONSTANTS.tap.aerated },
    leak: { tip: 'Fix every dripping tap — each one wastes about 31 L a day.', saves: byActivity.leak },
    garden: { tip: 'Water before 10 a.m. and use a bucket or drip line instead of a hose.', saves: byActivity.garden * 0.3 },
    drinkCook: { tip: 'Keep a covered jug in the fridge instead of running the tap cold.', saves: 0 },
    utensilsClean: { tip: 'Wash utensils in a filled basin rather than under a running tap.', saves: 0 },
  };

  return Object.entries(byActivity)
    .filter(([, litres]) => litres > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, litres]) => ({
      activity: key,
      label: ACTIVITY_LABELS[key],
      litres: round2(litres),
      percent: 0, // filled in by computeUsage, which knows the total
      tip: candidates[key].tip,
      saves: round2(Math.max(0, candidates[key].saves)),
    }));
}

/**
 * Main entry point. Takes already-validated inputs and returns the full result object
 * stored in CalculatorLog.results (§9.4).
 */
export function computeUsage(inputs) {
  const people = inputs.adults + inputs.children;
  const raw = activityLitres(inputs);

  const byActivity = {};
  for (const [k, v] of Object.entries(raw)) byActivity[k] = round2(v);

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const perCapita = total / people;
  const norm = NORMS[inputs.cityType];
  const band = classifyBand(perCapita, norm);

  const flags = [];
  if (band === 'overuse' || band === 'severe_overuse') flags.push('overuse');
  if (band === 'undersupply' || band === 'critical_undersupply') flags.push('undersupply_norm');

  // FR-C8 — the supply check only runs when the user tells us what they actually receive.
  let supply = null;
  const received = inputs.suppliedLitresPerDay;
  if (received !== null && received !== undefined) {
    const suppliedLpcd = received / people;
    supply = {
      litresPerDay: round2(received),
      lpcd: round2(suppliedLpcd),
      shortfall: round2(Math.max(0, total - received)),
    };
    if (suppliedLpcd < THRESHOLDS.jjmAdequate && !flags.includes('undersupply_norm')) flags.push('undersupply_norm');
    if (received < total) flags.push('supply_below_need');
  }

  const savings = savingOpportunities(inputs, raw).map((s) => ({
    ...s,
    percent: round2((s.litres / total) * 100),
  }));

  return {
    byActivity,
    totalLitresPerDay: round2(total),
    perCapitaLpcd: round2(perCapita),
    normLpcd: norm,
    band,
    flags,
    people,
    supply,
    savings,
    totalSavable: round2(savings.reduce((a, s) => a + s.saves, 0)),
    formulaVersion: FORMULA_VERSION,
  };
}

/** Convenience wrapper: validate then compute, the way both the form and the API want it. */
export function calculate(raw) {
  const { value, errors, valid } = validateInputs(raw);
  if (!valid) return { valid: false, errors, inputs: value, results: null };
  return { valid: true, errors: {}, inputs: value, results: computeUsage(value) };
}
