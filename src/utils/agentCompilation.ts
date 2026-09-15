export interface AgentCompilationInput {
  agentId: string;
  agentName: string;
  shopName: string;
  reports: any[];
  leads: any[];
}

export function buildAgentCompilationPayload(input: AgentCompilationInput): any {
  return {
    type: 'agent_compilation',
    generatedAt: new Date().toISOString(),
    agentId: input.agentId,
    agentName: input.agentName,
    shopName: input.shopName,
    reports: input.reports,
    leads: input.leads,
  };
}
