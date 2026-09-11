import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse + validate a JSON body; returns a NextResponse on failure. */
export async function readBody<T>(request: Request, schema: ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, res: bad('invalid JSON body') };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, res: bad(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')) };
  return { ok: true, data: parsed.data };
}
