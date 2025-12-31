import React from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

export default function SessionTimer() {
  const { isRunning, elapsedTime, startTimer, pauseTimer, stopTimer, formatTime } = useTimeTracking();

  return (
    <div className="flex items-center gap-2 ml-4">
      <span className="font-mono text-sm text-foreground">{formatTime(elapsedTime)}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={startTimer}
        disabled={isRunning}
        className="h-8 w-8 p-0"
      >
        <Play className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={pauseTimer}
        disabled={!isRunning}
        className="h-8 w-8 p-0"
      >
        <Pause className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={stopTimer}
        className="h-8 w-8 p-0"
      >
        <Square className="w-4 h-4" />
      </Button>
    </div>
  );
}
