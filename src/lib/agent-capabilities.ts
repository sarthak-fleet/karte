export type AgentCapability = {
  id: string;
  label?: string;
  description: string;
};

const MAX_AGENT_CAPABILITIES = 20;

export function normalizeAgentCapabilities(
  value: unknown,
): AgentCapability[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return null;

  const normalized: AgentCapability[] = [];
  for (const item of value.slice(0, MAX_AGENT_CAPABILITIES)) {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const description =
      typeof record.description === 'string' ? record.description.trim() : '';
    const label =
      typeof record.label === 'string' ? record.label.trim() : undefined;

    if (!id || !description) return null;
    normalized.push({
      id,
      description,
      ...(label ? { label } : {}),
    });
  }

  return normalized;
}
