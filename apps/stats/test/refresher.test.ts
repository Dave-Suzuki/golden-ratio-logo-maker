import { describe, expect, it } from 'vitest';
import { refresherSectionFor, relevantTo } from '@/lib/refresher';
import { allQuestions } from '@/lib/server/content';

const q = (over: Partial<Parameters<typeof refresherSectionFor>[0]>) => ({ stem: '', sectionId: '1.1', source: 'openstax-practice-test', ...over });

describe('refresherSectionFor', () => {
  it('matches the topic a practice-test question tests, not the heading it sits under', () => {
    // real item pt1-2: filed under 1.1 "Key Terms" but it is a data-types question, which is 1.2
    expect(
      refresherSectionFor(
        q({ stem: 'What kind of data is “amount of money spent on produce per visit”?', options: ['qualitative', 'quantitative-continuous', 'quantitative-discrete'] }),
      ),
    ).toBe('1.2');
    // real item pt1-6: filed under 1.2 but it is about parameter versus statistic, which is 1.1
    expect(refresherSectionFor(q({ stem: 'Describe a situation in which you would calculate a parameter, rather than a statistic.', sectionId: '1.2' }))).toBe('1.1');
  });

  it('never second-guesses a question that came from its own section', () => {
    for (const source of ['openstax-practice', 'openstax-homework', 'openstax-tryit']) {
      expect(refresherSectionFor(q({ stem: 'What kind of data is this? qualitative quantitative', sectionId: '1.1', source })), source).toBe('1.1');
    }
  });

  it('stays inside the chapter the question was filed under', () => {
    const got = refresherSectionFor(q({ stem: 'A manager draws a sample without replacement of 30 employees.', sectionId: '1.2' }));
    expect(got?.startsWith('1.')).toBe(true);
  });

  it('keeps the section when nothing matches better', () => {
    expect(refresherSectionFor(q({ stem: 'Identify the parameter and the statistic in this study.', sectionId: '1.1' }))).toBe('1.1');
    expect(refresherSectionFor(q({ stem: '', sectionId: '2.5' }))).toBe('2.5');
    expect(refresherSectionFor(q({ stem: 'anything', sectionId: null }))).toBeNull();
  });

  it('changes the section for only a small minority of the bank', () => {
    let changed = 0;
    let total = 0;
    for (const item of allQuestions()) {
      if (!item.sectionId) continue;
      total++;
      if (refresherSectionFor({ ...item, options: item.kind === 'mc' ? item.options : undefined }) !== item.sectionId) changed++;
    }
    // a high rate would mean the matcher is overriding labels that were right all along
    expect(changed / total).toBeLessThan(0.1);
  });
});

describe('relevantTo', () => {
  it('keeps only the warnings that bear on the question asked', () => {
    const pitfalls = [
      'Confusing stratified (some from every group) with cluster (all from some groups).',
      'Treating numeric codes such as zip codes as quantitative — they are labels.',
    ];
    const got = relevantTo('What kind of data is “amount of money spent on produce per visit”? qualitative quantitative-discrete quantitative-continuous', pitfalls);
    expect(got).toEqual([pitfalls[1]]);
  });

  it('falls back to everything when nothing matches, rather than showing nothing', () => {
    const pitfalls = ['Something entirely unrelated about chi-square.'];
    expect(relevantTo('Find the median of the data.', pitfalls)).toEqual(pitfalls);
    expect(relevantTo('', pitfalls)).toEqual(pitfalls);
  });

  it('puts the closest match first', () => {
    const got = relevantTo('Should I use the mean or the median for a skewed distribution?', [
      'Dividing by n instead of n − 1 for a sample standard deviation.',
      'Naming the skew by where the peak is — skew is named for the direction of the long tail.',
    ]);
    expect(got[0]).toContain('skew');
  });
});
