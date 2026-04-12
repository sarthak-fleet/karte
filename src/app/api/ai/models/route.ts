import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listModels } from '@/lib/ai-client';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
