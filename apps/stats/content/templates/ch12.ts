import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

function linreg(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += ((xs[i] as number) - mx) * ((ys[i] as number) - my);
    sxx += ((xs[i] as number) - mx) ** 2;
    syy += ((ys[i] as number) - my) ** 2;
  }
  const b = sxy / sxx;
  const a = my - b * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { a, b, r };
}

// critical values of r for α = 0.05 (two-tailed), indexed by df = n − 2 (OpenStax Table 12.x)
const R_CRIT: Record<number, number> = { 1: 0.997, 2: 0.95, 3: 0.878, 4: 0.811, 5: 0.754, 6: 0.707, 7: 0.666, 8: 0.632, 9: 0.602, 10: 0.576, 11: 0.555, 12: 0.532, 13: 0.514, 14: 0.497, 15: 0.482, 16: 0.468, 17: 0.456, 18: 0.444, 19: 0.433, 20: 0.423 };

export const CH12_TEMPLATES: Template[] = [
  {
    id: 'linear-equation-slope',
    sectionId: '12.1',
    conceptTag: '12.1',
    kind: 'numeric',
    generate(rng) {
      const a = rng.int(10, 60);
      const b = rng.pick([1.5, 2, 2.5, 3, 4, 5, 7.5]);
      const ask = rng.pick(['slope', 'intercept', 'value'] as const);
      const x = rng.int(2, 12);
      const ans = { slope: b, intercept: a, value: a + b * x }[ask];
      return {
        sectionId: '12.1',
        conceptTag: '12.1',
        kind: 'numeric',
        stem: `A tutor charges a one-time fee plus an hourly rate, so the total cost is y = ${a} + ${b}x, where x is the number of hours. ${ask === 'slope' ? 'What is the slope, and what does it represent? Enter the slope.' : ask === 'intercept' ? 'What is the y-intercept? Enter the number.' : `What is the total cost for ${x} hours?`}`,
        answer: ans,
        tolerance: { abs: 0.01 },
        explanation: ask === 'slope' ? [`In y = a + bx the slope is b = ${b}: the cost increases by ${b} for each additional hour.`] : ask === 'intercept' ? [`The y-intercept is a = ${a}: the cost when x = 0 (the one-time fee).`] : [`y = ${a} + ${b}(${x}) = ${ans}`],
      };
    },
  },
  {
    id: 'reg-line-predict',
    sectionId: '12.3',
    conceptTag: '12.3',
    kind: 'numeric',
    generate(rng) {
      const n = rng.int(5, 7);
      const xs = Array.from({ length: n }, (_, i) => 1 + i * rng.int(1, 3) + rng.int(0, 1));
      const trueB = rng.pick([1.5, 2, 3, -2, 4]);
      const ys = xs.map((x) => Math.round(20 + trueB * x + rng.int(-4, 4)));
      const { a, b } = linreg(xs, ys);
      const ask = rng.pick(['slope', 'intercept'] as const);
      const ans = round(ask === 'slope' ? b : a, 3);
      return {
        sectionId: '12.3',
        conceptTag: '12.3',
        kind: 'numeric',
        context: `Data on study hours (x) and quiz score (y):\n[TABLE]\nx | ${xs.join(' | ')}\ny | ${ys.join(' | ')}\n[/TABLE]`,
        stem: `Find the least-squares regression line ŷ = a + bx. Enter the ${ask === 'slope' ? 'slope b' : 'y-intercept a'}, rounded to three decimals.`,
        answer: ans,
        tolerance: { abs: 0.01 },
        explanation: [`Use LinRegTTest / linear regression on the calculator with x = hours, y = score.`, `ŷ = ${round(a, 3)} + ${round(b, 3)}x`, `${ask === 'slope' ? `b = ${ans}` : `a = ${ans}`}`],
      };
    },
  },
  {
    id: 'reg-predict-y',
    sectionId: '12.5',
    conceptTag: '12.5',
    kind: 'numeric',
    generate(rng) {
      const a = round(rng.float(-20, 40, 1), 1);
      const b = round(rng.float(-3, 6, 2), 2);
      const lo = rng.int(1, 10), hi = lo + rng.int(10, 30);
      const x = rng.int(lo, hi);
      const ans = round(a + b * x, 2);
      return {
        sectionId: '12.5',
        conceptTag: '12.5',
        kind: 'numeric',
        stem: `The regression line ŷ = ${a} + ${b}x was fitted to data with x between ${lo} and ${hi}. Predict y when x = ${x}. Round to two decimals.`,
        answer: ans,
        tolerance: { abs: 0.02 },
        explanation: [`x = ${x} is inside the data range, so prediction is appropriate.`, `ŷ = ${a} + ${b}(${x}) = ${ans}`],
      };
    },
  },
  {
    id: 'reg-r-significance',
    sectionId: '12.4',
    conceptTag: '12.4',
    kind: 'tf',
    generate(rng) {
      const n = rng.int(5, 22);
      const crit = R_CRIT[n - 2] as number;
      const sig = rng.next() < 0.5;
      const r = round((sig ? crit + rng.float(0.02, 0.15, 2) : crit - rng.float(0.02, 0.2, 2)) * (rng.next() < 0.3 ? -1 : 1), 3);
      const rr = Math.min(Math.abs(r), 0.999) * Math.sign(r);
      return {
        sectionId: '12.4',
        conceptTag: '12.4',
        kind: 'tf',
        stem: `For n = ${n} data points the correlation coefficient is r = ${rr}. The critical value from the table for df = ${n - 2} at α = 0.05 is ${crit}. True or false: the correlation is significant.`,
        answer: Math.abs(rr) > crit,
        explanation: [`Compare |r| with the critical value: |${rr}| = ${Math.abs(rr)} ${Math.abs(rr) > crit ? '>' : '≤'} ${crit}.`, Math.abs(rr) > crit ? 'Since |r| exceeds the critical value, r is significant: the line may be used for prediction.' : 'Since |r| does not exceed the critical value, r is not significant.'],
      };
    },
  },
];

