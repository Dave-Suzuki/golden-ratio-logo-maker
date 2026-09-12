/**
 * Regenerates the QA audit input: every question the app is willing to show, rendered to the exact
 * text a learner sees. Skipped by default — it writes files. Run it with:
 *
 *   QA_EXPORT=1 npx vitest run test/export-qa.test.ts
 *
 * The point of rendering through parseRich rather than dumping the raw JSON is that an auditor has
 * to judge what is on screen: a table the learner cannot see is not evidence they were given.
 */
import { test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { allQuestions } from '@/lib/server/content';
import { isQuizzable } from '@/lib/verify';
import { parseRich, type RichBlock } from '@/lib/richtext';

/** Flatten blocks the way RichText.tsx lays them out. */
function render(blocks: readonly RichBlock[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'para') out.push(b.text);
    else if (b.kind === 'data') out.push(`${b.label ? `${b.label}: ` : ''}${b.values.join(', ')}`);
    else if (b.kind === 'bullets') out.push(b.items.map((i) => `• ${i}`).join('\n'));
    else if (b.kind === 'parts') out.push(b.items.map((i) => `${i.label} ${i.text}`).join('\n'));
    else if (b.kind === 'figure') out.push(`[IMAGE NOT SHOWN${b.caption ? `: ${b.caption}` : ''}]`);
    else {
      const lines: string[] = [];
      if (b.caption) lines.push(b.caption);
      if (b.head) lines.push(b.head.join(' | '));
      for (const r of b.rows) lines.push(r.join(' | '));
      out.push(lines.join('\n'));
    }
  }
  return out.join('\n\n').trim();
}

const BATCH = 40;

test.skipIf(!process.env.QA_EXPORT)('export the shown question bank for audit', () => {
  const items = allQuestions()
    .filter(isQuizzable)
    .map((q) => {
      const o: Record<string, unknown> = {
        id: q.id,
        section: q.sectionId,
        kind: q.kind,
        scenario: q.context ? render(parseRich(q.context)) : null,
        question: render(parseRich(q.stem)),
      };
      if (q.kind === 'mc') {
        o.options = q.options;
        o.correct = q.options?.[q.correctIndex];
      } else if (q.kind === 'fill') o.correct = q.blanks?.map((b) => b.answer);
      else if (q.kind === 'open') o.correct = render(parseRich(q.modelSolution ?? ''));
      else o.correct = q.answer;
      if (q.explanation?.length) o.explanation = q.explanation.map((e) => render(parseRich(e)));
      return o;
    });

  mkdirSync('qa/batches', { recursive: true });
  writeFileSync('qa/questions.json', JSON.stringify(items, null, 1));
  for (let i = 0; i * BATCH < items.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    writeFileSync(`qa/batches/batch${n}.json`, JSON.stringify(items.slice(i * BATCH, (i + 1) * BATCH), null, 1));
  }
  console.log(`exported ${items.length} questions in ${Math.ceil(items.length / BATCH)} batches`);
});
