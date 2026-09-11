#!/usr/bin/env python3
"""Import extra practice sources into apps/stats/content/extra/*.json (same Question shape as content/bank).

Sources are text files under content/sources/extra/ with a small JSON front-matter block on the first line, e.g.
  {"source": "deanza", "format": "exam-mc", "title": "De Anza Math 10 Exam 1 Spring 2015 (Bloom)", "chapters": [1,2,3],
   "license": "All rights reserved — instructor material, private study use only", "url": "https://www.deanza.edu/..."}
Files without front-matter fall back to the FALLBACK_META table below (keyed by filename).

Formats
  exam-mc              De Anza-style multiple-choice exams: "N." stems, "A." … "D." options, "Questions X-Y refer to the
                       following:" shared contexts, "FORM A"/"FORM B" halves, key table "n A B" on the last page.
  pressbooks-practice  Virginia Tech "Significant Statistics" Extra Practice chapters (numbered exercises + answers).
                       Text is produced by --fetch (HTML → text) or by uploading a print-to-PDF/text export.

Usage
  python3 scripts/ingest_extra.py                 # (re)build content/extra from content/sources/extra
  python3 scripts/ingest_extra.py --fetch         # also download the VT Extra Practice chapters (needs network access to
                                                  #  pressbooks.lib.vt.edu) into content/sources/extra/vt-chNN.txt
  python3 scripts/ingest_extra.py --pdf file.pdf  # convert an uploaded PDF to text first (needs `pip install pypdf`)
"""
import json, os, re, sys, html, urllib.request
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
SRC = os.path.join(APP, 'content', 'sources', 'extra')
OUT = os.path.join(APP, 'content', 'extra')
sys.path.insert(0, HERE)
from ingest_openstax import guess_section, classify, make_question  # noqa: E402

FALLBACK_META = {
    'deanza-exam1-spring2015.txt': {
        'source': 'deanza', 'format': 'exam-mc', 'title': 'De Anza College Math 10 — Exam 1 practice, Spring 2015 (R. Bloom)',
        'chapters': [1, 2, 3], 'license': 'All rights reserved (instructor material). Private study use only; not for redistribution.',
        'url': 'https://www.deanza.edu/faculty/bloomroberta/documents/math10/practice-exams/Exam1Spring%202015Math10ExamPractice.pdf'},
}
VT_URL = 'https://pressbooks.lib.vt.edu/significantstatistics/chapter/chapter-{n}-extra-practice/'


# ----------------------------------------------------------------------------- exam-mc (De Anza)
OPT_RE = re.compile(r'(?:^|(?<=\s))([A-E])(?:\.\s*|\s{2,}|\s(?=[\d$(]))')
QNUM_RE = re.compile(r'^\s*(\d{1,2})\.\s+(.*)$')
CTX_RE = re.compile(r'^\s*Questions?\s+(\d+)\s*-+\s*(\d+)\s+refer to the following', re.I)


