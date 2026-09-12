import { describe, expect, it } from 'vitest';
import { estimateLines, parseRich, plainText, type RichBlock } from '@/lib/richtext';
import { allQuestions } from '@/lib/server/content';
import { isQuizzable } from '@/lib/verify';

const kinds = (blocks: RichBlock[]) => blocks.map((b) => b.kind);

describe('parseRich', () => {
  it('turns a run of data values into one block, not one line each', () => {
    const text = 'Researcher A:\n' + Array.from({ length: 40 }, (_, i) => `• ${i + 3}`).join('\n');
    const blocks = parseRich(text);
    expect(kinds(blocks)).toEqual(['data']);
    const data = blocks[0] as Extract<RichBlock, { kind: 'data' }>;
    expect(data.values).toHaveLength(40);
    expect(data.label).toBe('Researcher A:');
    expect(estimateLines(blocks)).toBeLessThan(6);
  });

  it('accepts the marker form and the legacy bullet form identically', () => {
    const fromMarker = parseRich('[DATA]3, 4, 11, 15[/DATA]');
    const fromBullets = parseRich('• 3\n• 4\n• 11\n• 15');
    expect(fromMarker).toEqual(fromBullets);
  });

  it('normalises a trailing "and" value', () => {
    const blocks = parseRich('• 12\n• 15\n• 19\n• and 28');
    expect((blocks[0] as Extract<RichBlock, { kind: 'data' }>).values).toEqual(['12', '15', '19', '28']);
  });

  it('keeps prose bullets as a list', () => {
    const text = '• Let X = the number of years a student studies ballet\n• Let Y = the number of recitals attended\n• Let Z = hours practised each week\n• Let W = the age at which they started';
    expect(kinds(parseRich(text))).toEqual(['bullets']);
  });

  it('reads the lettered parts of a multi-part question as a list', () => {
    const blocks = parseRich('Identify each term.\n[PARTS]\na. population\nb. sample\nc. parameter\n[/PARTS]');
    expect(kinds(blocks)).toEqual(['para', 'parts']);
    const parts = blocks[1] as Extract<RichBlock, { kind: 'parts' }>;
    expect(parts.items.map((i) => i.label)).toEqual(['a', 'b', 'c']);
    expect(parts.items[0]?.text).toBe('population');
  });

  it('treats a single-cell first row as a caption, not a header', () => {
    const blocks = parseRich('[TABLE]\nFrequency of test scores\nScore | Count\n90 | 3\n80 | 5\n[/TABLE]');
    const t = blocks[0] as Extract<RichBlock, { kind: 'table' }>;
    expect(t.caption).toBe('Frequency of test scores');
    expect(t.head).toEqual(['Score', 'Count']);
    expect(t.rows).toHaveLength(2);
  });

  it('gives a stem-and-leaf table no header and pads ragged rows', () => {
    const blocks = parseRich('[TABLE]\n3 | 2 2 3\n4 | 0 2\n5 |\n[/TABLE]');
    const t = blocks[0] as Extract<RichBlock, { kind: 'table' }>;
    expect(t.head).toBeNull();
    expect(t.rows).toHaveLength(3);
    for (const r of t.rows) expect(r).toHaveLength(t.cols);
  });

  it('flattens to one readable line for the mistake log', () => {
    expect(plainText(parseRich('Find the mean.\n[DATA]3, 4, 11[/DATA]'))).toBe('Find the mean. 3, 4, 11');
    expect(plainText(parseRich('x'.repeat(400)), 50)).toHaveLength(50);
  });

  it('estimates more lines for more content', () => {
    const short = estimateLines(parseRich('Find the mean.'));
    const long = estimateLines(parseRich('Find the mean.\n\n' + 'word '.repeat(200)));
    expect(long).toBeGreaterThan(short);
    expect(short).toBeGreaterThanOrEqual(1);
  });
});

describe('the shipped questions as the learner sees them', () => {
  it('shows no question as an unreadable wall of text', () => {
    const tall: string[] = [];
    for (const q of allQuestions()) {
      if (q.context && estimateLines(parseRich(q.context)) > 24) tall.push(`${q.id} scenario`);
      if (estimateLines(parseRich(q.stem)) > 45) tall.push(`${q.id} question`);
    }
    expect(tall).toEqual([]);
  });
});

describe('markup nested inside a part', () => {
  const nested = [
    '[PARTS]',
    'a. Complete the table.',
    '[TABLE]',
    'Size | Cost | cents/oz',
    '16 | 3.99 | 24.94',
    '32 | 4.99 | 15.59',
    '[/TABLE]',
    'b. Check the linear trend.',
    '[/PARTS]',
  ].join('\n');

  it('keeps the part list whole instead of orphaning its tags', () => {
    const blocks = parseRich(nested);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.kind).toBe('parts');
    // the literal markers must never reach the page
    expect(JSON.stringify(blocks)).not.toMatch(/\[\/?PARTS\]/);
  });

  it('parses the table inside the part as a table, not one long row', () => {
    const parts = parseRich(nested)[0] as Extract<ReturnType<typeof parseRich>[number], { kind: 'parts' }>;
    const inner = parseRich(parts.items[0]?.text ?? '');
    const table = inner.find((b) => b.kind === 'table') as Extract<(typeof inner)[number], { kind: 'table' }>;
    expect(table, 'no table parsed inside part a').toBeDefined();
    expect(table.cols).toBe(3);
    expect(table.rows).toHaveLength(2);
    expect(table.head).toEqual(['Size', 'Cost', 'cents/oz']);
  });

  it('summarises a nested part without leaking markup', () => {
    const text = plainText(parseRich(nested), 200);
    expect(text).not.toMatch(/\[TABLE\]|\[PARTS\]/);
    expect(text).toMatch(/Complete the table/);
  });
});

describe('the shipped bank', () => {
  it('never leaves a block marker in rendered text', () => {
    const leaks: string[] = [];
    for (const q of allQuestions().filter(isQuizzable)) {
      const sources = [q.stem, q.context ?? '', q.kind === 'open' ? q.modelSolution : ''];
      for (const src of sources) {
        if (!src) continue;
        if (/\[(TABLE|DATA|LIST|PARTS)\]/.test(plainText(parseRich(src), 4000))) leaks.push(q.id);
      }
    }
    expect([...new Set(leaks)]).toEqual([]);
  });
});
