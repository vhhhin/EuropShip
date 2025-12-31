import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Play, Square, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { refetch, isLoading } = useLeads();
  const { isRunning, elapsedTime, startTimer, stopTimer, formatTime, getTodayTime } = useTimeTracking();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-base sm:text-lg text-foreground truncate">
          {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Agent Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
        {/* Time Tracking (for Agents) */}
        {user?.role === 'AGENT' && (
          <div className="hidden sm:flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-lg bg-secondary border border-border">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-xs md:text-sm font-medium text-foreground whitespace-nowrap">
              {formatTime(isRunning ? elapsedTime : getTodayTime())}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0"
              onClick={isRunning ? stopTimer : startTimer}
              title={isRunning ? 'Stop Timer' : 'Start Timer'}
            >
              {isRunning ? (
                <Square className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
              ) : (
                <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              )}
            </Button>
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
}