def parse_exam_mc(text, meta):
    forms = re.split(r'\n(?=[^\n]*FORM B\b)', text, maxsplit=1)
    key_m = re.search(r'Form A\s+Form B\s*\n((?:\s*\d+\s+[A-E]\s+[A-E]\s*\n?)+)', text)
    keys = {'A': {}, 'B': {}}
    if key_m:
        for n, a, b in re.findall(r'(\d+)\s+([A-E])\s+([A-E])', key_m.group(1)):
            keys['A'][int(n)], keys['B'][int(n)] = a, b
    questions = []
    for form, chunk in zip(('A', 'B'), forms):
        chunk = chunk.split('Form A\nForm B')[0] if 'Form A\nForm B' in chunk else chunk
        chunk = re.sub(r'=====PAGE=====', '\n', chunk)
        lines = chunk.split('\n')
        ctx, ctx_range, cur = None, None, None
        items = []

        def flush():
            if cur:
                items.append(cur)

        i = 0
        while i < len(lines):
            l = lines[i].rstrip()
            m = CTX_RE.match(l)
            if m:
                flush(); cur = None
                ctx_range = (int(m.group(1)), int(m.group(2)))
                buf = []
                i += 1
                while i < len(lines) and not QNUM_RE.match(lines[i]):
                    buf.append(lines[i].rstrip())
                    i += 1
                ctx = '\n'.join(x for x in buf if x.strip()).strip()
                continue
            m = QNUM_RE.match(l)
            if m and (cur is None or int(m.group(1)) == cur['n'] + 1):
                flush()
                n = int(m.group(1))
                cur = {'n': n, 'lines': [m.group(2)], 'context': ctx if ctx_range and ctx_range[0] <= n <= ctx_range[1] else None}
                i += 1
                continue
            if cur is not None:
                cur['lines'].append(l)
            i += 1
        flush()
        for it in items:
            body = '\n'.join(x for x in it['lines'] if x.strip())
            if 'Form A' in body and 'Form B' in body:
                body = body.split('Form A')[0]
            body = re.split(r'\n\s*Hint\b', body)[0]
            parts = OPT_RE.split(body)
            stem = parts[0].strip()
            options = []
            for j in range(1, len(parts) - 1, 2):
                options.append(re.sub(r'\s+', ' ', parts[j + 1]).strip().rstrip(','))
            letter = keys[form].get(it['n'])
            if not letter or len(options) < 2:
                continue
            if any(re.search(r'[\u0b00-\u0b7f\ue000-\uf8ff\ufffd]', o) for o in options):
                print(f'  skip {form}{it["n"]}: options contain unreadable math glyphs (transcribe by hand in overrides)')
                continue
            idx = ord(letter) - 65
            if idx >= len(options):
                continue
            sid = guess_section(stem + ' ' + (it['context'] or ''), meta.get('chapters'))
            q = make_question(f"{meta['source']}-{meta.get('slug', 'exam')}-{form}{it['n']}", sid, 'mc',
                              {'options': options, 'correctIndex': idx,
                               'needsFigure': bool(re.search(r'boxplot|graph below|histogram below|shown below', stem + ' ' + (it['context'] or ''), re.I))},
                              stem, it['context'], letter, meta['source'], {'test': meta['title'], 'form': form, 'n': it['n']})
            q['license'] = meta['license']
            questions.append(q)
    return questions


# ----------------------------------------------------------------------------- pressbooks-practice (VT)
def html_to_text(h):
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S | re.I)
    main = re.search(r'<div[^>]+class="[^"]*\bentry-content\b[^"]*"[^>]*>(.*)', h, flags=re.S)
    body = main.group(1) if main else h
    body = re.sub(r'<(br|/p|/div|/li|/h\d|/tr)\b[^>]*>', '\n', body, flags=re.I)
    body = re.sub(r'<(td|th)\b[^>]*>', ' | ', body, flags=re.I)
    body = re.sub(r'<[^>]+>', '', body)
    body = html.unescape(body)
    body = re.sub(r'[ \t]+', ' ', body)
    body = re.sub(r'\n\s*\n+', '\n\n', body)
    return body.strip()


def fetch_vt():
    os.makedirs(SRC, exist_ok=True)
    for n in range(1, 14):
        dest = os.path.join(SRC, f'vt-ch{n:02d}.txt')
        if os.path.exists(dest):
            continue
        url = VT_URL.format(n=n)
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                h = r.read().decode('utf8', 'replace')
        except Exception as e:  # noqa: BLE001
            print(f'  skip chapter {n}: {e}')
            continue
        meta = {'source': 'vt', 'format': 'pressbooks-practice', 'title': f'Significant Statistics — Chapter {n} Extra Practice (Virginia Tech)',
                'chapters': [n], 'license': 'CC BY-SA 4.0', 'url': url}
        open(dest, 'w', encoding='utf8').write(json.dumps(meta) + '\n' + html_to_text(h))
        print(f'  fetched chapter {n}')


NUMQ_RE = re.compile(r'^\s*(\d{1,3})[.)]\s+(.*)$')


