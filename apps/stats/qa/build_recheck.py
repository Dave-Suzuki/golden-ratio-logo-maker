#!/usr/bin/env python3
"""Rebuild audit batches for a subset of ids, against the CURRENT rendering.

The first audit judged the bank as it stood. Repairing the importer changes the text of some of
those questions, so a verdict from the first pass is evidence about the old wording, not the new.
This regenerates batches for the ids given, so the re-check reads what the learner would read now.

  python3 qa/build_recheck.py broken   -> every id the audit rejected
  python3 qa/build_recheck.py sample N -> N ids the audit passed, for a false-pass estimate
"""
import glob, json, os, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = 35


def verdicts():
    out = {}
    for f in sorted(glob.glob(os.path.join(HERE, 'results', '*.jsonl'))):
        for line in open(f, encoding='utf8'):
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            d['_batch'] = os.path.basename(f)[5:7]
            out[d['id']] = d
    return out


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'broken'
    shown = {q['id']: q for q in json.load(open(os.path.join(HERE, 'questions.json'), encoding='utf8'))}
    v = verdicts()

    if mode == 'suspect':
        # Batches whose file was overwritten by a re-export while their auditor was still reading
        # it. Their pass verdicts describe an unknown mixture of old and new text, so they are
        # simply re-run rather than trusted.
        want = set(sys.argv[2].split(','))
        ids = sorted(i for i, d in v.items() if d.get('verdict') == 'ok' and i in shown and d.get('_batch') in want)
        out_dir = os.path.join(HERE, 'recheck-suspect')
    elif mode == 'sample':
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 80
        skip = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else set()
        ids = sorted(i for i, d in v.items() if d.get('verdict') == 'ok' and i in shown and d.get('_batch') not in skip)
        random.Random(11).shuffle(ids)
        ids, out_dir = ids[:n], os.path.join(HERE, 'recheck-sample')
    else:
        ids = sorted(i for i, d in v.items() if d.get('verdict') != 'ok' and i in shown)
        out_dir = os.path.join(HERE, 'recheck')

    os.makedirs(out_dir, exist_ok=True)
    for f in glob.glob(os.path.join(out_dir, '*.json')):
        os.remove(f)
    items = [shown[i] for i in ids]
    for b in range((len(items) + SIZE - 1) // SIZE):
        path = os.path.join(out_dir, f'batch{b + 1:02d}.json')
        json.dump(items[b * SIZE:(b + 1) * SIZE], open(path, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
    print(f'{mode}: {len(items)} questions -> {(len(items) + SIZE - 1) // SIZE} batches in {out_dir}')


if __name__ == '__main__':
    main()
