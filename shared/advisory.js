/**
 * AquaWise — crisis advisory engine.
 *
 * FR-A6: the rules live in advisory-rules.json, never in if/else chains inside a
 * component. This file is only the resolver, so adding a sixth problem type means
 * editing data, not code. Pure functions — imported by both React and Express.
 */

import RULES from './advisory-rules.json' with { type: 'json' };

export const ADVISORY_VERSION = RULES.version;
export const PROBLEMS = RULES.problems;
export const CONTACT_DIRECTORY = RULES.contactDirectory;
export const SEVERITY_ORDER = RULES.severityOrder; // most severe first

export function listProblems() {
  return PROBLEMS.map(({ id, label, icon, summary, questions, complaintCategory }) => ({
    id, label, icon, summary, complaintCategory, questions,
  }));
}

export function getProblem(problemType) {
  return PROBLEMS.find((p) => p.id === problemType) ?? null;
}

export function rulesFor(problemType) {
  return RULES.rules
    .filter((r) => r.problem === problemType)
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
}

/** A condition set matches when every question it names has an accepted answer. */
function conditionMatches(condition, answers) {
  return Object.entries(condition).every(([questionId, accepted]) => accepted.includes(answers[questionId]));
}

/** A rule's `when` is a list of condition sets — an OR of ANDs. */
function ruleMatches(rule, answers) {
  return rule.when.some((condition) => conditionMatches(condition, answers));
}

/**
 * Resolve contact keys to displayable contacts (FR-A4).
 * Society contacts, when passed in, replace the generic SOC_* entries and the
 * municipal helpline, so a logged-in member sees their own building's numbers.
 */
export function resolveContacts(keys, society = null) {
  return keys.map((key) => {
    const base = CONTACT_DIRECTORY[key];
    if (!society) return { ...base };

    if (key === 'MUNI' && society.municipalHelpline) {
      return { ...base, phone: society.municipalHelpline, name: `Municipal water department (${society.address?.city ?? 'your city'})` };
    }
    if (key === 'SOC_ADMIN' && society.adminContact) {
      return { ...base, name: `${society.adminContact.name} (society admin)`, phone: society.adminContact.phone };
    }
    if (key === 'SOC_MAINT') {
      const maint = (society.contacts ?? []).find((c) => /maint|plumb|caretaker/i.test(c.role));
      if (maint) return { ...base, name: `${maint.name} — ${maint.role}`, phone: maint.phone };
    }
    if (key === 'PLUMBER') {
      const plumber = (society.contacts ?? []).find((c) => /plumb/i.test(c.role));
      if (plumber) return { ...base, name: `${plumber.name} — ${plumber.role}`, phone: plumber.phone };
    }
    return { ...base };
  });
}

/** Validate an advisory request before evaluating it, the same way on client and server. */
export function validateAnswers(problemType, answers = {}) {
  const errors = {};
  const problem = getProblem(problemType);
  if (!problem) return { valid: false, errors: { problemType: 'Choose a problem type.' }, problem: null };

  for (const q of problem.questions) {
    const given = answers[q.id];
    if (given === undefined || given === null || given === '') {
      errors[q.id] = 'Please answer this question.';
    } else if (!q.options.some((o) => o.value === given)) {
      errors[q.id] = 'Choose one of the listed options.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, problem };
}

/**
 * FR-A2/A3 — match the most severe rule first and return its ordered steps.
 * Falls back to the least severe rule for the problem type so the user is never
 * left with nothing; the fallback is reported so the UI can say so.
 */
export function evaluate(problemType, answers = {}, society = null) {
  const { valid, errors, problem } = validateAnswers(problemType, answers);
  if (!valid) return { valid: false, errors, rule: null };

  const candidates = rulesFor(problemType);
  const matched = candidates.find((r) => ruleMatches(r, answers));
  const rule = matched ?? candidates[candidates.length - 1];

  return {
    valid: true,
    errors: {},
    fallback: !matched,
    problem: { id: problem.id, label: problem.label, complaintCategory: problem.complaintCategory },
    rule: {
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      steps: rule.steps,
      contacts: resolveContacts(rule.contacts, society),
      // FR-A5 — a critical rule shows the 112 banner.
      emergency: rule.severity === 'critical',
      complaintCategory: problem.complaintCategory,
    },
    advisoryVersion: ADVISORY_VERSION,
  };
}
