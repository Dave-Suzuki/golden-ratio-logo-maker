# QA brief — statistics question bank

You are auditing questions from a study app built on OpenStax *Introductory Statistics 2e*.
The learner sees EXACTLY the text in your batch file: the `scenario` (if any), then the
`question`, then answer controls. Nothing else. No neighbouring exercises, no textbook page,
no figures. The app shuffles questions, so the one before and after are unrelated.

Your job, for every question in your batch, is to answer two things:

1. **Is the question answerable exactly as shown?** A competent student with a statistics
   textbook must be able to answer it from `scenario` + `question` alone.
2. **Is the stated correct answer right?** Check it. Do the arithmetic. For `mc`, confirm
   `correct` is the best option and the others are genuinely wrong. For `numeric`, recompute.
   For `tf`, reason it out. For `open`, check the model answer actually answers the question
   asked, and is not a leftover from a different question.

## Fail it when

- `missing-info` — needs data, a table, a figure, a prior exercise or a value that is not shown.
  This includes a scenario that describes something the question never uses, and a question
  whose numbers appear nowhere.
- `wrong-answer` — the stated answer is mathematically or factually wrong.
- `answer-mismatch` — the answer is for a different question, answers only part of a multi-part
  question, or is a bare letter/fragment that means nothing on its own.
- `not-a-question` — a label, a heading, or a sentence fragment rather than something to answer.
- `garbled` — mangled wording, duplicated clauses, a broken table, stray markup.
- `ambiguous` — genuinely has more than one defensible answer as worded.
- `ungradable` — asks the learner to draw, sketch, graph, or hand in a construction that the app
  cannot mark.
- `bad-options` — (mc only) duplicate options, the "options" are the parts of the question, more
  than one option is correct, or no option is correct.

## Do NOT fail it for

- Being hard, terse, or dry.
- Open questions whose model answer is brief but correct — the learner self-marks these.
- American spelling, textbook phrasing, or dated examples.
- Rounding differences within about 1% on a probability or statistic.
- A scenario shared with other questions — that is expected and fine, as long as THIS question
  can be answered from it.

## Output

Write ONE line of JSON per question, in batch order, and NOTHING else — no prose, no summary,
no markdown fence. Every question in the batch gets exactly one line.

{"id":"<id>","verdict":"ok"}
{"id":"<id>","verdict":"broken","issue":"<one category from the list above>","note":"<= 25 words, what is wrong>"}

Be strict but fair: the test is whether a real student could answer it correctly and would be
graded correctly. If you are unsure whether something is answerable, mark it broken and say why.
