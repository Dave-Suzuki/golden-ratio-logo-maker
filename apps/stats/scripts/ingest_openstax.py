#!/usr/bin/env python3
"""Ingest OpenStax *Introductory Statistics 2e* (CC BY 4.0) into apps/stats/content.

Sources
  - OpenStax book source (CNXML): github.com/openstax/osbooks-introductory-statistics-bundle
  - content/sources/tryit-answers.txt   (OpenStax "Try It" answer guide, CC BY 4.0)
  - content/sources/lecture-notes.txt   (Skipper et al., Lecture Notes for OpenStax Introductory Statistics, CC BY 4.0)

Outputs (all committed, the app never fetches at runtime)
  content/openstax/chNN.json            raw parsed sections (try its, practice, homework, summary, formula review, glossary)
  content/openstax/practice-tests.json  Appendix B practice tests 1-4 (+ final exams, review exercises)
  content/notes/chNN.json               lecture notes split per OpenStax section
  content/bank/chNN.json                classified, quiz-ready Question[] (mc | numeric | fill | tf | open)
  content/bank/index.json               per-section counts by kind
  content/ATTRIBUTION.md, content/openstax/sources.json

Usage:  python3 scripts/ingest_openstax.py [--fetch]   (stdlib only; --fetch refreshes scripts/.cache from GitHub)
"""
import json, re, os, sys, difflib, urllib.request, datetime
import xml.etree.ElementTree as ET
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
CACHE = os.path.join(HERE, '.cache')
MOD = os.path.join(CACHE, 'modules')
CONTENT = os.path.join(APP, 'content')
RAW = 'https://raw.githubusercontent.com/openstax/osbooks-introductory-statistics-bundle/main'
C = '{http://cnx.rice.edu/cnxml}'
M = '{http://www.w3.org/1998/Math/MathML}'
NS = {'md': 'http://cnx.rice.edu/mdml'}


# ----------------------------------------------------------------------------- fetch
def fetch(url, dest):
    if os.path.exists(dest):
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as r:
        open(dest, 'wb').write(r.read())


def ensure_sources(force=False):
    if force:
        import shutil
        shutil.rmtree(CACHE, ignore_errors=True)
    fetch(f'{RAW}/META-INF/books.xml', os.path.join(CACHE, 'books.xml'))
    coll = os.path.join(CACHE, 'introductory-statistics-2e.collection.xml')
    fetch(f'{RAW}/collections/introductory-statistics-2e.collection.xml', coll)
    ids = re.findall(r'document="(m\d+)"', open(coll, encoding='utf8').read())
    for mid in ids:
        fetch(f'{RAW}/modules/{mid}/index.cnxml', os.path.join(MOD, f'{mid}.cnxml'))
    return coll


# ----------------------------------------------------------------------------- CNXML → text
def uncomment_solutions(xml):
    return re.sub(r'<!--\s*(<solution\b.*?</solution>)\s*-->', r'\1', xml, flags=re.S)


def math_to_text(el):
    tag = el.tag.replace(M, '')
    kids = list(el)
    join = lambda ch: ''.join(math_to_text(k) for k in ch)
    if tag in ('math', 'mrow', 'mstyle', 'semantics', 'mpadded', 'mphantom', 'mtd'):
        return join(kids)
    if tag in ('mi', 'mn', 'mo', 'mtext', 'ms'):
        return el.text or ''
    if tag == 'mfrac':
        a = math_to_text(kids[0]) if kids else ''
        b = math_to_text(kids[1]) if len(kids) > 1 else ''
        a2 = a if re.fullmatch(r'[\w.−–-]+', a) else f'({a})'
        b2 = b if re.fullmatch(r'[\w.−–-]+', b) else f'({b})'
        return f'{a2}/{b2}'
    if tag == 'msup':
        base, sup = math_to_text(kids[0]), math_to_text(kids[1])
        return f'{base}^{sup}' if len(sup) <= 2 else f'{base}^({sup})'
    if tag == 'msub':
        base, sub = math_to_text(kids[0]), math_to_text(kids[1])
        return f'{base}_{sub}' if len(sub) <= 2 else f'{base}_({sub})'
    if tag == 'msubsup':
        return f'{math_to_text(kids[0])}_{math_to_text(kids[1])}^{math_to_text(kids[2])}'
    if tag == 'msqrt':
        return f'√({join(kids)})'
    if tag == 'mroot':
        return f'root{math_to_text(kids[1])}({math_to_text(kids[0])})'
    if tag == 'mover':
        base, over = math_to_text(kids[0]), math_to_text(kids[1])
        if over in ('¯', '‾', '_', '-', '―', '—', '¯'):
            return base + '̄'
        if over in ('^', 'ˆ'):
            return base + '̂'
        return f'{base}[{over}]'
    if tag == 'munder':
        return f'{math_to_text(kids[0])}_{{{math_to_text(kids[1])}}}'
    if tag == 'munderover':
        return f'{math_to_text(kids[0])}_{{{math_to_text(kids[1])}}}^{{{math_to_text(kids[2])}}}'
    if tag == 'mtable':
        return ' ; '.join(math_to_text(r) for r in kids)
    if tag in ('mtr', 'mlabeledtr'):
        return ' '.join(math_to_text(c) for c in kids)
    if tag == 'mfenced':
        return '(' + join(kids) + ')'
    if tag == 'mspace':
        return ' '
    if tag == 'annotation':
        return ''
    return join(kids)


ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']

