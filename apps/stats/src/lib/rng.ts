import type { Rng } from './types';

/** FNV-1a 32-bit hash, unsigned. Stable across platforms. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, deterministic PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int(lo, hi) {
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    float(lo, hi, decimals = 2) {
      const v = lo + next() * (hi - lo);
      const f = 10 ** decimals;
      return Math.round(v * f) / f;
    },
    pick(arr) {
      if (arr.length === 0) throw new Error('pick from empty array');
      return arr[Math.floor(next() * arr.length)] as (typeof arr)[number];
    },
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
    sample(arr, n) {
      return rng.shuffle(arr).slice(0, Math.max(0, Math.min(n, arr.length)));
    },
  };
  return rng;
}

export function rngFor(...parts: (string | number)[]): Rng {
  return mulberry32(hashString(parts.join(':')));
}
