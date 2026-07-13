import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

export type AiConfig = {
  endpointUrl: string;
  apiKey: string;
  model: string;
};

const DEFAULT_AI_ENDPOINT_URL = 'https://ai-gateway.sassmaker.com/v1';
const DEFAULT_AI_MODEL = 'workers-ai-llama-3.3-70b';
const DEFAULT_FAST_AI_MODEL = 'workers-ai-llama-3b';
const FREE_AI_PROJECT_ID = 'linkchat';

export function getDefaultAiConfig(): AiConfig | null {
  const apiKey = process.env.LINKCHAT_DEFAULT_AI_API_KEY;
  if (!apiKey) return null;

  return {
    endpointUrl:
      process.env.LINKCHAT_DEFAULT_AI_ENDPOINT_URL || DEFAULT_AI_ENDPOINT_URL,
    apiKey,
    model: process.env.LINKCHAT_DEFAULT_AI_MODEL || DEFAULT_AI_MODEL,
  };
}

export function resolveAiConfig(config?: {
  aiEndpointUrl?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}): AiConfig | null {
  if (config?.aiEndpointUrl && config.aiApiKey && config.aiModel) {
    return {
      endpointUrl: config.aiEndpointUrl,
      apiKey: config.aiApiKey,
      model: config.aiModel,
    };
  }

  return getDefaultAiConfig();
}

export type ReasoningLevel = 'fast' | 'deep';

function reasoningEffortFor(
  level?: ReasoningLevel,
): 'low' | 'high' | undefined {
  if (level === 'fast') return 'low';
  if (level === 'deep') return 'high';
  return undefined;
}

function isFreeAiGateway(config: AiConfig): boolean {
  return (
    config.endpointUrl.includes('ai-gateway.sassmaker.com') ||
    config.endpointUrl.includes('free-ai-gateway.sarthakagrawal927.workers.dev')
  );
}

function modelForReasoning(
  config: AiConfig,
  reasoningLevel?: ReasoningLevel,
): string {
  if (reasoningLevel === 'fast' && isFreeAiGateway(config)) {
    return process.env.LINKCHAT_FAST_AI_MODEL || DEFAULT_FAST_AI_MODEL;
  }
  return config.model;
}

function getProvider(config: AiConfig, reasoningLevel?: ReasoningLevel) {
  const freeAi = isFreeAiGateway(config);
  const reasoningEffort = reasoningEffortFor(reasoningLevel);
  return createOpenAICompatible({
    name: 'custom',
    baseURL: config.endpointUrl,
    apiKey: config.apiKey,
    headers: freeAi
      ? { 'x-gateway-project-id': FREE_AI_PROJECT_ID }
      : undefined,
    transformRequestBody: freeAi
      ? (body) => ({
          ...body,
          project_id: FREE_AI_PROJECT_ID,
          ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
        })
      : undefined,
  });
}

// Latency vs. quality intent. Sent to the free-ai gateway as OpenAI-compatible
// `reasoning_effort`; the gateway picks the actual model. Karte
// surfaces decide based on UX:
//   - `fast`  → chat, demo-chat, welcome cards (real-time / one-shot
//               where latency matters)
//   - `deep`  → newspaper, encyclopedia, roast (one-shot generations
//               where output quality matters more than latency)

/**
 * Generate a non-streaming text completion.
 */
export async function generate(
  config: AiConfig,
  opts: {
    system: string;
    prompt: string;
    reasoningLevel?: ReasoningLevel;
    maxOutputTokens?: number;
    timeoutMs?: number;
  },
): Promise<string> {
  const provider = getProvider(config, opts.reasoningLevel);
  const { text } = await generateText({
    model: provider.chatModel(modelForReasoning(config, opts.reasoningLevel)),
    system: opts.system,
    prompt: opts.prompt,
    maxRetries: 0,
    ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    ...(opts.timeoutMs ? { timeout: { totalMs: opts.timeoutMs } } : {}),
  });
  return text;
}

/**
 * Generate a non-streaming completion from a message history. Same shape
 * as `generate()` but for multi-turn conversations.
 */
export async function generateChat(
  config: AiConfig,
  opts: {
    system: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    reasoningLevel?: ReasoningLevel;
    maxOutputTokens?: number;
    timeoutMs?: number;
  },
): Promise<string> {
  const provider = getProvider(config, opts.reasoningLevel);
  const { text } = await generateText({
    model: provider.chatModel(modelForReasoning(config, opts.reasoningLevel)),
    system: opts.system,
    messages: opts.messages,
    maxRetries: 0,
    ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    ...(opts.timeoutMs ? { timeout: { totalMs: opts.timeoutMs } } : {}),
  });
  return text;
}

/**
 * Stream a chat completion. Returns a Response with SSE text stream.
 */
export function streamResponse(
  config: AiConfig,
  opts: {
    system: string;
    prompt: string;
    reasoningLevel?: ReasoningLevel;
    maxOutputTokens?: number;
    timeoutMs?: number;
  },
): Response {
  const provider = getProvider(config, opts.reasoningLevel);
  const result = streamText({
    model: provider.chatModel(modelForReasoning(config, opts.reasoningLevel)),
    system: opts.system,
    prompt: opts.prompt,
    maxRetries: 0,
    ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    ...(opts.timeoutMs
      ? { timeout: { totalMs: opts.timeoutMs, chunkMs: opts.timeoutMs } }
      : {}),
  });
  return result.toTextStreamResponse();
}

/**
 * List available models from an OpenAI-compatible endpoint.
 */
export async function listModels(
  endpointUrl: string,
  apiKey: string,
): Promise<{ id: string; name?: string }[]> {
  // The /models endpoint is standard across OpenAI-compatible APIs
  const baseUrl = endpointUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status}`);
  }

  const data = await res.json();
  const models = data.data || data.models || data;

  if (!Array.isArray(models)) return [];

  return models.map((m: { id: string; name?: string }) => ({
    id: m.id,
    name: m.name,
  }));
}
