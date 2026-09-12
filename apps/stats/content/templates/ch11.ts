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
  {
    id: 'chi-facts',
    sectionId: '11.1',
    conceptTag: '11.1',
    kind: 'numeric',
    generate(rng) {
      const df = rng.int(3, 40);
      const ask = rng.pick(['mean', 'sd'] as const);
      const ans = ask === 'mean' ? df : round(Math.sqrt(2 * df), 3);
      return {
        sectionId: '11.1',
        conceptTag: '11.1',
        kind: 'numeric',
        stem: `A chi-square distribution has ${df} degrees of freedom. Find its ${ask === 'mean' ? 'mean' : 'standard deviation (round to three decimals)'}.`,
        answer: ans,
        tolerance: { abs: ask === 'mean' ? 0.01 : 0.006 },
        explanation:
          ask === 'mean'
            ? [`For a chi-square distribution the mean equals the degrees of freedom: μ = df = ${df}.`]
            : [`For a chi-square distribution σ = √(2·df) = √(2 × ${df}) = √${2 * df} = ${ans}.`],
      };
    },
  },
  {
    id: 'chi-shape',
    sectionId: '11.1',
    conceptTag: '11.1',
    kind: 'mc',
    generate(rng) {
      const which = rng.pick(['shape', 'tail', 'grows', 'negative'] as const);
      const q = {
        shape: {
          stem: 'Which statement describes the shape of a chi-square distribution with small degrees of freedom?',
          options: ['Skewed to the right', 'Skewed to the left', 'Symmetric and bell-shaped', 'Uniform'],
          why: 'Chi-square values cannot be negative and have a long right tail, so the curve is skewed right; it becomes more symmetric as df increases.',
        },
        tail: {
          stem: 'A goodness-of-fit or independence test uses which tail of the chi-square distribution?',
          options: ['The right tail', 'The left tail', 'Both tails equally', 'Neither; it uses the center'],
          why: 'A poor fit makes Σ(O − E)²/E large, so evidence against H0 sits in the right tail.',
        },
        grows: {
          stem: 'What happens to a chi-square distribution as the degrees of freedom increase?',
          options: ['It becomes more symmetric', 'It becomes more skewed', 'It becomes uniform', 'Its mean drops to zero'],
          why: 'The mean is df and the skew decreases as df grows, so the curve approaches a symmetric shape.',
        },
        negative: {
          stem: 'Can a chi-square test statistic be negative?',
          options: ['No, it is a sum of squared terms divided by positive expected counts', 'Yes, when observed counts are below expected', 'Yes, for a left-tailed test', 'Only when df = 1'],
          why: 'Every term is (O − E)²/E: the numerator is squared and E is positive, so the total cannot be negative.',
        },
      }[which];
      return {
        sectionId: '11.1',
        conceptTag: '11.1',
        kind: 'mc',
        stem: q.stem,
        options: q.options,
        correctIndex: 0,
        explanation: [q.why],
      };
    },
  },
  {
    id: 'chi-test-choice',
    sectionId: '11.5',
    conceptTag: '11.5',
    kind: 'mc',
    generate(rng) {
      const which = rng.pick(['gof', 'independence', 'homogeneity', 'variance'] as const);
      const stem = {
        gof: 'A researcher records the colour of 200 cars and asks whether the colours occur in the proportions the manufacturer claims. Which chi-square test applies?',
        independence: 'A single sample of 300 people is classified by both age group and preferred device, to ask whether the two are related. Which chi-square test applies?',
        homogeneity: 'Separate random samples are taken at three campuses and each student is classified by commute method, to ask whether the campuses have the same distribution. Which chi-square test applies?',
        variance: 'A machinist claims the standard deviation of a part\u2019s diameter is 0.5 mm. A sample of 20 parts is measured to test that claim. Which chi-square test applies?',
      }[which];
      const correct = { gof: 'goodness-of-fit', independence: 'test of independence', homogeneity: 'test for homogeneity', variance: 'test of a single variance' }[which];
      const options = rng.shuffle(['goodness-of-fit', 'test of independence', 'test for homogeneity', 'test of a single variance']);
      return {
        sectionId: '11.5',
        conceptTag: '11.5',
        kind: 'mc',
        stem,
        options,
        correctIndex: options.indexOf(correct),
        explanation: [
          'Goodness-of-fit: one variable compared with a claimed distribution. Independence: one sample classified by two variables. Homogeneity: several populations compared on one variable. Single variance: a claim about \u03c3 or \u03c3\u00b2.',
          `This is a ${correct}.`,
        ],
      };
    },
  },
  {
    id: 'chi-test-df',
    sectionId: '11.5',
    conceptTag: '11.5',
    kind: 'numeric',
    generate(rng) {
      const gof = rng.next() < 0.5;
      const k = rng.int(4, 7);
      const r = rng.int(2, 5);
      const c = rng.int(2, 5);
      return {
        sectionId: '11.5',
        conceptTag: '11.5',
        kind: 'numeric',
        stem: gof
          ? `A goodness-of-fit test compares observed counts across ${k} categories with a claimed distribution. How many degrees of freedom does it have?`
          : `A test of independence uses a table with ${r} rows and ${c} columns. How many degrees of freedom does it have?`,
        answer: gof ? k - 1 : (r - 1) * (c - 1),
        tolerance: { abs: 0.01 },
        explanation: gof
          ? [`Goodness-of-fit: df = number of categories − 1 = ${k} − 1 = ${k - 1}.`]
          : [`Independence and homogeneity: df = (rows − 1)(columns − 1) = (${r} − 1)(${c} − 1) = ${(r - 1) * (c - 1)}.`],
      };
    },
  },
];