def parse_pressbooks(text, meta):
    """Numbered exercises; an 'Answer'/'Solution' block (or a trailing 'Answers' list) supplies solutions."""
    text = re.sub(r'\r', '', text)
    ans_split = re.split(r'\n\s*(?:Answers?|Solutions?)(?: to (?:the )?(?:extra )?practice(?: exercises)?)?\s*\n', text, maxsplit=1, flags=re.I)
    qtext, atext = (ans_split + [''])[:2]

    def numbered(block):
        out, cur = [], None
        for l in block.split('\n'):
            m = NUMQ_RE.match(l)
            if m and (cur is None or int(m.group(1)) == cur['n'] + 1):
                if cur: out.append(cur)
                cur = {'n': int(m.group(1)), 'lines': [m.group(2)]}
            elif cur is not None:
                cur['lines'].append(l)
        if cur: out.append(cur)
        for it in out:
            it['text'] = '\n'.join(x.rstrip() for x in it['lines']).strip()
        return out

    qs, ans = numbered(qtext), {a['n']: a['text'] for a in numbered(atext)}
    questions = []
    for it in qs:
        body = it['text']
        # inline "Answer:" inside the exercise
        sol = ans.get(it['n'])
        m = re.search(r'\n\s*(?:Answer|Solution)s?:?\s*(.*)$', body, flags=re.S | re.I)
        if m and not sol:
            sol, body = m.group(1).strip(), body[:m.start()].strip()
        if not sol:
            continue
        opts = None
        parts = re.split(r'\n\s*\(?([a-e])[.)]\s+', '\n' + body)
        if len(parts) >= 5:
            stem = parts[0].strip()
            opts = [re.sub(r'\s+', ' ', parts[j + 1]).strip() for j in range(1, len(parts) - 1, 2)]
        else:
            stem = body
        chapter = meta['chapters'][0]
        sid = guess_section(stem, [chapter])
        kind, fields = classify(stem, stem if opts else None, opts, sol, None)
        if not kind:
            continue
        q = make_question(f"{meta['source']}-ch{chapter:02d}-{it['n']}", sid, kind, fields, stem, None, sol, meta['source'],
                          {'test': meta['title'], 'n': it['n']})
        q['license'] = meta['license']
        q['chapter'] = chapter
        questions.append(q)
    return questions


# ----------------------------------------------------------------------------- main
def load_source(path):
    text = open(path, encoding='utf8').read()
    first, _, rest = text.partition('\n')
    meta = None
    if first.strip().startswith('{'):
        try:
            meta = json.loads(first)
            text = rest
        except json.JSONDecodeError:
            meta = None
    if meta is None:
        meta = FALLBACK_META.get(os.path.basename(path))
    if meta is None:
        print(f'  no metadata for {path}; skipped')
        return None, None
    slug = re.sub(r'\W+', '-', os.path.splitext(os.path.basename(path))[0])
    meta.setdefault('slug', re.sub(rf"^{re.escape(meta['source'])}-", '', slug))
    return meta, text


def main():
    if '--pdf' in sys.argv:
        import pypdf  # type: ignore
        pdf = sys.argv[sys.argv.index('--pdf') + 1]
        r = pypdf.PdfReader(pdf)
        txt = '\n\n=====PAGE=====\n\n'.join((p.extract_text() or '') for p in r.pages)
        dest = os.path.join(SRC, os.path.splitext(os.path.basename(pdf))[0].lower().replace(' ', '-') + '.txt')
        open(dest, 'w', encoding='utf8').write(txt)
        print('wrote', dest)
    if '--fetch' in sys.argv:
        fetch_vt()
    os.makedirs(OUT, exist_ok=True)
    by_source = OrderedDict()
    for f in sorted(os.listdir(SRC)) if os.path.isdir(SRC) else []:
        if not f.endswith('.txt'):
            continue
        meta, text = load_source(os.path.join(SRC, f))
        if meta is None:
            continue
        if meta['format'] == 'exam-mc':
            qs = parse_exam_mc(text, meta)
        elif meta['format'] == 'pressbooks-practice':
            qs = parse_pressbooks(text, meta)
        else:
            print(f'  unknown format {meta["format"]} for {f}')
            continue
        entry = by_source.setdefault(meta['source'], {'source': meta['source'], 'license': meta['license'], 'sets': []})
        entry['sets'].append({'title': meta['title'], 'url': meta.get('url'), 'chapters': meta.get('chapters'), 'count': len(qs)})
        entry.setdefault('questions', []).extend(qs)
        print(f'{f}: {len(qs)} questions ({sum(1 for q in qs if q["sectionId"])} with a section guess)')
    for src, entry in by_source.items():
        json.dump(entry, open(os.path.join(OUT, f'{src}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump({s: {'license': e['license'], 'sets': e['sets']} for s, e in by_source.items()},
              open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
