# Content ingestion

Python 3 (stdlib only). Run from `apps/stats`:

```sh
npm run ingest                                  # rebuild content/ from scripts/.cache + content/sources
python3 scripts/ingest_openstax.py --fetch      # refresh the OpenStax CNXML cache from GitHub first
python3 scripts/ingest_extra.py --fetch         # download Virginia Tech "Chapter N Extra Practice" pages (needs network)
python3 scripts/ingest_extra.py --pdf exam.pdf  # convert an uploaded exam PDF to text (pip install pypdf), then rebuild
```

Outputs are committed so the app runs offline:

| Path | Content |
|---|---|
| `content/catalog.json` | 13 chapters, 58 sections (OpenStax 2e numbering) |
| `content/openstax/chNN.json` | raw parsed modules: Try Its, practice, homework, summary, formula review, glossary |
| `content/openstax/practice-tests.json` | Appendix B practice tests 1–4, final exams 1–2, review exercises |
| `content/notes/chNN.json` | lecture-notes text per section |
| `content/teach/chNN.json` | per-section teaching bundle (notes + summary + formulas + glossary) |
| `content/bank/chNN.json`, `index.json` | classified quiz items: `mc`, `numeric`, `fill`, `tf`, `open` (self-assessed) |
| `content/extra/<source>.json` | extra practice sets (De Anza, Virginia Tech) |
| `content/overrides.json` | hand corrections applied on top of the classifier (see below) |

`overrides.json` keys: `tryitAlignment` (`"ch.n": {"module","index"}` or `null` to skip), `items` (`id` → fields to
merge into the emitted question), `skip` (ids never emitted). Never edit generated JSON by hand.

The De Anza exam text has a few multiple-choice options typeset with a math font that extracts as unreadable
glyphs; those items are skipped with a console note and can be transcribed into `overrides.json`.
