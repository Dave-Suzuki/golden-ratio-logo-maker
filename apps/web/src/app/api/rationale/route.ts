import { NextResponse } from 'next/server';
import { BrandBriefSchema, ConstructionPlanSchema } from '@kiwari/engine';
import { polishRationale } from '@/lib/ai/editor';

export async function POST(request: Request) {
  let body: { plan?: unknown; brief?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const plan = ConstructionPlanSchema.safeParse(body.plan);
  if (!plan.success) {
    return NextResponse.json({ error: 'invalid plan' }, { status: 400 });
  }
  const brief = BrandBriefSchema.safeParse(body.brief);
  const result = await polishRationale(plan.data, brief.success ? brief.data : undefined);
  return NextResponse.json(result);
}
