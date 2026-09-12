import { describe, expect, it } from 'vitest';
import { conceptKey, applyEvent, computeMastery, newProfile, openConcepts } from '@/lib/progress';
import type { Given, McQuestion, OpenQuestion, TestSpec } from '@/lib/types';

const spec: TestSpec = { scope: 'section', id: '6.1', count: 3, seed: 1 };
const mc: McQuestion = { id: 'a', sectionId: '6.1', conceptTag: 'z', stem: 's', explanation: [], source: 't', kind: 'mc', options: ['x', 'y'], correctIndex: 1 };
const open: OpenQuestion = { ...mc, id: 'o', kind: 'open', modelSolution: 'm', conceptTag: 'w' } as unknown as OpenQuestion;

/** Each call is its own sitting unless a session is named: answering twice in one sitting is a resubmit. */
let sitting = 0;
function answer(
  p: ReturnType<typeof newProfile>,
  q: McQuestion | OpenQuestion,
  given: Given,
  ctx: 'quiz' | 'review' = 'quiz',
  at = '2026-01-01T00:00:00Z',
  sessionId = `s${++sitting}`,
) {
  return applyEvent(p, { type: 'answer', sessionId, spec, context: ctx, question: q, ref: { kind: 'bank', id: q.id }, given, at });
}

describe('progress reducer', () => {
  it('wrong → mistake + open concept; 2 correct in a row → understood; a miss resets the streak', () => {
    // the concept is the question itself: only *this* question answered right twice clears it,
    // and only in a later sitting than the one it was missed in
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
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'quiz', '2026-01-01T00:00:00Z', 's1');
    p = answer(p, { ...mc, id: 'a2' }, { kind: 'mc', index: 1 }, 'quiz', '2026-01-01T00:00:00Z', 's1');
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

describe('what a sitting means', () => {
  it('does not let other questions in the same quiz clear a miss', () => {
    // a generated question's concept is its generator, so one quiz can serve several of them
    let p = newProfile('p', 'D');
    p = answer(p, mc, { kind: 'mc', index: 0 }, 'quiz', '2026-01-01T00:00:00Z', 'quiz-1');
    expect(p.review[conceptKey(mc)]).toMatchObject({ status: 'open', streak: 0 });
    // two more correct answers on the same concept, still inside that quiz
    p = answer(p, { ...mc, id: 'a2' }, { kind: 'mc', index: 1 }, 'quiz', '2026-01-01T00:00:00Z', 'quiz-1');
    p = answer(p, { ...mc, id: 'a3' }, { kind: 'mc', index: 1 }, 'quiz', '2026-01-01T00:00:00Z', 'quiz-1');
    expect(p.review[conceptKey(mc)], 'cleared without coming back to it').toMatchObject({ status: 'open', streak: 0 });
    // a later sitting does clear it
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'review', '2026-01-02T00:00:00Z', 'review-1');
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'review', '2026-01-03T00:00:00Z', 'review-2');
    expect(p.review[conceptKey(mc)]?.status).toBe('understood');
  });

  it('counts a question once however many times the answer arrives', () => {
    // two tabs on one quiz, or a resubmit, used to record the answer twice
    let p = newProfile('p', 'D');
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'quiz', '2026-01-01T00:00:00Z', 'tab');
    p = answer(p, mc, { kind: 'mc', index: 0 }, 'quiz', '2026-01-01T00:00:00Z', 'tab');
    expect(p.sectionStats['6.1']).toMatchObject({ answered: 1, correct: 1 });
    expect(p.mistakes).toHaveLength(0);
  });

  it('gives each section its own score after a chapter quiz', () => {
    const chapterSpec: TestSpec = { scope: 'chapter', id: '6', count: 4, seed: 1 };
    const inSection = (id: string, sectionId: string) => ({ ...mc, id, sectionId }) as McQuestion;
    let p = newProfile('p', 'D');
    const ev = (q: McQuestion, given: Given) =>
      applyEvent(p, { type: 'answer', sessionId: 'ch', spec: chapterSpec, context: 'quiz', question: q, ref: { kind: 'bank', id: q.id }, given, at: '2026-01-01T00:00:00Z' });
    p = ev(inSection('p1', '6.1'), { kind: 'mc', index: 1 });
    p = ev(inSection('p2', '6.1'), { kind: 'mc', index: 1 });
    p = ev(inSection('p3', '6.2'), { kind: 'mc', index: 0 });
    p = ev(inSection('p4', '6.2'), { kind: 'mc', index: 0 });
    p = applyEvent(p, { type: 'finish', sessionId: 'ch', spec: chapterSpec, at: '2026-01-01T00:05:00Z' });
    // the whole quiz scored 50%, but each section earned its own
    expect(p.sectionStats['6.1']?.lastScore).toBe(1);
    expect(p.sectionStats['6.2']?.lastScore).toBe(0);
  });

  it('lets a profile written before per-question concepts work its entries off', () => {
    let p = newProfile('p', 'D');
    // an old build keyed the concept by section
    p.review['6.1'] = { conceptTag: '6.1', sectionId: '6.1', streak: 0, required: 2, status: 'open', lastAt: '2025-01-01T00:00:00Z', misses: 3 };
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'review', '2026-01-02T00:00:00Z', 'r1');
    expect(p.review['6.1']).toMatchObject({ streak: 1, status: 'open' });
    p = answer(p, mc, { kind: 'mc', index: 1 }, 'review', '2026-01-03T00:00:00Z', 'r2');
    expect(p.review['6.1']?.status).toBe('understood');
  });
});
