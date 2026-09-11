import { describe, expect, it } from 'vitest';
import { buildTest, instantiate, refFor, shuffleOptions, type ContentSource } from '@/lib/testgen';
import { mulberry32 } from '@/lib/rng';
import type { McQuestion, Question, Template } from '@/lib/types';

const mk = (id: string, sectionId: string, kind: 'mc' | 'open' = 'mc'): Question =>
  kind === 'mc'
    ? { id, sectionId, conceptTag: sectionId, stem: id, explanation: [], source: 't', kind, options: ['a', 'b', 'c', 'd'], correctIndex: 2 }
    : { id, sectionId, conceptTag: sectionId, stem: id, explanation: [], source: 't', kind, modelSolution: 'm' };

const tpl: Template = {
  id: 'z-score',
  sectionId: '6.1',
  conceptTag: '6.1',
  kind: 'numeric',
  generate(rng) {
    const mu = rng.int(10, 50);
    const x = mu + rng.int(-9, 9);
    return { sectionId: '6.1', conceptTag: '6.1', stem: `z for x=${x}, μ=${mu}, σ=3`, kind: 'numeric', answer: (x - mu) / 3, tolerance: { abs: 0.01 }, explanation: [`(${x}−${mu})/3`] };
  },
};

const src: ContentSource = {
  bank: (s) => [...Array(8)].map((_, i) => mk(`${s}-${i}`, s, i < 5 ? 'mc' : 'open')),
  templates: (s) => (s === '6.1' ? [tpl] : []),
  sectionsOfChapter: () => ['6.1', '6.2'],
  testItems: () => [mk('pt1-1', '1.1'), mk('pt1-2', '1.2'), mk('pt1-3', '1.3')],
};

describe('buildTest', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = buildTest({ scope: 'section', id: '6.1', count: 6, seed: 7 }, src);
    const b = buildTest({ scope: 'section', id: '6.1', count: 6, seed: 7 }, src);
    const c = buildTest({ scope: 'section', id: '6.1', count: 6, seed: 8 }, src);
    expect(a).toEqual(b);
    expect(a.questions.map((q) => q.id)).not.toEqual(c.questions.map((q) => q.id));
    expect(a.questions).toHaveLength(6);
    expect(new Set(a.questions.map((q) => q.id)).size).toBe(6);
  });
  it('mixes templates, auto items and open items by share', () => {
    const t = buildTest({ scope: 'section', id: '6.1', count: 10, seed: 1, templateShare: 0.4, openShare: 0.3 }, src);
    const kinds = t.questions.map((q) => q.source === 'template' ? 'template' : q.kind);
    expect(kinds.filter((k) => k === 'template')).toHaveLength(4);
    expect(kinds.filter((k) => k === 'open')).toHaveLength(3);
    expect(kinds.filter((k) => k === 'mc')).toHaveLength(3);
  });
  it('chapter tests cover every section', () => {
    const t = buildTest({ scope: 'chapter', id: '6', count: 5, seed: 3, templateShare: 0 }, src);
    expect(new Set(t.questions.map((q) => q.sectionId))).toEqual(new Set(['6.1', '6.2']));
    expect(t.questions).toHaveLength(5);
  });
  it('practice-test scope keeps printed order and can sample', () => {
    const all = buildTest({ scope: 'practice-test', id: '1', count: 99, seed: 1 }, src);
    expect(all.questions.map((q) => q.id)).toEqual(['pt1-1', 'pt1-2', 'pt1-3']);
    const some = buildTest({ scope: 'practice-test', id: '1', count: 2, seed: 1 }, src);
    expect(some.questions).toHaveLength(2);
  });
  it('shuffleOptions keeps the correct option text; refs round-trip template seeds', () => {
    const q = mk('m', '6.1') as McQuestion;
    const s = shuffleOptions(q, mulberry32(5));
    expect(s.options[s.correctIndex]).toBe('c');
    expect([...s.options].sort()).toEqual(['a', 'b', 'c', 'd']);
    const inst = instantiate(tpl, 12345);
    expect(inst.id).toBe('z-score#12345');
    expect(refFor(inst)).toEqual({ kind: 'template', templateId: 'z-score', seed: 12345 });
    expect(instantiate(tpl, 12345)).toEqual(inst);
    expect(refFor(q)).toEqual({ kind: 'bank', id: 'm' });
  });
});
