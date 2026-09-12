# End-to-end QA brief — Stats Trainer

You are testing a study app for OpenStax *Introductory Statistics* as a real learner would: by
clicking through it in a browser. The build under test is served at http://localhost:3010 (it is a
single-page app; routes live after `#/`). Do not read the source code to decide what *should*
happen — decide from what a learner would reasonably expect, then check what actually happens.

## Tooling

Write Node scripts (`.mjs`) in /home/user/golden-ratio-logo-maker/apps/stats/qa/e2e/ and run them
with `node`. Import the helper:

    import { open, text, BASE } from './browser.mjs';
    const { page, errors, close } = await open({ width: 1000 });   // or width: 400 for a phone
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });

`errors` collects page errors and console errors as you go — report any that appear.

**A trap worth knowing before you write a driver.** The quiz in progress is saved in
sessionStorage, so navigating to the SAME quiz URL again resumes that quiz rather than starting it
over — the answer controls come back disabled, and a `fill()` will hang waiting for an editable
element. To start the same URL fresh, clear it first:

    await page.evaluate(() => sessionStorage.removeItem('stats-session'));

That behaviour is intentional; do not report it as a defect unless the resume itself is wrong.
Take a screenshot of every defect: `await page.screenshot({ path: 'qa/e2e/<id>.png', fullPage: true })`.
Prefer clicking what the learner sees (buttons, links) over typing URLs. Use a URL only when a page
has no visible way in. Wait for content with `page.waitForSelector` or a short `waitForTimeout`
rather than assuming it is instant.

## What counts as a defect

Anything a learner would call broken, wrong, confusing, or worse than it obviously should be:
- A wrong grade: a correct answer marked wrong, or a wrong one marked right.
- A crash, blank page, unhandled error, or a page that never finishes loading.
- A control that does nothing, or does the wrong thing.
- Text that cannot be read at the width you are testing; layout that overflows sideways; controls
  that cannot be reached or tapped.
- State that is lost when it should persist (progress, mistakes, chosen learner) or persists when
  it should reset (a new quiz starting with old answers).
- A question shown that cannot be answered from what is on screen (report it, but content is
  audited separately, so only note it — do not hunt for these).
- Anything where the keyboard hint on screen does not match what the keys actually do.

Do not report matters of taste. Do report things you had to work around.

## Severity

- `blocker` — cannot complete a core flow (start a quiz, answer, see the result, review, print).
- `major` — wrong result, lost data, or a control that fails; the flow completes but is untrustworthy.
- `minor` — works, but confusing or clumsy; a learner would notice and be annoyed.
- `cosmetic` — visual only, no effect on use.

## Output

Write findings as JSON lines to the file named in your instructions, one object per finding:

    {"id":"<short-slug>","severity":"major","area":"quiz","steps":["...","..."],"expected":"...","actual":"...","screenshot":"qa/e2e/<id>.png","width":1000}

Then finish with a short plain-text report: what you verified works (be specific — which
question kinds, which pages, which widths), followed by the findings in severity order. If you
found nothing in an area, say you tested it and found nothing.
