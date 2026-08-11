import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  fallbackNlEdit,
  ParamDeltaSchema,
  rationaleFor,
  type BrandBrief,
  type ConstructionPlan,
  type ParamDelta,
} from '@kiwari/engine';
import { z } from 'zod';
import { getClient, hasApiKey, MODEL, type Source } from './client';

const EDIT_SYSTEM = `You map a user's natural-language edit of a logo mark to a ParamDelta — one of the parameter operations the construction system supports:
- weight ±1: heavier/lighter stroke, one φ-step
- rotate by a whitelisted angle (±60, ±90, ±72, ±137.5)
- mirror (vertical | horizontal axis)
- counterform ±1: open/close the negative space one φ-step
- optical on/off: toggle the labeled optical-correction layer
- replan: the request is beyond parameter reach (new subject, different idea, more/less abstract) — return the adjusted brief and a short note
- unrecognized: cannot be mapped; give a short helpful message

Prefer the smallest parameter change that satisfies the request. Only replan when parameters cannot express it.`;

export interface EditResult {
  delta: ParamDelta;
  source: Source;
}

export async function mapEdit(
  instruction: string,
  brief: BrandBrief,
  plan: ConstructionPlan,
): Promise<EditResult> {
  if (!hasApiKey()) {
    return { delta: fallbackNlEdit(instruction, brief), source: 'fallback' };
  }
  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: EDIT_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Current brief:\n${JSON.stringify(brief)}\n\nCurrent plan summary: family=${plan.family}, render=${plan.style.render}, strokeStep=${plan.style.strokeStep}, elements=${plan.elements.map((e) => e.type).join(',')}, ops=${plan.composite.map((c) => c.op).join(',') || 'none'}, optical=${plan.optical.enabled}\n\nInstruction: "${instruction}"`,
        },
      ],
      output_config: { format: zodOutputFormat(ParamDeltaSchema) },
    });
    const parsed = response.parsed_output;
    if (!parsed) throw new Error('editor returned no parsed output');
    return { delta: parsed, source: 'llm' };
  } catch (err) {
    console.warn('[kiwari] editor LLM path failed, using fallback:', err);
    return { delta: fallbackNlEdit(instruction, brief), source: 'fallback' };
  }
}

const RationaleSchema = z.object({ sentences: z.array(z.string()) });

export interface RationaleResult {
  rationale: string;
  source: Source;
}

/** EXP-2: plain-language rationale from the actual plan. LLM warms the template facts; never invents. */
export async function polishRationale(
  plan: ConstructionPlan,
  brief?: BrandBrief,
): Promise<RationaleResult> {
  const facts = rationaleFor(plan, brief);
  if (!hasApiKey()) {
    return { rationale: facts, source: 'fallback' };
  }
  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 1500,
      system:
        'Rewrite the given construction facts as 2-3 warm, plain-language sentences for a non-designer. Only reference the provided facts — no aesthetic claims, no golden-ratio mysticism, no invented geometry. Keep the mathematical terms (φ, √2, steps, lattice) intact.',
      messages: [{ role: 'user', content: facts }],
      output_config: { format: zodOutputFormat(RationaleSchema) },
    });
    const sentences = response.parsed_output?.sentences?.slice(0, 3);
    if (!sentences || sentences.length === 0) throw new Error('no rationale returned');
    return { rationale: sentences.join(' '), source: 'llm' };
  } catch {
    return { rationale: facts, source: 'fallback' };
  }
}
