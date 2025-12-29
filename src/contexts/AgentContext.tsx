import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Agent, AgentStatus, AgentRole, AgentStats } from '@/types/agent';

interface AgentContextType {
  agents: Agent[];
  getAgent: (id: string) => Agent | undefined;
  getAgentByEmail: (email: string) => Agent | undefined;
  getActiveAgents: () => Agent[];
  addAgent: (agent: Omit<Agent, 'id' | 'currentLeadsCount' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  setAgentCapacity: (id: string, maxDailyLeads: number) => void;
  incrementLeadCount: (id: string) => void;
  decrementLeadCount: (id: string) => void;
  resetDailyLeadCounts: () => void;
  getAgentStats: () => AgentStats;
  getAvailableAgentForAssignment: () => Agent | null;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const STORAGE_KEY = 'euroship_agents';

// Default agents for demo
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@euroship.com',
    role: 'AGENT',
    status: 'active',
    maxDailyLeads: 15,
    currentLeadsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@euroship.com',
    role: 'AGENT',
    status: 'active',
    maxDailyLeads: 12,
    currentLeadsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike@euroship.com',
    role: 'AGENT',
    status: 'active',
    maxDailyLeads: 10,
    currentLeadsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadAgents(): Agent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load agents:', e);
  }
  return DEFAULT_AGENTS;
}

function saveAgents(agents: Agent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch (e) {
    console.error('Failed to save agents:', e);
  }
}

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(loadAgents);

  // Save to localStorage when agents change
  useEffect(() => {
    saveAgents(agents);
  }, [agents]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  const getAgentByEmail = useCallback((email: string) => {
    return agents.find(a => a.email.toLowerCase() === email.toLowerCase());
  }, [agents]);

  const getActiveAgents = useCallback(() => {
    return agents.filter(a => a.status === 'active');
  }, [agents]);

  const addAgent = useCallback((agentData: Omit<Agent, 'id' | 'currentLeadsCount' | 'createdAt' | 'updatedAt'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: `agent-${Date.now()}`,
      currentLeadsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents(prev => [...prev, newAgent]);
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    ));
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  }, []);

  const setAgentStatus = useCallback((id: string, status: AgentStatus) => {
    updateAgent(id, { status });
  }, [updateAgent]);

  const setAgentCapacity = useCallback((id: string, maxDailyLeads: number) => {
    updateAgent(id, { maxDailyLeads });
  }, [updateAgent]);

  const incrementLeadCount = useCallback((id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, currentLeadsCount: a.currentLeadsCount + 1, updatedAt: new Date().toISOString() } : a
    ));
  }, []);

  const decrementLeadCount = useCallback((id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, currentLeadsCount: Math.max(0, a.currentLeadsCount - 1), updatedAt: new Date().toISOString() } : a
    ));
  }, []);

  const resetDailyLeadCounts = useCallback(() => {
    setAgents(prev => prev.map(a => ({ ...a, currentLeadsCount: 0, updatedAt: new Date().toISOString() })));
  }, []);

  const getAgentStats = useCallback((): AgentStats => {
    const activeAgents = agents.filter(a => a.status === 'active');
    const totalCapacity = activeAgents.reduce((sum, a) => sum + a.maxDailyLeads, 0);
    const usedCapacity = activeAgents.reduce((sum, a) => sum + a.currentLeadsCount, 0);
    
    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      inactiveAgents: agents.filter(a => a.status === 'inactive').length,
      totalCapacity,
      usedCapacity,
      availableCapacity: totalCapacity - usedCapacity,
      agentsAtCapacity: activeAgents.filter(a => a.currentLeadsCount >= a.maxDailyLeads).length,
      agentsAvailable: activeAgents.filter(a => a.currentLeadsCount < a.maxDailyLeads).length,
    };
  }, [agents]);

  const getAvailableAgentForAssignment = useCallback((): Agent | null => {
    const available = agents
      .filter(a => a.status === 'active' && a.currentLeadsCount < a.maxDailyLeads)
      .sort((a, b) => {
        // Sort by utilization (lowest first)
        const utilA = a.currentLeadsCount / a.maxDailyLeads;
        const utilB = b.currentLeadsCount / b.maxDailyLeads;
        return utilA - utilB;
      });
    
    return available[0] || null;
  }, [agents]);

  return (
    <AgentContext.Provider value={{
      agents,
      getAgent,
      getAgentByEmail,
      getActiveAgents,
      addAgent,
      updateAgent,
      deleteAgent,
      setAgentStatus,
      setAgentCapacity,
      incrementLeadCount,
      decrementLeadCount,
      resetDailyLeadCounts,
      getAgentStats,
      getAvailableAgentForAssignment,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within AgentProvider');
  }
  return context;
}
