import { getCloudflareContext } from '@opennextjs/cloudflare';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'https://knowledgebase.sarthakagrawal927.workers.dev';

type RagSearchResult = {
  document_id: string;
  chunk_id: string;
  chunk_content: string;
  score: number;
  metadata: Record<string, unknown>;
};

type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

type CloudflareEnv = {
  RAG_SERVICE?: ServiceBinding;
  RAG_SERVICE_KEY?: string;
};

function cloudflareEnv(): CloudflareEnv {
  try {
    const { env } = getCloudflareContext();
    return env as CloudflareEnv;
  } catch {
    return {};
  }
}

function ragServiceKey(): string {
  return process.env.RAG_SERVICE_KEY?.trim() || cloudflareEnv().RAG_SERVICE_KEY?.trim() || '';
}

function ragServiceBinding(): ServiceBinding | null {
  return cloudflareEnv().RAG_SERVICE ?? null;
}

async function ragFetch(path: string, init: RequestInit): Promise<Response> {
  const key = ragServiceKey();
  if (!key) throw new Error('knowledgebase service key is not configured');

  const requestInit: RequestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  };

  const binding = ragServiceBinding();
  if (binding) return binding.fetch(new Request(`https://knowledgebase.internal${path}`, requestInit));
  return fetch(`${RAG_SERVICE_URL.replace(/\/+$/, '')}${path}`, requestInit);
}

export async function createIndex(name: string): Promise<{ id: string }> {
  const res = await ragFetch('/v1/indexes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Failed to create RAG index: ${await res.text()}`);
  return res.json();
}

export async function ingestDocument(
  indexId: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<{ id: string; chunks_created: number }> {
  const res = await ragFetch(`/v1/indexes/${indexId}/ingest`, {
    method: 'POST',
    body: JSON.stringify({ documents: [{ content, metadata }] }),
  });
  if (!res.ok) throw new Error(`Failed to ingest RAG document: ${await res.text()}`);

  const data = await res.json() as { documents?: Array<{ document_id: string; chunks_created: number }> };
  const document = data.documents?.[0];
  if (!document) throw new Error('RAG ingest response was empty');
  return { id: document.document_id, chunks_created: document.chunks_created };
}

export async function deleteDocument(docId: string): Promise<void> {
  const res = await ragFetch(`/v1/documents/${docId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`Failed to delete RAG document: ${await res.text()}`);
}

export async function search(
  indexId: string,
  query: string,
  topK = 5,
  filter?: Record<string, unknown>,
): Promise<{ results: { document_id: string; chunk_content: string; score: number }[] }> {
  const res = await ragFetch(`/v1/indexes/${indexId}/query`, {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK, ...(filter ? { filter } : {}) }),
  });
  if (!res.ok) throw new Error(`Failed to search RAG index: ${await res.text()}`);

  const data = await res.json() as { data?: RagSearchResult[] };
  return {
    results: (data.data ?? []).map((result) => ({
      document_id: result.document_id,
      chunk_content: result.chunk_content,
      score: result.score,
    })),
  };
}
