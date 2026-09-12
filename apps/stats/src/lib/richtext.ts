/**
 * Question text parser. Pure, dependency-free, and shared by the renderer, the print page and the
 * content tests, so a test assertion about "how long does this question look" means the same thing
 * the learner sees.
 *
 * The importer marks structure with square-bracket blocks rather than HTML:
 *   [DATA]3, 4, 11[/DATA]   a data set — must render on one wrapped line, never one value per line
 *   [LIST] … [/LIST]        prose bullets
 *   [PARTS] a. … b. … [/PARTS]  the lettered parts of a multi-part question
 *   [TABLE] a | b … [/TABLE]    rows separated by newlines, cells by pipes
 *   [FIGURE: caption]       an image we do not have
 * Legacy content that still uses one "• value" line per data point is parsed the same way, so the
 * renderer stays correct against older generated JSON.
 */

export type RichBlock =
  | { kind: 'para'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'parts'; items: { label: string; text: string }[] }
  | { kind: 'data'; label: string | null; values: string[] }
  | { kind: 'table'; caption: string | null; head: string[] | null; rows: string[][]; cols: number }
  | { kind: 'figure'; caption: string | null };

/** A number, optionally signed, currency-prefixed or percent-suffixed. "and 28" counts as 28. */
const DATA_VALUE = /^(?:and\s+)?[−–-]?\$?\d[\d,]*(?:\.\d+)?\s*%?$/;
const BULLET = /^[•·]\s*(.*)$/;
const PART = /^([a-z]|[ivx]{1,4}|\d{1,2})[.)]\s+(.*)$/i;
const FIGURE_INLINE = /\[FIGURE(?::\s*([^\]]*))?\]/g;

function stripAnd(v: string): string {
  return v.replace(/^and\s+/i, '').trim();
}

function isDataValue(v: string): boolean {
  return DATA_VALUE.test(v.trim());
}

/** A bullet run is a data set when it is several values and they all look like numbers. */
function bulletsAreData(items: readonly string[]): boolean {
  if (items.length < 4) return false;
  if (items.every(isDataValue)) return true;
  const shortWithDigits = items.every((i) => i.length <= 20) && items.filter((i) => /\d/.test(i)).length >= 0.7 * items.length;
  return items.length >= 6 && shortWithDigits;
}

function parseTable(block: string): RichBlock {
  const rows = block
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split('|').map((c) => c.trim()));
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  let caption: string | null = null;
  // OpenStax puts a spanned title row first; one cell in a multi-column table is a caption, not a header
  if (rows.length > 1 && (rows[0]?.length ?? 0) === 1 && cols > 1) {
    caption = rows[0]?.[0] ?? null;
    rows.shift();
  }
  // a header row names things; a stem-and-leaf plot's first row is all digits, so it has none
  const first = rows[0] ?? [];
  const headerLike = first.length > 0 && first.some((c) => /[a-z]/i.test(c));
  const head = headerLike ? rows.shift() ?? null : null;
  const padded = rows.map((r) => Array.from({ length: cols }, (_, c) => r[c] ?? ''));
  return { kind: 'table', caption, head: head ? Array.from({ length: cols }, (_, c) => head[c] ?? '') : null, rows: padded, cols };
}

