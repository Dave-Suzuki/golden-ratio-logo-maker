import { NextResponse } from 'next/server';
import { interpret } from '@/lib/ai/interpreter';

export async function POST(request: Request) {
  let prompt: unknown;
  try {
    ({ prompt } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'prompt must be a non-empty string' }, { status: 400 });
  }
  const result = await interpret(prompt.slice(0, 4000));
  return NextResponse.json(result);
}
