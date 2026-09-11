import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH11_TEMPLATES: Template[] = [
  {
    id: 'chi-gof-stat',
    sectionId: '11.2',
    conceptTag: '11.2',
    kind: 'numeric',
    generate(rng) {
      const k = rng.pick([4, 5, 6]);
      const n = rng.pick([60, 100, 120, 150]);
      const expected = n / k;
      const obs = Array.from({ length: k }, () => Math.round(expected + rng.int(-6, 6)));
      const diff = n - obs.reduce((a, b) => a + b, 0);
      obs[0] = (obs[0] as number) + diff;
      const chi = round(obs.reduce((a, o) => a + (o - expected) ** 2 / expected, 0), 3);
      const askDf = rng.next() < 0.25;
      return {
        sectionId: '11.2',
        conceptTag: '11.2',
        kind: 'numeric',
        context: `A die-like spinner with ${k} equally likely outcomes is spun ${n} times.\n[TABLE]\nOutcome | ${obs.map((_, i) => i + 1).join(' | ')}\nObserved | ${obs.join(' | ')}\n[/TABLE]`,
        stem: askDf ? 'How many degrees of freedom does the goodness-of-fit test have?' : 'Test H0: the outcomes are equally likely. Compute the chi-square test statistic. Round to three decimals.',
        answer: askDf ? k - 1 : chi,
        tolerance: { abs: askDf ? 0.01 : 0.02 },
        explanation: askDf
          ? [`df = number of categories − 1 = ${k} − 1 = ${k - 1}`]
          : [`Expected count per outcome = ${n} / ${k} = ${expected}`, `χ² = Σ (O − E)² / E = ${obs.map((o) => `(${o} − ${expected})²/${expected}`).join(' + ')}`, `= ${chi}`],
      };
    },
  },
  {
    id: 'chi-independence-expected',
    sectionId: '11.3',
    conceptTag: '11.3',
    kind: 'numeric',
    generate(rng) {
      const a = rng.int(10, 40), b = rng.int(10, 40), c = rng.int(10, 40), d = rng.int(10, 40);
      const total = a + b + c + d;
      const which = rng.pick(['top-left', 'bottom-right'] as const);
      const exp = which === 'top-left' ? ((a + b) * (a + c)) / total : ((c + d) * (b + d)) / total;
      const ans = round(exp, 3);
      const askDf = rng.next() < 0.2;
      return {
        sectionId: '11.3',
        conceptTag: '11.3',
        kind: 'numeric',
        context: `Survey of ${total} people: preferred device by age group.\n[TABLE]\n | Phone | Laptop | Total\nUnder 30 | ${a} | ${b} | ${a + b}\n30 and over | ${c} | ${d} | ${c + d}\nTotal | ${a + c} | ${b + d} | ${total}\n[/TABLE]`,
        stem: askDf ? 'For a test of independence on this table, how many degrees of freedom are there?' : `Find the expected count for the ${which === 'top-left' ? '"Under 30 / Phone"' : '"30 and over / Laptop"'} cell under H0: device and age are independent. Round to three decimals.`,
        answer: askDf ? 1 : ans,
        tolerance: { abs: askDf ? 0.01 : 0.01 },
        explanation: askDf ? ['df = (rows − 1)(columns − 1) = (2 − 1)(2 − 1) = 1'] : [`E = (row total × column total) / grand total`, which === 'top-left' ? `= (${a + b} × ${a + c}) / ${total} = ${ans}` : `= (${c + d} × ${b + d}) / ${total} = ${ans}`],
      };
    },
  },
  {
    id: 'chi-single-variance-stat',
    sectionId: '11.6',
    conceptTag: '11.6',
    kind: 'numeric',
    generate(rng) {
      const n = rng.int(10, 30);
      const sigma0 = rng.pick([2, 3, 4, 5, 8, 10]);
      const s = round(sigma0 * rng.float(0.6, 1.5, 2), 2);
      const chi = round(((n - 1) * s * s) / (sigma0 * sigma0), 3);
      return {
        sectionId: '11.6',
        conceptTag: '11.6',
        kind: 'numeric',
        stem: `A sample of n = ${n} has standard deviation s = ${s}. Test H0: σ = ${sigma0}. Compute the chi-square test statistic. Round to three decimals.`,
        answer: chi,
        tolerance: { abs: 0.02 },
        explanation: [`χ² = (n − 1)s² / σ² = (${n} − 1)(${s})² / ${sigma0}²`, `= ${n - 1} × ${round(s * s, 4)} / ${sigma0 * sigma0} = ${chi}`, `df = n − 1 = ${n - 1}`],
      };
    },
  },
];
