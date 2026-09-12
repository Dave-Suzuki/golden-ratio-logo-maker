import { mean, median, quartiles, sampleSd } from '../../src/lib/stats/descriptive';
import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

const SCENARIOS = [
  ['quiz scores', 'points', 60, 100],
  ['commute times', 'minutes', 10, 60],
  ['weekly hours worked', 'hours', 5, 40],
  ['prices of lunch', 'dollars', 6, 18],
  ['ages of club members', 'years', 18, 65],
] as const;

export const CH02_TEMPLATES: Template[] = [
  {
    id: 'desc-mean-median',
    sectionId: '2.5',
    conceptTag: '2.5',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(7, 9);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
      const askMean = rng.next() < 0.5;
      const m = round(mean(xs), 2);
      const md = median(xs);
      return {
        sectionId: '2.5',
        conceptTag: '2.5',
        kind: 'numeric',
        stem: `A sample of ${n} ${what} (${unit}) is: ${xs.join('; ')}. Find the sample ${askMean ? 'mean' : 'median'}.`,
        answer: askMean ? m : md,
        tolerance: { abs: 0.01 },
        explanation: askMean
          ? [`Sum = ${xs.reduce((a, b) => a + b, 0)}`, `Mean = ${xs.reduce((a, b) => a + b, 0)} / ${n} = ${m}`]
          : [`Ordered data: ${xs.join(', ')}`, n % 2 ? `Middle value (position ${(n + 1) / 2}) = ${md}` : `Average of the two middle values = ${md}`],
      };
    },
  },
  {
    id: 'desc-sample-sd',
    sectionId: '2.7',
    conceptTag: '2.7',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(5, 7);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi));
      const m = mean(xs);
      const s = round(sampleSd(xs), 2);
      const devs = xs.map((x) => round((x - m) ** 2, 4));
      return {
        sectionId: '2.7',
        conceptTag: '2.7',
        kind: 'numeric',
        stem: `Sample of ${what} (${unit}): ${xs.join('; ')}. Find the sample standard deviation s (round to two decimals).`,
        answer: s,
        tolerance: { abs: 0.02 },
        explanation: [
          `x̄ = ${round(m, 4)}`,
          `Squared deviations: ${devs.join(', ')} → sum = ${round(devs.reduce((a, b) => a + b, 0), 4)}`,
          `s² = sum / (n − 1) = ${round(devs.reduce((a, b) => a + b, 0), 4)} / ${n - 1} = ${round(devs.reduce((a, b) => a + b, 0) / (n - 1), 4)}`,
          `s = √(s²) = ${s}`,
        ],
      };
    },
  },
  {
    id: 'desc-zscore-data',
    sectionId: '2.7',
    conceptTag: '2.7',
    kind: 'numeric',
    generate(rng) {
      const mu = rng.int(40, 90);
      const s = rng.int(3, 12);
      const x = mu + rng.int(-3, 3) * s + rng.int(-2, 2);
      const z = round((x - mu) / s, 2);
      return {
        sectionId: '2.7',
        conceptTag: '2.7',
        kind: 'numeric',
        stem: `A data set has mean ${mu} and standard deviation ${s}. How many standard deviations from the mean is the value x = ${x}? (Give the z-score, two decimals.)`,
        answer: z,
        tolerance: { abs: 0.01 },
        explanation: [`z = (x − x̄) / s = (${x} − ${mu}) / ${s} = ${z}`, z < 0 ? `The value is ${Math.abs(z)} standard deviations below the mean.` : `The value is ${z} standard deviations above the mean.`],
      };
    },
  },
  {
    id: 'desc-quartiles-iqr',
    sectionId: '2.3',
    conceptTag: '2.3',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(9, 12);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
      const q = quartiles(xs);
      const ask = rng.pick(['q1', 'q3', 'iqr'] as const);
      const label = { q1: 'first quartile Q1', q3: 'third quartile Q3', iqr: 'interquartile range IQR' }[ask];
      return {
        sectionId: '2.3',
        conceptTag: '2.3',
        kind: 'numeric',
        stem: `Ordered ${what} (${unit}): ${xs.join('; ')}. Find the ${label}.`,
        answer: q[ask],
        tolerance: { abs: 0.01 },
        explanation: [
          `Median (Q2) = ${q.q2}`,
          `Q1 = median of the lower half = ${q.q1}; Q3 = median of the upper half = ${q.q3}`,
          `IQR = Q3 − Q1 = ${q.q3} − ${q.q1} = ${q.iqr}`,
        ],
      };
    },
  },
  {
    id: 'desc-outlier-fence',
    sectionId: '2.4',
    conceptTag: '2.4',
    kind: 'tf',
    generate(rng) {
      const q1 = rng.int(20, 40);
      const iqr = rng.int(6, 15);
      const q3 = q1 + iqr;
      const upper = q3 + 1.5 * iqr;
      const isOut = rng.next() < 0.5;
      const x = isOut ? upper + rng.int(1, 6) : upper - rng.int(1, 6);
      return {
        sectionId: '2.4',
        conceptTag: '2.4',
        kind: 'tf',
        stem: `A data set has Q1 = ${q1} and Q3 = ${q3}. True or false: the value ${x} is a potential outlier by the 1.5·IQR rule.`,
        answer: isOut,
        explanation: [`IQR = ${q3} − ${q1} = ${iqr}`, `Upper fence = Q3 + 1.5·IQR = ${q3} + ${1.5 * iqr} = ${upper}`, isOut ? `${x} > ${upper}, so it is a potential outlier.` : `${x} ≤ ${upper}, so it is not a potential outlier.`],
      };
    },
  },
  {
    id: 'skew-direction',
    sectionId: '2.6',
    conceptTag: '2.6',
    kind: 'mc',
    generate(rng) {
      const shape = rng.pick(['right', 'left', 'symmetric'] as const);
      const median = rng.int(30, 80);
      const mean = shape === 'right' ? median + rng.int(3, 12) : shape === 'left' ? median - rng.int(3, 12) : median;
      const what = rng.pick(['house prices in a town', 'salaries at a company', 'exam scores', 'ages of customers', 'waiting times at a clinic']);
      const options = ['skewed to the right', 'skewed to the left', 'symmetric'];
      const correct = { right: 0, left: 1, symmetric: 2 }[shape];
      return {
        sectionId: '2.6',
        conceptTag: '2.6',
        kind: 'mc',
        stem: `For a data set of ${what}, the mean is ${mean} and the median is ${median}. What is the shape of the distribution?`,
        options,
        correctIndex: correct,
        explanation: [
          'The mean is pulled toward the long tail; the median is not.',
          shape === 'right'
            ? `mean (${mean}) > median (${median}), so the tail is on the right: skewed right.`
            : shape === 'left'
              ? `mean (${mean}) < median (${median}), so the tail is on the left: skewed left.`
              : `mean and median are both ${mean}, so neither tail is longer: symmetric.`,
        ],
      };
    },
  },
  {
    id: 'skew-center-choice',
    sectionId: '2.6',
    conceptTag: '2.6',
    kind: 'mc',
    generate(rng) {
      const skewed = rng.next() < 0.6;
      const what = skewed
        ? rng.pick(['incomes in a city', 'house prices', 'hospital stay lengths', 'donation amounts'])
        : rng.pick(['adult heights', 'daily temperatures in June', 'bolt diameters from a machine']);
      return {
        sectionId: '2.6',
        conceptTag: '2.6',
        kind: 'mc',
        stem: `A distribution of ${what} is ${skewed ? 'strongly skewed to the right' : 'roughly symmetric with no outliers'}. Which measure of center best describes it?`,
        options: skewed ? ['the median', 'the mean', 'the mode', 'the range'] : ['the mean', 'the median', 'the mode', 'the range'],
        correctIndex: 0,
        explanation: [
          skewed
            ? 'A few very large values drag the mean toward the tail, so the mean overstates a typical value.'
            : 'With no skew or outliers the mean uses every value and is the most efficient summary.',
          `Use the ${skewed ? 'median' : 'mean'} here. (The range is a measure of spread, not center.)`,
        ],
      };
    },
  },
];

