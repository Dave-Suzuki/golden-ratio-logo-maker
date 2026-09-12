import { KEY_POINTS } from '../../content/keypoints';
import type { Question } from './types';

/**
 * Picks the refresher that actually matches a question.
 *
 * A textbook section covers several ideas, and the practice tests group questions under the
 * heading they follow rather than the topic they test: a question about discrete versus continuous
 * data sits under "Definitions of Statistics, Probability and Key Terms". Showing that section's
 * advice after a miss ("don't confuse parameter and statistic") is noise. So instead of trusting
 * the section label, score every section's refresher against the wording of the question and use
 * the best match, falling back to the question's own section when nothing scores clearly better.
 */

const STOPWORDS = new Set(
  ('the and for are but not you all any can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use that with this from they have been more when will each which their said them then some what your would make like into time look than over also back after work first well year came show every good give our under most very such take come these only know place little round man year came each'.split(
    /\s+/,
  ) as string[]).concat([
    'data',
    'value',
    'values',
    'find',
    'given',
    'following',
    'question',
    'answer',
    'example',
    'sample',
    'population',
    'number',
    'numbers',
    'using',
    'used',
    'use',
  ]),
);

/** Crude suffix stripping so "skewed" matches "skew" and "samples" matches "sample". */
function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  for (const suffix of ['ness', 'ing', 'ed', 'es', 's']) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix)) return w.slice(0, -suffix.length);
  }
  return w;
}

function terms(text: string): string[] {
  // hyphens split: "quantitative-discrete" has to match the word "quantitative"
  const words = text.toLowerCase().replace(/[^a-z]+/g, ' ').split(' ');
  return words.filter((w) => w.length >= 4 && !STOPWORDS.has(w)).map(stem).filter((w) => !STOPWORDS.has(w));
}

/** Words that characterise each section, with a weight: a word used by few sections is a strong signal. */
interface Index {
  bySection: Map<string, Set<string>>;
  weight: Map<string, number>;
}

let index: Index | null = null;

function buildIndex(): Index {
  const bySection = new Map<string, Set<string>>();
  const seenIn = new Map<string, number>();
  for (const [sectionId, kp] of Object.entries(KEY_POINTS)) {
    const text = [...kp.points, ...(kp.pitfalls ?? []), ...(kp.terms ?? []).map(([t, d]) => `${t} ${d}`)].join(' ');
    const set = new Set(terms(text));
    bySection.set(sectionId, set);
    for (const w of set) seenIn.set(w, (seenIn.get(w) ?? 0) + 1);
  }
  const weight = new Map<string, number>();
  const total = bySection.size;
  for (const [w, n] of seenIn) weight.set(w, Math.log(total / n));
  return { bySection, weight };
}

function score(words: readonly string[], sectionId: string, idx: Index): number {
  const set = idx.bySection.get(sectionId);
  if (!set) return 0;
  let s = 0;
  const counted = new Set<string>();
  for (const w of words) {
    if (counted.has(w) || !set.has(w)) continue;
    counted.add(w);
    s += idx.weight.get(w) ?? 0;
  }
  return s;
}

/**
 * Orders candidate strings by how well they match a question, dropping the ones that share nothing
 * with it. Used for the "watch out for" list: a section's warnings cover the whole section, and
 * showing one about cluster sampling under a question about data types is just noise.
 */
export function relevantTo(question: string, candidates: readonly string[]): string[] {
  if (!index) index = buildIndex();
  const asked = new Set(terms(question));
  if (asked.size === 0) return [...candidates];
  const scored = candidates.map((text, i) => {
    let s = 0;
    const counted = new Set<string>();
    for (const w of terms(text)) {
      if (counted.has(w) || !asked.has(w)) continue;
      counted.add(w);
      s += index!.weight.get(w) ?? 0.5;
    }
    return { text, s, i };
  });
  const matching = scored.filter((c) => c.s > 0);
  if (matching.length === 0) return [...candidates];
  return matching.sort((a, b) => b.s - a.s || a.i - b.i).map((c) => c.text);
}

/**
 * Sources that group questions by the heading they follow rather than the topic they test.
 * A question from a section's own exercises is reliably labelled and is never second-guessed.
 */
const GROUPED_SOURCES = new Set(['openstax-practice-test', 'openstax-final', 'openstax-review', 'deanza', 'vt']);

/** The section whose refresher to show after a miss. */
export function refresherSectionFor(q: Pick<Question, 'stem' | 'sectionId' | 'source'> & { options?: string[] }): string | null {
  if (!GROUPED_SOURCES.has(q.source)) return q.sectionId;
  return bestSectionFor(`${q.stem} ${(q.options ?? []).join(' ')}`, q.sectionId);
}

/**
 * The section whose refresher best fits `text`. Returns `fallback` unless another section is a
 * clearly better match, so a well-labelled question is never second-guessed.
 */
export function bestSectionFor(text: string, fallback: string | null): string | null {
  if (!index) index = buildIndex();
  const words = terms(text);
  if (words.length === 0) return fallback;
  const own = fallback ? score(words, fallback, index) : 0;
  // Stay inside the chapter the question was filed under: the heading it follows is written by the
  // book and gets the chapter right even when it gets the section wrong.
  const chapter = fallback ? fallback.split('.')[0] : null;
  let bestId = fallback;
  let best = own;
  for (const sectionId of index.bySection.keys()) {
    if (sectionId === fallback) continue;
    if (chapter && sectionId.split('.')[0] !== chapter) continue;
    const s = score(words, sectionId, index);
    if (s > best) {
      best = s;
      bestId = sectionId;
    }
  }
  // Only override on a decisive win. A section label is usually right, and a wrong refresher
  // is worse than a merely generic one, so the bar for overriding it is deliberately high.
  return best > own * 1.6 + 3 ? bestId : fallback;
}
