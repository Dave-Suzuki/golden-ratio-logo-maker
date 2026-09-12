import { describe, expect, it } from 'vitest';
import { answerOutline, outlineToText } from '@/lib/outline';
import { allQuestions } from '@/lib/server/content';
import { isQuizzable } from '@/lib/verify';
import type { Question } from '@/lib/types';

describe('answerOutline', () => {
  it('offers the categories a model answer is organised under', () => {
    const sol = [
      'Explanatory variable: amount of sleep',
      'Response variable: performance measured in assigned tasks',
      'Treatments: normal sleep and 27 hours of total sleep deprivation',
      'Experimental Units: 19 professional drivers',
      'Control/Placebo: completing the session under normal sleep conditions',
    ].join('\n');
    const rows = answerOutline('Use key terms from this module to describe the design of this experiment.', sol);
    expect(rows?.map((r) => r.label)).toEqual([
      'Explanatory variable',
      'Response variable',
      'Treatments',
      'Experimental Units',
      'Control/Placebo',
    ]);
    // the values are the answer and must not be offered
    expect(JSON.stringify(rows)).not.toMatch(/amount of sleep|19 professional/);
  });

  it('uses the question’s own wording for lettered parts', () => {
    const stem = 'Find the following.\n[PARTS]\na. the mean\nb. the median\nc. the standard deviation\n[/PARTS]';
    const sol = '[PARTS]\na. 12.4\nb. 11\nc. 3.2\n[/PARTS]';
    expect(answerOutline(stem, sol)).toEqual([
      { label: 'a', hint: 'the mean' },
      { label: 'b', hint: 'the median' },
      { label: 'c', hint: 'the standard deviation' },
    ]);
  });

  it('reads parts that the question runs together in one sentence', () => {
    const stem = 'Identify: a. the population, b. the sample, c. the parameter, d. the statistic. Give examples where appropriate.';
    const sol = '[PARTS]\na. all clients\nb. clients that week\nc. the mean time\nd. the sample mean\n[/PARTS]';
    const rows = answerOutline(stem, sol);
    expect(rows?.map((r) => r.label)).toEqual(['a', 'b', 'c', 'd']);
    expect(rows?.map((r) => r.hint)).toEqual(['the population', 'the sample', 'the parameter', 'the statistic']);
  });

  it('falls back to bare letters when the question does not name its parts', () => {
    const sol = '[PARTS]\na. 0.25\nb. 0.5\n[/PARTS]';
    expect(answerOutline('Work out each probability.', sol)).toEqual([{ label: 'a' }, { label: 'b' }]);
  });

  it('leaves a plain workspace for prose, and for a stray colon or letter', () => {
    expect(answerOutline('Why is this sample biased?', 'Because volunteers differ from the population.')).toBeNull();
    expect(answerOutline('What is the median?', 'The median is 12: the middle value once sorted.')).toBeNull();
    // "a)" mid-sentence is not a part list
    expect(answerOutline('Is a) reasonable here?', 'No, because the sample is small.')).toBeNull();
  });

  it('joins filled rows into one answer and drops the blanks', () => {
    const rows = [{ label: 'Explanatory variable' }, { label: 'Response variable' }, { label: 'Treatments' }];
    expect(outlineToText(rows, ['sleep', '', ' reaction time '])).toBe('Explanatory variable: sleep\nTreatments: reaction time');
    expect(outlineToText(rows, ['', '', ''])).toBe('');
  });
});

describe('the shipped bank', () => {
  it('scaffolds a useful share of worked problems, and never leaks an answer into a label', () => {
    const open = allQuestions().filter((q) => isQuizzable(q) && q.kind === 'open') as (Question & { modelSolution: string })[];
    const scaffolded = open.filter((q) => answerOutline(q.stem, q.modelSolution));
    expect(scaffolded.length).toBeGreaterThan(150);
    for (const q of scaffolded) {
      const rows = answerOutline(q.stem, q.modelSolution) ?? [];
      // a 13-part probability exercise is real content, not a parsing accident
      expect(rows.length, q.id).toBeLessThanOrEqual(15);
      for (const r of rows) {
        expect(r.label.length, q.id).toBeGreaterThan(0);
        // a label is a category name or a letter, never a sentence of answer
        expect(r.label.length, `${q.id} label "${r.label}"`).toBeLessThanOrEqual(40);
      }
    }
  });

  it('refuses to list the answers to a question that asks the learner to choose', () => {
    // "Which of the potential problems with samples could explain this?" — its model answer is
    // organised under the problems that apply, so those headings are the answer, not a framework
    const q = allQuestions().find((x) => x.id === 'os-m46885-eip-24') as Question & { modelSolution: string };
    expect(q, 'question missing from the bank').toBeDefined();
    expect(answerOutline(q.stem, q.modelSolution)).toBeNull();
  });

  it('offers the sleep-deprivation question its eight key terms', () => {
    const q = allQuestions().find((x) => x.id === 'os-m46919-fs-idm22501296');
    expect(q, 'question missing from the bank').toBeDefined();
    const rows = answerOutline(q!.stem, (q as Question & { modelSolution: string }).modelSolution);
    expect(rows?.map((r) => r.label)).toEqual([
      'Explanatory variable',
      'Response variable',
      'Treatments',
      'Experimental Units',
      'Lurking variables',
      'Random assignment',
      'Control/Placebo',
      'Blinding',
    ]);
  });
});
