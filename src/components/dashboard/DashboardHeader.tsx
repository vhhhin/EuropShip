import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Play, Pause, Menu } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { refetch, isLoading } = useLeads();
  const { isRunning, elapsedTime, startTimer, pauseTimer, formatTime, getTodayTime } = useTimeTracking();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6">
      <div className="flex items-center justify-between h-full">
        {/* Left Side - Mobile Menu */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right Side - Notifications Only */}
        <div className="flex items-center">
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
