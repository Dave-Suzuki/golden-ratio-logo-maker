import type { Profile } from '../../types';

export class ProfileNotFound extends Error {
  constructor(id: string) {
    super(`profile not found: ${id}`);
    this.name = 'ProfileNotFound';
  }
}

export interface ProfileSummary {
  id: string;
  name: string;
  updatedAt: string;
}

/** Persistence boundary. Swap JsonFileStore for a database by implementing this interface. */
export interface LearnerStore {
  list(): Promise<ProfileSummary[]>;
  get(id: string): Promise<Profile | null>;
  findByName(name: string): Promise<Profile | null>;
  create(name: string): Promise<Profile>;
  /** read-modify-write under a per-profile lock */
  update(id: string, fn: (p: Profile) => Profile): Promise<Profile>;
  remove(id: string): Promise<void>;
}
