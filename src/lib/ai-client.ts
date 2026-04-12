import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

export type AiConfig = {
  endpointUrl: string;
  apiKey: string;
  model: string;
};

function getProvider(config: AiConfig) {
  return createOpenAICompatible({
    name: 'custom',
    baseURL: config.endpointUrl,
    apiKey: config.apiKey,
  });
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
