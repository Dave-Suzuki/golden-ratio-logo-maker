import { describe, expect, it } from 'vitest';
import { applyEvent, conceptKey, newProfile } from '@/lib/progress';
import { buildReviewSet, type ReviewSource } from '@/lib/review';
import { instantiate } from '@/lib/testgen';
import type { McQuestion, Question, Template, TestSpec } from '@/lib/types';

const spec: TestSpec = { scope: 'section', id: '6.1', count: 1, seed: 1 };
const mk = (id: string): McQuestion => ({ id, sectionId: '6.1', conceptTag: '6.1', stem: id, explanation: [], source: 't', kind: 'mc', options: ['a', 'b'], correctIndex: 0 });
const tpl: Template = { id: 'tz', sectionId: '6.1', conceptTag: '6.1', kind: 'tf', generate: (r) => ({ sectionId: '6.1', conceptTag: '6.1', stem: `t${r.int(1, 9)}`, kind: 'tf', answer: true, explanation: ['x'] }) };
const bank: Question[] = [mk('z1'), mk('z2'), mk('w1')];
// mirrors serverReviewSource: a concept key is a question id or a template id, and older
// profiles' section tags still resolve through conceptTag
const src: ReviewSource = {
  byTag: (tag) => bank.filter((q) => q.id === tag || q.conceptTag === tag),
  templatesByTag: (tag) => [tpl].filter((t) => t.id === tag || t.conceptTag === tag),
  resolve: (ref) => (ref.kind === 'bank' ? bank.find((q) => q.id === ref.id) : ref.kind === 'template' ? instantiate(tpl, ref.seed) : undefined),
};

describe('buildReviewSet', () => {
  it('is empty without open concepts', () => {
    expect(buildReviewSet(newProfile('p', 'D'), 5, 1, src).questions).toEqual([]);
  });
  it('re-asks each missed question itself, with fresh numbers when it came from a generator', () => {
    let p = newProfile('p', 'D');
    const miss = (q: Question, at: string) =>
      applyEvent(p, {
        type: 'answer',
        sessionId: 's',
        spec,
        context: 'quiz',
        question: q,
        ref: q.source === 'template' ? { kind: 'template', templateId: 'tz', seed: 5 } : { kind: 'bank', id: q.id },
        given: q.kind === 'tf' ? { kind: 'tf', value: false } : { kind: 'mc', index: 1 },
        at,
      });
    const generated = instantiate(tpl, 5);
    p = miss(mk('z1'), '2026-01-01T00:00:00Z');
    p = miss(mk('w1'), '2026-01-01T00:01:00Z');
    p = miss(generated, '2026-01-01T00:02:00Z');
    const set = buildReviewSet(p, 6, 3, src);
    // one concept per missed question, oldest first; the generated one is keyed by its template
    expect(set.concepts).toEqual(['z1', 'w1', conceptKey(generated)]);
    expect(conceptKey(generated)).toBe('tz');
    // round-robin across the open concepts
    expect(set.questions.slice(0, 3).map((q) => (q.source === 'template' ? 'tz' : q.id))).toEqual(['z1', 'w1', 'tz']);
    // a textbook question comes back as itself, never as a neighbour on the same section
    expect(set.questions.filter((q) => q.id === 'z2')).toEqual([]);
    // a generated question comes back from its generator, not as the exact instance that was missed
    const fresh = set.questions.filter((q) => q.source === 'template');
    expect(fresh.length).toBeGreaterThan(0);
    expect(fresh.some((q) => q.id !== generated.id)).toBe(true);
    expect(new Set(set.questions.map((q) => q.id)).size).toBe(set.questions.length);
    expect(buildReviewSet(p, 6, 3, src)).toEqual(set);
  });
});
