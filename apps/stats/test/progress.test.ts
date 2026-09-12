import { describe, expect, it } from 'vitest';
import { conceptKey, applyEvent, computeMastery, newProfile, openConcepts } from '@/lib/progress';
import type { Given, McQuestion, OpenQuestion, TestSpec } from '@/lib/types';

const spec: TestSpec = { scope: 'section', id: '6.1', count: 3, seed: 1 };
const mc: McQuestion = { id: 'a', sectionId: '6.1', conceptTag: 'z', stem: 's', explanation: [], source: 't', kind: 'mc', options: ['x', 'y'], correctIndex: 1 };
const open: OpenQuestion = { ...mc, id: 'o', kind: 'open', modelSolution: 'm', conceptTag: 'w' } as unknown as OpenQuestion;

function answer(p: ReturnType<typeof newProfile>, q: McQuestion | OpenQuestion, given: Given, ctx: 'quiz' | 'review' = 'quiz', at = '2026-01-01T00:00:00Z') {
  return applyEvent(p, { type: 'answer', sessionId: 's1', spec, context: ctx, question: q, ref: { kind: 'bank', id: q.id }, given, at });
}

describe('progress reducer', () => {
  it('wrong → mistake + open concept; 2 correct in a row → understood; a miss resets the streak', () => {
    // the concept is the question itself: only *this* question answered right twice clears it
    let p = newProfile('p', 'Dave');
    p = answer(p, mc, { kind: 'mc', index: 0 });
    expect(p.mistakes).toHaveLength(1);
    expect(p.review[conceptKey(mc)]).toMatchObject({ status: 'open', streak: 0, misses: 1 });
    p = answer(p, mc, { kind: 'mc', index: 1 });
    expect(p.review[conceptKey(mc)]).toMatchObject({ status: 'open', streak: 1 });
    p = answer(p, mc, { kind: 'mc', index: 0 });
    expect(p.review[conceptKey(mc)]).toMatchObject({ status: 'open', streak: 0, misses: 2 });
    p = answer(p, mc, { kind: 'mc', index: 1 });
    p = answer(p, mc, { kind: 'mc', index: 1 });
    expect(p.review[conceptKey(mc)]?.status).toBe('understood');
    expect(openConcepts(p)).toEqual([]);
    expect(p.sectionStats['6.1']).toMatchObject({ answered: 5, correct: 3 });
  });
  it('re-grades on the server: a client cannot claim correctness', () => {
    const p = answer(newProfile('p', 'D'), mc, { kind: 'mc', index: 0 });
    expect(p.mistakes).toHaveLength(1);
  });
  it('open items count only once self-marked', () => {
    let p = newProfile('p', 'D');
    p = answer(p, open, { kind: 'open', text: 'my answer' });
    expect(p.sectionStats['6.1']).toBeUndefined();
    p = answer(p, open, { kind: 'open', text: 'my answer', selfMark: 'missed' });
    expect(p.mistakes).toHaveLength(1);
    expect(p.review[conceptKey(open)]?.status).toBe('open');
  });
  it('finish records an attempt and last score → mastery', () => {
    let p = newProfile('p', 'D');
    p = answer(p, mc, { kind: 'mc', index: 1 });
    p = answer(p, mc, { kind: 'mc', index: 1 });
    p = applyEvent(p, { type: 'finish', sessionId: 's1', spec, at: '2026-01-01T00:01:00Z' });
    expect(p.attempts).toHaveLength(1);
    expect(p.attempts[0]).toMatchObject({ total: 2, correct: 2, sectionIds: ['6.1'] });
    expect(p.openSessions['s1']).toBeUndefined();
    expect(computeMastery(p, ['6.1', '6.2'])).toEqual({ '6.1': 'mastered', '6.2': 'not_started' });
    // a later miss in that section reopens it
    p = answer(p, mc, { kind: 'mc', index: 0 });
    expect(computeMastery(p, ['6.1'])['6.1']).toBe('in_progress');
  });
  it('does not mutate the input profile', () => {
    const p0 = newProfile('p', 'D');
    const snapshot = JSON.stringify(p0);
    answer(p0, mc, { kind: 'mc', index: 0 });
    expect(JSON.stringify(p0)).toBe(snapshot);
  });
});
