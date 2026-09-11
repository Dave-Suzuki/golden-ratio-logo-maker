import fs from 'node:fs/promises';
import path from 'node:path';
import { newProfile } from '../../progress';
import { hashString } from '../../rng';
import type { Profile } from '../../types';
import { ProfileNotFound, type LearnerStore, type ProfileSummary } from './LearnerStore';

export function profileId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'learner';
  return `${slug}-${hashString(name.trim().toLowerCase()).toString(16).padStart(8, '0').slice(0, 6)}`;
}

/** One JSON file per profile under `<dir>/profiles/`. Writes are atomic (tmp + rename) and serialized per id. */
export class JsonFileStore implements LearnerStore {
  private locks = new Map<string, Promise<unknown>>();

  constructor(private readonly dir: string) {}

  private get profilesDir() {
    return path.join(this.dir, 'profiles');
  }

  private file(id: string) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new ProfileNotFound(id);
    return path.join(this.profilesDir, `${id}.json`);
  }

  private async ensureDir() {
    await fs.mkdir(this.profilesDir, { recursive: true });
  }

  private async write(p: Profile) {
    await this.ensureDir();
    const target = this.file(p.id);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(p, null, 1), 'utf8');
    await fs.rename(tmp, target);
  }

  private locked<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(id) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    this.locks.set(id, run.catch(() => undefined));
    return run;
  }

  async list(): Promise<ProfileSummary[]> {
    await this.ensureDir();
    const files = (await fs.readdir(this.profilesDir)).filter((f) => f.endsWith('.json'));
    const out: ProfileSummary[] = [];
    for (const f of files) {
      try {
        const p = JSON.parse(await fs.readFile(path.join(this.profilesDir, f), 'utf8')) as Profile;
        out.push({ id: p.id, name: p.name, updatedAt: p.updatedAt });
      } catch {
        /* skip unreadable file */
      }
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Profile | null> {
    try {
      return JSON.parse(await fs.readFile(this.file(id), 'utf8')) as Profile;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT' || err instanceof ProfileNotFound) return null;
      throw err;
    }
  }

  async findByName(name: string): Promise<Profile | null> {
    return this.get(profileId(name));
  }

  async create(name: string): Promise<Profile> {
    const id = profileId(name);
    return this.locked(id, async () => {
      const existing = await this.get(id);
      if (existing) return existing;
      const p = newProfile(id, name.trim());
      await this.write(p);
      return p;
    });
  }

  async update(id: string, fn: (p: Profile) => Profile): Promise<Profile> {
    return this.locked(id, async () => {
      const current = await this.get(id);
      if (!current) throw new ProfileNotFound(id);
      const next = fn(current);
      await this.write(next);
      return next;
    });
  }

  async remove(id: string): Promise<void> {
    await this.locked(id, async () => {
      try {
        await fs.unlink(this.file(id));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    });
  }
}
