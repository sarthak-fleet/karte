import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

export type AiConfig = {
  endpointUrl: string;
  apiKey: string;
  model: string;
};

const DEFAULT_AI_ENDPOINT_URL = 'https://free-ai-gateway.sarthakagrawal927.workers.dev/v1';
const DEFAULT_AI_MODEL = 'workers-ai-llama-3.3-70b';

export function getDefaultAiConfig(): AiConfig | null {
  const apiKey = process.env.LINKCHAT_DEFAULT_AI_API_KEY;
  if (!apiKey) return null;

  return {
    endpointUrl: process.env.LINKCHAT_DEFAULT_AI_ENDPOINT_URL || DEFAULT_AI_ENDPOINT_URL,
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

function getProvider(config: AiConfig) {
  return createOpenAICompatible({
    name: 'custom',
    baseURL: config.endpointUrl,
    apiKey: config.apiKey,
  });
}

function getProviderOptions(config: AiConfig) {
  if (!config.endpointUrl.includes('free-ai-gateway.sarthakagrawal927.workers.dev')) {
    return undefined;
  }

  return {
    custom: {
      project_id: 'linkchat',
    },
  };
}

/**
 * Generate a non-streaming text completion.
 */
export async function generate(
  config: AiConfig,
  opts: { system: string; prompt: string },
): Promise<string> {
  const provider = getProvider(config);
  const { text } = await generateText({
    model: provider.chatModel(config.model),
    system: opts.system,
    prompt: opts.prompt,
    providerOptions: getProviderOptions(config),
  });
  return text;
}

/**
 * Stream a chat completion. Returns a Response with SSE text stream.
 */
export function streamResponse(
  config: AiConfig,
  opts: { system: string; prompt: string },
): Response {
  const provider = getProvider(config);
  const result = streamText({
    model: provider.chatModel(config.model),
    system: opts.system,
    prompt: opts.prompt,
    providerOptions: getProviderOptions(config),
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
