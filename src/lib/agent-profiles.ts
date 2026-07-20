import type { AgentCapability, pages } from '@/db/schema';

const DEMO_AGENT_SLUG = 'atlas-demo';

export type AgentPageFields = Pick<
  typeof pages.$inferSelect,
  | 'pageType'
  | 'displayName'
  | 'agentPurpose'
  | 'agentOperator'
  | 'agentOperatorUrl'
  | 'agentCapabilities'
  | 'agentDisclosurePolicy'
  | 'verifiedDomain'
  | 'verifiedAt'
>;

export function isAgentPage(
  page: Pick<typeof pages.$inferSelect, 'pageType'>,
): boolean {
  return page.pageType === 'agent';
}

export function isAgentVerified(page: AgentPageFields): boolean {
  return Boolean(page.verifiedDomain && page.verifiedAt);
}

export function agentOperatorLabel(page: AgentPageFields): string | null {
  if (page.agentOperator?.trim()) return page.agentOperator.trim();
  return null;
}

export function agentCapabilities(page: AgentPageFields): AgentCapability[] {
  return page.agentCapabilities ?? [];
}
