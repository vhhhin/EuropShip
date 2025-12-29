import { useCallback, useEffect, useRef } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useAgents } from '@/contexts/AgentContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Lead, LeadStatus } from '@/types/lead';

export function useLeadDistribution() {
  const { getAllLeads, updateLead, getStats } = useLeads();
  const { 
    agents, 
    getActiveAgents, 
    incrementLeadCount, 
    decrementLeadCount,
    getAgentByEmail 
  } = useAgents();
  
  let addNotification: ((type: string, message: string) => void) | null = null;
  try {
    const notifications = useNotifications();
    addNotification = notifications.addNotification;
  } catch {
    // NotificationProvider might not be available
  }

  const allLeads = getAllLeads();
  const distributionInProgress = useRef(false);

  // Get unassigned leads (not assigned to any agent, and not closed/not interested)
  const getUnassignedLeads = useCallback((): Lead[] => {
    return allLeads.filter(lead => 
      !lead.assignedAgent && 
      lead.status !== 'meeting booked' &&
      lead.status !== 'not interested' &&
      lead.status !== 'not qualified'
    );
  }, [allLeads]);

  // Get leads assigned to a specific agent
  const getLeadsByAgent = useCallback((agentEmail: string): Lead[] => {
    return allLeads.filter(lead => 
      lead.assignedAgent?.toLowerCase() === agentEmail.toLowerCase() &&
      lead.status !== 'not interested' &&
      lead.status !== 'not qualified'
    );
  }, [allLeads]);

  // Calculate real-time lead counts per agent from actual data
  const calculateAgentLeadCounts = useCallback((): Record<string, number> => {
    const counts: Record<string, number> = {};
    
    getActiveAgents().forEach(agent => {
      counts[agent.id] = allLeads.filter(lead => 
        lead.assignedAgent?.toLowerCase() === agent.email.toLowerCase() &&
        lead.status !== 'not interested' &&
        lead.status !== 'not qualified'
      ).length;
    });

    return counts;
  }, [allLeads, getActiveAgents]);

  // Get next available agent with lowest utilization
  const getNextAvailableAgent = useCallback(() => {
    const activeAgents = getActiveAgents();
    const leadCounts = calculateAgentLeadCounts();

    const availableAgents = activeAgents
      .map(agent => ({
        ...agent,
        currentLeads: leadCounts[agent.id] || 0,
        availableSlots: agent.maxDailyLeads - (leadCounts[agent.id] || 0),
        utilization: ((leadCounts[agent.id] || 0) / agent.maxDailyLeads) * 100
      }))
      .filter(agent => agent.availableSlots > 0)
      .sort((a, b) => a.utilization - b.utilization); // Lowest utilization first

    return availableAgents[0] || null;
  }, [getActiveAgents, calculateAgentLeadCounts]);

  // Assign a single lead to an agent
  const assignLeadToAgent = useCallback((leadId: string, agentEmail: string, agentName: string): boolean => {
    try {
      updateLead(leadId, { assignedAgent: agentEmail });
      
      const agent = getAgentByEmail(agentEmail);
      if (agent) {
        incrementLeadCount(agent.id);
      }

      // Get lead name for notification
      const lead = allLeads.find(l => l.id === leadId);
      const leadName = lead 
        ? String(lead['Name'] || lead['Full Name'] || lead['Email'] || lead['Company'] || `Lead ${lead.id}`)
        : 'New Lead';

      if (addNotification) {
        addNotification('lead_assigned', `Lead "${leadName}" assigned to ${agentName}`);
      }

      console.log(`[Distribution] ✅ Assigned lead ${leadId} to ${agentName}`);
      return true;
    } catch (error) {
      console.error(`[Distribution] ❌ Failed to assign lead ${leadId}:`, error);
      return false;
    }
  }, [updateLead, allLeads, incrementLeadCount, getAgentByEmail, addNotification]);

  // Main distribution function - distributes all unassigned leads
  const distributeUnassignedLeads = useCallback((): { distributed: number; remaining: number } => {
    if (distributionInProgress.current) {
      console.log('[Distribution] Distribution already in progress, skipping...');
      return { distributed: 0, remaining: getUnassignedLeads().length };
    }

    distributionInProgress.current = true;
    console.log('[Distribution] Starting lead distribution...');

    const unassigned = getUnassignedLeads();
    let distributed = 0;

    for (const lead of unassigned) {
      const availableAgent = getNextAvailableAgent();
      
      if (!availableAgent) {
        console.log('[Distribution] No more available agents');
        break;
      }

      const success = assignLeadToAgent(
        lead.id, 
        availableAgent.email, 
        `${availableAgent.firstName} ${availableAgent.lastName}`
      );

      if (success) {
        distributed++;
      }
    }

    const remaining = getUnassignedLeads().length;

    console.log(`[Distribution] Completed: ${distributed} distributed, ${remaining} remaining`);

    if (remaining > 0 && addNotification) {
      addNotification('unassigned_leads', `${remaining} leads waiting for distribution`);
    }

    distributionInProgress.current = false;

    return { distributed, remaining };
  }, [getUnassignedLeads, getNextAvailableAgent, assignLeadToAgent, addNotification]);

  // Handle when a lead is completed (frees up capacity)
  const handleLeadCompleted = useCallback((leadId: string, newStatus: LeadStatus) => {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead?.assignedAgent) return;

    const agent = getAgentByEmail(lead.assignedAgent);
    if (!agent) return;

    // If lead is closed/not interested, free up capacity
    if (newStatus === 'not interested' || newStatus === 'not qualified') {
      decrementLeadCount(agent.id);
      console.log(`[Distribution] Lead ${leadId} completed, freeing capacity for ${agent.firstName}`);

      // Auto-distribute from pool
      setTimeout(() => {
        const result = distributeUnassignedLeads();
        if (result.distributed > 0) {
          console.log(`[Distribution] Auto-assigned ${result.distributed} leads after capacity freed`);
        }
      }, 500);
    }
  }, [allLeads, getAgentByEmail, decrementLeadCount, distributeUnassignedLeads]);

  // Force redistribution (admin action)
  const forceRedistribution = useCallback(() => {
    console.log('[Distribution] Force redistribution triggered by admin');
    return distributeUnassignedLeads();
  }, [distributeUnassignedLeads]);

  // Get distribution statistics
  const getDistributionStats = useCallback(() => {
    const unassigned = getUnassignedLeads().length;
    const activeAgents = getActiveAgents();
    const leadCounts = calculateAgentLeadCounts();
    
    const totalCapacity = activeAgents.reduce((sum, a) => sum + a.maxDailyLeads, 0);
    const usedCapacity = Object.values(leadCounts).reduce((sum, c) => sum + c, 0);
    const availableCapacity = totalCapacity - usedCapacity;

    const agentsAtCapacity = activeAgents.filter(a => 
      (leadCounts[a.id] || 0) >= a.maxDailyLeads
    ).length;

    const agentsAvailable = activeAgents.filter(a => 
      (leadCounts[a.id] || 0) < a.maxDailyLeads
    ).length;

    return {
      unassignedLeads: unassigned,
      totalCapacity,
      usedCapacity,
      availableCapacity,
      utilizationRate: totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0,
      agentsAtCapacity,
      agentsAvailable,
      totalActiveAgents: activeAgents.length,
    };
  }, [getUnassignedLeads, getActiveAgents, calculateAgentLeadCounts]);

  // Get detailed agent stats with lead counts
  const getAgentDistributionStats = useCallback(() => {
    const activeAgents = getActiveAgents();
    const leadCounts = calculateAgentLeadCounts();

    return activeAgents.map(agent => {
      const currentLeads = leadCounts[agent.id] || 0;
      const utilization = (currentLeads / agent.maxDailyLeads) * 100;
      const status = utilization >= 100 ? 'full' : utilization >= 80 ? 'busy' : 'available';

      return {
        ...agent,
        currentLeads,
        utilization: Math.min(utilization, 100),
        status,
        availableSlots: Math.max(0, agent.maxDailyLeads - currentLeads),
      };
    }).sort((a, b) => b.currentLeads - a.currentLeads);
  }, [getActiveAgents, calculateAgentLeadCounts]);

  // Auto-distribute on initial load and when agents change
  useEffect(() => {
    const timer = setTimeout(() => {
      const unassigned = getUnassignedLeads();
      if (unassigned.length > 0) {
        console.log(`[Distribution] Auto-distributing ${unassigned.length} unassigned leads on load`);
        distributeUnassignedLeads();
      }
    }, 2000); // Wait 2s for data to load

    return () => clearTimeout(timer);
  }, [agents.length]); // Re-run when agents change

  return {
    getUnassignedLeads,
    getLeadsByAgent,
    calculateAgentLeadCounts,
    getNextAvailableAgent,
    assignLeadToAgent,
    distributeUnassignedLeads,
    handleLeadCompleted,
    forceRedistribution,
    getDistributionStats,
    getAgentDistributionStats,
  };
}
