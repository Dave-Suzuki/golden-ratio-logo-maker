import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildReviewSet } from '@/lib/review';
import { bad, readBody } from '@/lib/server/http';
import { serverReviewSource } from '@/lib/server/reviewSource';
import { getStore } from '@/lib/server/storage';

const Body = z.object({ count: z.number().int().min(1).max(40).default(8), seed: z.number().int().optional() });

/** POST { count } → a review set built from the learner's open concepts. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readBody(request, Body);
  if (!body.ok) return body.res;
  const profile = await getStore().get(id);
  if (!profile) return bad('profile not found', 404);
  const set = buildReviewSet(profile, body.data.count, body.data.seed ?? Date.now() % 2147483647, serverReviewSource);
  return NextResponse.json(set);
}
