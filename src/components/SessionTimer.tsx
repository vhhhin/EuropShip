import React from 'react';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

export default function SessionTimer() {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT';
  const { isRunning, elapsedTime, startTimer, stopTimer, formatTime } = useTimeTracking();

  // Only show for agents
  if (!isAgent) return null;

  return (
    <div className="flex items-center gap-2 ml-4">
      <span className="font-mono text-sm text-foreground">{formatTime(elapsedTime)}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={isRunning ? stopTimer : startTimer}
        className="h-8 w-8 p-0"
        title={isRunning ? 'Stop Timer' : 'Start Timer'}
      >
        {isRunning ? (
          <Square className="w-4 h-4 text-destructive" />
        ) : (
          <Play className="w-4 h-4 text-success" />
        )}
      </Button>
    </div>
  );
}
