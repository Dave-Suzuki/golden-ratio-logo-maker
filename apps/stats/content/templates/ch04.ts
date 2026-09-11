import { binomCdf, binomPmf, geomPmf, poissonPmf, round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH04_TEMPLATES: Template[] = [
  {
    id: 'pdf-expected-value',
    sectionId: '4.2',
    conceptTag: '4.2',
    kind: 'numeric',
    generate(rng) {
      const xs = [0, 1, 2, 3];
      let ps = xs.map(() => rng.int(1, 5));
      const tot = ps.reduce((a, b) => a + b, 0);
      ps = ps.map((p) => p / tot);
      const ps2 = ps.map((p) => round(p, 2));
      const drift = round(1 - ps2.reduce((a, b) => a + b, 0), 2);
      ps2[3] = round((ps2[3] as number) + drift, 2);
      const mu = round(xs.reduce((a, x, i) => a + x * (ps2[i] as number), 0), 2);
      const who = rng.pick(['a student is late in a week', 'a printer jams in a day', 'a customer calls back in a month', 'a bus is delayed in a week']);
      return {
        sectionId: '4.2',
        conceptTag: '4.2',
        kind: 'numeric',
        context: `X = number of times ${who}.\n[TABLE]\nx | P(x)\n${xs.map((x, i) => `${x} | ${ps2[i]}`).join('\n')}\n[/TABLE]`,
        stem: `X = number of times ${who}. Using the table, find the expected value (mean) μ of X. Round to two decimals.`,
        answer: mu,
        tolerance: { abs: 0.006 },
        explanation: [`μ = Σ x·P(x) = ${xs.map((x, i) => `${x}(${ps2[i]})`).join(' + ')}`, `= ${mu}`],
      };
    },
  },
  {
    id: 'binom-pmf',
    sectionId: '4.3',
    conceptTag: '4.3',
    kind: 'numeric',
    generate(rng) {
      const n = rng.int(6, 15);
      const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7]);
      const k = rng.int(1, n - 1);
      const cum = rng.next() < 0.5;
      const ans = round(cum ? binomCdf(n, p, k) : binomPmf(n, p, k), 4);
      return {
        sectionId: '4.3',
        conceptTag: '4.3',
        kind: 'numeric',
        stem: `X ~ B(${n}, ${p}). Find ${cum ? `P(X ≤ ${k})` : `P(X = ${k})`}. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.0006 },
        explanation: cum
          ? [`Use binomcdf(${n}, ${p}, ${k}) — the sum of P(X = x) for x = 0 … ${k}.`, `= ${ans}`]
          : [`P(X = ${k}) = C(${n}, ${k}) · ${p}^${k} · ${round(1 - p, 2)}^${n - k}`, `binompdf(${n}, ${p}, ${k}) = ${ans}`],
      };
    },
  },
  {
    id: 'binom-mean-sd',
    sectionId: '4.3',
    conceptTag: '4.3',
    kind: 'numeric',
    generate(rng) {
      const n = rng.int(10, 80);
      const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.65, 0.8]);
      const askMean = rng.next() < 0.5;
      const mu = round(n * p, 2);
      const sd = round(Math.sqrt(n * p * (1 - p)), 2);
      return {
        sectionId: '4.3',
        conceptTag: '4.3',
        kind: 'numeric',
        stem: `X ~ B(${n}, ${p}). Find the ${askMean ? 'mean μ' : 'standard deviation σ'} of X (two decimals).`,
        answer: askMean ? mu : sd,
        tolerance: { abs: 0.01 },
        explanation: askMean ? [`μ = np = ${n} × ${p} = ${mu}`] : [`σ = √(npq) = √(${n} × ${p} × ${round(1 - p, 2)}) = ${sd}`],
      };
    },
  },
  {
    id: 'geom-first-success',
    sectionId: '4.4',
    conceptTag: '4.4',
    kind: 'numeric',
    generate(rng) {
      const p = rng.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
      const k = rng.int(2, 6);
      const ans = round(geomPmf(p, k), 4);
      return {
        sectionId: '4.4',
        conceptTag: '4.4',
        kind: 'numeric',
        stem: `Each call to a help line reaches a live agent with probability ${p}. X = the number of calls until the first live agent. Find P(X = ${k}). Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.0006 },
        explanation: [`Geometric: P(X = k) = (1 − p)^(k−1) · p`, `= ${round(1 - p, 2)}^${k - 1} × ${p} = ${ans}`],
      };
    },
  },
  {
    id: 'poisson-pmf',
    sectionId: '4.6',
    conceptTag: '4.6',
    kind: 'numeric',
    generate(rng) {
      const lam = rng.pick([1.5, 2, 2.5, 3, 4, 5]);
      const k = rng.int(0, 6);
      const ans = round(poissonPmf(lam, k), 4);
      return {
        sectionId: '4.6',
        conceptTag: '4.6',
        kind: 'numeric',
        stem: `A bakery gets an average of ${lam} custom-cake orders per day. X = orders in a day, X ~ P(${lam}). Find P(X = ${k}). Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.0006 },
        explanation: [`Poisson: P(X = k) = μ^k e^(−μ) / k!`, `= ${lam}^${k} · e^(−${lam}) / ${k}! = ${ans}`],
      };
    },
  },
];
