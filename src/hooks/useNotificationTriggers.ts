import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Lead, LeadStatus } from '@/types/lead';

export function useNotificationTriggers() {
  const { addNotification } = useNotifications();

  // Notification when a lead is assigned to an agent
  const notifyLeadAssigned = useCallback((leadName: string, agentName?: string) => {
    addNotification(
      'lead_assigned',
      agentName 
        ? `Lead "${leadName}" has been assigned to ${agentName}`
        : `A new lead "${leadName}" has been assigned to you`,
    );
  }, [addNotification]);

  // Notification when a meeting is booked
  const notifyMeetingBooked = useCallback((leadName: string, date?: string) => {
    addNotification(
      'meeting_booked',
      date 
        ? `Meeting booked for "${leadName}" on ${date}`
        : `A meeting has been booked for "${leadName}"`,
    );
  }, [addNotification]);

  // Notification when lead requires follow-up
  const notifyFollowUpRequired = useCallback((leadName: string) => {
    addNotification(
      'follow_up_required',
      `Lead "${leadName}" requires follow-up`,
    );
  }, [addNotification]);

  // Notification when lead is overdue
  const notifyLeadOverdue = useCallback((leadName: string, daysOverdue: number) => {
    addNotification(
      'lead_overdue',
      `Lead "${leadName}" is ${daysOverdue} day(s) overdue`,
    );
  }, [addNotification]);

  // Notification when agent reaches capacity (admin only)
  const notifyAgentCapacityFull = useCallback((agentName: string) => {
    addNotification(
      'agent_capacity_full',
      `Agent "${agentName}" has reached maximum lead capacity`,
    );
  }, [addNotification]);

  // Notification for unassigned leads (admin only)
  const notifyUnassignedLeads = useCallback((count: number) => {
    addNotification(
      'unassigned_leads',
      `There are ${count} unassigned leads waiting for distribution`,
    );
  }, [addNotification]);

  // Notification when new agent registers (admin only)
  const notifyNewAgentRegistered = useCallback((agentName: string) => {
    addNotification(
      'new_agent_registered',
      `New agent "${agentName}" has registered`,
    );
  }, [addNotification]);

  // Notify based on status change
  const notifyStatusChange = useCallback((lead: Lead, oldStatus: LeadStatus, newStatus: LeadStatus) => {
    const leadName = String(lead['Name'] || lead['Full Name'] || lead['Email'] || `Lead ${lead.id}`);
    
    if (newStatus === 'meeting booked') {
      notifyMeetingBooked(leadName);
    } else if (newStatus === 'follow up') {
      notifyFollowUpRequired(leadName);
    }
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
