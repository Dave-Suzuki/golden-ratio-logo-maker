import { describe, expect, it } from 'vitest';
import { applyEvent, newProfile } from '@/lib/progress';
import { buildReviewSet, type ReviewSource } from '@/lib/review';
import type { McQuestion, Question, Template, TestSpec } from '@/lib/types';

const spec: TestSpec = { scope: 'section', id: '6.1', count: 1, seed: 1 };
const mk = (id: string, tag: string): McQuestion => ({ id, sectionId: '6.1', conceptTag: tag, stem: id, explanation: [], source: 't', kind: 'mc', options: ['a', 'b'], correctIndex: 0 });
const tpl: Template = { id: 'tz', sectionId: '6.1', conceptTag: 'z', kind: 'tf', generate: (r) => ({ sectionId: '6.1', conceptTag: 'z', stem: `t${r.int(1, 9)}`, kind: 'tf', answer: true, explanation: ['x'] }) };
const bank: Question[] = [mk('z1', 'z'), mk('z2', 'z'), mk('w1', 'w')];
const src: ReviewSource = {
  byTag: (tag) => bank.filter((q) => q.conceptTag === tag),
  templatesByTag: (tag) => (tag === 'z' ? [tpl] : []),
  resolve: (ref) => (ref.kind === 'bank' ? bank.find((q) => q.id === ref.id) : undefined),
};

describe('buildReviewSet', () => {
  it('is empty without open concepts', () => {
    expect(buildReviewSet(newProfile('p', 'D'), 5, 1, src).questions).toEqual([]);
  });
  it('interleaves open concepts, prefers templates, then other items, then the missed item', () => {
    let p = newProfile('p', 'D');
    const miss = (q: McQuestion, at: string) => applyEvent(p, { type: 'answer', sessionId: 's', spec, context: 'quiz', question: q, ref: { kind: 'bank', id: q.id }, given: { kind: 'mc', index: 1 }, at });
    p = miss(mk('z1', 'z'), '2026-01-01T00:00:00Z');
    p = miss(mk('w1', 'w'), '2026-01-01T00:01:00Z');
    const set = buildReviewSet(p, 6, 3, src);
    expect(set.concepts).toEqual(['z', 'w']);
    const tags = set.questions.map((q) => q.conceptTag);
    expect(tags[0]).toBe('z');
    expect(tags[1]).toBe('w');
    expect(set.questions.some((q) => q.source === 'template')).toBe(true);
    // 'w' has no template and no other item → falls back to the missed item itself
    expect(set.questions.filter((q) => q.conceptTag === 'w').map((q) => q.id)).toEqual(['w1']);
    expect(new Set(set.questions.map((q) => q.id)).size).toBe(set.questions.length);
    expect(buildReviewSet(p, 6, 3, src)).toEqual(set);
  });
});
