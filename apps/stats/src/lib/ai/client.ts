import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.STATS_MODEL ?? process.env.KIWARI_MODEL ?? 'claude-opus-5';

export type Source = 'llm' | 'fallback' | 'mixed';

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}
