import React from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function HeaderSessionTimer() {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT' && user?.email === 'agent.euroship';
  const {
    isRunning,
    elapsedTime,
    startTimer,
    pauseTimer,
    stopTimer,
    formatTime,
  } = useTimeTracking();

  if (!isAgent) return null;

  return (
    <div className="flex items-center gap-2 bg-muted rounded px-3 py-1">
      <span className="font-mono text-sm text-orange-400">
        ⏱ {formatTime(elapsedTime)}
      </span>
      {!isRunning ? (
        <button onClick={startTimer} title="Start" className="text-green-400">
          <Play size={16} />
        </button>
      ) : (
        <>
          <button
            onClick={pauseTimer}
            title="Pause"
            className="text-yellow-400"
          >
            <Pause size={16} />
          </button>
          <button
            onClick={stopTimer}
            title="Stop"
            className="text-red-400"
          >
            <Square size={16} />
          </button>
        </>
      )}
    </div>
  );
}
