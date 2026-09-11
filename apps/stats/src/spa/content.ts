/** Browser build of src/lib/server/content.ts: the generated JSON is bundled instead of read from disk. */
import type { Chapter, GlossaryEntry, Question, Section, SectionId, TeachSnippet } from '../lib/types';
import { keyPointsFor } from '../../content/keypoints';
import catalogJson from '../../content/catalog.json';
import extraIndex from '../../content/extra/index.json';
import deanza from '../../content/extra/deanza.json';
import b01 from '../../content/bank/ch01.json';
import b02 from '../../content/bank/ch02.json';
import b03 from '../../content/bank/ch03.json';
import b04 from '../../content/bank/ch04.json';
import b05 from '../../content/bank/ch05.json';
import b06 from '../../content/bank/ch06.json';
import b07 from '../../content/bank/ch07.json';
import b08 from '../../content/bank/ch08.json';
import b09 from '../../content/bank/ch09.json';
import b10 from '../../content/bank/ch10.json';
import b11 from '../../content/bank/ch11.json';
import b12 from '../../content/bank/ch12.json';
import b13 from '../../content/bank/ch13.json';
import b00 from '../../content/bank/ch00.json';
import t01 from '../../content/teach/ch01.json';
import t02 from '../../content/teach/ch02.json';
import t03 from '../../content/teach/ch03.json';
import t04 from '../../content/teach/ch04.json';
import t05 from '../../content/teach/ch05.json';
import t06 from '../../content/teach/ch06.json';
import t07 from '../../content/teach/ch07.json';
import t08 from '../../content/teach/ch08.json';
import t09 from '../../content/teach/ch09.json';
import t10 from '../../content/teach/ch10.json';
import t11 from '../../content/teach/ch11.json';
import t12 from '../../content/teach/ch12.json';
import t13 from '../../content/teach/ch13.json';

interface RawChapter {
  number: number;
  title: string;
  sections: { id: string; title: string; module: string }[];
}

const CHAPTERS: Chapter[] = (catalogJson as RawChapter[]).map((c) => ({
  number: c.number,
  title: c.title,
  sections: c.sections.map((s) => ({ id: s.id, chapter: c.number, title: s.title, module: s.module })),
}));

const BANK: Question[] = ([b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, b12, b13, b00] as Question[][]).flat();
const EXTRA: Question[] = (deanza as { questions: Question[] }).questions;
const ALL: Question[] = [...BANK, ...EXTRA];
const BY_ID = new Map(ALL.map((q) => [q.id, q]));
const BY_SECTION = new Map<string, Question[]>();
for (const q of ALL) {
  const key = q.sectionId ?? 'unassigned';
  BY_SECTION.set(key, [...(BY_SECTION.get(key) ?? []), q]);
}
interface RawTeach {
  sectionId: string;
  title: string;
  notesText: string | null;
  summary: string | null;
  formulaReview: string | null;
  glossary: GlossaryEntry[];
}
function toSnippet(raw: RawTeach): TeachSnippet {
  const kp = keyPointsFor(raw.sectionId);
  return {
    sectionId: raw.sectionId,
    title: raw.title,
    keyPoints: kp?.points ?? [],
    formulas: kp?.formulas ?? [],
    terms: kp?.terms ?? [],
    pitfalls: kp?.pitfalls ?? [],
    textbookRef: `OpenStax Introductory Statistics 2e, section ${raw.sectionId}`,
    glossary: raw.glossary,
  };
}
const TEACH = new Map<string, TeachSnippet>(([t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12, t13] as RawTeach[][]).flat().map((t) => [t.sectionId, toSnippet(t)]));
const EXTRA_SOURCES = new Set(['deanza', 'vt']);

export function chapters(): Chapter[] {
  return CHAPTERS;
}
export function sections(): Section[] {
  return CHAPTERS.flatMap((c) => c.sections);
}
export function sectionById(id: SectionId): Section | undefined {
  return sections().find((s) => s.id === id);
}
export function chapterOf(n: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.number === n);
}
export interface BankFilter {
  includeExtra?: boolean;
  includeFigure?: boolean;
  kinds?: readonly Question['kind'][];
}
export function bankFor(sectionId: SectionId, f: BankFilter = {}): Question[] {
  return (BY_SECTION.get(sectionId) ?? []).filter(
    (q) => ((f.includeExtra ?? true) || !EXTRA_SOURCES.has(q.source)) && ((f.includeFigure ?? false) || !q.needsFigure) && (!f.kinds || f.kinds.includes(q.kind)),
  );
}
export function questionById(id: string): Question | undefined {
  return BY_ID.get(id);
}
export function allQuestions(): Question[] {
  return ALL;
}
export function testItems(prefix: 'pt' | 'fe', n: number): Question[] {
  const re = new RegExp(`^${prefix}${n}-(\\d+)$`);
  return ALL.filter((q) => re.test(q.id)).sort((a, b) => Number(re.exec(a.id)![1]) - Number(re.exec(b.id)![1]));
}
export function teachFor(sectionId: SectionId): TeachSnippet | undefined {
  return TEACH.get(sectionId);
}
export function extraSets(): Record<string, { license: string; sets: { title: string; url?: string; chapters?: number[]; count: number }[] }> {
  return extraIndex as ReturnType<typeof extraSets>;
}
export function resetContentCache(): void {}
