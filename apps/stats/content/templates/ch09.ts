import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

const CLAIMS = [
  { text: 'the mean time to complete the form is less than {v} minutes', param: 'μ', unit: '', kind: 'lt' },
  { text: 'the mean weight of the bags is {v} kg', param: 'μ', unit: '', kind: 'eq' },
  { text: 'the mean battery life is more than {v} hours', param: 'μ', unit: '', kind: 'gt' },
  { text: 'at most {v}% of customers return an item', param: 'p', unit: '%', kind: 'le' },
  { text: 'at least {v}% of students commute by bus', param: 'p', unit: '%', kind: 'ge' },
  { text: 'more than {v}% of voters support the measure', param: 'p', unit: '%', kind: 'gt' },
  { text: 'fewer than {v}% of parts are defective', param: 'p', unit: '%', kind: 'lt' },
  { text: 'the proportion of left-handed players is {v}', param: 'p', unit: '', kind: 'eq' },
] as const;

// null carries the equality; the alternative is the claim's strict version (or its opposite for ≤/≥ claims)
const SYMBOLS: Record<string, [string, string]> = { lt: ['≥', '<'], gt: ['≤', '>'], eq: ['=', '≠'], le: ['≤', '>'], ge: ['≥', '<'] };

export const CH09_TEMPLATES: Template[] = [
  {
    id: 'hyp-symbols',
    sectionId: '9.1',
    conceptTag: '9.1',
    kind: 'fill',
    generate(rng) {
      const c = rng.pick(CLAIMS);
      const v = c.unit === '%' ? rng.int(5, 80) : c.param === 'p' ? rng.pick([0.1, 0.2, 0.25, 0.3, 0.4]) : rng.int(5, 120);
      const [h0, ha] = SYMBOLS[c.kind] as [string, string];
      const value = c.param === 'p' && c.unit === '%' ? v / 100 : v;
      return {
        sectionId: '9.1',
        conceptTag: '9.1',
        kind: 'fill',
        symbolSet: 'hypothesis',
        stem: `We want to test the claim that ${c.text.replace('{v}', String(v))}. Fill in the symbols (=, ≠, <, >, ≤, ≥):\nH0: ${c.param} __ ${value}\nHa: ${c.param} __ ${value}`,
        blanks: [
          { label: `H0: ${c.param}`, answer: h0 },
          { label: `Ha: ${c.param}`, answer: ha },
        ],
        explanation: [`The null hypothesis always contains equality (=, ≤ or ≥); the alternative never does.`, `H0: ${c.param} ${h0} ${value}   Ha: ${c.param} ${ha} ${value}`],
      };
    },
  },
  {
    id: 'hyp-pvalue-decision',
    sectionId: '9.4',
    conceptTag: '9.4',
    kind: 'mc',
    generate(rng) {
      const alpha = rng.pick([0.01, 0.05, 0.1]);
      const p = round(rng.next() < 0.5 ? alpha * rng.pick([0.1, 0.3, 0.6, 0.9]) : alpha * rng.pick([1.2, 1.8, 3, 5]), 4);
      const reject = p < alpha;
      return {
        sectionId: '9.4',
        conceptTag: '9.4',
        kind: 'mc',
        stem: `A hypothesis test gives a p-value of ${p}. At the α = ${alpha} level of significance, what is the decision?`,
        options: ['Reject the null hypothesis', 'Do not reject the null hypothesis', 'Accept the alternative hypothesis without a test', 'Increase α until the p-value is smaller'],
        correctIndex: reject ? 0 : 1,
        explanation: [`Compare the p-value with α: ${p} ${reject ? '<' : '≥'} ${alpha}.`, reject ? 'p-value < α → reject H0; there is sufficient evidence for Ha.' : 'p-value ≥ α → do not reject H0; there is not sufficient evidence for Ha.'],
      };
    },
  },
  {
    id: 'hyp-error-types',
    sectionId: '9.2',
    conceptTag: '9.2',
    kind: 'mc',
    generate(rng) {
      const scen = rng.pick([
        ['H0: the new drug has no side effects', 'concluding the drug has side effects when it actually has none', 'concluding the drug has no side effects when it actually does'],
        ['H0: the water is safe to drink', 'declaring the water unsafe when it is actually safe', 'declaring the water safe when it is actually unsafe'],
        ['H0: the defendant is innocent', 'convicting an innocent defendant', 'acquitting a guilty defendant'],
        ['H0: the machine is calibrated correctly', 'stopping a machine that is actually calibrated', 'leaving a miscalibrated machine running'],
      ] as const);
      const askType1 = rng.next() < 0.5;
      return {
        sectionId: '9.2',
        conceptTag: '9.2',
        kind: 'mc',
        stem: `${scen[0]}. Which statement describes a Type ${askType1 ? 'I' : 'II'} error?`,
        options: [askType1 ? scen[1] : scen[2], askType1 ? scen[2] : scen[1], 'Failing to collect a large enough sample', 'Choosing α = 0.05 instead of 0.01'],
        correctIndex: 0,
        explanation: [`Type I error: rejecting H0 when H0 is true (α). Type II error: not rejecting H0 when H0 is false (β).`, `Here a Type ${askType1 ? 'I' : 'II'} error is ${askType1 ? scen[1] : scen[2]}.`],
      };
    },
  },
  {
    id: 'hyp-z-stat',
    sectionId: '9.5',
    conceptTag: '9.5',
    kind: 'numeric',
    generate(rng) {
      const mu0 = rng.int(20, 100);
      const sd = rng.int(3, 15);
      const n = rng.pick([25, 36, 49, 64, 100]);
      const xbar = round(mu0 + rng.float(-3, 3, 1) * sd / Math.sqrt(n), 2);
      const z = round((xbar - mu0) / (sd / Math.sqrt(n)), 2);
      return {
        sectionId: '9.5',
        conceptTag: '9.5',
        kind: 'numeric',
        stem: `Test H0: μ = ${mu0} with a sample of n = ${n}, x̄ = ${xbar}, and known σ = ${sd}. Compute the test statistic z. Round to two decimals.`,
        answer: z,
        tolerance: { abs: 0.02 },
        explanation: [`z = (x̄ − μ0) / (σ/√n) = (${xbar} − ${mu0}) / (${sd}/√${n})`, `= ${round(xbar - mu0, 2)} / ${round(sd / Math.sqrt(n), 3)} = ${z}`],
      };
    },
  },
];
