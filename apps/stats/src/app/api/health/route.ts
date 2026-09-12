import { NextResponse } from 'next/server';
import { hasApiKey, MODEL } from '@/lib/ai/client';

export async function GET() {
  return NextResponse.json({ ok: true, ai: hasApiKey(), model: hasApiKey() ? MODEL : null, storage: 'server' });
}
