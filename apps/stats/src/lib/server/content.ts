import { isQuizzable } from '../verify';
import fs from 'node:fs';
import path from 'node:path';
import type { Chapter, GlossaryEntry, Question, Section, SectionId, TeachSnippet } from '../types';
import { keyPointsFor } from '../../../content/keypoints';

/**
 * Server-only content access. Generated JSON lives under apps/stats/content (see scripts/README.md);
 * it is read once per process and cached. Never import this module from client components.
 */
const ROOT = process.env.STATS_CONTENT_DIR ?? path.join(process.cwd(), 'content');

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')) as T;
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

interface RawChapter {
  number: number;
  title: string;
  sections: { id: string; title: string; module: string }[];
}

interface ExtraSet {
  source: string;
  license: string;
  sets: { title: string; url?: string; chapters?: number[]; count: number }[];
  questions: Question[];
}

let chaptersCache: Chapter[] | null = null;
let bankCache: Map<SectionId | 'unassigned', Question[]> | null = null;
let byIdCache: Map<string, Question> | null = null;
let teachCache: Map<SectionId, TeachSnippet> | null = null;

export function chapters(): Chapter[] {
  if (!chaptersCache) {
    chaptersCache = readJson<RawChapter[]>('catalog.json').map((c) => ({
      number: c.number,
      title: c.title,
      sections: c.sections.map((s) => ({ id: s.id, chapter: c.number, title: s.title, module: s.module })),
    }));
  }
  return chaptersCache;
}

export function sections(): Section[] {
  return chapters().flatMap((c) => c.sections);
}

export function sectionById(id: SectionId): Section | undefined {
  return sections().find((s) => s.id === id);
}

export function chapterOf(n: number): Chapter | undefined {
  return chapters().find((c) => c.number === n);
}

function loadBank(): void {
  if (bankCache) return;
  bankCache = new Map();
  byIdCache = new Map();
  const add = (q: Question) => {
    const key = q.sectionId ?? 'unassigned';
    const list = bankCache!.get(key) ?? [];
    list.push(q);
    bankCache!.set(key, list);
    byIdCache!.set(q.id, q);
  };
  for (const c of chapters()) {
    const rel = `bank/ch${String(c.number).padStart(2, '0')}.json`;
    if (exists(rel)) readJson<Question[]>(rel).forEach(add);
  }
  if (exists('bank/ch00.json')) readJson<Question[]>('bank/ch00.json').forEach(add);
  if (exists('extra/index.json')) {
    const idx = readJson<Record<string, unknown>>('extra/index.json');
    for (const src of Object.keys(idx)) {
      if (exists(`extra/${src}.json`)) readJson<ExtraSet>(`extra/${src}.json`).questions.forEach(add);
    }
  }
}

export interface BankFilter {
  includeExtra?: boolean;
  includeFigure?: boolean;
  kinds?: readonly Question['kind'][];
}

const EXTRA_SOURCES = new Set(['deanza', 'vt']);

export function bankFor(sectionId: SectionId, f: BankFilter = {}): Question[] {
  loadBank();
  return (bankCache!.get(sectionId) ?? []).filter(
    (q) =>
      isQuizzable(q) &&
      ((f.includeExtra ?? true) || !EXTRA_SOURCES.has(q.source)) &&
      (!f.kinds || f.kinds.includes(q.kind)),
  );
}

export function questionById(id: string): Question | undefined {
  loadBank();
  return byIdCache!.get(id);
}

export function allQuestions(): Question[] {
  loadBank();
  return [...byIdCache!.values()];
}

/** Items of one OpenStax practice test / final exam, in printed order. */
export function testItems(prefix: 'pt' | 'fe', n: number): Question[] {
  loadBank();
  const re = new RegExp(`^${prefix}${n}-(\\d+)$`);
  return [...byIdCache!.values()]
    .filter((q) => re.test(q.id) && isQuizzable(q))
    .sort((a, b) => Number(re.exec(a.id)![1]) - Number(re.exec(b.id)![1]));
}

interface RawTeach {
  sectionId: string;
  title: string;
  notesText: string | null;
  summary: string | null;
  formulaReview: string | null;
  glossary: GlossaryEntry[];
}

export function toSnippet(raw: RawTeach): TeachSnippet {
  const kp = keyPointsFor(raw.sectionId);
  return {
    sectionId: raw.sectionId,
    title: raw.title,
    keyPoints: kp?.points ?? [],
    formulas: kp?.formulas ?? [],
    terms: kp?.terms ?? [],
    pitfalls: kp?.pitfalls ?? [],
    textbookRef: `OpenStax Introductory Statistics 2e, section ${raw.sectionId}`,
    notesText: raw.notesText,
    summary: raw.summary,
    formulaReview: raw.formulaReview,
    glossary: raw.glossary,
  };
}

export function teachFor(sectionId: SectionId): TeachSnippet | undefined {
  if (!teachCache) {
    teachCache = new Map();
    for (const c of chapters()) {
      const rel = `teach/ch${String(c.number).padStart(2, '0')}.json`;
      if (exists(rel)) for (const t of readJson<RawTeach[]>(rel)) teachCache.set(t.sectionId, toSnippet(t));
    }
  }
  return teachCache.get(sectionId);
}

export function extraSets(): Record<string, { license: string; sets: ExtraSet['sets'] }> {
  return exists('extra/index.json') ? readJson('extra/index.json') : {};
}

/** Test hook: drop caches (used after regenerating content). */
export function resetContentCache(): void {
  chaptersCache = null;
  bankCache = null;
  byIdCache = null;
  teachCache = null;
}
