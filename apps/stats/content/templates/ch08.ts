import { normalInv, round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

const Z = { 90: 1.645, 95: 1.96, 98: 2.326, 99: 2.576 } as const;

export const CH08_TEMPLATES: Template[] = [
  {
    id: 'ci-mean-z-bound',
    sectionId: '8.1',
    conceptTag: '8.1',
    kind: 'numeric',
    generate(rng) {
      const cl = rng.pick([90, 95, 98, 99] as const);
      const sd = rng.int(3, 20);
      const n = rng.pick([25, 30, 36, 49, 64, 100]);
      const xbar = round(rng.int(40, 200) + rng.float(0, 0.9, 1), 1);
      const z = Z[cl];
      const ebm = round(z * sd / Math.sqrt(n), 3);
      const ask = rng.pick(['ebm', 'lower', 'upper'] as const);
      const ans = { ebm, lower: round(xbar - ebm, 2), upper: round(xbar + ebm, 2) }[ask];
      const label = { ebm: 'error bound EBM', lower: 'lower bound of the confidence interval', upper: 'upper bound of the confidence interval' }[ask];
      return {
        sectionId: '8.1',
        conceptTag: '8.1',
        kind: 'numeric',
        stem: `A sample of n = ${n} has mean x̄ = ${xbar}. The population standard deviation is known to be σ = ${sd}. Find the ${label} for a ${cl}% confidence interval for μ. Round to two decimals.`,
        answer: ans,
        tolerance: { abs: 0.03 },
        explanation: [`α = 1 − ${cl / 100} = ${round(1 - cl / 100, 2)}, z_(α/2) = ${z}`, `EBM = z · σ/√n = ${z} × ${sd}/√${n} = ${ebm}`, `CI = (x̄ − EBM, x̄ + EBM) = (${round(xbar - ebm, 2)}, ${round(xbar + ebm, 2)})`],
      };
    },
  },
  {
    id: 'ci-sample-size',
    sectionId: '8.1',
    conceptTag: '8.1',
    kind: 'numeric',
    generate(rng) {
      const cl = rng.pick([90, 95, 99] as const);
      const sd = rng.int(4, 25);
      const e = rng.pick([0.5, 1, 1.5, 2, 2.5, 3]);
      const z = Z[cl];
      const raw = (z * sd / e) ** 2;
      const n = Math.ceil(raw - 1e-9);
      return {
        sectionId: '8.1',
        conceptTag: '8.1',
        kind: 'numeric',
        stem: `The population standard deviation is σ = ${sd}. How large a sample is needed so that a ${cl}% confidence interval for μ has an error bound of at most ${e}?`,
        answer: n,
        tolerance: { abs: 0.4 },
        explanation: [`n = (z·σ / EBM)² = (${z} × ${sd} / ${e})² = ${round(raw, 2)}`, `Always round up: n = ${n}`],
      };
    },
  },
  {
    id: 'ci-proportion',
    sectionId: '8.3',
    conceptTag: '8.3',
    kind: 'numeric',
    generate(rng) {
      const cl = rng.pick([90, 95, 99] as const);
      const n = rng.pick([100, 150, 200, 250, 400, 500]);
      const x = rng.int(Math.round(n * 0.2), Math.round(n * 0.8));
      const phat = x / n;
      const z = Z[cl];
      const ebp = round(z * Math.sqrt((phat * (1 - phat)) / n), 4);
      const ask = rng.pick(['ebp', 'lower', 'upper'] as const);
      const ans = { ebp, lower: round(phat - ebp, 4), upper: round(phat + ebp, 4) }[ask];
      const label = { ebp: 'error bound EBP', lower: 'lower bound', upper: 'upper bound' }[ask];
      return {
        sectionId: '8.3',
        conceptTag: '8.3',
        kind: 'numeric',
        stem: `In a random sample of ${n} customers, ${x} said they would recommend the store. Find the ${label} of a ${cl}% confidence interval for the population proportion p. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [`p̂ = ${x}/${n} = ${round(phat, 4)}, q̂ = ${round(1 - phat, 4)}`, `EBP = z · √(p̂q̂/n) = ${z} × √(${round(phat, 4)} × ${round(1 - phat, 4)} / ${n}) = ${ebp}`, `CI = (${round(phat - ebp, 4)}, ${round(phat + ebp, 4)})`],
      };
    },
  },
  {
    id: 'ci-interpret-width',
    sectionId: '8.1',
    conceptTag: '8.1',
    kind: 'mc',
    generate(rng) {
      const which = rng.pick(['cl-up', 'cl-down', 'n-up', 'n-down'] as const);
      const [c1, c2] = rng.pick([[90, 95], [90, 99], [95, 99], [80, 95]] as const);
      const [n1, n2] = rng.pick([[25, 100], [36, 144], [50, 200], [30, 120]] as const);
      const stem = {
        'cl-up': `Keeping the same sample, the confidence level is raised from ${c1}% to ${c2}%. What happens to the confidence interval for μ?`,
        'cl-down': `Keeping the same sample, the confidence level is lowered from ${c2}% to ${c1}%. What happens to the confidence interval for μ?`,
        'n-up': `Keeping the confidence level the same, the sample size is increased from ${n1} to ${n2}. What happens to the confidence interval for μ?`,
        'n-down': `Keeping the confidence level the same, the sample size is decreased from ${n2} to ${n1}. What happens to the confidence interval for μ?`,
      }[which];
      const wider = which === 'cl-up' || which === 'n-down';
      return {
        sectionId: '8.1',
        conceptTag: '8.1',
        kind: 'mc',
        stem,
        options: [wider ? 'It becomes wider' : 'It becomes narrower', wider ? 'It becomes narrower' : 'It becomes wider', 'It stays the same width', 'It shifts to one side without changing width'],
        correctIndex: 0,
        explanation: which.startsWith('cl')
          ? [`EBM = z·σ/√n. A ${which === 'cl-up' ? 'higher' : 'lower'} confidence level uses a ${which === 'cl-up' ? 'larger' : 'smaller'} z, so the interval gets ${wider ? 'wider' : 'narrower'}.`]
          : [`EBM = z·σ/√n. A ${which === 'n-up' ? 'larger' : 'smaller'} n makes σ/√n ${which === 'n-up' ? 'smaller' : 'larger'}, so the interval gets ${wider ? 'wider' : 'narrower'}.`],
      };
    },
  },
  {
    id: 'ci-z-for-cl',
    sectionId: '8.1',
    conceptTag: '8.1',
    kind: 'numeric',
    generate(rng) {
      const cl = rng.pick([80, 85, 90, 92, 94, 95, 96, 98, 99]);
      const z = round(normalInv(1 - (1 - cl / 100) / 2), 3);
      return {
        sectionId: '8.1',
        conceptTag: '8.1',
        kind: 'numeric',
        stem: `What z-value (z_(α/2)) is used for a ${cl}% confidence interval? Round to three decimals.`,
        answer: z,
        tolerance: { abs: 0.006 },
        explanation: [`α = 1 − ${cl / 100} = ${round(1 - cl / 100, 2)}; each tail holds α/2 = ${round((1 - cl / 100) / 2, 3)}`, `z = invNorm(1 − ${round((1 - cl / 100) / 2, 3)}) = invNorm(${round(1 - (1 - cl / 100) / 2, 3)}) = ${z}`],
      };
    },
  },
];
