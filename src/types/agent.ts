export type AgentStatus = 'active' | 'inactive';
export type AgentRole = 'AGENT' | 'ADMIN';

export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AgentRole;
  status: AgentStatus;
  maxDailyLeads: number;
  currentLeadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  agentsAtCapacity: number;
  agentsAvailable: number;
}
