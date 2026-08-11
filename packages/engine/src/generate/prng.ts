/** mulberry32 — tiny deterministic PRNG; same seed, same stream. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** djb2 string hash → uint32. Stable across runs; used to key briefs. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

export interface Rng {
  next(): number;
  /** integer in [0, n) */
  int(n: number): number;
  /** pick one element */
  pick<T>(arr: readonly T[]): T;
  /** true with probability p */
  chance(p: number): boolean;
}

export function makeRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    next,
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)]!,
    chance: (p) => next() < p,
  };
}
