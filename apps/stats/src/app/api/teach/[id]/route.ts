import { NextResponse } from 'next/server';
import { sectionById, teachFor } from '@/lib/server/content';
import { bad } from '@/lib/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = sectionById(id);
  if (!section) return bad('unknown section', 404);
  return NextResponse.json({ section, teach: teachFor(id) ?? null });
}
