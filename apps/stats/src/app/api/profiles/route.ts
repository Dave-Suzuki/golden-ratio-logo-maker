import { NextResponse } from 'next/server';
import { ProfileNameSchema } from '@/lib/schemas';
import { readBody } from '@/lib/server/http';
import { view } from '@/lib/server/profiles';
import { getStore } from '@/lib/server/storage';

export async function GET() {
  return NextResponse.json({ profiles: await getStore().list() });
}

/** POST { name } → create-or-get a learner profile (no password; self-study tool). */
export async function POST(request: Request) {
  const body = await readBody(request, ProfileNameSchema);
  if (!body.ok) return body.res;
  const p = await getStore().create(body.data.name);
  return NextResponse.json({ profile: view(p) });
}