SCALAR_RE = re.compile(r'^[−–\-+$]?\d[\d,]*(?:\.\d+)?\s*%?$|^[−–\-+]?\.\d+$')


def is_scalar(t):
    """True for a data value (a number, optionally signed/%-suffixed, or a very short token)."""
    t = t.strip()
    return bool(t) and len(t) <= 14 and bool(SCALAR_RE.match(t))


LINK_KINDS = {}


def link_phrase(target_id):
    kind = LINK_KINDS.get(target_id, 'table')
    return {'table': 'the table below', 'figure': 'the figure below', 'media': 'the figure below',
            'example': 'the example above', 'exercise': 'the exercise above',
            'equation': 'the equation above', 'note': 'the note above'}.get(kind, 'the table below')


def text_of(el):
    out = []

    def walk(e):
        if e.tag.startswith(M):
            out.append(math_to_text(e))
            if e.tail: out.append(e.tail)
            return
        tag = e.tag.replace(C, '')
        if tag == 'list':
            style, ltype = e.get('number-style', ''), e.get('list-type', '')
            texts = []
            for it in (k for k in e if k.tag == C + 'item'):
                sub = []
                if it.text: sub.append(it.text)
                for k in it:
                    sub.append(text_of(k) if k.tag.startswith(C) or k.tag.startswith(M) else '')
                texts.append(re.sub(r'\s+', ' ', ''.join(sub)).strip())
            # A list of short scalars is a data set, not prose: emit it on ONE line so 40 values
            # do not become 40 rendered lines. See content/README of the renderer for the markers.
            if len(texts) >= 3 and all(is_scalar(t) for t in texts):
                out.append('\n[DATA]' + ', '.join(texts) + '[/DATA]\n')
                if e.tail: out.append(e.tail)
                return
            marker = 'PARTS' if ltype == 'enumerated' else 'LIST'
            out.append('\n[' + marker + ']\n')
            for i, t in enumerate(texts):
                if ltype == 'enumerated':
                    lab = {'lower-alpha': chr(97 + i) + '.', 'upper-alpha': chr(65 + i) + '.',
                           'lower-roman': ROMAN[i] + '.' if i < 10 else f'{i+1}.',
                           'upper-roman': ROMAN[i].upper() + '.' if i < 10 else f'{i+1}.'}.get(style, f'{i+1}.')
                    out.append(f'{lab} {t}\n')
                else:
                    out.append(f'{t}\n')
            out.append('[/' + marker + ']\n')
            if e.tail: out.append(e.tail)
            return
        if tag == 'table':
            rows = []
            for row in e.iter(C + 'row'):
                rows.append([text_of(entry).strip() for entry in row.findall(C + 'entry')])
            out.append('\n[TABLE]\n' + '\n'.join(' | '.join(r) for r in rows) + '\n[/TABLE]\n')
            if e.tail: out.append(e.tail)
            return
        if tag in ('media', 'figure'):
            cap = e.find(C + 'caption')
            out.append('[FIGURE' + (': ' + text_of(cap).strip() if cap is not None else '') + ']')
            if e.tail: out.append(e.tail)
            return
        if tag == 'link':
            out.append(link_phrase(e.get('target-id')))
            if e.tail: out.append(e.tail)
            return
        if tag == 'newline':
            out.append('\n')
            if e.tail: out.append(e.tail)
            return
        if tag == 'label':
            if e.tail: out.append(e.tail)
            return
        block = tag in ('para', 'equation', 'title', 'quote')
        if block: out.append('\n')
        if e.text: out.append(e.text)
        for k in e: walk(k)
        if block: out.append('\n')
        if e.tail: out.append(e.tail)

    walk(el)
    s = ''.join(out)
    s = s.replace(' ', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r' *\n *', '\n', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def inner_text(el):
    return text_of(el) if el is not None else ''


SUBQ_PREFIXES = ('find ', 'what ', 'in words', 'which ', 'construct ', 'calculate ', 'state ', 'explain ', 'why ', 'how ',
                 'is ', 'are ', 'define ', 'draw ', 'sketch ', 'graph ', 'interpret ', 'compare ', 'complete ', 'identify ',
                 'if ', 'suppose ', 'determine ', 'list ', 'give ', 'write ', 'describe ', 'estimate ', 'use ', 'does ',
                 'do ', 'can ', 'would ', 'should ', 'based on', 'let ', 'name ', 'discuss ', 'show ')


def content_words(t):
    return set(re.findall(r"[a-z][a-z']{2,}", (t or '').lower()))


NUMBER_WORDS = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
                'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12}
SCOPE_RE = re.compile(r'(?:answer|use for|refer to)\D{0,20}?the next (\w+)\s+(?:exercise|question|problem)', re.I)
OPENER_RE = re.compile(r'^\s*use the following|following information', re.I)
# An instruction that introduces sub-parts ("Determine what the key terms refer to…") belongs to the
# QUESTION, not to the shared scenario; otherwise the stem is left as a bare label like "population".
INSTRUCTION_RE = re.compile(
    r'^\s*(determine|identify|find|calculate|state|complete|construct|fill in|match|classify|name|list|give)\b', re.I)


class ContextScope:
    """Tracks which shared scenario (if any) legitimately applies to the next exercise.

    OpenStax writes "Use the following information to answer the next three exercises." — the block
    applies to exactly that many exercises and no further. The previous importer kept it attached
    until the next such block appeared, which pasted unrelated scenarios onto hundreds of questions.
    """

    def __init__(self):
        self.text = None
        self.remaining = 0
        self.lead = None   # instruction paragraph that belongs to each following stem
        self.group = []    # exercises awaiting the finished scenario

    def flush(self):
        """Hand the finished scenario to every exercise in its scope.

        The scenario is only complete once its last block has been read, so assignment is deferred:
        assigning as we go gave the first exercise of a group a truncated copy, typically missing
        the very table it needed.
        """
        for exercise in self.group:
            if self.text:
                exercise['context'] = self.text
        self.group = []
        self.text, self.remaining, self.lead = None, 0, None

    def add_block(self, t):
        if not t or not t.strip():
            return
        if OPENER_RE.search(t[:90]):
            m = SCOPE_RE.search(t)
            n = NUMBER_WORDS.get(m.group(1).lower()) if m else None
            self.flush()
            self.text, self.remaining, self.lead = t, (n if n else 2), None
            return
        if self.text is not None and self.remaining > 0:
            # data, tables and figures that follow the opener are part of the same scenario;
            # a trailing instruction is a lead-in for the questions instead.
            if INSTRUCTION_RE.match(t) and len(t) < 300:
                self.lead = t
            else:
                self.text += '\n\n' + t
            return
        # a standalone block with no opener: treat an instruction as a lead-in, ignore the rest
        self.lead = t if (INSTRUCTION_RE.match(t) and len(t) < 300) else None

    def apply(self, exercise):
        if self.lead:
            key = 'stem' if 'stem' in exercise else 'problem'
            cur = (exercise.get(key) or '').strip()
            if len(cur) < 60 and not cur.lower().startswith(self.lead[:20].lower()):
                exercise[key] = f'{self.lead.rstrip()} — {cur}' if cur else self.lead.rstrip()
        if self.text is not None and self.remaining > 0:
            self.group.append(exercise)
            self.remaining -= 1
            if self.remaining == 0:
                self.flush()


def options_are_subparts(stem, items):
    """True when an a./b./c. list is the PARTS of the question rather than answer choices.

    "Identify the population, sample, parameter, statistic, variable, and data" followed by
    a. population / b. sample / ... is six required answers, not six choices with one winner.
    """
    sw = content_words(stem)
    if not sw:
        return False
    named = sum(1 for i in items if content_words(i) and content_words(i) <= sw)
    if named >= max(2, len(items) // 2):
        return True
    # the stem enumerates several things and then asks for all of them
    if re.search(r'\b(identify|find|state|determine|calculate|complete|construct)\b[^.?]*,[^.?]*,[^.?]*\band\b', stem, re.I):
        return True
    return False


def parse_options(problem_el):
    """Return (stem_without_list, options) if the problem has an MC-looking lower-alpha list."""
    for l in problem_el.findall('.//' + C + 'list'):
        if l.get('list-type') == 'enumerated' and l.get('number-style', '') in ('lower-alpha', 'upper-alpha'):
            items = [inner_text(i) for i in l if i.tag == C + 'item']
            looks_mc = 2 <= len(items) <= 6 and all(
                len(i.strip()) >= 2 and len(i) <= 160 and '\n' not in i and '____' not in i and not i.rstrip().endswith('?')
                and not i.lower().startswith(SUBQ_PREFIXES) for i in items)
            if not looks_mc or len({i.strip().lower() for i in items}) != len(items):
                continue
            clone = ET.fromstring(ET.tostring(problem_el))
            parent = {c: p for p in clone.iter() for c in p}
            for ll in list(clone.iter(C + 'list')):
                if ll.get('list-type') == 'enumerated' and ll.get('number-style', '') in ('lower-alpha', 'upper-alpha'):
                    parent[ll].remove(ll)
                    break
            stem = inner_text(clone)
            if options_are_subparts(stem, items):
                return None, None
            return stem, items
    return None, None


def parse_exercise(ex):
    prob, sol = ex.find(C + 'problem'), ex.find(C + 'solution')
    stem, options = parse_options(prob) if prob is not None else (None, None)
    d = OrderedDict(id=ex.get('id'), problem=inner_text(prob))
    if options:
        d['stem'], d['options'] = stem, options
    d['solution'] = inner_text(sol) if sol is not None else None
    return d


def parse_module(mid):
    raw = uncomment_solutions(open(os.path.join(MOD, mid + '.cnxml'), encoding='utf8').read())
    root = ET.fromstring(raw)
    LINK_KINDS.clear()
    for el in root.iter():
        if el.get('id') and el.tag.startswith(C):
            LINK_KINDS[el.get('id')] = el.tag.replace(C, '')
    title = root.find('.//md:title', NS).text
    content = root.find(C + 'content')
    d = OrderedDict(id=mid, title=title)
    tryits = []
    for note in content.iter(C + 'note'):
        if 'try' in (note.get('class') or ''):
            for ex in note.iter(C + 'exercise'):
                tryits.append(parse_exercise(ex))
    d['tryits'] = tryits
    d['examples'] = [inner_text(e) for e in content.iter(C + 'example')]

    def section_exercises(cls):
        out = []
        for sec in content.iter(C + 'section'):
            if sec.get('class') != cls:
                continue
            scope = ContextScope()
            for child in sec:
                if child.tag in (C + 'para', C + 'table', C + 'figure', C + 'list', C + 'media'):
                    scope.add_block(inner_text(child))
                elif child.tag == C + 'exercise':
                    e = parse_exercise(child)
                    scope.apply(e)
                    out.append(e)
                elif child.tag == C + 'section':
                    out.extend(parse_exercise(ex) for ex in child.iter(C + 'exercise'))
            scope.flush()
        return out

    d['practice'] = section_exercises('practice')
    d['homework'] = section_exercises('free-response')
    d['bring_together'] = section_exercises('bring-together-homework') + section_exercises('bring-together-exercises')

    def section_text(cls):
        for sec in content.iter(C + 'section'):
            if sec.get('class') == cls:
                t = inner_text(sec)
                return re.sub(r'^(Chapter Review|Formula Review|Review)\s*\n', '', t)
        return None

    d['summary'] = section_text('summary')
    d['formula_review'] = section_text('formula-review')
    d['glossary'] = [{'term': inner_text(df.find(C + 'term')), 'meaning': inner_text(df.find(C + 'meaning'))}
                     for df in root.iter(C + 'definition')]
    return d


NUM_RE = re.compile(r'^\s*(\d+)\s*\.?\s*')


def parse_numbered_paras(sec):
    items, scope = [], ContextScope()
    for child in sec:
        if child.tag not in (C + 'para', C + 'table', C + 'figure', C + 'list', C + 'media'):
            continue
        emph = child.find(C + 'emphasis') if child.tag == C + 'para' else None
        num = None
        if emph is not None and emph.text and re.fullmatch(r'\d+\.?', emph.text.strip()):
            num = int(emph.text.strip().rstrip('.'))
        if num is None:
            scope.add_block(inner_text(child))
            continue
        stem, options = parse_options(child)
        it = OrderedDict(n=num, problem=NUM_RE.sub('', inner_text(child), count=1))
        if options:
            it['stem'], it['options'] = NUM_RE.sub('', stem, count=1), options
        scope.apply(it)
        items.append(it)
    scope.flush()
    return items


def collect_numbered(sec, label=None):
    tt = sec.find(C + 'title')
    stitle = inner_text(tt) if tt is not None else ''
    m = re.match(r'(\d+\.\d+)', stitle)
    lab = m.group(1) if m else (stitle or label)
    items = []
    for it in parse_numbered_paras(sec):
        it['section'] = lab
        items.append(it)
    for sub in sec.findall(C + 'section'):
        items.extend(collect_numbered(sub, lab))
    return items


def merge_solutions(questions, solutions):
    sols = {s['n']: s['problem'] for s in solutions}
    for q in questions:
        q['solution'] = sols.get(q['n'])
    return questions


# Practice Test 4 uses an older 8-section numbering for chapter 12.
PT4_MAP = {'12.3': '12.2', '12.4': '12.3', '12.5': '12.4', '12.6': '12.4', '12.7': '12.5', '12.8': '12.6'}


def parse_practice_tests():
    root = ET.fromstring(uncomment_solutions(open(os.path.join(MOD, 'm47865.cnxml'), encoding='utf8').read()))
    content = root.find(C + 'content')
    tests = OrderedDict()
    for top in content.findall(C + 'section'):
        ttitle = inner_text(top.find(C + 'title'))
        name = ttitle.replace(' Solutions', '').strip()
        t = tests.setdefault(name, {'questions': [], 'solutions': []})
        t['solutions' if 'Solution' in ttitle else 'questions'].extend(collect_numbered(top))
    out = OrderedDict()
    for name, t in tests.items():
        qs = merge_solutions(t['questions'], t['solutions'])
        if name == 'Practice Test 4':
            for q in qs:
                q['section'] = PT4_MAP.get(q['section'], q['section'])
        out[name] = qs
    return out


def parse_review_exercises():
    root = ET.fromstring(uncomment_solutions(open(os.path.join(MOD, 'm47864.cnxml'), encoding='utf8').read()))
    content = root.find(C + 'content')
    questions, solutions = OrderedDict(), OrderedDict()
    for sec in content.findall(C + 'section'):
        tt = sec.find(C + 'title')
        stitle = inner_text(tt) if tt is not None else ''
        if stitle == 'Solutions':
            for sub in sec.findall(C + 'section'):
                st = inner_text(sub.find(C + 'title'))
                solutions[st] = collect_numbered(sub, st)
        elif stitle.startswith('Chapter'):
            questions[stitle] = collect_numbered(sec, stitle)
    return OrderedDict((ch, merge_solutions(qs, solutions.get(ch, []))) for ch, qs in questions.items())


# ----------------------------------------------------------------------------- Try It answer guide
def load_tryit_guide():
    lines = open(os.path.join(CONTENT, 'sources', 'tryit-answers.txt'), encoding='utf8').read().split('\n')
    items, cur = [], None
    for l in lines:
        m = re.match(r'^TRY IT[\s ]*(\d+)\.(\d+):?\s*$', l)
        if m:
            cur = {'ch': int(m.group(1)), 'n': int(m.group(2)), 'lines': []}
            items.append(cur)
            continue
        if cur is not None:
            cur['lines'].append(l)
    for it in items:
        txt = '\n'.join(it['lines'])
        p, _, s = txt.partition('Solution:')
        it['problem'], it['solution'] = p.strip(), s.strip()
        del it['lines']
    return items


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def merge_tryit_solutions(chapters, guide, overrides):
    """Attach guide solutions to source Try Its by chapter + text similarity; overrides win."""
    by_key = {(g['ch'], g['n']): g for g in guide}
    forced = overrides.get('tryitAlignment', {})  # "ch.n" -> {"module": "m46909", "index": 0}
    used = set()
    matched = 0
    for ch in chapters:
        srcs = [(s, i, t) for s in ch['sections'] if s.get('kind') == 'section' for i, t in enumerate(s['tryits'])]
        for (chn, n), g in by_key.items():
            if chn != ch['number']:
                continue
            key = f'{chn}.{n}'
            target = None
            if key in forced:
                f = forced[key]
                if f is None:
                    continue
                for s, i, t in srcs:
                    if s['id'] == f['module'] and i == f['index']:
                        target = t
            else:
                # short-prefix similarity decides whether it is a match; the full text breaks ties between
                # Try Its that share a long preamble (e.g. the deck-of-cards series in 3.2)
                scored = []
                for s, i, t in srcs:
                    if id(t) in used:
                        continue
                    r200 = difflib.SequenceMatcher(None, norm(g['problem'])[:200], norm(t['problem'])[:200]).ratio()
                    if r200 > 0.6:
                        r_full = difflib.SequenceMatcher(None, norm(g['problem'])[:1500], norm(t['problem'])[:1500]).ratio()
                        scored.append((r_full, r200, t))
                if scored:
                    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
                    target = scored[0][2]
            if target is not None and g['solution']:
                used.add(id(target))
                target['guideSolution'] = g['solution']
                target['guideRef'] = f'Try It {key}'
                matched += 1
    return matched


# ----------------------------------------------------------------------------- lecture notes
NOTES_MAP = {  # (chapter, section number in the notes) -> OpenStax section id
    (1, 1): '1.1', (1, 2): '1.2', (1, 3): '1.3', (1, 4): '1.4',
    (2, 1): '2.1', (2, 2): '2.2', (2, 3): '2.3', (2, 4): '2.4', (2, 5): '2.5', (2, 6): '2.6', (2, 7): '2.7',
    (3, 1): '3.1', (3, 2): '3.2', (3, 3): '3.3', (3, 4): '3.4', (3, 5): '3.5',
    (4, 1): '4.1', (4, 2): '4.2', (4, 3): '4.3',
    (5, 1): '5.1', (5, 2): '5.2',
    (6, 1): '6.1', (6, 2): '6.2',
    (7, 1): '7.1', (7, 2): '7.2', (7, 3): '7.3',
    (8, 1): '8.1', (8, 2): '8.2', (8, 3): '8.3',
    (9, 1): '9.1', (9, 2): '9.2', (9, 3): '9.3', (9, 4): '9.4', (9, 5): '9.5',
    (10, 1): '10.1', (10, 2): '10.2', (10, 3): '10.3', (10, 4): '10.4',
    (11, 1): '11.1', (11, 2): '11.2', (11, 3): '11.3',
    (12, 1): '12.2', (12, 2): '12.3', (12, 3): '12.4', (12, 4): '12.5', (12, 5): '12.6',
    (13, 1): '13.1', (13, 2): '13.4',
    (14, 1): '2.7', (14, 2): '2.7',  # Chebyshev appendix
}
HEAD_RE = re.compile(r'^(\d{1,2})\.\s+([A-Z][^\n]{2,90})$')


def split_notes():
    raw = open(os.path.join(CONTENT, 'sources', 'lecture-notes.txt'), encoding='utf8').read()
    lines = raw.split('\n')
    chapters = OrderedDict()
    ch, sec, buf, cur_title = None, None, [], None

    def flush():
        if ch is None or not buf:
            return
        text = '\n'.join(buf).strip()
        chapters.setdefault(ch, OrderedDict())[sec] = {'title': cur_title, 'text': text}

    for l in lines:
        s = l.strip()
        if s == '=====PAGE=====' or re.match(r'^Chapter \d+ Notes .* p \d+$', s) or re.match(r'^Lecture Notes for Introductory Statistics ?1?$', s) \
                or s.startswith('1These lecture notes are intended') or re.match(r'^Statistics” by Barbara Illowsky', s) or re.fullmatch(r'\d+', s) \
                or s.startswith('Daphne Skipper, Augusta University') or s.startswith('Neal Smith,') or s.startswith('Chris Terry,'):
            continue
        m = re.match(r'^CHAPTER (\d+):\s*(.*)$', s)
        if m:
            flush(); buf = []
            ch, sec, cur_title = int(m.group(1)), 0, m.group(2).title()
            continue
        if ch is None:
            continue
        m = HEAD_RE.match(s)
        if m and len(s) < 90 and not s.endswith((',', ';')) and not re.search(r'\b(you|If|pay|win)\b', m.group(2)):
            flush(); buf = []
            sec, cur_title = int(m.group(1)), m.group(2).strip()
            continue
        if s.startswith('Chebyshev') and ch == 13 and sec >= 2 and 'Theorem' in s and len(s) < 40:
            flush(); buf = []
            ch, sec, cur_title = 14, 0, 'Chebyshev’s Theorem'
            continue
        buf.append(l)
    flush()

    def clean(text):
        text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff').replace('ﬃ', 'ffi').replace('¯x', 'x̄').replace('ˆp', 'p̂')
        text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)          # re-join hyphenated line breaks
        text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)           # single newlines are soft wraps
        text = re.sub(r'[ \t]+', ' ', text)
        return re.sub(r'\n{3,}', '\n\n', text).strip()

    for chn, secs in chapters.items():
        for d in secs.values():
            d['text'] = clean(d['text'])
    out = OrderedDict()
    for chn, secs in chapters.items():
        for secno, d in secs.items():
            if secno == 0:
                sid = 'intro'
            else:
                sid = NOTES_MAP.get((chn, secno))
                if sid is None:
                    continue
            key = f'{sid}' if sid != 'intro' else f'{chn}.intro'
            entry = out.setdefault(key, {'sectionId': sid if sid != 'intro' else None, 'chapter': chn if chn != 14 else 2,
                                         'title': d['title'], 'text': ''})
            entry['text'] = (entry['text'] + '\n\n' + d['text']).strip()
    return out


