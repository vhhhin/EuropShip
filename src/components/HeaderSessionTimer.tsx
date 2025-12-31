import React from 'react';
import { Play, Square } from 'lucide-react';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function HeaderSessionTimer() {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT';
  const {
    isRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    formatTime,
  } = useTimeTracking();

  // Only show for agents
  if (!isAgent) return null;

  return (
    <div className="flex items-center gap-2 bg-muted rounded px-3 py-1">
      <span className="font-mono text-sm text-orange-400">
        ⏱ {formatTime(elapsedTime)}
      </span>
      {!isRunning ? (
        <button 
          onClick={startTimer} 
          title="Start Timer" 
          className="text-green-400 hover:text-green-300 transition-colors"
          aria-label="Start timer"
        >
          <Play size={16} />
        </button>
      ) : (
        <button
          onClick={stopTimer}
          title="Stop Timer"
          className="text-red-400 hover:text-red-300 transition-colors"
          aria-label="Stop timer"
        >
          <Square size={16} />
        </button>
      )}
    </div>
  );
}
