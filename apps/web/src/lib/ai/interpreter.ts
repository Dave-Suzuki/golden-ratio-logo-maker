import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  BrandBriefSchema,
  fallbackInterpret,
  normalizeBrief,
  type BrandBrief,
} from '@kiwari/engine';
import { getClient, hasApiKey, MODEL, type Source } from './client';

const SYSTEM = `You are the Interpreter of Kiwari, a logo tool where every mark is constructed on a geometric proportion system. Turn the user's free-text description into a BrandBrief.

Rules:
- personality: at most 3 adjectives, drawn from or faithful to the user's words.
- motif.subject: the single strongest visual subject. motif.metaphors: up to 5 associated ideas.
- motif.abstraction: 0 = literal depiction … 1 = pure abstraction. Default toward 0.5-0.7.
- proportion_system: "root2" only if the user hints at √2 / yamato / A-series / modular-grid Japanese proportions; else "phi".
- constraints.avoid: obvious clichés of the industry (e.g. coffee → cup, steam).
- constraints.min_size_px: 24 unless the user says otherwise. monochrome_required only if stated.
- name: the brand name if given (quoted or capitalized); else "Untitled".
- Do not invent facts the user did not imply.`;

export interface InterpretResult {
  brief: BrandBrief;
  source: Source;
}

export async function interpret(prompt: string): Promise<InterpretResult> {
  if (!hasApiKey()) {
    return { brief: fallbackInterpret(prompt), source: 'fallback' };
  }
  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      output_config: { format: zodOutputFormat(BrandBriefSchema) },
    });
    const parsed = response.parsed_output;
    if (!parsed) throw new Error('interpreter returned no parsed output');
    return { brief: normalizeBrief(parsed), source: 'llm' };
  } catch (err) {
    console.warn('[kiwari] interpreter LLM path failed, using fallback:', err);
    return { brief: fallbackInterpret(prompt), source: 'fallback' };
  }
}
