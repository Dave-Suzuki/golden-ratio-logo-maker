/** Browser build of the learner store: the page's own database when available, localStorage otherwise. */
import { newProfile } from '../lib/progress';
import { hashString } from '../lib/rng';
import type { Profile } from '../lib/types';
import { ProfileNotFound, type LearnerStore, type ProfileSummary } from '../lib/server/storage/LearnerStore';

export { ProfileNotFound } from '../lib/server/storage/LearnerStore';
export type { LearnerStore } from '../lib/server/storage/LearnerStore';

interface DocSnap {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  get(): Promise<DocSnap>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
}
interface Db {
  doc(path: string): DocRef;
  collection(path: string): { get(): Promise<{ docs: DocSnap[] }> };
}

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

export function profileId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'learner';
  return `${slug}-${hashString(name.trim().toLowerCase()).toString(16).padStart(8, '0').slice(0, 6)}`;
}

const MAX_MISTAKES = 300;
const MAX_ATTEMPTS = 200;

function trim(p: Profile): Profile {
  return { ...p, mistakes: p.mistakes.slice(-MAX_MISTAKES), attempts: p.attempts.slice(-MAX_ATTEMPTS) };
}

class LocalBackend {
  private key(id: string) {
    return `stats-profile:${id}`;
  }
  async list(): Promise<Profile[]> {
    const out: Profile[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('stats-profile:')) out.push(JSON.parse(localStorage.getItem(k) ?? 'null') as Profile);
      }
    } catch {
      /* storage unavailable */
    }
    return out.filter(Boolean);
  }
  async get(id: string): Promise<Profile | null> {
    try {
      const raw = localStorage.getItem(this.key(id));
      return raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      return null;
    }
  }
  async put(p: Profile): Promise<void> {
    localStorage.setItem(this.key(p.id), JSON.stringify(p));
  }
  async remove(id: string): Promise<void> {
    localStorage.removeItem(this.key(id));
  }
}

class DbBackend {
  constructor(private db: Db) {}
  async list(): Promise<Profile[]> {
    const snap = await this.db.collection('profiles').get();
    return snap.docs.map((d) => d.data() as unknown as Profile).filter((p) => p && p.id);
  }
  async get(id: string): Promise<Profile | null> {
    const snap = await this.db.doc(`profiles/${id}`).get();
    return snap.exists ? (snap.data() as unknown as Profile) : null;
  }
  async put(p: Profile): Promise<void> {
    await this.db.doc(`profiles/${p.id}`).set(p as unknown as Record<string, unknown>);
  }
  async remove(id: string): Promise<void> {
    await this.db.doc(`profiles/${id}`).delete();
  }
}

type Backend = LocalBackend | DbBackend;

let backendPromise: Promise<Backend> | null = null;

function backend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = (async () => {
      try {
        const use = window.claude?.use;
        if (use) {
          const db = (await Promise.race([use.call(window.claude, 'db'), new Promise<null>((r) => setTimeout(() => r(null), 8000))])) as Db | null;
          if (db) return new DbBackend(db);
        }
      } catch {
        /* fall through */
      }
      return new LocalBackend();
    })();
  }
  return backendPromise;
}

export async function storageKind(): Promise<'page' | 'browser'> {
  return (await backend()) instanceof DbBackend ? 'page' : 'browser';
}

class BrowserStore implements LearnerStore {
  private locks = new Map<string, Promise<unknown>>();
  private locked<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(id) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    this.locks.set(id, run.catch(() => undefined));
    return run;
  }
  async list(): Promise<ProfileSummary[]> {
    const b = await backend();
    return (await b.list()).map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt })).sort((a, c) => c.updatedAt.localeCompare(a.updatedAt));
  }
  async get(id: string): Promise<Profile | null> {
    if (!/^[a-z0-9-]+$/.test(id)) return null;
    return (await backend()).get(id);
  }
  async findByName(name: string): Promise<Profile | null> {
    return this.get(profileId(name));
  }
  async create(name: string): Promise<Profile> {
    const id = profileId(name);
    return this.locked(id, async () => {
      const b = await backend();
      const existing = await b.get(id);
      if (existing) return existing;
      const p = newProfile(id, name.trim());
      await b.put(p);
      return p;
    });
  }
  async update(id: string, fn: (p: Profile) => Profile): Promise<Profile> {
    return this.locked(id, async () => {
      const b = await backend();
      const cur = await b.get(id);
      if (!cur) throw new ProfileNotFound(id);
      const next = trim(fn(cur));
      await b.put(next);
      return next;
    });
  }
  async remove(id: string): Promise<void> {
    await this.locked(id, async () => (await backend()).remove(id));
  }
}

let store: LearnerStore | null = null;
export function getStore(): LearnerStore {
  if (!store) store = new BrowserStore();
  return store;
}