# ----------------------------------------------------------------------------- classifier
NUMBER = r'[−–-]?\$?\d[\d,]*(?:\.\d+)?%?'
NUM_ONLY = re.compile(rf'^\s*(?:[A-Za-zσμ̄̂_ ]{{0,12}}[=≈]\s*)?({NUMBER})\s*(?:[a-zA-Z%]{{0,12}})?\.?\s*$')
LETTER = re.compile(r'^\s*([a-e])\s*(?:[.)\s]|$)', re.I)
YESNO = re.compile(r'^\s*(yes|no|true|false)\b', re.I)
HYP = re.compile(r'H\s*[0oO]\s*:\s*([μpσ][\w̄̂]*|μ_d)?\s*([=≠<>≤≥]|>=|<=|!=)', re.I)
HYPA = re.compile(r'H\s*[aA1]\s*:\s*([μpσ][\w̄̂]*|μ_d)?\s*([=≠<>≤≥]|>=|<=|!=)', re.I)
SYM = {'>=': '≥', '<=': '≤', '!=': '≠'}


def to_number(tok):
    t = tok.replace('$', '').replace(',', '').replace('−', '-').replace('–', '-')
    pct = t.endswith('%')
    t = t.rstrip('%')
    v = float(t)
    return v, pct, t


def classify(problem, stem, options, solution, context):
    """Return (kind, fields) for a solved item, or (None, None) if unusable in a quiz."""
    if not solution:
        return None, None
    sol = solution.strip()
    has_fig = '[FIGURE' in (problem or '') or '[FIGURE' in (context or '') or '[FIGURE' in sol
    if options:
        m = LETTER.match(sol)
        if m:
            idx = ord(m.group(1).lower()) - 97
            if idx < len(options):
                return 'mc', {'options': options, 'correctIndex': idx, 'needsFigure': has_fig}
        return 'open', {'modelSolution': sol, 'needsFigure': has_fig}
    if '____' in (problem or '') and 'H0' in problem.replace(' ', '')[:400].upper().replace('H_0', 'H0'):
        m0, ma = HYP.search(sol), HYPA.search(sol)
        if m0 and ma:
            b0, ba = SYM.get(m0.group(2), m0.group(2)), SYM.get(ma.group(2), ma.group(2))
            return 'fill', {'blanks': [{'label': 'H0', 'answer': b0}, {'label': 'Ha', 'answer': ba}],
                            'symbolSet': 'hypothesis', 'needsFigure': has_fig}
    if sol.count('\n') == 0 and NUM_ONLY.match(sol) and '[TABLE' not in sol:
        m = NUM_ONLY.match(sol)
        try:
            v, pct, t = to_number(m.group(1))
        except ValueError:
            return 'open', {'modelSolution': sol, 'needsFigure': has_fig}
        decimals = len(t.split('.')[1]) if '.' in t else 0
        abs_tol = max(0.6 * 10 ** (-decimals), 0.005) if decimals else 0.05
        return 'numeric', {'answer': v, 'tolerance': {'abs': abs_tol, 'rel': 0.01 if abs(v) < 1 else 0.005},
                           'unit': '%' if pct else None, 'needsFigure': has_fig}
    ym = YESNO.match(sol)
    if ym and (problem or '').rstrip().endswith('?'):
        return 'tf', {'answer': ym.group(1).lower() in ('yes', 'true'), 'needsFigure': has_fig}
    return 'open', {'modelSolution': sol, 'needsFigure': has_fig}


