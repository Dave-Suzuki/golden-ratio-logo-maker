'use client';

import { grade } from './grade';
import { useStats, type CatalogChapter, type ProfileSummary, type Session, type StorageKind } from './store';
import { refFor } from './testgen';
import type { Given, ProfileView, Question, Test, TestSpec } from './types';

const PROFILE_KEY = 'stats-profile';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'content-type': 'application/json' }, ...init });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      msg = ((await res.json()) as { error?: string }).error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

const post = <T,>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) });

function remember(id: string | null) {
  try {
    if (id) window.localStorage.setItem(PROFILE_KEY, id);
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function remembered(): string | null {
  try {
    return window.localStorage.getItem(PROFILE_KEY);
  } catch {
    return null;
  }
}

async function withBusy<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  const s = useStats.getState();
  s.setBusy(label);
  s.setError(null);
  try {
    return await fn();
  } catch (err) {
    useStats.getState().setError(err instanceof Error ? err.message : String(err));
    return undefined;
  } finally {
    useStats.getState().setBusy(null);
  }
}

/** Boot: catalog, AI flag, profile list, and the remembered profile. */
export async function bootstrap() {
  const s = useStats.getState();
  if (s.catalog.length === 0) {
    const [{ chapters }, { ai, storage }, { profiles }] = await Promise.all([
      request<{ chapters: CatalogChapter[] }>('/api/catalog'),
      request<{ ai: boolean; storage?: StorageKind }>('/api/health'),
      request<{ profiles: ProfileSummary[] }>('/api/profiles'),
    ]);
    useStats.getState().setCatalog(chapters);
    useStats.getState().setAiEnabled(ai);
    if (storage) useStats.getState().setStorageKind(storage);
    useStats.getState().setProfiles(profiles);
  }
  if (!useStats.getState().profile) {
    const id = remembered();
    if (id) {
      try {
        const { profile } = await request<{ profile: ProfileView }>(`/api/profiles/${id}`);
        useStats.getState().setProfile(profile);
      } catch {
        remember(null);
      }
    }
  }
}

export async function selectProfile(name: string) {
  return withBusy('profile', async () => {
    const { profile } = await post<{ profile: ProfileView }>('/api/profiles', { name });
    useStats.getState().setProfile(profile);
    remember(profile.id);
    const { profiles } = await request<{ profiles: ProfileSummary[] }>('/api/profiles');
    useStats.getState().setProfiles(profiles);
    return profile;
  });
}

export function signOut() {
  useStats.getState().setProfile(null);
  useStats.getState().setSession(null);
  remember(null);
}

export async function refreshProfile() {
  const p = useStats.getState().profile;
  if (!p) return;
  const { profile } = await request<{ profile: ProfileView }>(`/api/profiles/${p.id}`);
  useStats.getState().setProfile(profile);
}

function newSessionId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function specToQuery(spec: TestSpec): string {
  const p = new URLSearchParams({ scope: spec.scope, id: spec.id, count: String(spec.count), seed: String(spec.seed) });
  if (spec.templateShare !== undefined) p.set('templateShare', String(spec.templateShare));
  if (spec.openShare !== undefined) p.set('openShare', String(spec.openShare));
  if (spec.includeExtra !== undefined) p.set('includeExtra', String(spec.includeExtra));
  return p.toString();
}

export async function fetchTest(spec: TestSpec): Promise<Test> {
  return request<Test>(`/api/test?${specToQuery(spec)}`);
}

export async function startQuiz(spec: TestSpec) {
  return withBusy('quiz', async () => {
    const test = await fetchTest(spec);
    const session: Session = {
      id: newSessionId(),
      test,
      mode: 'quiz',
      index: 0,
      given: test.questions.map(() => null),
      results: test.questions.map(() => null),
    };
    useStats.getState().setSession(session);
    return session;
  });
}

/** Review mode: build a set from the learner's open concepts (server regenerates the missed items). */
export async function startReview(count = 8) {
  return withBusy('review', async () => {
    const p = useStats.getState().profile;
    if (!p) throw new Error('pick a profile first');
    const { questions, concepts } = await post<{ questions: Question[]; concepts: string[] }>(`/api/profiles/${p.id}/review`, { count });
    if (questions.length === 0) throw new Error('nothing to review — no open mistakes');
    const spec: TestSpec = { scope: 'review', id: p.id, count: questions.length, seed: Date.now() % 1_000_000 };
    const session: Session = {
      id: newSessionId(),
      test: { spec, questions },
      mode: 'review',
      index: 0,
      given: questions.map(() => null),
      results: questions.map(() => null),
      concepts,
    };
    useStats.getState().setSession(session);
    return session;
  });
}

async function recordAnswer(session: Session, q: Question, given: Given) {
  const p = useStats.getState().profile;
  if (!p) return;
  try {
    const { profile } = await post<{ profile: ProfileView }>(`/api/profiles/${p.id}/events`, {
      type: 'answer',
      sessionId: session.id,
      spec: session.test.spec,
      context: session.mode,
      question: q,
      ref: refFor(q),
      given,
    });
    useStats.getState().setProfile(profile);
  } catch (err) {
    useStats.getState().setError(`could not save your answer: ${err instanceof Error ? err.message : err}`);
  }
}

/** Grade locally for instant feedback, then record on the server (which re-grades). */
export async function submitAnswer(given: Given) {
  const s = useStats.getState().session;
  if (!s) return;
  const q = s.test.questions[s.index];
  if (!q) return;
  const result = grade(q, given);
  useStats.getState().patchSession((cur) => ({
    ...cur,
    given: cur.given.map((g, i) => (i === cur.index ? given : g)),
    results: cur.results.map((r, i) => (i === cur.index ? result : r)),
  }));
  if (result.correct !== null) await recordAnswer(s, q, given);
}

export function nextQuestion() {
  useStats.getState().patchSession((cur) => ({ ...cur, index: Math.min(cur.index + 1, cur.test.questions.length) }));
}

export async function finishSession() {
  const s = useStats.getState().session;
  const p = useStats.getState().profile;
  if (!s || !p) return;
  try {
    const { profile } = await post<{ profile: ProfileView }>(`/api/profiles/${p.id}/events`, {
      type: 'finish',
      sessionId: s.id,
      spec: s.test.spec,
    });
    useStats.getState().setProfile(profile);
  } catch (err) {
    useStats.getState().setError(`could not save the result: ${err instanceof Error ? err.message : err}`);
  }
}

export async function retryMistake(ref: unknown) {
  return withBusy('retry', async () => {
    const { question } = await post<{ question: Question }>('/api/question', ref);
    const spec: TestSpec = { scope: 'review', id: 'retry', count: 1, seed: 0 };
    const session: Session = { id: newSessionId(), test: { spec, questions: [question] }, mode: 'review', index: 0, given: [null], results: [null] };
    useStats.getState().setSession(session);
    return session;
  });
}

export async function fetchExplanation(q: Question, given: Given): Promise<string[] | null> {
  try {
    const { explanation } = await post<{ explanation: string[] | null }>('/api/explain', { question: q, given });
    return explanation;
  } catch {
    return null;
  }
}
