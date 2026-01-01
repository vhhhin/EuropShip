import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationType } from '@/types/notification';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, message: string, extras?: { leadId?: string; agentId?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'euroship_notifications';

// Load notifications from localStorage
function loadNotifications(): Notification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((n: Notification) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
  return [];
}

// Save notifications to localStorage
function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>(loadNotifications);

  // Save to localStorage when notifications change
  useEffect(() => {
    saveNotifications(allNotifications);
  }, [allNotifications]);

  // Filter notifications for current agent only
  const notifications = React.useMemo(() => {
    if (!user || user.role !== 'AGENT') {
      return []; // No notifications for non-agents
    }
    
    // Only show notifications for this specific agent
    return allNotifications.filter(n => {
      // Agent-specific notification types
      const agentTypes: NotificationType[] = ['lead_assigned', 'meeting_booked', 'follow_up_required', 'lead_overdue'];
      if (!agentTypes.includes(n.type)) {
        return false;
      }
      
      // If notification has agentId, match it with current user
      if (n.agentId) {
        return n.agentId === user.id || n.agentId === user.email || n.agentId === user.username;
      }
      
      // For notifications without agentId, include them (will be filtered by type)
      return true;
    });
  }, [allNotifications, user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((
    type: NotificationType, 
    message: string, 
    extras?: { leadId?: string; agentId?: string }
  ) => {
    // Only create notifications for agent-specific types
    const agentTypes: NotificationType[] = ['lead_assigned', 'meeting_booked', 'follow_up_required', 'lead_overdue'];
    if (!agentTypes.includes(type)) {
      return; // Don't create notifications for non-agent types
    }

    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      isRead: false,
      ...extras,
    };

    setAllNotifications(prev => {
      // Avoid duplicate notifications (same type, message, and agentId within 1 minute)
      const isDuplicate = prev.some(n => 
        n.type === type && 
        n.message === message && 
        n.agentId === extras?.agentId &&
        (new Date().getTime() - new Date(n.timestamp).getTime()) < 60000
      );
      
      if (isDuplicate) return prev;
      
      // Keep only last 100 notifications (more for multiple agents)
      const updated = [newNotification, ...prev].slice(0, 100);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!user || user.role !== 'AGENT') return;
    
    // Mark all agent notifications as read
    setAllNotifications(prev =>
      prev.map(n => {
        const agentTypes: NotificationType[] = ['lead_assigned', 'meeting_booked', 'follow_up_required', 'lead_overdue'];
        if (agentTypes.includes(n.type) && (!n.agentId || n.agentId === user.id || n.agentId === user.email || n.agentId === user.username)) {
          return { ...n, isRead: true };
        }
        return n;
      })
    );
  }, [user]);

  const clearNotifications = useCallback(() => {
    if (!user || user.role !== 'AGENT') return;
    
    // Clear only agent notifications
    setAllNotifications(prev =>
      prev.filter(n => {
        const agentTypes: NotificationType[] = ['lead_assigned', 'meeting_booked', 'follow_up_required', 'lead_overdue'];
        if (agentTypes.includes(n.type) && (!n.agentId || n.agentId === user.id || n.agentId === user.email || n.agentId === user.username)) {
          return false;
        }
        return true;
      })
    );
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
