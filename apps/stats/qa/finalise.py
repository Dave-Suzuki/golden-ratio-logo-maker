#!/usr/bin/env python3
"""Turn the audit verdicts into content/suppressed.json.

A question is hidden when the last auditor to read it — reading the text the app shows now —
could not answer it or found the stored answer wrong. Later passes override earlier ones, because
the earlier pass judged wording that has since been repaired.
"""
import glob, json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)


def read(pattern):
    out = {}
    for f in sorted(glob.glob(pattern)):
        for line in open(f, encoding='utf8'):
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if 'id' in d:
                out[d['id']] = d
    return out


first = read(os.path.join(HERE, 'results', '*.jsonl'))
again = read(os.path.join(HERE, 'recheck-results', '*.jsonl'))

final = dict(first)
final.update(again)

shown = {q['id'] for q in json.load(open(os.path.join(HERE, 'questions.json'), encoding='utf8'))}
suppressed, kept = {}, 0
issues = Counter()
for qid, d in sorted(final.items()):
    if qid not in shown:
        continue
    if d.get('verdict') == 'ok':
        kept += 1
        continue
    issue = d.get('issue', 'failed the audit')
    note = (d.get('note') or '').strip()
    suppressed[qid] = f'{issue}: {note}' if note else issue
    issues[issue] += 1

json.dump(suppressed, open(os.path.join(APP, 'content', 'suppressed.json'), 'w', encoding='utf8'),
          indent=1, sort_keys=True, ensure_ascii=False)

recovered = sum(1 for i, d in again.items() if d.get('verdict') == 'ok' and first.get(i, {}).get('verdict') != 'ok')
missed = sum(1 for i, d in again.items() if d.get('verdict') != 'ok' and first.get(i, {}).get('verdict') == 'ok')
rechecked_ok = sum(1 for i, d in again.items() if first.get(i, {}).get('verdict') == 'ok')

print(f'shown {len(shown)}  judged {len([i for i in final if i in shown])}')
print(f'kept {kept}   suppressed {len(suppressed)}')
print(f'repairs recovered {recovered} questions that had failed')
print(f'second opinion on {rechecked_ok} passes found {missed} the first pass let through'
      f' ({missed / rechecked_ok * 100:.1f}%)' if rechecked_ok else '')
for k, v in issues.most_common():
    print(f'  {v:4}  {k}')
