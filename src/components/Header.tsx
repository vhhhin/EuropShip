import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext'; // Add useAuth import
import { NOTIFICATION_ICONS } from '@/types/notification';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import HeaderSessionTimer from '@/components/HeaderSessionTimer';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Get user role
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  // Filter notifications based on user role
  const filteredNotifications = React.useMemo(() => {
    if (user?.role === 'ADMIN') {
      return notifications; // Admin sees all
    } else if (user?.role === 'AGENT') {
      // Agent sees only personal notifications related to their assigned leads
      const allowedTypes = ['lead_assigned', 'meeting_booked', 'follow_up_required', 'lead_overdue'];
      return notifications.filter(n => allowedTypes.includes(n.type));
    }
    return [];
  }, [notifications, user?.role]);

  // Compute filtered unread count
  const filteredUnreadCount = React.useMemo(() => {
    return filteredNotifications.filter(n => !n.isRead).length;
  }, [filteredNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-200",
          "hover:bg-secondary text-muted-foreground hover:text-foreground",
          isOpen && "bg-secondary text-foreground",
          filteredUnreadCount > 0 && "animate-pulse" // Use filteredUnreadCount
        )}
        aria-label={`Notifications ${filteredUnreadCount > 0 ? `(${filteredUnreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {filteredUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold text-white bg-destructive rounded-full animate-bounce">
            {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {filteredUnreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                  {filteredUnreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {filteredUnreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              {filteredNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                      notification.isRead 
                        ? "bg-transparent hover:bg-secondary/30" 
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg",
                      notification.isRead ? "bg-secondary" : "bg-primary/20"
                    )}>
                      {NOTIFICATION_ICONS[notification.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-snug",
                        notification.isRead ? "text-muted-foreground" : "text-foreground font-medium"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {filteredNotifications.length > 5 && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30">
              <p className="text-xs text-center text-muted-foreground">
                Showing {filteredNotifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  // RÈGLE MÉTIER : Utiliser uniquement user.role depuis la base de données
  // Aucun email ne doit être hardcodé
  const isAgent = user?.role === 'AGENT';

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-primary">
      <div className="flex items-center gap-4">
        {isAgent && <HeaderSessionTimer />}
        <NotificationDropdown />
      </div>
    </header>
  );
}