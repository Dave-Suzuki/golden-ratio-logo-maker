import { describe, expect, it } from 'vitest';
import { formatAnswer, grade, normalizeSymbol, parseNumeric } from '@/lib/grade';
import type { FillQuestion, McQuestion, NumericQuestion, OpenQuestion, TfQuestion } from '@/lib/types';

const base = { id: 'q', sectionId: '6.1', conceptTag: '6.1', stem: 'stem', explanation: [], source: 'test' };
const num: NumericQuestion = { ...base, kind: 'numeric', answer: 0.1587, tolerance: { abs: 0.0006 } };

describe('parseNumeric', () => {
  it('accepts common forms', () => {
    expect(parseNumeric('-3.67')).toBeCloseTo(-3.67);
    expect(parseNumeric('–3.67')).toBeCloseTo(-3.67);
    expect(parseNumeric('3,200')).toBe(3200);
    expect(parseNumeric('$12.84')).toBeCloseTo(12.84);
    expect(parseNumeric('3/8')).toBeCloseTo(0.375);
    expect(parseNumeric('35%')).toBeCloseTo(0.35);
    expect(parseNumeric('≈ 0.25')).toBeCloseTo(0.25);
    expect(parseNumeric('.5')).toBe(0.5);
  });
  it('rejects junk', () => {
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('abc')).toBeNull();
    expect(parseNumeric('1/0')).toBeNull();
    expect(parseNumeric('1..2')).toBeNull();
  });
});

describe('grade numeric', () => {
  it('uses the larger of abs and rel tolerance', () => {
    expect(grade(num, { kind: 'numeric', raw: '0.159' }).correct).toBe(true);
    expect(grade(num, { kind: 'numeric', raw: '0.16' }).correct).toBe(false);
    const rel: NumericQuestion = { ...num, answer: 1000, tolerance: { abs: 0.5, rel: 0.01 } };
    expect(grade(rel, { kind: 'numeric', raw: '1009' }).correct).toBe(true);
    expect(grade(rel, { kind: 'numeric', raw: '1011' }).correct).toBe(false);
  });
  it('handles percent-unit answers typed with or without %', () => {
    const pct: NumericQuestion = { ...num, answer: 35, tolerance: { abs: 0.5 }, unit: '%' };
    expect(grade(pct, { kind: 'numeric', raw: '35%' }).correct).toBe(true);
    expect(grade(pct, { kind: 'numeric', raw: '35' }).correct).toBe(true);
    expect(formatAnswer(pct)).toBe('35%');
  });
  it('unparseable input is wrong, never a crash', () => {
    const r = grade(num, { kind: 'numeric', raw: 'idk' });
    expect(r.correct).toBe(false);
    expect(r.parsedValue).toBeNull();
  });
});

describe('grade mc / tf / fill / open', () => {
  const mc: McQuestion = { ...base, kind: 'mc', options: ['a', 'b', 'c'], correctIndex: 2 };
  const tf: TfQuestion = { ...base, kind: 'tf', answer: false };
  const fill: FillQuestion = {
    ...base,
    kind: 'fill',
    symbolSet: 'hypothesis',
    blanks: [
      { label: 'H0', answer: '≥' },
      { label: 'Ha', answer: '<' },
    ],
  };
  const open: OpenQuestion = { ...base, kind: 'open', modelSolution: 'The population is all students.' };
  it('mc and tf', () => {
    expect(grade(mc, { kind: 'mc', index: 2 }).correct).toBe(true);
    expect(grade(mc, { kind: 'mc', index: 0 }).correct).toBe(false);
    expect(formatAnswer(mc)).toBe('c. c');
    expect(grade(tf, { kind: 'tf', value: false }).correct).toBe(true);
    expect(grade(tf, { kind: 'mc', index: 0 }).correct).toBe(false);
  });
  it('fill normalizes typed symbols', () => {
    expect(grade(fill, { kind: 'fill', values: ['>=', '<'] }).correct).toBe(true);
    expect(grade(fill, { kind: 'fill', values: [' ≥ ', '<'] }).correct).toBe(true);
    // H0 written with = is accepted on a one-sided test: OpenStax states the same null as
    // "H0: p = 0.42" in one exercise and "H0: p ≥ 0.42" in the next, and Ha carries the direction
    expect(grade(fill, { kind: 'fill', values: ['=', '<'] }).correct).toBe(true);
    // an H0 that contradicts Ha is still wrong, and = is never right for Ha
    const r = grade(fill, { kind: 'fill', values: ['≤', '<'] });
    expect(r.correct).toBe(false);
    expect(r.perBlank).toEqual([false, true]);
    expect(grade(fill, { kind: 'fill', values: ['≥', '='] }).correct).toBe(false);
    expect(grade(fill, { kind: 'fill', values: [] }).correct).toBe(false);
    expect(normalizeSymbol('MU')).toBe('μ');
    expect(normalizeSymbol('p-hat')).toBe('p̂');
  });
  it('open needs a self-mark', () => {
    expect(grade(open, { kind: 'open', text: 'x' })).toMatchObject({ correct: null, needsSelfMark: true });
    expect(grade(open, { kind: 'open', text: 'x', selfMark: 'got' }).correct).toBe(true);
    expect(grade(open, { kind: 'open', text: 'x', selfMark: 'missed' }).correct).toBe(false);
  });
});

describe('grading, after end-to-end testing', () => {
  const fillQ = {
    id: 'f', sectionId: '9.1', conceptTag: '9.1', stem: 'State the hypotheses', explanation: [], source: 't',
    kind: 'fill', symbolSet: 'hypothesis',
    blanks: [{ label: 'H0: μ', answer: '≤' }, { label: 'Ha: μ', answer: '>' }],
  } as const;
  it('accepts H0 written with = on a one-sided test, as the textbook itself does', () => {
    expect(grade(fillQ as never, { kind: 'fill', values: ['=', '>'] }).correct).toBe(true);
    expect(grade(fillQ as never, { kind: 'fill', values: ['≤', '>'] }).correct).toBe(true);
    // but not an H0 that contradicts Ha, and never = for Ha
    expect(grade(fillQ as never, { kind: 'fill', values: ['≥', '>'] }).correct).toBe(false);
    expect(grade(fillQ as never, { kind: 'fill', values: ['=', '='] }).correct).toBe(false);
  });
  it('does not double a colon the label already carries', () => {
    expect(formatAnswer(fillQ as never)).toBe('H0: μ ≤; Ha: μ >');
    const bare = { ...fillQ, blanks: [{ label: 'H0', answer: '≤' }, { label: 'Ha', answer: '>' }] };
    expect(formatAnswer(bare as never)).toBe('H0: ≤; Ha: >');
  });
  it('accepts a leading plus and the unit the question used', () => {
    expect(parseNumeric('+1')).toBe(1);
    expect(parseNumeric('180.5 cm')).toBe(180.5);
    expect(parseNumeric('36 minutes')).toBe(36);
    expect(parseNumeric('1e5')).toBe(100000);
    expect(parseNumeric('x = 6.5')).toBe(6.5);
    expect(parseNumeric('z=-1.5')).toBe(-1.5);
    expect(parseNumeric('\u22124')).toBe(-4);
    expect(parseNumeric('3/8')).toBe(0.375);
    expect(parseNumeric('cm')).toBeNull();
  });
});
