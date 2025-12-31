import { Play, Pause, Square } from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
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
    <div className="flex items-center gap-2 text-sm text-white">
      <span className="font-mono">⏱ {formatTime(elapsedTime)}</span>
      {!isRunning ? (
        <button onClick={startTimer} title="Start">
          <Play size={16} />
        </button>
      ) : (
        <button onClick={pauseTimer} title="Pause">
          <Pause size={16} />
        </button>
      )}
      <button onClick={stopTimer} title="Stop">
        <Square size={16} />
      </button>
    </div>
  );
}
