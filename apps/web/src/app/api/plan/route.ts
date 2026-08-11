import { NextResponse } from 'next/server';
import { BrandBriefSchema, normalizeBrief } from '@kiwari/engine';
import { planBatch } from '@/lib/ai/planner';

export async function POST(request: Request) {
  let body: { brief?: unknown; seed?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const parsed = BrandBriefSchema.safeParse(body.brief);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid brief' }, { status: 400 });
  }
  const seed = typeof body.seed === 'number' && Number.isFinite(body.seed) ? Math.trunc(body.seed) : 1;
  const result = await planBatch(normalizeBrief(parsed.data), seed);
  return NextResponse.json(result);
}
