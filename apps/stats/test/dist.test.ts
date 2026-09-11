import { describe, expect, it } from 'vitest';
import { binomCdf, binomPmf, normalCdf, normalInv, poissonPmf } from '@/lib/stats/dist';
import { mean, median, quartiles, sampleSd } from '@/lib/stats/descriptive';

describe('distributions', () => {
  it('normal cdf / inverse against table values', () => {
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1)).toBeCloseTo(0.1587, 3);
    expect(normalInv(0.975)).toBeCloseTo(1.96, 2);
    expect(normalInv(0.95)).toBeCloseTo(1.645, 2);
    expect(normalInv(0.3, 36.9, 13.9)).toBeCloseTo(29.6, 1); // OpenStax Try It 6.10
    expect(normalCdf(65, 68, 3)).toBeCloseTo(0.1587, 3); // Try It 6.8
  });
  it('binomial and poisson', () => {
    let s = 0;
    for (let k = 0; k <= 20; k++) s += binomPmf(20, 0.41, k);
    expect(s).toBeCloseTo(1, 8);
    expect(binomCdf(20, 0.41, 12)).toBeCloseTo(0.9738, 3); // OpenStax Example 4.13 (P(x ≤ 12))
    expect(poissonPmf(2, 0)).toBeCloseTo(Math.exp(-2), 6);
  });
  it('descriptive stats use the OpenStax quartile convention', () => {
    const xs = [1, 1, 2, 2, 4, 6, 6.8, 7.2, 8, 8.3, 9, 10, 10, 11.5];
    const q = quartiles(xs);
    expect(q.q2).toBeCloseTo(7, 6);
    expect(q.q1).toBe(2);
    expect(q.q3).toBe(9);
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(sampleSd([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
  });
});
