import { NextResponse } from 'next/server';
import { TestSpecSchema } from '@/lib/schemas';
import { bad } from '@/lib/server/http';
import { serverSource } from '@/lib/server/testSource';
import { buildTest } from '@/lib/testgen';

/** GET /api/test?scope=section&id=6.1&count=10&seed=7[&templateShare=&openShare=&includeExtra=] */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const num = (k: string) => (u.searchParams.has(k) ? Number(u.searchParams.get(k)) : undefined);
  const parsed = TestSpecSchema.safeParse({
    scope: u.searchParams.get('scope') ?? 'section',
    id: u.searchParams.get('id') ?? '',
    count: num('count') ?? 10,
    seed: num('seed') ?? Math.floor(Math.random() * 1_000_000),
    templateShare: num('templateShare'),
    openShare: num('openShare'),
    includeExtra: u.searchParams.has('includeExtra') ? u.searchParams.get('includeExtra') !== 'false' : undefined,
  });
  if (!parsed.success) return bad(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  const test = buildTest(parsed.data, serverSource);
  if (test.questions.length === 0) return bad('no questions available for this scope', 404);
  return NextResponse.json(test);
}
