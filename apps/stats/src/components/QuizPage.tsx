'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { startQuiz } from '@/lib/actions';
import { useStats } from '@/lib/store';
import type { TestSpec } from '@/lib/types';
import { QuizRunner } from './QuizRunner';

export function specFromParams(p: URLSearchParams): TestSpec | null {
  const scope = p.get('scope') as TestSpec['scope'] | null;
  const id = p.get('id');
  if (!scope || !id) return null;
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : undefined);
  return { scope, id, count: num('count') ?? 10, seed: num('seed') ?? 1, templateShare: num('templateShare'), openShare: num('openShare'), includeExtra: p.has('includeExtra') ? p.get('includeExtra') !== 'false' : undefined };
}

export function QuizPage() {
  const params = useSearchParams();
  const { session, busy, error } = useStats();
  const spec = specFromParams(params);
  const key = params.toString();
  useEffect(() => {
    const s = useStats.getState().session;
    if (spec && (!s || JSON.stringify(s.test.spec) !== JSON.stringify(spec))) void startQuiz(spec);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!spec) return <p className="text-sm">No test specified. Pick a section from the home page.</p>;
  if (error && !session) return <p className="text-sm text-[var(--bad)]">{error}</p>;
  if (!session || busy === 'quiz') return <p className="text-sm opacity-60">Building your test…</p>;
  return <QuizRunner />;
}
