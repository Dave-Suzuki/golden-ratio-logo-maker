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
/** Does this fragment carry any of the importer's block markers? */
const HAS_MARKER = /\[(TABLE|DATA|LIST|PARTS)\]/;

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
function parseDataBlock(inner: string): RichBlock {
  const values = inner
    .split(',')
    .map((v) => stripAnd(v))
    .filter(Boolean);
  return { kind: 'data', label: null, values };
}

/**
 * Remove a marker that has no partner inside this fragment. The importer can emit a doubled
 * "[/PARTS]", and a closer with nothing to close cannot be rendered — it would print as itself.
 * Markers that do pair up are left alone, because something nested renders them.
 */
function dropUnmatched(text: string): string {
  return text.replace(/\[\/?(TABLE|DATA|PARTS|LIST)\]/g, (tag, name: string) => {
    const opens = text.split(`[${name}]`).length - 1;
    const closes = text.split(`[/${name}]`).length - 1;
    if (opens === closes) return tag;
    return tag.startsWith('[/') ? (closes > opens ? '' : tag) : opens > closes ? '' : tag;
  });
}

function parseListBlock(inner: string): RichBlock {
  const items = inner.split('\n').map((l) => dropUnmatched(l.trim())).filter(Boolean);
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
  // only once each item is whole: a half-built item looks unbalanced while its block is still open
  return { kind: 'parts', items: items.map((i) => ({ ...i, text: dropUnmatched(i.text) })) };
}

/**
 * The importer's block markers, and how to turn each one into a block.
 *
 * These nest: a list item can hold a part list, and a part can hold a table. Splitting on one
 * marker at a time left the other's opener in one fragment and its closer in another, so neither
 * matched and both printed literally — and a table whose rows were split that way arrived as one
 * row wider than the page. So the text is walked once, taking whichever block opens first and
 * finding its own matching close, counting depth so an inner block of the same kind cannot end
 * the outer one.
 */
const BLOCK_MAKERS: Record<string, (inner: string) => RichBlock | RichBlock[]> = {
  TABLE: parseTable,
  DATA: parseDataBlock,
  PARTS: parsePartsBlock,
  LIST: parseListBlock,
};
const OPEN_ANY = /\[(TABLE|DATA|PARTS|LIST)\]/;
/** A marker with no partner. It cannot be rendered, and must never reach the page as text. */
const STRAY_MARKER = /\[\/?(TABLE|DATA|PARTS|LIST)\]/g;

interface FoundBlock {
  name: string;
  start: number;
  inner: string;
  end: number;
}

/** The first block in `text` whose close can be found, honouring nesting of its own kind. */
function findBlock(text: string): FoundBlock | null {
  const m = OPEN_ANY.exec(text);
  if (!m) return null;
  const name = m[1] as string;
  const open = `[${name}]`;
  const close = `[/${name}]`;
  let depth = 1;
  let i = m.index + open.length;
  const innerStart = i;
  while (i < text.length) {
    const nextOpen = text.indexOf(open, i);
    const nextClose = text.indexOf(close, i);
    if (nextClose === -1) return null; // unbalanced; handled as plain text below
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + open.length;
      continue;
    }
    depth -= 1;
    i = nextClose + close.length;
    if (depth === 0) return { name, start: m.index, inner: text.slice(innerStart, nextClose), end: i };
  }
  return null;
}

/** Text outside any block: paragraphs, bullet runs and figures. */
function pushPlain(text: string, out: RichBlock[]): void {
  const cleaned = text.replace(STRAY_MARKER, '');
  const trimmed = cleaned.trim();
  if (!trimmed) return;
  const only = /^\[FIGURE(?::\s*([^\]]*))?\]$/.exec(trimmed);
  if (only) {
    out.push({ kind: 'figure', caption: only[1]?.trim() || null });
    return;
  }
  pushParagraphs(cleaned.replace(FIGURE_INLINE, '\u2020figure\u2020'), out);
}

/** Parse question text into renderable blocks. */
export function parseRich(text: string): RichBlock[] {
  const out: RichBlock[] = [];
  let rest = text ?? '';
  for (let found = findBlock(rest); found; found = findBlock(rest)) {
    pushPlain(rest.slice(0, found.start), out);
    const made = (BLOCK_MAKERS[found.name] as (inner: string) => RichBlock | RichBlock[])(found.inner);
    out.push(...(Array.isArray(made) ? made : [made]));
    rest = rest.slice(found.end);
  }
  pushPlain(rest, out);
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
        // a part may hold a whole table; count what it renders as, not its markup
        n += b.items.reduce((a, i) => a + (HAS_MARKER.test(i.text) ? estimateLines(parseRich(i.text), cols) : wrap(i.text)), 0);
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
        parts.push(b.items.map((i) => (HAS_MARKER.test(i) ? plainText(parseRich(i), max) : i)).join('; '));
        break;
      case 'parts':
        parts.push(b.items.map((i) => `${i.label}. ${plainText(parseRich(i.text), max)}`).join('; '));
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
