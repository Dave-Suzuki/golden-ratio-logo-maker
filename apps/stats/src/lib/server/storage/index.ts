import path from 'node:path';
import type { LearnerStore } from './LearnerStore';
import { JsonFileStore } from './jsonFileStore';

let store: LearnerStore | null = null;

/** Process-wide store. `STATS_DATA_DIR` overrides the default `<app>/data`. */
export function getStore(): LearnerStore {
  if (!store) store = new JsonFileStore(process.env.STATS_DATA_DIR ?? path.join(process.cwd(), 'data'));
  return store;
}

export { JsonFileStore } from './jsonFileStore';
export { ProfileNotFound } from './LearnerStore';
export type { LearnerStore } from './LearnerStore';
