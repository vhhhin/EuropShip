export type NotificationType = 
  | 'lead_assigned'
  | 'meeting_booked'
  | 'follow_up_required'
  | 'lead_overdue'
  | 'agent_capacity_full'
  | 'unassigned_leads'
  | 'new_agent_registered';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  isRead: boolean;
  leadId?: string;
  agentId?: string;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  'lead_assigned': '👤',
  'meeting_booked': '📅',
  'follow_up_required': '🔄',
  'lead_overdue': '⚠️',
  'agent_capacity_full': '🚫',
  'unassigned_leads': '📋',
  'new_agent_registered': '🆕',
};
