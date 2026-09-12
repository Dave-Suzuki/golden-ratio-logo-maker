import { describe, expect, it } from 'vitest';
import { allQuestions, bankFor, chapters, sections } from '@/lib/server/content';
import { isQuizzable, rejectionSummary, unquizzableReason } from '@/lib/verify';
import { templatesFor } from '../content/templates';
import type { McQuestion, OpenQuestion, Question } from '@/lib/types';

const base = { id: 'q', sectionId: '1.1', conceptTag: '1.1', stem: 'What is the population in this study?', explanation: [], source: 'test' };

describe('unquizzableReason', () => {
  it('accepts a well-formed question of every kind', () => {
    const ok: Question[] = [
      { ...base, kind: 'mc', options: ['all adults', 'the 100 surveyed'], correctIndex: 0 },
      { ...base, kind: 'numeric', answer: 1.5, tolerance: { abs: 0.01 } },
      { ...base, kind: 'tf', answer: true },
      { ...base, kind: 'open', modelSolution: 'All employed adult women.' },
    ];
    for (const q of ok) expect(unquizzableReason(q), q.kind).toBeNull();
  });

  it('rejects a fragment stem', () => {
    expect(unquizzableReason({ ...base, stem: 'population', kind: 'open', modelSolution: 'all adults' })).toMatch(/fragment/);
  });

  it('rejects anything that needs a picture we do not have', () => {
    expect(unquizzableReason({ ...base, kind: 'open', modelSolution: 'x'.repeat(20), needsFigure: true })).toMatch(/figure/);
    expect(unquizzableReason({ ...base, kind: 'open', modelSolution: 'y'.repeat(20), context: 'See [FIGURE: a boxplot]' })).toMatch(/figure/);
    expect(
      unquizzableReason({ ...base, stem: 'Which interval in the box plot below contains the most data?', kind: 'open', modelSolution: '23 to 25' }),
    ).toMatch(/figure/);
  });

  it('rejects a parts list posing as multiple choice', () => {
    const sixParts: McQuestion = {
      ...base,
      stem: 'Identify the population, sample, parameter, statistic, variable, and data for this example.',
      kind: 'mc',
      options: ['population', 'sample', 'parameter', 'statistic', 'variable', 'data'],
      correctIndex: 0,
    };
    expect(unquizzableReason(sixParts)).toMatch(/parts of the question/);
  });

  it('rejects broken options and missing answers', () => {
    expect(unquizzableReason({ ...base, kind: 'mc', options: ['a', 'reasonable option'], correctIndex: 0 })).toMatch(/blank/);
    expect(unquizzableReason({ ...base, kind: 'mc', options: ['same', 'Same'], correctIndex: 0 })).toMatch(/duplicate/);
    expect(unquizzableReason({ ...base, kind: 'mc', options: ['one', 'two'], correctIndex: 7 })).toMatch(/correct option/);
    expect(unquizzableReason({ ...base, kind: 'numeric', answer: Number.NaN, tolerance: { abs: 1 } })).toMatch(/numeric answer/);
    expect(unquizzableReason({ ...base, kind: 'open', modelSolution: ' ' } as OpenQuestion)).toMatch(/model answer/);
  });
});

describe('the shipped question bank', () => {
  it('only ever serves verified questions', () => {
    for (const s of sections()) {
      const bad = bankFor(s.id).filter((q) => !isQuizzable(q));
      expect(bad.map((q) => q.id), s.id).toEqual([]);
    }
  });

  it('keeps the large majority of the bank after verification', () => {
    const all = allQuestions();
    const kept = all.filter(isQuizzable);
    // a regression in the importer shows up here as a sudden drop
    expect(kept.length).toBeGreaterThan(1300);
    expect(kept.length / all.length).toBeGreaterThan(0.8);
    // surface the reasons when this fails
    if (kept.length <= 1300) console.log(rejectionSummary(all));
  });

  it('never attaches a scenario to more questions than the textbook says it covers', () => {
    const NUMBER: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    const re = /answer the next (\w+)\s+(?:exercise|question)/i;
    // group per source document: the same scenario text legitimately reappears in another module
    const groups = new Map<string, string[]>();
    for (const q of allQuestions()) {
      if (!q.context) continue;
      const ref = q.sourceRef as { module?: string; test?: string } | undefined;
      const key = `${ref?.module ?? ref?.test ?? ''}::${q.context}`;
      groups.set(key, [...(groups.get(key) ?? []), q.id]);
    }
    const over: string[] = [];
    for (const [key, ids] of groups) {
      const m = re.exec(key);
      const n = m ? NUMBER[m[1]!.toLowerCase()] : undefined;
      if (n !== undefined && ids.length > n) over.push(`${ids.length} questions share a scenario scoped to ${n}: ${ids.slice(0, 4).join(', ')}`);
    }
    expect(over).toEqual([]);
  });

  it('renders no question as a wall of one-value-per-line bullets', () => {
    const bullets = /(^|\n)• [^\n]*\n• [^\n]*\n• [^\n]*\n• [^\n]*\n• /;
    const bad = allQuestions().filter((q) => bullets.test(`${q.stem}\n${q.context ?? ''}`));
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it('emits well-formed data and table blocks', () => {
    for (const q of allQuestions()) {
      const text = `${q.stem}\n${q.context ?? ''}`;
      expect((text.match(/\[DATA\]/g) ?? []).length, q.id).toBe((text.match(/\[\/DATA\]/g) ?? []).length);
      expect((text.match(/\[TABLE\]/g) ?? []).length, q.id).toBe((text.match(/\[\/TABLE\]/g) ?? []).length);
      expect((text.match(/\[PARTS\]/g) ?? []).length, q.id).toBe((text.match(/\[\/PARTS\]/g) ?? []).length);
    }
  });

  it('leaves every section able to fill a ten-question quiz', () => {
    const thin: string[] = [];
    for (const c of chapters())
      for (const s of c.sections) {
        const kept = bankFor(s.id).length;
        const generated = templatesFor(s.id).length * 4; // a generator yields unlimited fresh variants
        if (kept + generated < 10) thin.push(`§${s.id}: ${kept} questions, ${templatesFor(s.id).length} generators`);
      }
    expect(thin).toEqual([]);
  });
});
