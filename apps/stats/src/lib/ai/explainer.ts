import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { formatAnswer } from '../grade';
import type { Given, Question, TeachSnippet } from '../types';
import { getClient, hasApiKey, MODEL, type Source } from './client';

const ExplanationSchema = z.object({ steps: z.array(z.string()).min(1).max(8) });

const SYSTEM = `You are a patient introductory-statistics tutor (OpenStax Introductory Statistics 2e). A learner answered a question incorrectly.
Explain, in 2–6 short numbered steps, how to reach the correct answer, and point out the specific misconception suggested by their answer.
Use plain unicode math (μ, σ, x̄, p̂, √), never LaTeX. Do not mention that you are an AI.`;

export interface ExplainResult {
  explanation: string[] | null;
  source: Source;
}

function describeGiven(given: Given, q: Question): string {
  switch (given.kind) {
    case 'mc':
      return q.kind === 'mc' ? `option ${String.fromCharCode(97 + given.index)}: ${q.options[given.index] ?? ''}` : String(given.index);
    case 'numeric':
      return given.raw;
    case 'fill':
      return given.values.join(', ');
    case 'tf':
      return given.value ? 'true' : 'false';
    case 'open':
      return given.text;
  }
}

/** Richer explanation when ANTHROPIC_API_KEY is set; otherwise null so the UI shows the built-in explanation. */
export async function explain(q: Question, given: Given, teach?: TeachSnippet | null): Promise<ExplainResult> {
  if (!hasApiKey()) return { explanation: null, source: 'fallback' };
  try {
    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            `Section: ${q.sectionId ?? 'unknown'}${teach ? ` — ${teach.title}` : ''}`,
            teach?.formulaReview ? `Formula review:\n${teach.formulaReview.slice(0, 1500)}` : '',
            q.context ? `Context:\n${q.context}` : '',
            `Question:\n${q.stem}`,
            q.kind === 'mc' ? `Options:\n${q.options.map((o, i) => `${String.fromCharCode(97 + i)}. ${o}`).join('\n')}` : '',
            `Correct answer: ${formatAnswer(q)}`,
            q.explanation.length ? `Book solution:\n${q.explanation.join('\n')}` : '',
            `Learner's answer: ${describeGiven(given, q)}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      ],
      output_config: { format: zodOutputFormat(ExplanationSchema) },
    });
    const parsed = response.parsed_output;
    if (!parsed) throw new Error('no parsed output');
    return { explanation: parsed.steps, source: 'llm' };
  } catch (err) {
    console.warn('[stats] explainer LLM path failed, using fallback:', err);
    return { explanation: null, source: 'fallback' };
  }
}
