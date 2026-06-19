import { NextResponse } from 'next/server';

import { listModels } from '@/lib/ai-client';
import { requireUser } from '@/lib/api-auth';

export async function POST(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { endpointUrl, apiKey } = body;

  if (!endpointUrl?.trim() || !apiKey?.trim()) {
    return NextResponse.json(
      { error: 'Endpoint URL and API Key are required' },
      { status: 400 },
    );
  }

  try {
    const models = await listModels(endpointUrl.trim(), apiKey.trim());
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch models. Check your endpoint URL and API key.' },
      { status: 502 },
    );
  }
}
