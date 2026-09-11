import { NextResponse } from 'next/server';
import { applyEvent } from '@/lib/progress';
import { ProgressEventSchema } from '@/lib/schemas';
import { bad, readBody } from '@/lib/server/http';
import { view } from '@/lib/server/profiles';
import { getStore, ProfileNotFound } from '@/lib/server/storage';

/** POST a ProgressEvent; the server re-grades and returns the updated profile view. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readBody(request, ProgressEventSchema);
  if (!body.ok) return body.res;
  try {
    const p = await getStore().update(id, (profile) => applyEvent(profile, body.data));
    return NextResponse.json({ profile: view(p) });
  } catch (err) {
    if (err instanceof ProfileNotFound) return bad('profile not found', 404);
    throw err;
  }
}
