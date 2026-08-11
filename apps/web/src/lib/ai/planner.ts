import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  briefHash,
  buildSlots,
  ConstructionPlanSchema,
  fallbackPlanBatch,
  findNearDuplicates,
  planSlot,
  validatePlan,
  type BrandBrief,
  type ConstructionPlan,
  type GenerationSlot,
  type ValidationIssue,
} from '@kiwari/engine';
import { getClient, hasApiKey, MODEL, type Source } from './client';
import { dslSpec, FEW_SHOT_PLAN } from './dslSpec';

const BatchSchema = z.object({ plans: z.array(ConstructionPlanSchema) });
const RepairSchema = z.object({
  repairs: z.array(z.object({ slotIndex: z.number().int(), plan: ConstructionPlanSchema })),
});

export interface PlanBatchResult {
  plans: ConstructionPlan[];
  source: Source;
}

/** Same brief + seed reproduces the identical batch (GEN-8) — LLM output is cached. */
const cache = new Map<string, PlanBatchResult>();
const MAX_CACHE = 200;

export async function planBatch(brief: BrandBrief, seed: number): Promise<PlanBatchResult> {
  const key = `${briefHash(brief)}:${seed}:${hasApiKey() ? 'llm' : 'fb'}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const result = await planBatchUncached(brief, seed);
  if (cache.size > MAX_CACHE) cache.clear();
  cache.set(key, result);
  return result;
}

async function planBatchUncached(brief: BrandBrief, seed: number): Promise<PlanBatchResult> {
  if (!hasApiKey()) {
    return { plans: fallbackPlanBatch(brief, seed), source: 'fallback' };
  }
  const slots = buildSlots(brief);
  try {
    const raw = await requestBatch(brief, slots, seed);
    const { plans, usedFallback } = await repairLoop(brief, slots, seed, raw);
    return { plans, source: usedFallback ? 'mixed' : 'llm' };
  } catch (err) {
    console.warn('[kiwari] planner LLM path failed, using fallback:', err);
    return { plans: fallbackPlanBatch(brief, seed), source: 'fallback' };
  }
}

async function requestBatch(
  brief: BrandBrief,
  slots: GenerationSlot[],
  seed: number,
): Promise<unknown[]> {
  const slotSpec = slots
    .map((s) => `slot ${s.index}: family=${s.family}, abstraction band=${s.band}, logoType=${s.logoType}`)
    .join('\n');
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 30000,
    system: `${dslSpec()}\n\n${FEW_SHOT_PLAN}`,
    messages: [
      {
        role: 'user',
        content: `BrandBrief:\n${JSON.stringify(brief, null, 2)}\n\nGenerate exactly 9 plans, one per slot, in slot order (deterministic seed ${seed} — be decisive, not random):\n${slotSpec}\n\nThe nine marks must be genuinely diverse ideas — different form languages and construction moves, not nine variations of one idea. Return {"plans": [...9 plans...]}.`,
      },
    ],
    output_config: { format: zodOutputFormat(BatchSchema) },
  });
  const parsed = response.parsed_output;
  if (!parsed || parsed.plans.length === 0) throw new Error('planner returned no plans');
  return parsed.plans;
}

async function repairLoop(
  brief: BrandBrief,
  slots: GenerationSlot[],
  seed: number,
  rawPlans: unknown[],
): Promise<{ plans: ConstructionPlan[]; usedFallback: boolean }> {
  const plans: (ConstructionPlan | null)[] = slots.map(() => null);
  let failing: { slotIndex: number; issues: ValidationIssue[] }[] = [];

  const absorb = (candidates: { slotIndex: number; raw: unknown }[]) => {
    failing = [];
    for (const { slotIndex, raw } of candidates) {
      if (slotIndex < 0 || slotIndex >= slots.length) continue;
      const v = validatePlan(raw);
      if (v.ok) plans[slotIndex] = v.plan;
      else failing.push({ slotIndex, issues: v.issues });
    }
  };

  absorb(rawPlans.slice(0, slots.length).map((raw, slotIndex) => ({ slotIndex, raw })));
  for (let i = rawPlans.length; i < slots.length; i++) failing.push({ slotIndex: i, issues: [] });

  // Re-request only the failing slots, quoting machine-readable validator issues (IN-2).
  for (let round = 0; round < 2 && failing.length > 0; round++) {
    const issueText = failing
      .map(
        (f) =>
          `slot ${f.slotIndex} (${slots[f.slotIndex]!.family}, ${slots[f.slotIndex]!.band}, ${slots[f.slotIndex]!.logoType}) was rejected:\n${
            f.issues.length > 0
              ? f.issues.map((i) => `  ${i.code} at ${i.path}: ${i.message}`).join('\n')
              : '  E_MISSING: no plan was provided for this slot'
          }`,
      )
      .join('\n');
    try {
      const response = await getClient().messages.parse({
        model: MODEL,
        max_tokens: 16000,
        system: `${dslSpec()}\n\n${FEW_SHOT_PLAN}`,
        messages: [
          {
            role: 'user',
            content: `BrandBrief:\n${JSON.stringify(brief)}\n\nThese plans were rejected by the validator. Emit corrected plans for exactly these slots:\n${issueText}\n\nReturn {"repairs": [{"slotIndex": n, "plan": {...}}, ...]}.`,
          },
        ],
        output_config: { format: zodOutputFormat(RepairSchema) },
      });
      const repairs = response.parsed_output?.repairs ?? [];
      const stillMissing = new Set(failing.map((f) => f.slotIndex));
      absorb(repairs.filter((r) => stillMissing.has(r.slotIndex)).map((r) => ({ slotIndex: r.slotIndex, raw: r.plan })));
      for (const idx of stillMissing) {
        if (plans[idx] === null && !failing.some((f) => f.slotIndex === idx)) {
          failing.push({ slotIndex: idx, issues: [] });
        }
      }
    } catch {
      break;
    }
  }

  // Any slot still failing is filled by the deterministic fallback planner.
  let usedFallback = false;
  const complete = plans.map((p, i) => {
    if (p) return p;
    usedFallback = true;
    return planSlot(brief, slots[i]!, seed);
  });

  // Reactive diversity: re-roll near-duplicates via the fallback templates (one round).
  for (const i of findNearDuplicates(complete)) {
    complete[i] = planSlot(brief, slots[i]!, seed, 1);
    usedFallback = true;
  }

  return { plans: complete, usedFallback };
}
