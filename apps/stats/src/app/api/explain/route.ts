import { NextResponse } from 'next/server';
import { z } from 'zod';
import { explain } from '@/lib/ai/explainer';
import { GivenSchema, QuestionSchema } from '@/lib/schemas';
import { teachFor } from '@/lib/server/content';
import { readBody } from '@/lib/server/http';

const Body = z.object({ question: QuestionSchema, given: GivenSchema });

export async function POST(request: Request) {
  const body = await readBody(request, Body);
  if (!body.ok) return body.res;
  const { question, given } = body.data;
  const result = await explain(question, given, question.sectionId ? teachFor(question.sectionId) : null);
  return NextResponse.json(result);
}
