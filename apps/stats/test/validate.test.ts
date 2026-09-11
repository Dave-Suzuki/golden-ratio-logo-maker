import { describe, expect, it } from 'vitest';
import { validateQuestion } from '@/lib/validate';
import type { Question } from '@/lib/types';

const base = { id: 'q', sectionId: '6.1', conceptTag: '6.1', stem: 'What is z?', explanation: ['x'], source: 'test' };

describe('validateQuestion', () => {
  it('accepts well-formed items', () => {
    const ok: Question[] = [
      { ...base, kind: 'mc', options: ['1', '2'], correctIndex: 1 },
      { ...base, kind: 'numeric', answer: 1.5, tolerance: { abs: 0.01 } },
      { ...base, kind: 'fill', symbolSet: 'hypothesis', blanks: [{ label: 'H0', answer: '≤' }] },
      { ...base, kind: 'tf', answer: true },
      { ...base, kind: 'open', modelSolution: 'x' },
    ];
    for (const q of ok) expect(validateQuestion(q)).toEqual([]);
  });
  it('rejects broken items', () => {
    expect(validateQuestion({ ...base, kind: 'mc', options: ['1', '1'], correctIndex: 0 }).map((i) => i.code)).toContain('options');
    expect(validateQuestion({ ...base, kind: 'mc', options: ['1', '2'], correctIndex: 5 }).map((i) => i.code)).toContain('correctIndex');
    expect(validateQuestion({ ...base, kind: 'numeric', answer: NaN, tolerance: { abs: 0.1 } }).map((i) => i.code)).toContain('answer');
    expect(validateQuestion({ ...base, kind: 'numeric', answer: 1, tolerance: {} }).map((i) => i.code)).toContain('tolerance');
    expect(validateQuestion({ ...base, kind: 'fill', symbolSet: 'hypothesis', blanks: [{ label: 'H0', answer: 'x' }] }).map((i) => i.code)).toContain('blank');
    expect(validateQuestion({ ...base, kind: 'open', modelSolution: ' ' }).map((i) => i.code)).toContain('modelSolution');
    expect(validateQuestion({ ...base, kind: 'tf', answer: true }, ['other'])).toHaveLength(1);
  });
});