function pushParagraphs(text: string, out: RichBlock[]): void {
  for (const para of text.split(/\n{2,}/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let i = 0;
    let buffer: string[] = [];
    const flushBuffer = () => {
      if (buffer.length > 0) {
        out.push({ kind: 'para', text: buffer.join('\n') });
        buffer = [];
      }
    };

    while (i < lines.length) {
      const line = lines[i] ?? '';
      const bulletMatch = BULLET.exec(line);
      if (bulletMatch) {
        const items: string[] = [];
        while (i < lines.length) {
          const m = BULLET.exec(lines[i] ?? '');
          if (!m) break;
          items.push((m[1] ?? '').trim());
          i++;
        }
        // a short label line just above a data run names it ("Researcher A:")
        const label = buffer.length > 0 ? (buffer[buffer.length - 1] ?? '') : '';
        if (bulletsAreData(items)) {
          const useLabel = label.length <= 40 && label.endsWith(':');
          if (useLabel) buffer.pop();
          flushBuffer();
          out.push({ kind: 'data', label: useLabel ? label : null, values: items.map(stripAnd) });
        } else {
          flushBuffer();
          out.push({ kind: 'bullets', items });
        }
        continue;
      }
      buffer.push(line);
      i++;
    }
    flushBuffer();
  }
}

/** Split the text on a marker block, handing each inner block to `make`. */
function splitMarker(text: string, name: string, make: (inner: string) => RichBlock | RichBlock[]): (string | RichBlock)[] {
  const re = new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`, 'g');
  const out: (string | RichBlock)[] = [];
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const made = make(m[1] ?? '');
    out.push(...(Array.isArray(made) ? made : [made]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parseDataBlock(inner: string): RichBlock {
  const values = inner
    .split(',')
    .map((v) => stripAnd(v))
    .filter(Boolean);
  return { kind: 'data', label: null, values };
}

function parseListBlock(inner: string): RichBlock {
  const items = inner.split('\n').map((l) => l.trim()).filter(Boolean);
  return { kind: 'bullets', items };
}

function parsePartsBlock(inner: string): RichBlock {
  const items: { label: string; text: string }[] = [];
  for (const raw of inner.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = PART.exec(line);
    if (m) items.push({ label: m[1] ?? '', text: (m[2] ?? '').trim() });
    else if (items.length > 0) {
      const last = items[items.length - 1];
      if (last) last.text = `${last.text}\n${line}`;
    } else items.push({ label: '', text: line });
  }
  return { kind: 'parts', items };
}

/** Parse question text into renderable blocks. */
export function parseRich(text: string): RichBlock[] {
  const out: RichBlock[] = [];
  // markers are handled outermost-first so a table inside a scenario stays intact
  const level1 = splitMarker(text ?? '', 'TABLE', parseTable);
  for (const part1 of level1) {
    if (typeof part1 !== 'string') {
      out.push(part1);
      continue;
    }
    for (const part2 of splitMarker(part1, 'DATA', parseDataBlock)) {
      if (typeof part2 !== 'string') {
        out.push(part2);
        continue;
      }
      for (const part3 of splitMarker(part2, 'PARTS', parsePartsBlock)) {
        if (typeof part3 !== 'string') {
          out.push(part3);
          continue;
        }
        for (const part4 of splitMarker(part3, 'LIST', parseListBlock)) {
          if (typeof part4 !== 'string') {
            out.push(part4);
            continue;
          }
          // a paragraph that is nothing but a figure becomes a figure block
          const trimmed = part4.trim();
          const only = /^\[FIGURE(?::\s*([^\]]*))?\]$/.exec(trimmed);
          if (only) {
            out.push({ kind: 'figure', caption: only[1]?.trim() || null });
            continue;
          }
          pushParagraphs(part4.replace(FIGURE_INLINE, '†figure†'), out);
        }
      }
    }
  }
  return out;
}

/** Conservative estimate of how many text lines these blocks occupy at `cols` characters wide. */
export function estimateLines(blocks: readonly RichBlock[], cols = 68): number {
  const wrap = (s: string) => Math.max(1, Math.ceil(s.length / cols));
  let n = 0;
  for (const b of blocks) {
    switch (b.kind) {
      case 'para':
        n += b.text.split('\n').reduce((a, l) => a + wrap(l), 0);
        break;
      case 'bullets':
        n += b.items.reduce((a, i) => a + wrap(i), 0);
        break;
      case 'parts':
        n += b.items.reduce((a, i) => a + wrap(i.text), 0);
        break;
      case 'data':
        n += wrap(b.values.join(', ')) + (b.label ? 1 : 0);
        break;
      case 'table':
        n += Math.min(b.rows.length, 12) + (b.head ? 1 : 0) + (b.caption ? 1 : 0);
        break;
      case 'figure':
        n += 1;
        break;
    }
  }
  return n;
}

/** Flatten to one readable line — for the mistake log, titles and accessible labels. */
export function plainText(blocks: readonly RichBlock[], max = 240): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.kind) {
      case 'para':
        parts.push(b.text.replace(/\n/g, ' '));
        break;
      case 'bullets':
        parts.push(b.items.join('; '));
        break;
      case 'parts':
        parts.push(b.items.map((i) => `${i.label}. ${i.text}`).join('; '));
        break;
      case 'data':
        parts.push(`${b.label ? `${b.label} ` : ''}${b.values.join(', ')}`);
        break;
      case 'table':
        parts.push(b.caption ?? `table of ${b.rows.length} rows`);
        break;
      case 'figure':
        parts.push(b.caption ?? 'figure');
        break;
    }
  }
  const joined = parts.join(' ').replace(/\s+/g, ' ').replace(/†figure†/g, '').trim();
  return joined.length > max ? `${joined.slice(0, max - 1).trimEnd()}…` : joined;
}
