'use client';

import {
  applyDelta,
  hashString,
  planSlot,
  buildSlots,
  type BrandBrief,
  type ConstructionPlan,
  type ParamDelta,
} from '@kiwari/engine';
import { useStudio } from './store';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

/** Describe → brief → 9 plans. One call drives the whole happy path. */
export async function generateFromPrompt(prompt: string, seedOverride?: number) {
  const s = useStudio.getState();
  const seed = seedOverride ?? (hashString(prompt) % 1000) + 1;
  s.setPrompt(prompt);
  s.setSeed(seed);
  s.setInterpreting(true);
  try {
    const { brief, source } = await post<{ brief: BrandBrief; source: 'llm' | 'fallback' }>(
      '/api/interpret',
      { prompt },
    );
    useStudio.getState().setBrief(brief, source);
    await generateFromBrief(brief, seed);
  } finally {
    useStudio.getState().setInterpreting(false);
  }
}

export async function generateFromBrief(brief: BrandBrief, seed: number) {
  const s = useStudio.getState();
  s.setGenerating(true);
  try {
    const { plans, source } = await post<{
      plans: ConstructionPlan[];
      source: 'llm' | 'fallback' | 'mixed';
    }>('/api/plan', { brief, seed });
    useStudio.getState().setPlans(plans, source);
  } finally {
    useStudio.getState().setGenerating(false);
  }
}

/** Slider path (REF-1): apply a delta locally; constraints hold via revalidation. */
export function applyLocalDelta(delta: ParamDelta, label: string) {
  const s = useStudio.getState();
  if (!s.workingPlan) return;
  if (delta.op === 'replan') {
    void replanSelected(delta.brief, label);
    return;
  }
  const result = applyDelta(s.workingPlan, delta);
  if (result.ok) {
    s.applyWorkingPlan(result.plan, label);
  } else {
    s.setRefineMessage(result.message);
  }
}

/** Abstraction/idea changes rebuild the selected slot's construction (deterministic, local). */
export async function replanSelected(brief: BrandBrief, label: string, bumpRoll = false) {
  const s = useStudio.getState();
  if (s.selected === null) return;
  const slots = buildSlots(brief);
  const slot = slots[s.selected] ?? slots[0]!;
  const plan = planSlot(brief, slot, s.seed, bumpRoll ? 1 + s.history.length : 0);
  useStudio.getState().setBrief(brief, s.briefSource);
  useStudio.getState().replaceWorkingPlan(plan, label);
}

/** NL edit path (REF-2): instruction → ParamDelta via API (LLM or verb lexicon). */
export async function applyNlEdit(instruction: string) {
  const s = useStudio.getState();
  if (!s.workingPlan || !s.brief) return;
  s.setEditing(true);
  try {
    const { delta } = await post<{ delta: ParamDelta }>('/api/edit', {
      instruction,
      brief: s.brief,
      plan: s.workingPlan,
    });
    if (delta.op === 'unrecognized') {
      useStudio.getState().setRefineMessage(delta.message);
    } else if (delta.op === 'replan') {
      await replanSelected(delta.brief, `"${instruction}"`, true);
    } else {
      applyLocalDelta(delta, `"${instruction}"`);
    }
  } finally {
    useStudio.getState().setEditing(false);
  }
}

export async function fetchRationale() {
  const s = useStudio.getState();
  if (!s.workingPlan) return;
  const { rationale } = await post<{ rationale: string }>('/api/rationale', {
    plan: s.workingPlan,
    brief: s.brief,
  });
  useStudio.getState().setRationale(rationale);
}
