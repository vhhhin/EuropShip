import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Play, Square } from 'lucide-react';

export default function DashboardHeader() {
  const { user } = useAuth();
  const { refetch, isLoading } = useLeads();
  const { isRunning, elapsedTime, startTimer, stopTimer, formatTime, getTodayTime } = useTimeTracking();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-lg text-foreground">
          {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Agent Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Time Tracking (for Agents) */}
        {user?.role === 'AGENT' && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary border border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium text-foreground">
              {formatTime(isRunning ? elapsedTime : getTodayTime())}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={isRunning ? stopTimer : startTimer}
              title={isRunning ? 'Stop Timer' : 'Start Timer'}
            >
              {isRunning ? (
                <Square className="w-4 h-4 text-destructive" />
              ) : (
                <Play className="w-4 h-4 text-success" />
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
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
}