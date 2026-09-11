/** Shared data model for the stats trainer. Pure types — no runtime imports. */

export type SectionId = string; // e.g. '8.1'

export interface Section {
  id: SectionId;
  chapter: number;
  title: string;
  module: string;
}

export interface Chapter {
  number: number;
  title: string;
  sections: Section[];
}

export type QuestionKind = 'mc' | 'numeric' | 'fill' | 'tf' | 'open';

export interface QuestionBase {
  id: string;
  sectionId: SectionId | null;
  conceptTag: string;
  stem: string;
  context?: string | null;
  /** ordered explanation steps shown after answering (auto-gradable kinds) */
  explanation: string[];
  /** 'openstax-practice' | 'openstax-homework' | 'openstax-tryit' | 'openstax-practice-test' | 'openstax-final' | 'openstax-review' | 'template' | 'llm' | 'deanza' | 'vt' … */
  source: string;
  sourceRef?: Record<string, unknown>;
  needsFigure?: boolean;
  license?: string;
}

export interface McQuestion extends QuestionBase {
  kind: 'mc';
  options: string[];
  correctIndex: number;
}

export interface NumericQuestion extends QuestionBase {
  kind: 'numeric';
  answer: number;
  tolerance: { abs?: number; rel?: number };
  unit?: string | null;
}

export interface FillBlank {
  label: string;
  answer: string;
  accept?: string[];
}

export interface FillQuestion extends QuestionBase {
  kind: 'fill';
  blanks: FillBlank[];
  symbolSet?: 'hypothesis' | 'notation';
}

export interface TfQuestion extends QuestionBase {
  kind: 'tf';
  answer: boolean;
}

/** Free-response item with a model solution; the learner self-assesses after seeing it. */
export interface OpenQuestion extends QuestionBase {
  kind: 'open';
  modelSolution: string;
  rubric?: string[];
}

export type Question = McQuestion | NumericQuestion | FillQuestion | TfQuestion | OpenQuestion;

export type Given =
  | { kind: 'mc'; index: number }
  | { kind: 'numeric'; raw: string }
  | { kind: 'fill'; values: string[] }
  | { kind: 'tf'; value: boolean }
  | { kind: 'open'; text: string; selfMark?: 'got' | 'missed' };

export interface GradeResult {
  /** null while an open item still needs the learner's self-mark */
  correct: boolean | null;
  correctDisplay: string;
  perBlank?: boolean[];
  parsedValue?: number | null;
  needsSelfMark?: boolean;
}

// ----- templates -----

export interface Rng {
  next(): number;
  int(lo: number, hi: number): number;
  float(lo: number, hi: number, decimals?: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  sample<T>(arr: readonly T[], n: number): T[];
}

export type TemplateOutput = Omit<Question, 'id' | 'source'>;

export interface Template {
  id: string;
  sectionId: SectionId;
  conceptTag: string;
  kind: QuestionKind;
  generate(rng: Rng): TemplateOutput;
}

// ----- teaching -----

export interface GlossaryEntry {
  term: string;
  meaning: string;
}

/** The refresher shown before a quiz and after a miss: one screen, essentials only. */
export interface TeachSnippet {
  sectionId: SectionId;
  title: string;
  /** hand-written key points (3–6 one-liners) */
  keyPoints: string[];
  /** essential formulas in plain unicode */
  formulas: string[];
  /** essential terms */
  terms: [string, string][];
  /** common mistakes for this section */
  pitfalls: string[];
  /** where to read more, e.g. "OpenStax Introductory Statistics 2e, section 6.2" */
  textbookRef: string;
  /** ingested reference material, kept as data but not shown by default */
  notesText?: string | null;
  summary?: string | null;
  formulaReview?: string | null;
  glossary?: GlossaryEntry[];
}

// ----- tests -----

export type TestScope = 'section' | 'chapter' | 'practice-test' | 'final' | 'review';

export interface TestSpec {
  scope: TestScope;
  id: string;
  count: number;
  seed: number;
  /** share of template-generated items (0–1); default 0.4 where templates exist */
  templateShare?: number;
  /** share of self-assessed open items (0–1); default 0.3 */
  openShare?: number;
  /** include extra (De Anza / VT) sets; default true */
  includeExtra?: boolean;
}

export interface Test {
  spec: TestSpec;
  questions: Question[];
}

export type QuestionRef =
  | { kind: 'bank'; id: string }
  | { kind: 'template'; templateId: string; seed: number }
  | { kind: 'llm'; snapshot: Question };

// ----- learner progress -----

export interface MistakeEntry {
  id: string;
  at: string;
  ref: QuestionRef;
  sectionId: SectionId | null;
  conceptTag: string;
  stem: string;
  given: Given;
  correctDisplay: string;
  context: 'quiz' | 'review';
}

export interface Attempt {
  id: string;
  at: string;
  spec: TestSpec;
  total: number;
  correct: number;
  sectionIds: SectionId[];
}

export interface ConceptReview {
  conceptTag: string;
  sectionId: SectionId | null;
  streak: number;
  required: number;
  status: 'open' | 'understood';
  lastAt: string;
  misses: number;
}

export type Mastery = 'not_started' | 'in_progress' | 'mastered';

export interface SectionStats {
  answered: number;
  correct: number;
  lastScore?: number;
  lastAt?: string;
}

export interface SessionTally {
  spec: TestSpec;
  total: number;
  correct: number;
  sectionIds: SectionId[];
  startedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  attempts: Attempt[];
  mistakes: MistakeEntry[];
  review: Record<string, ConceptReview>;
  sectionStats: Record<SectionId, SectionStats>;
  openSessions: Record<string, SessionTally>;
}

export interface ProfileView extends Profile {
  mastery: Record<SectionId, Mastery>;
  openConcepts: ConceptReview[];
}

export type ProgressEvent =
  | {
      type: 'answer';
      sessionId: string;
      spec: TestSpec;
      context: 'quiz' | 'review';
      question: Question;
      ref: QuestionRef;
      given: Given;
      at?: string;
    }
  | { type: 'finish'; sessionId: string; spec: TestSpec; at?: string };
