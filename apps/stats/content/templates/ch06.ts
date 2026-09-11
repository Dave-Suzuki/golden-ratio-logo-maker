import { normalCdf, normalInv, round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

const NORMALS = [
  ['exam scores', 'points', 70, 10],
  ['adult heights', 'cm', 170, 7],
  ['delivery times', 'minutes', 30, 6],
  ['battery life', 'hours', 12, 1.5],
  ['weekly grocery bills', 'dollars', 120, 25],
] as const;

export const CH06_TEMPLATES: Template[] = [
  {
    id: 'normal-z',
    sectionId: '6.1',
    conceptTag: '6.1',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, mu, sd] = rng.pick(NORMALS);
      const x = round(mu + rng.float(-2.5, 2.5, 1) * sd, 1);
      const z = round((x - mu) / sd, 2);
      return {
        sectionId: '6.1',
        conceptTag: '6.1',
        kind: 'numeric',
        stem: `Values of ${what} are normally distributed: X ~ N(${mu}, ${sd}) (${unit}). Find the z-score of x = ${x}. Round to two decimals.`,
        answer: z,
        tolerance: { abs: 0.011 },
        explanation: [`z = (x − μ) / σ = (${x} − ${mu}) / ${sd} = ${z}`, `x is ${Math.abs(z)} standard deviations ${z < 0 ? 'below' : 'above'} the mean.`],
      };
    },
  },
  {
    id: 'normal-x-from-z',
    sectionId: '6.1',
    conceptTag: '6.1',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, mu, sd] = rng.pick(NORMALS);
      const z = rng.pick([-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]);
      const x = round(mu + z * sd, 2);
      return {
        sectionId: '6.1',
        conceptTag: '6.1',
        kind: 'numeric',
        stem: `Values of ${what} follow X ~ N(${mu}, ${sd}) (${unit}). What value x has a z-score of ${z}?`,
        answer: x,
        tolerance: { abs: 0.05 },
        explanation: [`x = μ + zσ = ${mu} + (${z})(${sd}) = ${x}`],
      };
    },
  },
  {
    id: 'normal-empirical-rule',
    sectionId: '6.1',
    conceptTag: '6.1',
    kind: 'mc',
    generate(rng) {
      const [what, , mu, sd] = rng.pick(NORMALS);
      const k = rng.pick([1, 2, 3]);
      const pct = { 1: '68%', 2: '95%', 3: '99.7%' }[k];
      const lo = round(mu - k * sd, 1), hi = round(mu + k * sd, 1);
      const wrong = [1, 2, 3].filter((j) => j !== k).map((j) => `${round(mu - j * sd, 1)} to ${round(mu + j * sd, 1)}`);
      return {
        sectionId: '6.1',
        conceptTag: '6.1',
        kind: 'mc',
        stem: `Values of ${what} follow X ~ N(${mu}, ${sd}). By the empirical rule, about ${pct} of values lie between which two numbers?`,
        options: [`${lo} to ${hi}`, ...wrong, `${round(mu - 4 * sd, 1)} to ${round(mu + 4 * sd, 1)}`],
        correctIndex: 0,
        explanation: [`Empirical rule: 68% within 1σ, 95% within 2σ, 99.7% within 3σ of the mean.`, `μ ± ${k}σ = ${mu} ± ${k}·${sd} = ${lo} to ${hi}`],
      };
    },
  },
  {
    id: 'normal-area',
    sectionId: '6.2',
    conceptTag: '6.2',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, mu, sd] = rng.pick(NORMALS);
      const kind = rng.pick(['less', 'more', 'between'] as const);
      const a = round(mu + rng.float(-2, 1, 1) * sd, 1);
      const b = round(a + rng.float(0.5, 2, 1) * sd, 1);
      let ans: number, stem: string, steps: string[];
      if (kind === 'less') {
        ans = normalCdf(a, mu, sd);
        stem = `Find the probability that a randomly chosen value is less than ${a} ${unit}.`;
        steps = [`P(X < ${a}) = normalcdf(−∞, ${a}, ${mu}, ${sd})`, `z = (${a} − ${mu})/${sd} = ${round((a - mu) / sd, 2)}`];
      } else if (kind === 'more') {
        ans = 1 - normalCdf(a, mu, sd);
        stem = `Find the probability that a randomly chosen value is more than ${a} ${unit}.`;
        steps = [`P(X > ${a}) = 1 − P(X < ${a}) = normalcdf(${a}, ∞, ${mu}, ${sd})`, `z = (${a} − ${mu})/${sd} = ${round((a - mu) / sd, 2)}`];
      } else {
        ans = normalCdf(b, mu, sd) - normalCdf(a, mu, sd);
        stem = `Find the probability that a randomly chosen value is between ${a} and ${b} ${unit}.`;
        steps = [`P(${a} < X < ${b}) = normalcdf(${a}, ${b}, ${mu}, ${sd})`];
      }
      ans = round(ans, 4);
      return {
        sectionId: '6.2',
        conceptTag: '6.2',
        kind: 'numeric',
        context: `Values of ${what} are normally distributed with mean ${mu} and standard deviation ${sd} (${unit}).`,
        stem: `${stem} Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [...steps, `= ${ans}`],
      };
    },
  },
  {
    id: 'normal-percentile',
    sectionId: '6.2',
    conceptTag: '6.2',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, mu, sd] = rng.pick(NORMALS);
      const pct = rng.pick([10, 20, 25, 30, 40, 60, 75, 80, 90, 95]);
      const k = round(normalInv(pct / 100, mu, sd), 2);
      return {
        sectionId: '6.2',
        conceptTag: '6.2',
        kind: 'numeric',
        context: `Values of ${what} are normally distributed with mean ${mu} and standard deviation ${sd} (${unit}).`,
        stem: `Find the ${pct}th percentile. Round to two decimals.`,
        answer: k,
        tolerance: { abs: 0.05 },
        explanation: [`Find k with P(X < k) = ${pct / 100}: k = invNorm(${pct / 100}, ${mu}, ${sd})`, `= ${k}`, `${pct}% of ${what} are at most ${k} ${unit}.`],
      };
    },
  },
];
