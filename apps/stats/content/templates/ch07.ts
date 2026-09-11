import { normalCdf, round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH07_TEMPLATES: Template[] = [
  {
    id: 'clt-mean-prob',
    sectionId: '7.1',
    conceptTag: '7.1',
    kind: 'numeric',
    generate(rng) {
      const mu = rng.int(40, 120);
      const sd = rng.int(5, 20);
      const n = rng.pick([25, 36, 49, 64, 81, 100]);
      const se = sd / Math.sqrt(n);
      const a = round(mu + rng.float(-2, 2, 1) * se, 1);
      const less = rng.next() < 0.5;
      const ans = round(less ? normalCdf(a, mu, se) : 1 - normalCdf(a, mu, se), 4);
      return {
        sectionId: '7.1',
        conceptTag: '7.1',
        kind: 'numeric',
        stem: `A population has mean ${mu} and standard deviation ${sd}. A random sample of n = ${n} is taken. Find the probability that the sample mean is ${less ? 'less' : 'greater'} than ${a}. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [`By the CLT, X̄ ~ N(${mu}, ${sd}/√${n}) = N(${mu}, ${round(se, 3)})`, `z = (${a} − ${mu}) / ${round(se, 3)} = ${round((a - mu) / se, 2)}`, `${less ? `P(X̄ < ${a})` : `P(X̄ > ${a})`} = ${ans}`],
      };
    },
  },
  {
    id: 'clt-se',
    sectionId: '7.1',
    conceptTag: '7.1',
    kind: 'numeric',
    generate(rng) {
      const sd = rng.int(4, 30);
      const n = rng.pick([16, 25, 36, 49, 64, 100, 144]);
      const se = round(sd / Math.sqrt(n), 3);
      return {
        sectionId: '7.1',
        conceptTag: '7.1',
        kind: 'numeric',
        stem: `The population standard deviation is ${sd}. For samples of size n = ${n}, what is the standard deviation of the sample mean (the standard error)? Round to three decimals.`,
        answer: se,
        tolerance: { abs: 0.002 },
        explanation: [`σ_x̄ = σ / √n = ${sd} / √${n} = ${se}`],
      };
    },
  },
  {
    id: 'clt-sum-prob',
    sectionId: '7.2',
    conceptTag: '7.2',
    kind: 'numeric',
    generate(rng) {
      const mu = rng.int(20, 80);
      const sd = rng.int(4, 15);
      const n = rng.pick([30, 40, 50, 64, 80]);
      const sumMu = n * mu;
      const sumSd = Math.sqrt(n) * sd;
      const a = round(sumMu + rng.float(-2, 2, 1) * sumSd, 0);
      const less = rng.next() < 0.5;
      const ans = round(less ? normalCdf(a, sumMu, sumSd) : 1 - normalCdf(a, sumMu, sumSd), 4);
      return {
        sectionId: '7.2',
        conceptTag: '7.2',
        kind: 'numeric',
        stem: `A distribution has mean ${mu} and standard deviation ${sd}. For a sample of n = ${n}, find the probability that the sum of the sample values is ${less ? 'less' : 'greater'} than ${a}. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [`ΣX ~ N(nμ, √n·σ) = N(${sumMu}, ${round(sumSd, 3)})`, `z = (${a} − ${sumMu}) / ${round(sumSd, 3)} = ${round((a - sumMu) / sumSd, 2)}`, `= ${ans}`],
      };
    },
  },
];
