'use client';

import { create } from 'zustand';
import type { GradeResult, Given, ProfileView, Question, Test, TestSpec } from './types';

export interface ProfileSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export type StorageKind = 'page' | 'browser' | 'server';

export interface Session {
  id: string;
  test: Test;
  mode: 'quiz' | 'review';
  index: number;
  /** per question index */
  given: (Given | null)[];
  results: (GradeResult | null)[];
  /** review mode: concept tags this session is working on */
  concepts?: string[];
}

export interface CatalogSection {
  id: string;
  chapter: number;
  title: string;
  module: string;
  templates: number;
}

export interface CatalogChapter {
  number: number;
  title: string;
  sections: CatalogSection[];
}

interface StatsState {
  profiles: ProfileSummary[];
  profile: ProfileView | null;
  catalog: CatalogChapter[];
  aiEnabled: boolean;
  /** where progress lives: this page's own database, this browser only, or a server */
  storageKind: StorageKind;
  session: Session | null;
  busy: string | null;
  error: string | null;

  setProfiles: (p: ProfileSummary[]) => void;
  setProfile: (p: ProfileView | null) => void;
  setCatalog: (c: CatalogChapter[]) => void;
  setAiEnabled: (v: boolean) => void;
  setStorageKind: (k: StorageKind) => void;
  setSession: (s: Session | null) => void;
  patchSession: (fn: (s: Session) => Session) => void;
  setBusy: (b: string | null) => void;
  setError: (e: string | null) => void;
}

const SESSION_KEY = 'stats-session';

/**
 * The quiz in progress is kept in sessionStorage so a reload resumes it. Without this a reload
 * rebuilt the same test from question 1 while the answers already graded stayed recorded, so a
 * ten-question quiz could end with thirteen answers and duplicated mistakes. sessionStorage is
 * per-tab and cleared when the tab closes, which is the right lifetime for "the quiz I am doing".
 */
function readSession(): Session | null {
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
function writeSession(s: Session | null): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable: the session simply will not survive a reload */
  }
}

export const useStats = create<StatsState>((set) => ({
  profiles: [],
  profile: null,
  catalog: [],
  aiEnabled: false,
  storageKind: 'browser',
  session: readSession(),
  busy: null,
  error: null,
  setProfiles: (profiles) => set({ profiles }),
  setProfile: (profile) => set({ profile }),
  setCatalog: (catalog) => set({ catalog }),
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setStorageKind: (storageKind) => set({ storageKind }),
  setSession: (session) => {
    writeSession(session);
    set({ session });
  },
  patchSession: (fn) =>
    set((s) => {
      if (!s.session) return {};
      const session = fn(s.session);
      writeSession(session);
      return { session };
    }),
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error }),
}));

export function currentQuestion(s: Session | null): Question | null {
  return s ? (s.test.questions[s.index] ?? null) : null;
}

export function specLabel(spec: TestSpec): string {
  switch (spec.scope) {
    case 'section':
      return `Section ${spec.id}`;
    case 'chapter':
      return `Chapter ${spec.id}`;
    case 'practice-test':
      return `OpenStax Practice Test ${spec.id}`;
    case 'final':
      return `OpenStax Final Exam ${spec.id}`;
    case 'review':
      return 'Mistake review';
  }
}
