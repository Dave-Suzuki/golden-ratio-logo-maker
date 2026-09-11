import { NextResponse } from 'next/server';
import { QuestionRefSchema } from '@/lib/schemas';
import { questionById } from '@/lib/server/content';
import { bad, readBody } from '@/lib/server/http';
import { instantiate } from '@/lib/testgen';
import { templateById } from '../../../../content/templates';

/** POST { ref } → regenerate a question from its reference (used by "retry this mistake"). */
export async function POST(request: Request) {
  const body = await readBody(request, QuestionRefSchema);
  if (!body.ok) return body.res;
  const ref = body.data;
  if (ref.kind === 'bank') {
    const q = questionById(ref.id);
    return q ? NextResponse.json({ question: q }) : bad('unknown question', 404);
  }
  if (ref.kind === 'template') {
    const t = templateById(ref.templateId);
    return t ? NextResponse.json({ question: instantiate(t, ref.seed) }) : bad('unknown template', 404);
  }
  return NextResponse.json({ question: ref.snapshot });
}
