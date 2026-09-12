import { describe, expect, it } from 'vitest';
import { allQuestions, bankFor, chapters, sections } from '@/lib/server/content';
import { isQuizzable, rejectionSummary, unquizzableReason } from '@/lib/verify';
import { templatesFor } from '../content/templates';
import suppressed from '../content/suppressed.json';
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

  it('rejects a question that leans on a neighbouring exercise', () => {
    const sol = { kind: 'open', modelSolution: 'a sentence long enough to pass' } as const;
    for (const stem of [
      'Refer back to the pizza-delivery Try It exercise and find a 95% confidence interval.',
      'Draw the graph from the exercise above and label the axes.',
      'Why are X, Y and Z in the previous exercise random variables?',
      'Find the probability that the sum falls between the numbers you found in the exercise above.',
    ])
      expect(unquizzableReason({ ...base, ...sol, stem }), stem).toMatch(/another exercise/);
    // a scenario cannot rescue it: the sibling exercise is never on screen either way
    expect(
      unquizzableReason({ ...base, ...sol, stem: 'State the distribution from the exercise above.', context: 'A study of 100 mothers.' }),
    ).toMatch(/another exercise/);
  });

  it('rejects a question whose setup was never shown, and keeps it when it was', () => {
    const sol = { kind: 'open', modelSolution: 'a sentence long enough to pass' } as const;
    const stem = 'Use the information in the example above to find the probability.';
    expect(unquizzableReason({ ...base, ...sol, stem })).toMatch(/setup/);
    expect(unquizzableReason({ ...base, ...sol, stem, context: 'A recent study reported that 76% of the mothers are employed.' })).toBeNull();
  });

  it('rejects a number with a hole where the source lost a character', () => {
    const sol = { kind: 'open', modelSolution: 'a sentence long enough to pass' } as const;
    // PDF extraction writes "?" for a glyph it cannot map, so these are digits, not punctuation
    for (const context of ['9 110 0.20 0?.62', '10 7? ?8 0?.76', 'Relative frequency 0.0?8'])
      expect(unquizzableReason({ ...base, ...sol, context }), context).toMatch(/lost characters/);
    // an ordinary question mark after a number is not that
    for (const stem of ['Is a sample of 500 a reliable measure for a population of 2,500?', 'What is the median of 1; 2; 3?'])
      expect(unquizzableReason({ ...base, ...sol, stem }), stem).toBeNull();
  });

  it('asks nothing whose numbers have holes in them', () => {
    const holes = allQuestions().filter(isQuizzable).filter((q) => /\d\?(?=[\d.])|\?\d/.test(`${q.stem}\n${q.context ?? ''}`));
    expect(holes.map((q) => q.id)).toEqual([]);
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

  it('accepts a fair question whose stem names the candidates', () => {
    // This shape used to be rejected as "the options are really the parts of the question". It is
    // not: one of Bart, Cal and Dave is the answer. The rule could not tell the two apart and every
    // question it caught was fair, so it is gone; the real defect is stopped in the importer.
    const named: McQuestion = {
      ...base,
      stem: 'Bart, Cal and Dave commute to work. Whose commute today is relatively fastest?',
      kind: 'mc',
      options: ['Both Bart and Cal', 'Bart', 'Cal', 'Dave'],
      correctIndex: 3,
    };
    expect(unquizzableReason(named)).toBeNull();
    const numeric: McQuestion = {
      ...base,
      stem: 'Find the mean and appropriate standard deviation:',
      kind: 'mc',
      options: ['mean = 4.82, standard deviation = 1.67', 'mean = 4.82, standard deviation = 1.71', 'mean = 4.83, standard deviation = 2.48'],
      correctIndex: 1,
    };
    expect(unquizzableReason(numeric)).toBeNull();
  });

  it('never ships a parts list rendered as multiple choice', () => {
    // "Identify the population, sample, parameter, statistic, variable and data" reached the learner
    // as six radio buttons with one marked correct. The importer now emits it as one open question.
    const fake = allQuestions().filter(
      (q) =>
        q.kind === 'mc' &&
        (q.options?.length ?? 0) >= 5 &&
        (q.options ?? []).every((o) => o.split(/\s+/).length <= 2 && q.stem.toLowerCase().includes(o.toLowerCase())),
    );
    expect(fake.map((q) => q.id)).toEqual([]);
    expect(allQuestions().find((q) => q.id === 'pt1-1')?.kind).toBe('open');
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

  it('keeps enough of the bank to be worth studying from', () => {
    const all = allQuestions();
    const kept = all.filter(isQuizzable);
    // The floor is low on purpose. Reading every question found a fifth of them unanswerable or
    // wrongly answered, and those are now hidden; a bank that is smaller and right is the goal,
    // so this only guards against a regression that empties it.
    expect(kept.length).toBeGreaterThan(1100);
    expect(kept.length / all.length).toBeGreaterThan(0.6);
    if (kept.length <= 1100) console.log(rejectionSummary(all));
  });

  it('hides every question the audit rejected', () => {
    const failed = Object.keys(suppressed as Record<string, string>);
    expect(failed.length).toBeGreaterThan(200);
    const leaked = allQuestions().filter((q) => isQuizzable(q) && failed.includes(q.id));
    expect(leaked.map((q) => q.id)).toEqual([]);
    // every entry must carry a reason, so the decision can be argued with
    for (const [id, reason] of Object.entries(suppressed as Record<string, string>)) {
      expect(reason.length, id).toBeGreaterThan(3);
    }
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

  it('carries the earlier scenario into an "additional information" block', () => {
    // "We randomly pick ten mothers from the above population" — the population, and the 76%
    // employment rate the answer B(10, 0.76) depends on, are defined in the preceding block.
    const q = allQuestions().find((x) => x.id === 'rv5-30');
    expect(q, 'rv5-30 missing from the bank').toBeDefined();
    expect(q!.context).toMatch(/76% of the mothers are employed/);
    expect(q!.context).toMatch(/ten mothers from the above population/);
  });

  it('states no scenario as an instruction about a printed page', () => {
    // "Use the following data to answer the next five exercises" promises something a shuffled
    // ten-question quiz cannot keep: the next question is usually not one of the five.
    const pageTalk = /use the following[^.:]{0,90}?(exercises?|questions?|problems?)\s*[.:]/i;
    const bad = allQuestions().filter((q) => pageTalk.test(q.context ?? ''));
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it('asks a bare list item as a question, not a label', () => {
    // "number of competing computer spreadsheet software packages" was shown on its own; the
    // instruction heading the run ("For the following exercises, identify the type of data…")
    // was dropped because it did not start with the verb.
    const q = allQuestions().find((x) => x.id === 'os-m46885-eip-865');
    expect(q, 'os-m46885-eip-865 missing from the bank').toBeDefined();
    expect(q!.stem).toMatch(/^Identify the type of data/);
    expect(q!.stem).toMatch(/number of competing computer spreadsheet software packages/);
    // and the framing that only makes sense on a printed page is gone
    expect(q!.stem).not.toMatch(/for the following exercises/i);
    expect(isQuizzable(q!)).toBe(true);
  });

  it('keeps the wording of a cross-reference that has its own', () => {
    // <link>Try It</link> used to be replaced wholesale, dropping a second determiner phrase
    // inside the noun phrase: "the pizza-delivery the note above exercise".
    const doubled = /\bthe [\w-]+ the (note|table|figure|example|exercise|equation) (above|below)\b/i;
    const mangled = allQuestions().filter((q) => doubled.test(`${q.stem}\n${q.context ?? ''}`));
    expect(mangled.map((q) => q.id)).toEqual([]);
  });

  it('asks nothing that points at material the learner cannot see', () => {
    const dangling = allQuestions()
      .filter(isQuizzable)
      .filter((q) => /refers? back to|the (exercise|problem|question) above/i.test(`${q.stem}\n${q.context ?? ''}`));
    expect(dangling.map((q) => q.id)).toEqual([]);
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
