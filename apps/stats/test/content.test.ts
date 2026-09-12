import { describe, expect, it } from 'vitest';
import { allQuestions, bankFor, chapters, sections, teachFor, testItems } from '@/lib/server/content';
import { templatesFor } from '../content/templates';
import { validateQuestion } from '@/lib/validate';

describe('generated content', () => {
  it('has 13 chapters and 58 sections', () => {
    expect(chapters()).toHaveLength(13);
    expect(sections()).toHaveLength(58);
    expect(sections().map((s) => s.id)).toContain('11.6');
  });
  it('every bank item validates and has a unique id', () => {
    const qs = allQuestions();
    expect(qs.length).toBeGreaterThan(1500);
    const ids = new Set<string>();
    const bad: string[] = [];
    for (const q of qs) {
      if (ids.has(q.id)) bad.push(`dup ${q.id}`);
      ids.add(q.id);
      const issues = validateQuestion(q);
      if (issues.length) bad.push(`${q.id}: ${issues.map((i) => i.message).join(', ')}`);
    }
    expect(bad).toEqual([]);
  });
  it('every section has quiz items, auto-gradable items where expected, and a teach bundle', () => {
    const thin: string[] = [];
    for (const s of sections()) {
      const items = bankFor(s.id);
      if (items.length + templatesFor(s.id).length * 4 < 10) thin.push(`${s.id}: ${items.length}`);
      const t = teachFor(s.id);
      expect(t, s.id).toBeDefined();
      expect(t?.keyPoints.length ?? 0, s.id).toBeGreaterThanOrEqual(3);
      expect(t?.keyPoints.length ?? 0, s.id).toBeLessThanOrEqual(6);
      for (const kp of t?.keyPoints ?? []) expect(kp.length, `${s.id}: ${kp}`).toBeLessThan(260);
      expect(t?.textbookRef, s.id).toContain(s.id);
    }
    expect(thin).toEqual([]);
  });
  it('practice tests and finals are present in printed order', () => {
    const pt1 = testItems('pt', 1);
    expect(pt1.length).toBeGreaterThan(50);
    expect(pt1[0]?.id).toBe('pt1-1');
    expect(testItems('fe', 1).length).toBeGreaterThan(30);
  });
});
