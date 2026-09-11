import type { Template } from '../../src/lib/types';

const DATA_ITEMS = [
  ['the number of pets a household owns', 'quantitative discrete'],
  ['the weight of a newborn baby', 'quantitative continuous'],
  ['the color of a car', 'qualitative (categorical)'],
  ['the time it takes to run a mile', 'quantitative continuous'],
  ['the number of text messages sent in a day', 'quantitative discrete'],
  ['a student’s major', 'qualitative (categorical)'],
  ['the amount of rain in a month', 'quantitative continuous'],
  ['the number of siblings a person has', 'quantitative discrete'],
  ['the brand of phone a person uses', 'qualitative (categorical)'],
  ['the height of a tree', 'quantitative continuous'],
] as const;

const SAMPLING = [
  ['A manager numbers all 300 employees and uses a random number generator to pick 30 of them.', 'simple random'],
  ['A pollster divides the city into neighborhoods, randomly selects five neighborhoods, and surveys everyone living in them.', 'cluster'],
  ['A researcher separates students by class year and randomly picks 20 students from each year.', 'stratified'],
  ['A store surveys every 15th customer who walks in.', 'systematic'],
  ['A reporter interviews the first 40 people she meets at the mall.', 'convenience'],
  ['A teacher puts all names in a hat and draws ten without looking.', 'simple random'],
  ['A hospital randomly selects three of its twelve wards and interviews every nurse in those wards.', 'cluster'],
  ['A company randomly picks 10% of employees from each department.', 'stratified'],
  ['An auditor checks every 50th invoice in the file.', 'systematic'],
] as const;

const SAMPLING_TYPES = ['simple random', 'stratified', 'cluster', 'systematic', 'convenience'];

const LEVELS = [
  ['colors of cars in a parking lot', 'nominal'],
  ['finishing places in a race (1st, 2nd, 3rd)', 'ordinal'],
  ['temperatures in degrees Celsius', 'interval'],
  ['weights of packages in kilograms', 'ratio'],
  ['survey responses of "poor", "fair", "good", "excellent"', 'ordinal'],
  ['years in which buildings were constructed', 'interval'],
  ['number of children in a family', 'ratio'],
  ['zip codes', 'nominal'],
] as const;

export const CH01_TEMPLATES: Template[] = [
  {
    id: 'data-type',
    sectionId: '1.2',
    conceptTag: '1.2',
    kind: 'mc',
    generate(rng) {
      const [item, answer] = rng.pick(DATA_ITEMS);
      const options = ['quantitative discrete', 'quantitative continuous', 'qualitative (categorical)'];
      return {
        sectionId: '1.2',
        conceptTag: '1.2',
        kind: 'mc',
        stem: `What type of data is ${item}?`,
        options,
        correctIndex: options.indexOf(answer),
        explanation: [
          'Qualitative (categorical) data sorts into categories; quantitative data is numeric.',
          'Quantitative data is discrete when it results from counting and continuous when it results from measuring.',
          `${item[0]!.toUpperCase()}${item.slice(1)} is ${answer}.`,
        ],
      };
    },
  },
  {
    id: 'sampling-method',
    sectionId: '1.2',
    conceptTag: '1.2',
    kind: 'mc',
    generate(rng) {
      const [scenario, answer] = rng.pick(SAMPLING);
      const options = rng.shuffle(SAMPLING_TYPES).slice(0, 4);
      if (!options.includes(answer)) options[3] = answer;
      return {
        sectionId: '1.2',
        conceptTag: '1.2',
        kind: 'mc',
        stem: `${scenario} Which sampling method is this?`,
        options,
        correctIndex: options.indexOf(answer),
        explanation: [
          'Simple random: every sample of size n equally likely. Stratified: divide into groups, sample from each. Cluster: divide into groups, take all of some randomly chosen groups. Systematic: every kth member. Convenience: whoever is easy to reach.',
          `This is ${answer} sampling.`,
        ],
      };
    },
  },
  {
    id: 'measurement-level',
    sectionId: '1.3',
    conceptTag: '1.3',
    kind: 'mc',
    generate(rng) {
      const [item, answer] = rng.pick(LEVELS);
      const options = ['nominal', 'ordinal', 'interval', 'ratio'];
      return {
        sectionId: '1.3',
        conceptTag: '1.3',
        kind: 'mc',
        stem: `What is the level of measurement of ${item}?`,
        options,
        correctIndex: options.indexOf(answer),
        explanation: [
          'Nominal: categories with no order. Ordinal: ordered categories, differences not meaningful. Interval: ordered with meaningful differences but no true zero. Ratio: meaningful differences and a true zero.',
          `${item[0]!.toUpperCase()}${item.slice(1)} are measured at the ${answer} level.`,
        ],
      };
    },
  },
  {
    id: 'relative-frequency',
    sectionId: '1.3',
    conceptTag: '1.3',
    kind: 'numeric',
    generate(rng) {
      const cats = ['0', '1', '2', '3', '4'];
      const freqs = cats.map(() => rng.int(2, 12));
      const n = freqs.reduce((a, b) => a + b, 0);
      const k = rng.int(0, 4);
      const cumulative = rng.next() < 0.5;
      const cumSum = freqs.slice(0, k + 1).reduce((a, b) => a + b, 0);
      const ans = Math.round(((cumulative ? cumSum : (freqs[k] as number)) / n) * 10000) / 10000;
      return {
        sectionId: '1.3',
        conceptTag: '1.3',
        kind: 'numeric',
        context: `Number of days per week that ${n} students exercise.\n[TABLE]\nDays | Frequency\n${cats.map((c, i) => `${c} | ${freqs[i]}`).join('\n')}\n[/TABLE]`,
        stem: `Find the ${cumulative ? 'cumulative relative frequency' : 'relative frequency'} for ${k} days. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.0006 },
        explanation: cumulative
          ? [`Cumulative frequency up to ${k} days = ${freqs.slice(0, k + 1).join(' + ')} = ${cumSum}`, `Cumulative relative frequency = ${cumSum} / ${n} = ${ans}`]
          : [`Relative frequency = frequency / total = ${freqs[k]} / ${n} = ${ans}`],
      };
    },
  },
];
