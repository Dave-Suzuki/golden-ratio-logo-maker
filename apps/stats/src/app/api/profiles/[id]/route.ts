import { NextResponse } from 'next/server';
import { bad } from '@/lib/server/http';
import { view } from '@/lib/server/profiles';
import { getStore } from '@/lib/server/storage';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getStore().get(id);
  if (!p) return bad('profile not found', 404);
  return NextResponse.json({ profile: view(p) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getStore().remove(id);
  return new NextResponse(null, { status: 204 });
}
