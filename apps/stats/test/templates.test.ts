import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '../content/templates';
import { instantiate } from '@/lib/testgen';
import { validateQuestion } from '@/lib/validate';
import { grade, formatAnswer } from '@/lib/grade';

describe('templates', () => {
  it('have unique ids and match their declared kind/section', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });
  it('every template × 200 seeds validates, is idempotent, and grades its own answer as correct', () => {
    const bad: string[] = [];
    for (const t of TEMPLATES) {
      for (let seed = 1; seed <= 200; seed++) {
        const q = instantiate(t, seed);
        const issues = validateQuestion(q);
        if (issues.length) bad.push(`${t.id}#${seed}: ${issues.map((i) => i.message).join(', ')}`);
        if (q.kind !== t.kind || q.sectionId !== t.sectionId) bad.push(`${t.id}#${seed}: kind/section mismatch`);
        if (JSON.stringify(instantiate(t, seed)) !== JSON.stringify(q)) bad.push(`${t.id}#${seed}: not idempotent`);
        if (q.explanation.length === 0) bad.push(`${t.id}#${seed}: no explanation`);
        // the canonical answer must grade as correct through the same path the learner uses
        let ok: boolean | null = null;
        if (q.kind === 'numeric') ok = grade(q, { kind: 'numeric', raw: formatAnswer(q) }).correct;
        if (q.kind === 'mc') ok = grade(q, { kind: 'mc', index: q.correctIndex }).correct;
        if (q.kind === 'tf') ok = grade(q, { kind: 'tf', value: q.answer }).correct;
        if (q.kind === 'fill') ok = grade(q, { kind: 'fill', values: q.blanks.map((b) => b.answer) }).correct;
        if (ok === false) bad.push(`${t.id}#${seed}: canonical answer graded wrong`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('produces different questions for different seeds', () => {
    for (const t of TEMPLATES) {
      const stems = new Set(Array.from({ length: 30 }, (_, i) => instantiate(t, i + 1).stem + (instantiate(t, i + 1).context ?? '')));
      expect(stems.size, t.id).toBeGreaterThan(3);
    }
  });
});
