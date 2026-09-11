import { describe, expect, it } from 'vitest';
import { hashString, mulberry32, rngFor } from '@/lib/rng';

describe('rng', () => {
  it('hashString is stable', () => {
    expect(hashString('section:6.1:7')).toBe(hashString('section:6.1:7'));
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(hashString('')).toBe(0x811c9dc5);
  });
  it('same seed → same sequence; different seed → different', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    const sc = Array.from({ length: 10 }, () => c.next());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    sa.forEach((v) => expect(v >= 0 && v < 1).toBe(true));
  });
  it('shuffle is a permutation and int/float respect bounds', () => {
    const r = rngFor('x', 1);
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const s = r.shuffle(arr);
    expect([...s].sort()).toEqual([...arr].sort());
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (let i = 0; i < 200; i++) {
      const v = r.int(3, 5);
      expect(v >= 3 && v <= 5).toBe(true);
      const f = r.float(1, 2, 1);
      expect(f >= 1 && f <= 2).toBe(true);
      expect(String(f).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(1);
    }
    expect(r.sample([1, 2, 3], 5)).toHaveLength(3);
  });
});
