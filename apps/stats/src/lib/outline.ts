import { parseRich } from './richtext';

/**
 * The shape of the answer a worked problem is asking for.
 *
 * "Use key terms from this module to describe the design of this experiment" is a fair question on
 * paper, where the learner has the module's list of terms in front of them. In a quiz it arrives as
 * an empty box, and the model answer then turns out to want eight named things — explanatory
 * variable, response variable, treatments, experimental units, lurking variables, random
 * assignment, control, blinding. A learner who writes three paragraphs and misses four of those
 * has not been taught anything; they have been asked to guess the question.
 *
 * So where the expected answer has a visible structure, the workspace offers that structure: one
 * row per thing to answer. Nothing here reveals an answer — the labels come from the question's own
 * wording, or from the category names the model answer is organised under, which are the key terms
 * the question explicitly asks the learner to use.
 */

export interface OutlineRow {
  /** what this row is asking for: "Response variable", or "a" */
  label: string;
  /** the question's own wording for this part, when it has one */
  hint?: string;
}

/** "Explanatory variable: amount of sleep" — a named category, not a sentence that happens to have a colon. */
const LABELLED = /^\s*([A-Z][A-Za-z/()– -]{2,38}?):\s+\S/;
/** "a. the population" — a lettered or roman part. */
const PART = /^\s*([a-z]|[ivx]{1,4})[.)]\s+(\S.*)$/i;
/** "a. the population, b. the sample, c. the parameter" all on one line. */
const INLINE_PART = /(?:^|[\s(,;])([a-z])[.)]\s+([^,;]+?)(?=[,;]\s*[a-z][.)]\s|\.\s+[A-Z]|[.;]?\s*$)/g;

const MIN_LABELLED = 3;
const MIN_PARTS = 2;
/** Long enough to identify the part, short enough to sit in a label column. */
const HINT_MAX = 48;

function tidy(s: string): string {
  return s.replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
}

function shorten(s: string): string {
  const t = tidy(s);
  return t.length <= HINT_MAX ? t : `${t.slice(0, HINT_MAX - 1).trimEnd()}…`;
}

/** Lines of a block, with the bracket markers the importer adds stripped out. */
function lines(text: string): string[] {
  return text
    .replace(/\[\/?(PARTS|LIST|DATA|TABLE)\]/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * A question that asks the learner to write something up against a standard framework — describe
 * the design, state the conclusion, construct the table. Only these may take their rows from the
 * model answer's own headings.
 */
const WANTS_WRITEUP = /\b(describe|construct|state|identify|perform|conduct|complete|use key terms)\b/i;
/**
 * A question that asks the learner to CHOOSE from a set. Its model answer is organised under the
 * items that happen to apply, so offering those headings hands over the answer: "which of the
 * potential problems with samples could explain this?" must not arrive with the four problems
 * already listed.
 */
const WANTS_SELECTION = /\bwhich\b/i;

/** The category names a model answer is organised under, if it is organised under any. */
function labelledRows(modelSolution: string): OutlineRow[] | null {
  const labels = lines(modelSolution)
    .map((l) => LABELLED.exec(l)?.[1])
    .filter((l): l is string => Boolean(l))
    .map(tidy);
  return labels.length >= MIN_LABELLED ? labels.map((label) => ({ label })) : null;
}

/** How many lettered parts the model answer has. */
function partCount(modelSolution: string): number {
  return lines(modelSolution).filter((l) => PART.test(l)).length;
}

/** The question's own wording for each part, whether listed on its own lines or run together in a sentence. */
function partPrompts(stem: string): { label: string; text: string }[] {
  const fromBlocks = parseRich(stem)
    .filter((b): b is Extract<typeof b, { kind: 'parts' }> => b.kind === 'parts')
    .flatMap((b) => b.items.map((i) => ({ label: tidy(i.label).replace(/[.)]$/, ''), text: i.text })));
  if (fromBlocks.length > 0) return fromBlocks;

  const out: { label: string; text: string }[] = [];
  for (const line of lines(stem)) {
    INLINE_PART.lastIndex = 0;
    const found: { label: string; text: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = INLINE_PART.exec(line))) found.push({ label: (m[1] ?? '').toLowerCase(), text: m[2] ?? '' });
    // only trust a run that actually counts up from a: "a. … b. … c. …", not a stray "a)" mid-sentence
    const ordered = found.every((p, i) => p.label === String.fromCharCode(97 + i));
    if (found.length >= MIN_PARTS && ordered) out.push(...found);
  }
  return out;
}

/**
 * The rows to offer for this question's answer, or null to leave a plain workspace.
 * Falls back through: named categories → the question's own part wording → bare letters.
 */
export function answerOutline(stem: string, modelSolution: string): OutlineRow[] | null {
  if (WANTS_WRITEUP.test(stem) && !WANTS_SELECTION.test(stem)) {
    const labelled = labelledRows(modelSolution);
    if (labelled) return labelled;
  }

  const n = partCount(modelSolution);
  if (n < MIN_PARTS) return null;

  const prompts = partPrompts(stem);
  if (prompts.length === n) return prompts.map((p) => ({ label: p.label, hint: shorten(p.text) }));
  return Array.from({ length: n }, (_, i) => ({ label: String.fromCharCode(97 + i) }));
}

/** Join the filled rows into the single answer string the grader and the mistake log store. */
export function outlineToText(rows: readonly OutlineRow[], values: readonly string[]): string {
  return rows
    .map((r, i) => [r.label, (values[i] ?? '').trim()] as const)
    .filter(([, v]) => v.length > 0)
    .map(([label, v]) => `${label}: ${v}`)
    .join('\n');
}
