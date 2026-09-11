import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH03_TEMPLATES: Template[] = [
  {
    id: 'prob-contingency',
    sectionId: '3.4',
    conceptTag: '3.4',
    kind: 'numeric',
    generate(rng) {
      const a = rng.int(10, 40), b = rng.int(10, 40), c = rng.int(10, 40), d = rng.int(10, 40);
      const total = a + b + c + d;
      const ask = rng.pick(['pA', 'pAandB', 'pAgivenB', 'pAorB'] as const);
      const rowA = a + b, colB = a + c;
      const answers = { pA: rowA / total, pAandB: a / total, pAgivenB: a / colB, pAorB: (rowA + colB - a) / total };
      const stems = {
        pA: 'P(the student is a first-year)',
        pAandB: 'P(the student is a first-year AND owns a car)',
        pAgivenB: 'P(the student is a first-year | owns a car)',
        pAorB: 'P(the student is a first-year OR owns a car)',
      };
      const work = {
        pA: [`P(first-year) = row total / grand total = ${rowA} / ${total}`],
        pAandB: [`P(first-year AND car) = cell / grand total = ${a} / ${total}`],
        pAgivenB: [`P(first-year | car) = cell / column total for "owns a car" = ${a} / ${colB}`],
        pAorB: [`P(A OR B) = P(A) + P(B) − P(A AND B) = ${rowA}/${total} + ${colB}/${total} − ${a}/${total} = ${rowA + colB - a}/${total}`],
      };
      return {
        sectionId: '3.4',
        conceptTag: '3.4',
        kind: 'numeric',
        context: `A survey of ${total} students recorded class year and car ownership.\n[TABLE]\n | Owns a car | No car | Total\nFirst-year | ${a} | ${b} | ${rowA}\nOther years | ${c} | ${d} | ${c + d}\nTotal | ${colB} | ${b + d} | ${total}\n[/TABLE]`,
        stem: `One student is picked at random. Find ${stems[ask]}. Round to four decimals.`,
        answer: round(answers[ask], 4),
        tolerance: { abs: 0.0006 },
        explanation: [...work[ask], `= ${round(answers[ask], 4)}`],
      };
    },
  },
  {
    id: 'prob-independent-check',
    sectionId: '3.2',
    conceptTag: '3.2',
    kind: 'tf',
    generate(rng) {
      const pA = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6]);
      const pB = rng.pick([0.1, 0.2, 0.3, 0.5]);
      const indep = rng.next() < 0.5;
      const pAB = indep ? round(pA * pB, 3) : round(pA * pB + rng.pick([0.05, -0.04, 0.08]), 3);
      return {
        sectionId: '3.2',
        conceptTag: '3.2',
        kind: 'tf',
        stem: `P(A) = ${pA}, P(B) = ${pB}, and P(A AND B) = ${pAB}. True or false: A and B are independent events.`,
        answer: indep,
        explanation: [`Independent means P(A AND B) = P(A)·P(B).`, `P(A)·P(B) = ${pA} × ${pB} = ${round(pA * pB, 3)}`, indep ? `This equals P(A AND B) = ${pAB}, so the events are independent.` : `This does not equal P(A AND B) = ${pAB}, so the events are not independent.`],
      };
    },
  },
  {
    id: 'prob-or-rule',
    sectionId: '3.3',
    conceptTag: '3.3',
    kind: 'numeric',
    generate(rng) {
      const pA = rng.pick([0.3, 0.35, 0.4, 0.45, 0.5]);
      const pB = rng.pick([0.2, 0.25, 0.3, 0.4]);
      const pAB = round(Math.min(pA, pB) * rng.pick([0.2, 0.4, 0.5]), 2);
      const ans = round(pA + pB - pAB, 2);
      return {
        sectionId: '3.3',
        conceptTag: '3.3',
        kind: 'numeric',
        stem: `Given P(A) = ${pA}, P(B) = ${pB} and P(A AND B) = ${pAB}, find P(A OR B).`,
        answer: ans,
        tolerance: { abs: 0.006 },
        explanation: [`Addition rule: P(A OR B) = P(A) + P(B) − P(A AND B)`, `= ${pA} + ${pB} − ${pAB} = ${ans}`],
      };
    },
  },
  {
    id: 'prob-conditional',
    sectionId: '3.3',
    conceptTag: '3.3',
    kind: 'numeric',
    generate(rng) {
      const pB = rng.pick([0.2, 0.25, 0.4, 0.5, 0.6]);
      const pAB = round(pB * rng.pick([0.1, 0.2, 0.3, 0.5]), 3);
      const ans = round(pAB / pB, 3);
      return {
        sectionId: '3.3',
        conceptTag: '3.3',
        kind: 'numeric',
        stem: `Given P(B) = ${pB} and P(A AND B) = ${pAB}, find the conditional probability P(A | B). Round to three decimals.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [`P(A | B) = P(A AND B) / P(B)`, `= ${pAB} / ${pB} = ${ans}`],
      };
    },
  },
];
