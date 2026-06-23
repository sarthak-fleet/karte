import type { pages } from '@/db/schema';

export {
  MAX_AGENT_CAPABILITIES,
  normalizeAgentCapabilities,
} from './agent-capabilities';
export const MAX_AGENT_PURPOSE_LENGTH = 500;
export const MAX_AGENT_OPERATOR_LENGTH = 100;
export const MAX_AGENT_DISCLOSURE_LENGTH = 1_000;

export type AgentPageRow = typeof pages.$inferSelect;

export function buildAgentManifest(page: AgentPageRow, origin: string) {
  const verified = Boolean(page.verifiedDomain && page.verifiedAt);

  return {
    slug: page.slug,
    name: page.displayName,
    purpose: page.agentPurpose ?? page.bio ?? null,
    operator: {
      name: page.agentOperator ?? null,
      url: page.agentOperatorUrl ?? null,
      verified,
      verified_at: page.verifiedAt ? page.verifiedAt.toISOString() : null,
      verified_domain: page.verifiedDomain ?? null,
    },
    capabilities: page.agentCapabilities ?? [],
    chat: page.chatEnabled
      ? {
          url: `${origin}/api/chat/${page.slug}`,
          shape: page.brainEndpointShape ?? 'openai-chat',
        }
      : null,
    disclosure: page.agentDisclosurePolicy ?? null,
    published: Boolean(page.published),
    registry: origin,
    manifest_url: `${origin}/${page.slug}/agent.json`,
  };
}

export function sanitizeAgentPageResponse(page: AgentPageRow) {
  return {
    id: page.id,
    slug: page.slug,
    pageType: page.pageType,
    displayName: page.displayName,
    bio: page.bio,
    avatarUrl: page.avatarUrl,
    published: page.published,
    chatEnabled: page.chatEnabled,
    agentPurpose: page.agentPurpose,
    agentOperator: page.agentOperator,
    agentOperatorUrl: page.agentOperatorUrl,
    agentCapabilities: page.agentCapabilities ?? [],
    agentDisclosurePolicy: page.agentDisclosurePolicy,
    brainEndpointUrl: page.brainEndpointUrl,
    brainEndpointShape: page.brainEndpointShape,
    hasBrainEndpointAuth: Boolean(page.brainEndpointAuth),
    verifiedDomain: page.verifiedDomain,
    verifiedAt: page.verifiedAt,
    verificationMethod: page.verificationMethod,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}
