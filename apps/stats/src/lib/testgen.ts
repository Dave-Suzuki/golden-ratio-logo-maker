import { hashString, mulberry32 } from './rng';
import type { McQuestion, Question, QuestionRef, Rng, Template, Test, TestSpec } from './types';

export interface ContentSource {
  /** quiz-usable bank items for a section (extra sets included when the spec asks for them) */
  bank(sectionId: string, includeExtra: boolean): Question[];
  templates(sectionId: string): Template[];
  sectionsOfChapter(chapter: number): string[];
  /** printed-order items of an OpenStax practice test (pt) or final exam (fe) */
  testItems(prefix: 'pt' | 'fe', n: number): Question[];
}

export function instantiate(t: Template, seed: number): Question {
  const out = t.generate(mulberry32(seed));
  return { ...out, id: `${t.id}#${seed}`, source: 'template' } as Question;
}

export function refFor(q: Question): QuestionRef {
  if (q.source === 'template') {
    const [templateId, seed] = q.id.split('#');
    return { kind: 'template', templateId: templateId ?? q.id, seed: Number(seed ?? 0) };
  }
  if (q.source === 'llm') return { kind: 'llm', snapshot: q };
  return { kind: 'bank', id: q.id };
}

/** Deterministically permute MC options, remapping correctIndex. */
export function shuffleOptions(q: McQuestion, rng: Rng): McQuestion {
  const order = rng.shuffle(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i] as string), correctIndex: order.indexOf(q.correctIndex) };
}

function sectionsFor(spec: TestSpec, src: ContentSource): string[] {
  if (spec.scope === 'section') return [spec.id];
  if (spec.scope === 'chapter') return src.sectionsOfChapter(Number(spec.id));
  return [];
}

function pickForSection(sectionId: string, quota: number, spec: TestSpec, src: ContentSource, rng: Rng): Question[] {
  const templates = src.templates(sectionId);
  const bank = src.bank(sectionId, spec.includeExtra ?? true);
  const auto = bank.filter((q) => q.kind !== 'open');
  const open = bank.filter((q) => q.kind === 'open');
  const templateShare = spec.templateShare ?? 0.4;
  const openShare = spec.openShare ?? 0.3;
  const out: Question[] = [];

  let nT = templates.length ? Math.min(Math.round(quota * templateShare), quota) : 0;
  const nOpenTarget = Math.min(Math.round(quota * openShare), open.length);
  // fill the template quota round-robin over a shuffled template list (a template may repeat with a fresh seed)
  const order = rng.shuffle(templates);
  for (let i = 0; i < nT; i++) out.push(instantiate(order[i % order.length] as Template, rng.int(1, 2 ** 31 - 1)));
  nT = out.length;

  const autoPicks = rng.sample(auto, Math.max(0, quota - nT - nOpenTarget));
  out.push(...autoPicks);
  const openPicks = rng.sample(open, Math.max(0, quota - out.length));
  out.push(...openPicks);
  // still short (few auto items)? use more templates with fresh seeds, then more open items
  while (out.length < quota && templates.length) {
    out.push(instantiate(rng.pick(templates), rng.int(1, 2 ** 31 - 1)));
    if (out.length >= quota) break;
  }
  return out.slice(0, quota);
}

/** Build a deterministic test: same spec (incl. seed) → identical questions, option order and item order. */
export function buildTest(spec: TestSpec, src: ContentSource): Test {
  const rng = mulberry32(hashString(`${spec.scope}:${spec.id}:${spec.seed}`));
  let questions: Question[] = [];

  if (spec.scope === 'practice-test' || spec.scope === 'final') {
    const items = src.testItems(spec.scope === 'final' ? 'fe' : 'pt', Number(spec.id));
    questions = spec.count >= items.length ? items : rng.sample(items, spec.count).sort((a, b) => items.indexOf(a) - items.indexOf(b));
    // keep printed order but still shuffle MC options for a "new" test when count < items.length
  } else {
    const secs = rng.shuffle(sectionsFor(spec, src));
    const base = Math.floor(spec.count / Math.max(1, secs.length));
    let extra = spec.count - base * secs.length;
    for (const s of secs) {
      const quota = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
      questions.push(...pickForSection(s, quota, spec, src, rng));
    }
    questions = rng.shuffle(questions);
  }

  questions = questions.map((q) => (q.kind === 'mc' ? shuffleOptions(q, rng) : q));
  return { spec, questions };
}
