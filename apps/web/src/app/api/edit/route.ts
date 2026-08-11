import { NextResponse } from 'next/server';
import { BrandBriefSchema, ConstructionPlanSchema } from '@kiwari/engine';
import { mapEdit } from '@/lib/ai/editor';

export async function POST(request: Request) {
  let body: { instruction?: unknown; brief?: unknown; plan?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const brief = BrandBriefSchema.safeParse(body.brief);
  const plan = ConstructionPlanSchema.safeParse(body.plan);
  if (typeof body.instruction !== 'string' || !brief.success || !plan.success) {
    return NextResponse.json({ error: 'instruction, brief, and plan are required' }, { status: 400 });
  }
  const result = await mapEdit(body.instruction.slice(0, 1000), brief.data, plan.data);
  return NextResponse.json(result);
}