/**
 * Scatter-plot and outlier generators. Both sections are built around looking at a picture, so
 * nearly all their exercises ask for one to be drawn. These ask for the numbers the picture is
 * read from: the correlation coefficient behind "is this linear?", and the residual behind
 * "is this point an outlier?".
 */
function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] as number) - mx;
    const dy = (ys[i] as number) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export const CH12_GRAPH_TEMPLATES: Template[] = [
  {
    id: 'scatter-correlation-value',
    sectionId: '12.2',
    conceptTag: '12.2',
    kind: 'numeric',
    generate(rng) {
      const n = rng.pick([5, 6]);
      const slope = rng.pick([-3, -2, -1.5, 1.5, 2, 3]);
      const intercept = rng.int(5, 40);
      const xs = Array.from({ length: n }, (_, i) => 2 + i * rng.int(2, 4));
      const ys = xs.map((x) => round(intercept + slope * x + rng.int(-4, 4), 1));
      const r = round(pearson(xs, ys), 3);
      return {
        sectionId: '12.2',
        conceptTag: '12.2',
        kind: 'numeric',
        context: `[TABLE]\nx | ${xs.join(' | ')}\ny | ${ys.join(' | ')}\n[/TABLE]`,
        stem: 'Compute the correlation coefficient r for these points. Round to three decimal places.',
        answer: r,
        tolerance: { abs: 0.01 },
        explanation: [
          'r = Σ(x − x̄)(y − ȳ) / √( Σ(x − x̄)² · Σ(y − ȳ)² )',
          `x̄ = ${round(xs.reduce((a, b) => a + b, 0) / n, 3)},  ȳ = ${round(ys.reduce((a, b) => a + b, 0) / n, 3)}`,
          `r = ${r}`,
          r > 0 ? 'r is positive, so the scatter plot slopes upward.' : 'r is negative, so the scatter plot slopes downward.',
        ],
      };
    },
  },
  {
    id: 'scatter-direction-choice',
    sectionId: '12.2',
    conceptTag: '12.2',
    kind: 'mc',
    generate(rng) {
      const n = 6;
      const kind = rng.pick(['strong-positive', 'strong-negative', 'weak'] as const);
      const slope = kind === 'strong-positive' ? 2.5 : kind === 'strong-negative' ? -2.5 : 0;
      const noise = kind === 'weak' ? 25 : 3;
      const xs = Array.from({ length: n }, (_, i) => 4 + i * 3);
      const ys = xs.map((x) => round(30 + slope * x + rng.int(-noise, noise), 1));
      const r = pearson(xs, ys);
      const options = [
        'a strong positive linear relationship',
        'a strong negative linear relationship',
        'little or no linear relationship',
      ];
      const correctIndex = r > 0.7 ? 0 : r < -0.7 ? 1 : 2;
      return {
        sectionId: '12.2',
        conceptTag: '12.2',
        kind: 'mc',
        context: `[TABLE]\nx | ${xs.join(' | ')}\ny | ${ys.join(' | ')}\n[/TABLE]`,
        stem: 'A scatter plot is drawn from these points. What does it show?',
        options,
        correctIndex,
        explanation: [
          'Work out r, or look at whether y moves consistently up or down as x increases.',
          `Here r = ${round(r, 3)}.`,
          correctIndex === 2
            ? '|r| is well below 0.7, so the points do not line up: little or no linear relationship.'
            : `|r| is above 0.7 and r is ${r > 0 ? 'positive' : 'negative'}, so the relationship is strong and ${r > 0 ? 'positive' : 'negative'}.`,
        ],
      };
    },
  },
  {
    id: 'outlier-residual',
    sectionId: '12.6',
    conceptTag: '12.6',
    kind: 'numeric',
    generate(rng) {
      const a = rng.int(5, 40);
      const b = rng.pick([1.5, 2, 2.5, 3, -2, -1.5]);
      const x = rng.int(3, 20);
      const predicted = round(a + b * x, 2);
      const observed = round(predicted + rng.pick([-1, 1]) * rng.int(2, 18), 1);
      const residual = round(observed - predicted, 2);
      return {
        sectionId: '12.6',
        conceptTag: '12.6',
        kind: 'numeric',
        stem: `The least-squares line for a data set is ŷ = ${a} + ${b}x. One observed point is (${x}, ${observed}). What is the residual for that point? Round to two decimal places.`,
        answer: residual,
        tolerance: { abs: 0.02 },
        explanation: [
          'residual = observed y − predicted y.',
          `Predicted: ŷ = ${a} + ${b}(${x}) = ${predicted}`,
          `residual = ${observed} − ${predicted} = ${residual}`,
        ],
      };
    },
  },
  {
    id: 'outlier-two-s-rule',
    sectionId: '12.6',
    conceptTag: '12.6',
    kind: 'tf',
    generate(rng) {
      const s = rng.pick([2, 2.5, 3, 4, 5]);
      const isOutlier = rng.next() < 0.5;
      const magnitude = isOutlier ? round(2 * s + rng.int(1, 6) + rng.next(), 2) : round(rng.next() * 1.8 * s, 2);
      const residual = round(rng.pick([-1, 1]) * magnitude, 2);
      return {
        sectionId: '12.6',
        conceptTag: '12.6',
        kind: 'tf',
        stem: `For a regression the standard deviation of the residuals is s = ${s}. One point has a residual of ${residual}. True or false: that point is an outlier.`,
        answer: Math.abs(residual) > 2 * s,
        explanation: [
          'A point is treated as an outlier when its residual is more than two standard deviations from the line.',
          `2s = 2 × ${s} = ${2 * s}, and |residual| = ${Math.abs(residual)}.`,
          Math.abs(residual) > 2 * s
            ? `${Math.abs(residual)} > ${2 * s}, so the point is an outlier.`
            : `${Math.abs(residual)} is not greater than ${2 * s}, so the point is not an outlier.`,
        ],
      };
    },
  },
];
