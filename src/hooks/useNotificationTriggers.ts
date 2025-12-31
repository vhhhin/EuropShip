import { useCallback } from 'react';
import { Lead, LeadStatus } from '@/types/lead';

// Create a no-op function for when notifications are unavailable
const noop = () => {};

export function useNotificationTriggers() {
  // Try to get addNotification, but don't throw if unavailable
  let addNotification: (type: string, message: string) => void = noop;
  
  try {
    // Dynamic import to avoid hook order issues
    const { useNotifications } = require('@/contexts/NotificationContext');
    const context = useNotifications();
    if (context?.addNotification) {
      addNotification = context.addNotification;
    }
  } catch {
    // Context not available, use noop
  }

  const notifyLeadAssigned = useCallback((leadName: string, agentName?: string) => {
    try {
      addNotification(
        'lead_assigned',
        agentName 
          ? `Lead "${leadName}" has been assigned to ${agentName}`
          : `A new lead "${leadName}" has been assigned to you`,
      );
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyMeetingBooked = useCallback((leadName: string, date?: string) => {
    try {
      addNotification(
        'meeting_booked',
        date 
          ? `Meeting booked for "${leadName}" on ${date}`
          : `A meeting has been booked for "${leadName}"`,
      );
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyFollowUpRequired = useCallback((leadName: string) => {
    try {
      addNotification('follow_up_required', `Lead "${leadName}" requires follow-up`);
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyLeadOverdue = useCallback((leadName: string, daysOverdue: number) => {
    try {
      addNotification('lead_overdue', `Lead "${leadName}" is ${daysOverdue} day(s) overdue`);
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyAgentCapacityFull = useCallback((agentName: string) => {
    try {
      addNotification('agent_capacity_full', `Agent "${agentName}" has reached maximum lead capacity`);
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyUnassignedLeads = useCallback((count: number) => {
    try {
      addNotification('unassigned_leads', `There are ${count} unassigned leads waiting for distribution`);
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyNewAgentRegistered = useCallback((agentName: string) => {
    try {
      addNotification('new_agent_registered', `New agent "${agentName}" has registered`);
    } catch { /* ignore */ }
  }, [addNotification]);

  const notifyStatusChange = useCallback((lead: Lead, oldStatus: LeadStatus, newStatus: LeadStatus) => {
    try {
      const leadName = String(lead['Name'] || lead['Full Name'] || lead['Email'] || `Lead ${lead.id}`);
      if (newStatus === 'meeting booked') {
        notifyMeetingBooked(leadName);
      } else if (newStatus === 'follow up') {
        notifyFollowUpRequired(leadName);
      }
    } catch { /* ignore */ }
  }, [notifyMeetingBooked, notifyFollowUpRequired]);

  return {
    notifyLeadAssigned,
    notifyMeetingBooked,
    notifyFollowUpRequired,
    notifyLeadOverdue,
    notifyAgentCapacityFull,
    notifyUnassignedLeads,
    notifyNewAgentRegistered,
    notifyStatusChange,
  };
}
