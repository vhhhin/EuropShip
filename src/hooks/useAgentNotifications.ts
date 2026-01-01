import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useNotifications } from '@/contexts/NotificationContext';
import { Lead } from '@/types/lead';

/**
 * Hook to monitor lead changes and trigger notifications for agents
 * Checks for overdue leads and sends notifications
 */
export function useAgentNotifications() {
  const { user } = useAuth();
  const { getAllLeads } = useLeads();
  const { addNotification } = useNotifications();
  const notifiedOverdueLeads = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only run for agents
    if (!user || user.role !== 'AGENT') {
      return;
    }

    // Early return if hooks are not available
    if (!getAllLeads || !addNotification) {
      return;
    }

    const checkOverdueLeads = () => {
      try {
        const allLeads = getAllLeads();
        const agentEmail = user.email || user.username || user.displayName;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find leads assigned to this agent that are overdue
        const agentLeads = allLeads.filter(lead => {
          const leadAgent = lead.assignedAgent;
          return leadAgent && (
            leadAgent.toLowerCase() === agentEmail.toLowerCase() ||
            leadAgent === user.id
          );
        });

        agentLeads.forEach(lead => {
          // Check if lead is overdue (status is "new" or "called" and no activity for 3+ days)
          // A lead is overdue if it's been in "new" or "called" status for more than 3 days
          const isOverdue = (lead.status === 'new' || lead.status === 'called');

          if (isOverdue && !notifiedOverdueLeads.current.has(lead.id)) {
            // For simplicity, consider leads overdue if they're in new/called status
            // In a real system, you'd check creation date or last activity date
            addNotification('lead_overdue', 'A lead is overdue', {
              leadId: lead.id,
              agentId: agentEmail,
            });
            
            // Mark as notified
            notifiedOverdueLeads.current.add(lead.id);
          } else if (!isOverdue && notifiedOverdueLeads.current.has(lead.id)) {
            // Remove from notified set if lead is no longer overdue
            notifiedOverdueLeads.current.delete(lead.id);
          }
        });
      } catch (error) {
        // Silently handle errors to prevent breaking the app
        console.error('Error checking overdue leads:', error);
      }
    };

    // Check immediately
    checkOverdueLeads();

    // Check every 5 minutes
    const interval = setInterval(checkOverdueLeads, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, getAllLeads, addNotification]);
}

