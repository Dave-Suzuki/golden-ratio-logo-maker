'use client';

import { create } from 'zustand';
import type { GradeResult, Given, ProfileView, Question, Test, TestSpec } from './types';

export interface ProfileSummary {
  id: string;
  name: string;
  updatedAt: string;
}

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
  session: Session | null;
  busy: string | null;
  error: string | null;

  setProfiles: (p: ProfileSummary[]) => void;
  setProfile: (p: ProfileView | null) => void;
  setCatalog: (c: CatalogChapter[]) => void;
  setAiEnabled: (v: boolean) => void;
  setSession: (s: Session | null) => void;
  patchSession: (fn: (s: Session) => Session) => void;
  setBusy: (b: string | null) => void;
  setError: (e: string | null) => void;
}

export const useStats = create<StatsState>((set) => ({
  profiles: [],
  profile: null,
  catalog: [],
  aiEnabled: false,
  session: null,
  busy: null,
  error: null,
  setProfiles: (profiles) => set({ profiles }),
  setProfile: (profile) => set({ profile }),
  setCatalog: (catalog) => set({ catalog }),
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setSession: (session) => set({ session }),
  patchSession: (fn) => set((s) => (s.session ? { session: fn(s.session) } : {})),
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
