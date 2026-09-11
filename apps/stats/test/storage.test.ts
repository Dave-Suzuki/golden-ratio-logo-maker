import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JsonFileStore } from '@/lib/server/storage/jsonFileStore';
import { ProfileNotFound } from '@/lib/server/storage/LearnerStore';

let dir: string;
let store: JsonFileStore;

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stats-store-'));
  store = new JsonFileStore(dir);
});
afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('JsonFileStore', () => {
  it('create is idempotent by name and list/get/findByName work', async () => {
    const a = await store.create('Dave Suzuki');
    const b = await store.create('dave suzuki');
    expect(a.id).toBe(b.id);
    expect((await store.list()).map((p) => p.id)).toEqual([a.id]);
    expect((await store.get(a.id))?.name).toBe('Dave Suzuki');
    expect((await store.findByName('Dave Suzuki'))?.id).toBe(a.id);
    expect(await store.get('nope')).toBeNull();
    expect(await store.get('../etc/passwd')).toBeNull();
  });
  it('20 concurrent updates all land and leave no temp files', async () => {
    const p = await store.create('Concurrent');
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        store.update(p.id, (cur) => ({ ...cur, attempts: [...cur.attempts, { id: `a${i}`, at: 'x', spec: { scope: 'section', id: '1.1', count: 1, seed: 1 }, total: 1, correct: 1, sectionIds: ['1.1'] }] })),
      ),
    );
    expect((await store.get(p.id))?.attempts).toHaveLength(20);
    const files = await fs.readdir(path.join(dir, 'profiles'));
    expect(files.filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });
  it('update of a missing profile throws, remove is idempotent', async () => {
    await expect(store.update('missing-000000', (p) => p)).rejects.toBeInstanceOf(ProfileNotFound);
    const p = await store.create('Gone');
    await store.remove(p.id);
    await store.remove(p.id);
    expect(await store.get(p.id)).toBeNull();
  });
});
