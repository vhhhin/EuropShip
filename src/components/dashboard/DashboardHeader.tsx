import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Play, Pause, Menu } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useTimeTracking } from '@/contexts/TimeTrackingContext'; // Direct import

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

function SessionTimer() {
  const { isRunning, elapsedTime, startTimer, pauseTimer, stopTimer, formatTime } = useTimeTracking();
  return (
    <div className="flex items-center bg-muted rounded px-3 py-1 ml-2">
      <Clock className="w-4 h-4 mr-2" />
      <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
      {isRunning ? (
        <>
          <button onClick={pauseTimer} className="ml-2 text-yellow-400" title="Pause">
            <Pause className="w-4 h-4" />
          </button>
          <button onClick={stopTimer} className="ml-1 text-red-400" title="Stop">
            <svg width="16" height="16" fill="currentColor"><rect x="4" y="4" width="8" height="8" rx="2"/></svg>
          </button>
        </>
      ) : (
        <button onClick={startTimer} className="ml-2 text-green-400" title="Start">
          <Play className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { refetch, isLoading } = useLeads();

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

        {/* Right Side - Notifications and Timer */}
        <div className="flex items-center">
          {user?.email === 'agent.euroship' && <SessionTimer />}
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}