import { NextResponse } from 'next/server';
import { chapters, extraSets } from '@/lib/server/content';
import { templatesFor } from '../../../../content/templates';

export async function GET() {
  const data = chapters().map((c) => ({
    ...c,
    sections: c.sections.map((s) => ({ ...s, templates: templatesFor(s.id).length })),
  }));
  return NextResponse.json({ chapters: data, extra: extraSets() });
}