OPTION_LETTER_RE = re.compile(r'^\s*\(?([a-f])[.)]?\s*', re.I)


def useful_mc_explanation(solution, options):
    """Drop an MC "explanation" that is only the answer letter.

    The stored solution is often just "c", or "c. Iris". The correct answer is already shown, and
    the letter is meaningless once the options are shuffled -- it contradicts what the learner sees.
    """
    body = OPTION_LETTER_RE.sub('', (solution or '').strip()).strip()
    if not body:
        return []
    norm = lambda t: re.sub(r'\W+', '', (t or '').lower())
    if any(norm(body) == norm(o) for o in (options or [])):
        return []
    return [body]


def make_question(qid, section_id, kind, fields, stem, context, solution, source, source_ref):
    q = OrderedDict(id=qid, sectionId=section_id, kind=kind, conceptTag=section_id or 'unassigned',
                    stem=stem.strip(), source=source, sourceRef=source_ref)
    if context:
        q['context'] = context
    q.update(fields)
    if kind == 'mc':
        q['explanation'] = useful_mc_explanation(solution, fields.get('options'))
    elif kind == 'open':
        q['explanation'] = []
    else:
        q['explanation'] = [solution.strip()]
    return q


# Keyword rules for items without a section (final exams).
SECTION_RULES = [
    ('9.2', r'type (i|ii) error'), ('9.1', r'null hypothesis|alternative hypothesis|H_?0|H_?a\b'),
    ('9.4', r'p-value|\breject'), ('8.3', r'proportion.*confidence|confidence.*proportion|error bound.*proportion'),
    ('8.2', r"student'?s? t\b|\bt-distribution|\bt distribution|confidence.*unknown"), ('8.1', r'confidence interval|error bound|margin of error'),
    ('10.4', r'matched|paired'), ('10.3', r'two.*proportions'), ('10.1', r'two.*means|difference.*means'),
    ('11.3', r'test (of|for) independence|chi-square.*independen|independen.*chi-square'), ('11.2', r'goodness'), ('11.4', r'homogeneity'),
    ('11.6', r'single variance|variance.*test'), ('11.1', r'chi-square'),
    ('13.4', r'two variances'), ('13.1', r'anova'), ('13.2', r'f-ratio|f distribution|f-distribution'),
    ('12.4', r'significan.*correlation|correlation coefficient'), ('12.5', r'predict'), ('12.6', r'outlier'),
    ('12.3', r'regression|line of best fit|least.squares'), ('12.2', r'scatter'), ('12.1', r'slope|y-intercept|linear equation'),
    ('7.2', r'sum of|sums'), ('7.1', r'central limit|sample mean|averages'), ('6.1', r'z-score|standard normal'),
    ('6.2', r'normal(ly)? distribut'), ('5.3', r'exponential'), ('5.2', r'uniform'), ('5.1', r'continuous'),
    ('4.3', r'binomial'), ('4.4', r'geometric'), ('4.5', r'hypergeometric'), ('4.6', r'poisson'),
    ('4.2', r'expected value|standard deviation.*random variable'), ('4.1', r'probability distribution|random variable'),
    ('3.4', r'contingency|\btable\b|two-way'), ('3.5', r'tree|venn'), ('3.2', r'independent|mutually exclusive'),
    ('3.3', r'\bP\(|probability'), ('3.1', r'sample space|event'),
    ('2.4', r'box ?plot|quartile|interquartile'), ('2.7', r'standard deviation|variance|spread'), ('2.6', r'skew'),
    ('2.5', r'mean|median|mode'), ('2.3', r'percentile'), ('2.2', r'histogram|frequency polygon|time series'),
    ('2.1', r'stem|bar graph|line graph'), ('1.4', r'experiment|treatment|placebo|blind|ethic'),
    ('1.3', r'frequency|nominal|ordinal|interval|ratio'), ('1.2', r'sampl|qualitative|quantitative|discrete|continuous'),
    ('1.1', r'population|parameter|statistic|variable'),
]


