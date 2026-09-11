import type { Question } from './types';

export interface Issue {
  code: string;
  path: string;
  message: string;
}

const HYP = new Set(['=', '≠', '<', '>', '≤', '≥']);

/** Structural checks every question must pass — authored, template-generated or LLM-generated alike. */
export function validateQuestion(q: Question, sectionTags?: readonly string[]): Issue[] {
  const issues: Issue[] = [];
  const push = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!q.id) push('id', 'id', 'missing id');
  if (!q.stem || q.stem.trim().length < 3) push('stem', 'stem', 'stem is empty');
  if (!Array.isArray(q.explanation)) push('explanation', 'explanation', 'explanation must be an array');
  if (sectionTags && !sectionTags.includes(q.conceptTag)) push('tag', 'conceptTag', `unknown tag ${q.conceptTag}`);
  switch (q.kind) {
    case 'mc': {
      if (q.options.length < 2 || q.options.length > 6) push('options', 'options', 'need 2–6 options');
      if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length)
        push('options', 'options', 'options must be distinct');
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length)
        push('correctIndex', 'correctIndex', 'correctIndex out of range');
      if (q.options.some((o) => !o.trim())) push('options', 'options', 'empty option');
      break;
    }
    case 'numeric': {
      if (!Number.isFinite(q.answer)) push('answer', 'answer', 'answer must be finite');
      const { abs, rel } = q.tolerance ?? {};
      if ((abs ?? 0) < 0 || (rel ?? 0) < 0) push('tolerance', 'tolerance', 'tolerance must be ≥ 0');
      if (abs === undefined && rel === undefined) push('tolerance', 'tolerance', 'tolerance required');
      break;
    }
    case 'fill': {
      if (!q.blanks?.length) push('blanks', 'blanks', 'at least one blank');
      q.blanks?.forEach((b, i) => {
        if (!b.answer?.trim()) push('blank', `blanks[${i}]`, 'empty answer');
        if (q.symbolSet === 'hypothesis' && !HYP.has(b.answer)) push('blank', `blanks[${i}]`, 'not a hypothesis symbol');
      });
      break;
    }
    case 'tf':
      if (typeof q.answer !== 'boolean') push('answer', 'answer', 'answer must be boolean');
      break;
    case 'open':
      if (!q.modelSolution?.trim()) push('modelSolution', 'modelSolution', 'model solution required');
      break;
    default:
      push('kind', 'kind', `unknown kind ${(q as { kind: string }).kind}`);
  }
  return issues;
}
