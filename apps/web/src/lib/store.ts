'use client';

import { create } from 'zustand';
import type { BrandBrief, ConstructionPlan } from '@kiwari/engine';

export type Tier = 'free' | 'paid';
export type SourceTag = 'llm' | 'fallback' | 'mixed' | null;

export interface HistoryEntry {
  plan: ConstructionPlan;
  label: string;
}

export interface RevealLayers {
  grid: boolean;
  rects: boolean;
  circles: boolean;
  spiral: boolean;
  anchors: boolean;
  labels: boolean;
}

interface StudioState {
  prompt: string;
  brief: BrandBrief | null;
  briefSource: SourceTag;
  seed: number;
  plans: ConstructionPlan[];
  planSource: SourceTag;
  selected: number | null;
  /** working copy of the selected plan with refinements applied */
  workingPlan: ConstructionPlan | null;
  history: HistoryEntry[];
  refineMessage: string | null;
  rationale: string | null;
  interpreting: boolean;
  generating: boolean;
  editing: boolean;
  revealOpen: boolean;
  revealLayers: RevealLayers;
  tier: Tier;

  setPrompt: (prompt: string) => void;
  setBrief: (brief: BrandBrief | null, source: SourceTag) => void;
  setSeed: (seed: number) => void;
  setPlans: (plans: ConstructionPlan[], source: SourceTag) => void;
  select: (index: number | null) => void;
  applyWorkingPlan: (plan: ConstructionPlan, label: string) => void;
  replaceWorkingPlan: (plan: ConstructionPlan, label: string) => void;
  undo: () => void;
  setRefineMessage: (message: string | null) => void;
  setRationale: (rationale: string | null) => void;
  setInterpreting: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setEditing: (v: boolean) => void;
  setRevealOpen: (v: boolean) => void;
  toggleRevealLayer: (layer: keyof RevealLayers) => void;
  setTier: (tier: Tier) => void;
}

export const useStudio = create<StudioState>((set, get) => ({
  prompt: '',
  brief: null,
  briefSource: null,
  seed: 1,
  plans: [],
  planSource: null,
  selected: null,
  workingPlan: null,
  history: [],
  refineMessage: null,
  rationale: null,
  interpreting: false,
  generating: false,
  editing: false,
  revealOpen: false,
  revealLayers: { grid: true, rects: true, circles: true, spiral: true, anchors: true, labels: true },
  tier: 'free',

  setPrompt: (prompt) => set({ prompt }),
  setBrief: (brief, briefSource) => set({ brief, briefSource }),
  setSeed: (seed) => set({ seed }),
  setPlans: (plans, planSource) =>
    set({ plans, planSource, selected: null, workingPlan: null, history: [], rationale: null, refineMessage: null }),
  select: (index) =>
    set((s) => ({
      selected: index,
      workingPlan: index === null ? null : (s.plans[index] ?? null),
      history: [],
      rationale: null,
      refineMessage: null,
      revealOpen: false,
    })),
  applyWorkingPlan: (plan, label) =>
    set((s) => ({
      workingPlan: plan,
      history: s.workingPlan ? [...s.history, { plan: s.workingPlan, label }] : s.history,
      refineMessage: null,
    })),
  replaceWorkingPlan: (plan, label) =>
    set((s) => ({
      workingPlan: plan,
      history: s.workingPlan ? [...s.history, { plan: s.workingPlan, label }] : s.history,
      rationale: null,
      refineMessage: null,
    })),
  undo: () => {
    const { history } = get();
    const last = history[history.length - 1];
    if (!last) return;
    set({ workingPlan: last.plan, history: history.slice(0, -1), refineMessage: null });
  },
  setRefineMessage: (refineMessage) => set({ refineMessage }),
  setRationale: (rationale) => set({ rationale }),
  setInterpreting: (interpreting) => set({ interpreting }),
  setGenerating: (generating) => set({ generating }),
  setEditing: (editing) => set({ editing }),
  setRevealOpen: (revealOpen) => set({ revealOpen }),
  toggleRevealLayer: (layer) =>
    set((s) => ({ revealLayers: { ...s.revealLayers, [layer]: !s.revealLayers[layer] } })),
  setTier: (tier) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('kiwari-tier', tier);
    set({ tier });
  },
}));