def guess_section(text, chapters=None):
    """Keyword-rule section guess; `chapters` (iterable of ints) restricts candidates, e.g. review exercises for
    chapter N only cover chapters < N and an uploaded exam covers the chapters named in its metadata."""
    t = text.lower()
    allowed = set(chapters) if chapters else None
    for sid, pat in SECTION_RULES:
        if allowed is not None and int(sid.split('.')[0]) not in allowed:
            continue
        if re.search(pat, t):
            return sid
    return None


# ----------------------------------------------------------------------------- main
def main():
    force = '--fetch' in sys.argv
    coll = ensure_sources(force)
    overrides_path = os.path.join(CONTENT, 'overrides.json')
    overrides = json.load(open(overrides_path, encoding='utf8')) if os.path.exists(overrides_path) else {}
    collxml = open(coll, encoding='utf8').read()
    chapters = []
    for m in re.finditer(r'<col:subcollection>\s*<md:title>([^<]*)</md:title>(.*?)</col:subcollection>', collxml, flags=re.S):
        chapters.append((m.group(1), re.findall(r'document="(m\d+)"', m.group(2))))

    book = []
    for ci, (ctitle, mods) in enumerate(chapters, start=1):
        ch = OrderedDict(number=ci, title=ctitle, sections=[])
        secno = 0
        for mid in mods:
            d = parse_module(mid)
            if d['title'] == 'Introduction':
                d['kind'] = 'intro'
            elif d['practice'] or d['homework']:
                secno += 1
                d['kind'], d['section'] = 'section', f'{ci}.{secno}'
            else:
                d['kind'] = 'lab'
            ch['sections'].append(d)
        book.append(ch)

    guide = load_tryit_guide()
    matched = merge_tryit_solutions(book, guide, overrides)
    notes = split_notes()
    tests = parse_practice_tests()
    reviews = parse_review_exercises()
    skip = set(overrides.get('skip', []))
    fixes = overrides.get('items', {})

    os.makedirs(os.path.join(CONTENT, 'openstax'), exist_ok=True)
    os.makedirs(os.path.join(CONTENT, 'notes'), exist_ok=True)
    os.makedirs(os.path.join(CONTENT, 'bank'), exist_ok=True)
    os.makedirs(os.path.join(CONTENT, 'teach'), exist_ok=True)

    catalog = []
    index = OrderedDict()
    bank_by_chapter = OrderedDict()

    def add(chn, q):
        if q['id'] in skip:
            return
        if q['id'] in fixes:
            q.update(fixes[q['id']])
        bank_by_chapter.setdefault(chn, []).append(q)
        sid = q['sectionId'] or 'unassigned'
        idx = index.setdefault(sid, OrderedDict(mc=0, numeric=0, fill=0, tf=0, open=0, total=0))
        idx[q['kind']] += 1
        idx['total'] += 1

    for ch in book:
        chn = ch['number']
        json.dump(ch, open(os.path.join(CONTENT, 'openstax', f'ch{chn:02d}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        cat = OrderedDict(number=chn, title=ch['title'], sections=[])
        teach = []
        for s in ch['sections']:
            if s.get('kind') != 'section':
                continue
            sid = s['section']
            cat['sections'].append(OrderedDict(id=sid, title=s['title'], module=s['id']))
            n = notes.get(sid)
            teach.append(OrderedDict(sectionId=sid, title=s['title'], notesTitle=n['title'] if n else None,
                                     notesText=n['text'] if n else None, summary=s['summary'], formulaReview=s['formula_review'],
                                     glossary=s['glossary']))
            # try its
            for i, t in enumerate(s['tryits']):
                sol = t.get('solution') or t.get('guideSolution')
                if not sol:
                    continue
                stem, opts = (t.get('stem'), t.get('options'))
                kind, fields = classify(t['problem'], stem, opts, sol, None)
                if not kind:
                    continue
                add(chn, make_question(f'tryit-{s["id"]}-{i}', sid, kind, fields, stem or t['problem'], None, sol,
                                       'openstax-tryit', {'module': s['id'], 'exerciseId': t['id'], 'ref': t.get('guideRef')}))
            for group in ('practice', 'homework', 'bring_together'):
                for e in s[group]:
                    if not e.get('solution'):
                        continue
                    kind, fields = classify(e['problem'], e.get('stem'), e.get('options'), e['solution'], e.get('context'))
                    if not kind:
                        continue
                    add(chn, make_question(f'os-{s["id"]}-{e["id"]}', sid, kind, fields, e.get('stem') or e['problem'],
                                           e.get('context'), e['solution'], f'openstax-{group}',
                                           {'module': s['id'], 'exerciseId': e['id']}))
        catalog.append(cat)
        json.dump(teach, open(os.path.join(CONTENT, 'teach', f'ch{chn:02d}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        intro = notes.get(f'{chn}.intro')
        json.dump({'chapter': chn, 'intro': intro['text'] if intro else None,
                   'sections': {sid: notes[sid] for sid in [c['id'] for c in cat['sections']] if sid in notes}},
                  open(os.path.join(CONTENT, 'notes', f'ch{chn:02d}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    # practice tests, finals, review exercises
    for name, qs in tests.items():
        is_final = 'Final' in name
        tn = re.sub(r'\D', '', name) or '0'
        prefix = f'fe{tn}' if is_final else f'pt{tn}'
        for q in qs:
            if not q.get('solution'):
                continue
            sid = q['section'] if re.fullmatch(r'\d+\.\d+', q['section'] or '') else guess_section(q['problem'] + ' ' + (q.get('context') or ''))
            kind, fields = classify(q['problem'], q.get('stem'), q.get('options'), q['solution'], q.get('context'))
            if not kind:
                continue
            chn = int(sid.split('.')[0]) if sid else 0
            add(chn, make_question(f'{prefix}-{q["n"]}', sid, kind, fields, q.get('stem') or q['problem'], q.get('context'),
                                   q['solution'], 'openstax-final' if is_final else 'openstax-practice-test',
                                   {'test': name, 'n': q['n']}))
    for chname, qs in reviews.items():
        chn_rev = int(re.sub(r'\D', '', chname))
        for q in qs:
            if not q.get('solution'):
                continue
            sid = guess_section(q['problem'] + ' ' + (q.get('context') or ''), range(1, chn_rev))
            kind, fields = classify(q['problem'], q.get('stem'), q.get('options'), q['solution'], q.get('context'))
            if not kind:
                continue
            chn = int(sid.split('.')[0]) if sid else 0
            add(chn, make_question(f'rv{chn_rev}-{q["n"]}', sid, kind, fields, q.get('stem') or q['problem'], q.get('context'),
                                   q['solution'], 'openstax-review', {'test': chname, 'n': q['n']}))

    json.dump({'practiceTests': tests, 'reviewExercises': reviews},
              open(os.path.join(CONTENT, 'openstax', 'practice-tests.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    for chn, qs in bank_by_chapter.items():
        json.dump(qs, open(os.path.join(CONTENT, 'bank', f'ch{chn:02d}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(catalog, open(os.path.join(CONTENT, 'catalog.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(index, open(os.path.join(CONTENT, 'bank', 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump({'openstax': {'repo': 'https://github.com/openstax/osbooks-introductory-statistics-bundle', 'branch': 'main',
                            'book': 'introductory-statistics-2e', 'license': 'CC BY 4.0'},
               'tryItGuide': {'file': 'sources/tryit-answers.txt', 'license': 'CC BY 4.0', 'matched': matched, 'items': len(guide)},
               'lectureNotes': {'file': 'sources/lecture-notes.txt', 'license': 'CC BY 4.0',
                                'citation': 'Skipper, Smith, Scott, Payne, Terry (2017). Lecture Notes for OpenStax Introductory Statistics. GALILEO/USG.'},
               'generatedAt': datetime.date.today().isoformat()},
              open(os.path.join(CONTENT, 'openstax', 'sources.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    print(f'Try It guide: {matched}/{len(guide)} matched')
    print('section  mc num fill tf open total')
    for sid, c in index.items():
        print(f'{sid:9}{c["mc"]:3} {c["numeric"]:3} {c["fill"]:4} {c["tf"]:3} {c["open"]:4} {c["total"]:5}')
    tot = {k: sum(c[k] for c in index.values()) for k in ('mc', 'numeric', 'fill', 'tf', 'open', 'total')}
    print('TOTAL', tot)
    print('notes sections:', sorted(k for k in notes if not k.endswith('intro')))


if __name__ == '__main__':
    main()
