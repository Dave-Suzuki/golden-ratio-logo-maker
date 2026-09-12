import type { Question } from './types';

/**
 * Quizzability gate.
 *
 * The question bank is machine-extracted from the textbook, and extraction fails in ways that
 * produce questions a learner cannot answer: a scenario copied from a different exercise, a stem
 * reduced to a single word, a list of required parts turned into multiple-choice options, a
 * question that depends on a figure we do not have. A learner cannot tell those from their own
 * mistakes, so anything that fails a check here never reaches a quiz, a review set or a printed
 * test. The reason is returned for auditing and is never shown to the learner.
 *
 * Keep every rule cheap and pure: this runs over the whole bank on every test build.
 */

/** Shortest stem that can still be a real question ("What is the median?" is 22). */
const MIN_STEM = 20;
/** A model answer shorter than this is an extraction artefact, not an answer. */
const MIN_MODEL_ANSWER = 8;

const FIGURE = /\[FIGURE/;
/** Phrases that only make sense with a picture we do not have. */
const NEEDS_PICTURE = /\b(the (graph|figure|histogram|box ?plot|scatter ?plot|chart|diagram|curve) (below|above|shown)|shown below|pictured below|in the graph below)\b/i;

function words(t: string | null | undefined): Set<string> {
  return new Set((t ?? '').toLowerCase().match(/[a-z][a-z']{2,}/g) ?? []);
}

/** True when the options merely repeat terms the stem already names — a parts list, not choices. */
function optionsAreStemTerms(stem: string, options: readonly string[]): boolean {
  const sw = words(stem);
  if (sw.size === 0) return false;
  let named = 0;
  for (const o of options) {
    const ow = words(o);
    if (ow.size > 0 && [...ow].every((w) => sw.has(w))) named++;
  }
  return named >= Math.max(2, Math.floor(options.length / 2));
}

/**
 * Returns null when the question is safe to ask, otherwise a short reason why it is not.
 */
export function unquizzableReason(q: Question): string | null {
  const stem = (q.stem ?? '').trim();
  const context = (q.context ?? '').trim();
  const both = `${stem}\n${context}`;

  if (stem.length < MIN_STEM) return 'question is only a fragment';
  if (q.needsFigure || FIGURE.test(both) || NEEDS_PICTURE.test(both)) return 'needs a figure we do not have';

  switch (q.kind) {
    case 'mc': {
      const opts = q.options ?? [];
      if (opts.length < 2) return 'not enough options';
      if (opts.some((o) => o.trim().length < 2)) return 'an option is blank';
      if (new Set(opts.map((o) => o.trim().toLowerCase())).size !== opts.length) return 'duplicate options';
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= opts.length) return 'no valid correct option';
      if (optionsAreStemTerms(stem, opts)) return 'options are the parts of the question, not choices';
      return null;
    }
    case 'numeric':
      if (!Number.isFinite(q.answer)) return 'no numeric answer';
      if ((q.tolerance?.abs ?? q.tolerance?.rel) === undefined) return 'no tolerance';
      return null;
    case 'fill':
      if (!q.blanks?.length) return 'no blanks';
      if (q.blanks.some((b) => !b.answer?.trim())) return 'a blank has no answer';
      return null;
    case 'tf':
      if (typeof q.answer !== 'boolean') return 'no true/false answer';
      return null;
    case 'open':
      if ((q.modelSolution ?? '').trim().length < MIN_MODEL_ANSWER) return 'no usable model answer';
      return null;
  }
}

export function isQuizzable(q: Question): boolean {
  return unquizzableReason(q) === null;
}

/** Audit helper: counts of every rejection reason across a bank. */
export function rejectionSummary(questions: readonly Question[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of questions) {
    const r = unquizzableReason(q);
    if (r) out[r] = (out[r] ?? 0) + 1;
  }
  return out;
}