/**
 * Display-graph generators. Chapter 2's first two sections are about reading graphs, and almost
 * every textbook exercise there asks for one to be drawn — which the app cannot mark — so after
 * the audit removed those, both sections were left too thin to fill a quiz. These ask the
 * arithmetic behind the picture instead, which is the part a learner actually gets wrong.
 */
export const CH02_DISPLAY_TEMPLATES: Template[] = [
  {
    id: 'stemplot-leaf-count',
    sectionId: '2.1',
    conceptTag: '2.1',
    kind: 'numeric',
    generate(rng) {
      const stem = rng.int(3, 8);
      const onStem = rng.int(3, 7);
      const values = [
        ...Array.from({ length: onStem }, () => stem * 10 + rng.int(0, 9)),
        ...Array.from({ length: rng.int(6, 10) }, () => rng.pick([stem - 2, stem - 1, stem + 1, stem + 2]) * 10 + rng.int(0, 9)),
      ];
      const shuffled = rng.shuffle(values);
      const count = shuffled.filter((v) => Math.floor(v / 10) === stem).length;
      return {
        sectionId: '2.1',
        conceptTag: '2.1',
        kind: 'numeric',
        stem: `A stem-and-leaf plot of the data below uses the tens digit as the stem.\n\n[DATA]${shuffled.join(', ')}[/DATA]\n\nHow many leaves are on the stem ${stem}?`,
        answer: count,
        tolerance: { abs: 0.01 },
        explanation: [
          `The stem ${stem} holds every value from ${stem * 10} to ${stem * 10 + 9}.`,
          `Those values are: ${shuffled.filter((v) => Math.floor(v / 10) === stem).sort((a, b) => a - b).join(', ') || 'none'}.`,
          `That is ${count} leaf${count === 1 ? '' : 'ves'}.`,
        ],
      };
    },
  },
  {
    id: 'bar-relative-frequency',
    sectionId: '2.1',
    conceptTag: '2.1',
    kind: 'numeric',
    generate(rng) {
      const labels = rng.shuffle(['walk', 'cycle', 'bus', 'car', 'train']).slice(0, 4);
      const counts = labels.map(() => rng.int(8, 60));
      const total = counts.reduce((a, b) => a + b, 0);
      const i = rng.int(0, labels.length - 1);
      const pct = round(((counts[i] as number) / total) * 100, 1);
      return {
        sectionId: '2.1',
        conceptTag: '2.1',
        kind: 'numeric',
        context: `A bar graph shows how ${total} students travel to college.\n[TABLE]\nMethod | ${labels.join(' | ')}\nStudents | ${counts.join(' | ')}\n[/TABLE]`,
        stem: `What percentage of the students travel by ${labels[i]}? Round to one decimal place.`,
        answer: pct,
        tolerance: { abs: 0.06 },
        explanation: [
          `Total = ${counts.join(' + ')} = ${total}`,
          `Relative frequency = ${counts[i]} / ${total} = ${round((counts[i] as number) / total, 4)}`,
          `As a percentage: ${pct}%`,
        ],
      };
    },
  },
  {
    id: 'histogram-bar-width',
    sectionId: '2.2',
    conceptTag: '2.2',
    kind: 'numeric',
    generate(rng) {
      const bars = rng.pick([4, 5, 6, 8]);
      const width = rng.pick([2, 2.5, 3, 4, 5]);
      const min = rng.int(1, 30);
      const max = round(min + bars * width, 2);
      const what = rng.pick(['the ages of visitors to a museum', 'the weights of parcels', 'daily rainfall in millimetres', 'the lengths of phone calls in minutes']);
      return {
        sectionId: '2.2',
        conceptTag: '2.2',
        kind: 'numeric',
        stem: `A histogram of ${what} is drawn with ${bars} bars of equal width. The smallest value is ${min} and the largest is ${max}. What is the width of each bar?`,
        answer: width,
        tolerance: { abs: 0.01 },
        explanation: [
          'Bar width = (largest value − smallest value) ÷ number of bars.',
          `= (${max} − ${min}) ÷ ${bars} = ${round(max - min, 2)} ÷ ${bars} = ${width}`,
        ],
      };
    },
  },
  {
    id: 'histogram-cumulative-relative',
    sectionId: '2.2',
    conceptTag: '2.2',
    kind: 'numeric',
    generate(rng) {
      const k = rng.pick([4, 5]);
      const counts = Array.from({ length: k }, () => rng.int(5, 40));
      const total = counts.reduce((a, b) => a + b, 0);
      const upTo = rng.int(1, k - 1);
      const running = counts.slice(0, upTo + 1).reduce((a, b) => a + b, 0);
      const ans = round(running / total, 3);
      const lo = 0;
      const edges = Array.from({ length: k }, (_, i) => `${lo + i * 5}–${lo + (i + 1) * 5}`);
      return {
        sectionId: '2.2',
        conceptTag: '2.2',
        kind: 'numeric',
        context: `A frequency table of hours studied per week by ${total} students.\n[TABLE]\nHours | ${edges.join(' | ')}\nFrequency | ${counts.join(' | ')}\n[/TABLE]`,
        stem: `What is the cumulative relative frequency for the class ${edges[upTo]}? Round to three decimal places.`,
        answer: ans,
        tolerance: { abs: 0.002 },
        explanation: [
          'Cumulative relative frequency = (frequency of this class and all classes below it) ÷ total.',
          `= (${counts.slice(0, upTo + 1).join(' + ')}) ÷ ${total} = ${running} ÷ ${total}`,
          `= ${ans}`,
        ],
      };
    },
  },
];
