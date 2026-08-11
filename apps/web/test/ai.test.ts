import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validatePlan } from '@kiwari/engine';

// Mock the Anthropic client boundary; everything else runs for real.
const parse = vi.fn();
let keyPresent = true;
vi.mock('@/lib/ai/client', () => ({
  MODEL: 'claude-opus-5',
  hasApiKey: () => keyPresent,
  getClient: () => ({ messages: { parse } }),
}));

import { interpret } from '@/lib/ai/interpreter';
import { planBatch } from '@/lib/ai/planner';
import { mapEdit } from '@/lib/ai/editor';

const sampleBrief = {
  name: 'Kessa Coffee',
  industry: 'food_beverage/coffee',
  personality: ['warm', 'precise'],
  motif: { subject: 'crescent', metaphors: ['moon'], abstraction: 0.65 },
  form_language: 'geometric' as const,
  logo_type: 'pictorial' as const,
  proportion_system: 'phi' as const,
  palette_intent: { temperature: 'warm' as const, contrast: 'high' as const },
  constraints: { monochrome_required: false, min_size_px: 24, avoid: ['cup'] },
};

const validPlan = {
  version: 1,
  family: 'phi_circle_chain',
  logoType: 'pictorial',
  canvas: { size: 1000, lattice: 'golden_subdivision', depth: 4 },
  elements: [
    { type: 'circle', id: 'a', at: 'L1.4', r: { step: 0 } },
    { type: 'circle', id: 'b', at: 'L1.5', r: { step: -1 } },
  ],
  composite: [{ op: 'subtract', of: 'a', by: 'b', as: 'crescent' }],
  transforms: [],
  style: { strokeStep: null, render: 'fill' },
  optical: { enabled: false, corrections: [] },
};

beforeEach(() => {
  parse.mockReset();
  keyPresent = true;
});

describe('interpreter', () => {
  it('uses the fallback when no API key is present', async () => {
    keyPresent = false;
    const result = await interpret('a coffee roastery with a crescent');
    expect(result.source).toBe('fallback');
    expect(result.brief.motif.subject).toBe('crescent');
    expect(parse).not.toHaveBeenCalled();
  });

  it('falls back when the LLM call throws', async () => {
    parse.mockRejectedValueOnce(new Error('boom'));
    const result = await interpret('a coffee roastery with a crescent');
    expect(result.source).toBe('fallback');
  });

  it('returns the normalized LLM brief on success', async () => {
    parse.mockResolvedValueOnce({
      parsed_output: { ...sampleBrief, personality: ['a', 'b', 'c', 'd', 'e'] },
    });
    const result = await interpret('anything');
    expect(result.source).toBe('llm');
    expect(result.brief.personality).toHaveLength(3); // normalized
  });
});

describe('planner repair loop', () => {
  it('re-requests failing slots quoting validator issues, then fills the rest from fallback', async () => {
    // First response: slot 0 valid, slot 1 off-lattice, others missing entirely
    const badPlan = JSON.parse(JSON.stringify(validPlan));
    badPlan.elements[0].at = 'L9.4';
    parse.mockResolvedValueOnce({ parsed_output: { plans: [validPlan, badPlan] } });
    // Repair round: fixes slot 1 only
    parse.mockResolvedValueOnce({ parsed_output: { repairs: [{ slotIndex: 1, plan: validPlan }] } });
    // Second repair round for still-missing slots: returns nothing useful
    parse.mockResolvedValueOnce({ parsed_output: { repairs: [] } });

    const result = await planBatch(sampleBrief, 7);
    expect(result.plans).toHaveLength(9);
    for (const plan of result.plans) {
      expect(validatePlan(plan).ok).toBe(true);
    }
    expect(result.source).toBe('mixed'); // fallback filled the missing slots

    // The repair prompt quoted the machine-readable issue code
    const repairCall = parse.mock.calls[1]![0] as { messages: { content: string }[] };
    expect(repairCall.messages[0]!.content).toContain('E_OFF_LATTICE');
    expect(repairCall.messages[0]!.content).toContain('E_MISSING');
  });

  it('falls back entirely when the batch call throws, and caches per brief+seed', async () => {
    parse.mockRejectedValue(new Error('api down'));
    const a = await planBatch(sampleBrief, 42);
    expect(a.source).toBe('fallback');
    expect(a.plans).toHaveLength(9);
    const callCount = parse.mock.calls.length;
    const b = await planBatch(sampleBrief, 42);
    expect(parse.mock.calls.length).toBe(callCount); // cached — no second API call
    expect(b.plans).toEqual(a.plans);
  });

  it('never surfaces raw invalid LLM output (IN-2)', async () => {
    parse.mockResolvedValueOnce({
      parsed_output: { plans: Array(9).fill({ nonsense: true }) },
    });
    parse.mockResolvedValue({ parsed_output: { repairs: [] } });
    const result = await planBatch(sampleBrief, 13);
    for (const plan of result.plans) {
      expect(validatePlan(plan).ok).toBe(true);
    }
  });
});

describe('editor', () => {
  it('maps instructions via the verb lexicon when no key is present', async () => {
    keyPresent = false;
    const plan = validatePlan(validPlan);
    if (!plan.ok) throw new Error('fixture invalid');
    const result = await mapEdit('make it heavier', sampleBrief, plan.plan);
    expect(result.source).toBe('fallback');
    expect(result.delta).toEqual({ op: 'weight', direction: 1 });
  });
});
