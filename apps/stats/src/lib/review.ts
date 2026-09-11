import { mulberry32 } from './rng';
import { instantiate } from './testgen';
import { openConcepts } from './progress';
import type { Profile, Question, QuestionRef, Template } from './types';

export interface ReviewSource {
  /** quiz-usable items carrying this concept tag */
  byTag(tag: string): Question[];
  templatesByTag(tag: string): Template[];
  resolve(ref: QuestionRef): Question | undefined;
}

/**
 * Build a review set from the learner's open concepts, oldest first. For each concept prefer a template
 * (fresh numbers), then another bank item with the same tag, then the missed item itself. Concepts are
 * interleaved round-robin so a short set still touches every open concept.
 */
export function buildReviewSet(profile: Profile, n: number, seed: number, src: ReviewSource): { questions: Question[]; concepts: string[] } {
  const rng = mulberry32(seed);
  const open = openConcepts(profile);
  if (open.length === 0) return { questions: [], concepts: [] };
  const missedByTag = new Map<string, QuestionRef[]>();
  for (const m of [...profile.mistakes].reverse()) {
    const list = missedByTag.get(m.conceptTag) ?? [];
    list.push(m.ref);
    missedByTag.set(m.conceptTag, list);
  }
  const used = new Set<string>();
  const pools = open.map((c) => {
    const tag = c.conceptTag;
    const templates = rng.shuffle(src.templatesByTag(tag));
    const missedIds = new Set((missedByTag.get(tag) ?? []).map((r) => (r.kind === 'bank' ? r.id : r.kind === 'template' ? `${r.templateId}#${r.seed}` : r.snapshot.id)));
    const others = rng.shuffle(src.byTag(tag).filter((q) => !missedIds.has(q.id)));
    const missed = (missedByTag.get(tag) ?? []).map((r) => src.resolve(r)).filter((q): q is Question => Boolean(q));
    return { tag, templates, others, missed, ti: 0 };
  });
  const questions: Question[] = [];
  let progress = true;
  while (questions.length < n && progress) {
    progress = false;
    for (const pool of pools) {
      if (questions.length >= n) break;
      let q: Question | undefined;
      if (pool.templates.length && pool.ti < 2 + pool.missed.length) {
        q = instantiate(pool.templates[pool.ti % pool.templates.length] as Template, rng.int(1, 2 ** 31 - 1));
        pool.ti++;
      } else if (pool.others.length) {
        q = pool.others.shift();
      } else if (pool.missed.length) {
        q = pool.missed.shift();
      }
      if (q && !used.has(q.id)) {
        used.add(q.id);
        questions.push(q);
        progress = true;
      }
    }
  }
  return { questions, concepts: open.map((c) => c.conceptTag) };
}
