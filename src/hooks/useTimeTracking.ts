import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TIME_TRACKING_KEY = 'euroship_time_tracking';

interface TimeSession {
  id: string;
  agentId: string;
  agentName: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  date: string;
}

interface TimeTrackingState {
  isRunning: boolean;
  currentSessionStart: number | null;
  sessions: TimeSession[];
}

function loadTimeTrackingData(): TimeTrackingState {
  try {
    const data = localStorage.getItem(TIME_TRACKING_KEY);
    return data ? JSON.parse(data) : { isRunning: false, currentSessionStart: null, sessions: [] };
  } catch {
    return { isRunning: false, currentSessionStart: null, sessions: [] };
  }
}

function saveTimeTrackingData(data: TimeTrackingState): void {
  localStorage.setItem(TIME_TRACKING_KEY, JSON.stringify(data));
}

export function useTimeTracking() {
  const { user } = useAuth();
  const [state, setState] = useState<TimeTrackingState>(loadTimeTrackingData);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isRunning && state.currentSessionStart) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - state.currentSessionStart!) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.currentSessionStart]);

  // Start timer
  const startTimer = useCallback(() => {
    if (!user) return;
    
    setState(prev => {
      const newState = {
        ...prev,
        isRunning: true,
        currentSessionStart: Date.now(),
      };
      saveTimeTrackingData(newState);
      return newState;
    });
    setElapsedTime(0);
  }, [user]);

  // Pause timer (saves current session)
  const pauseTimer = useCallback(() => {
    if (!user || !state.currentSessionStart) return;
    
    const duration = Math.floor((Date.now() - state.currentSessionStart) / 1000);
    const newSession: TimeSession = {
      id: `session-${Date.now()}`,
      agentId: user.id,
      agentName: user.displayName,
      startTime: state.currentSessionStart,
      endTime: Date.now(),
      duration,
      date: new Date().toISOString().split('T')[0],
    };

    setState(prev => {
      const newState = {
        ...prev,
        isRunning: false,
        currentSessionStart: null,
        sessions: [...prev.sessions, newSession],
      };
      saveTimeTrackingData(newState);
      return newState;
    });
    setElapsedTime(0);
  }, [user, state.currentSessionStart]);

  // Stop timer
  const stopTimer = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  // Get total time for current user today
  const getTodayTime = useCallback(() => {
    if (!user) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = state.sessions.filter(
      s => s.agentId === user.id && s.date === today
    );
    
    const totalSeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    return totalSeconds + (state.isRunning ? elapsedTime : 0);
  }, [user, state.sessions, state.isRunning, elapsedTime]);

  // Get all sessions (for admin)
  const getAllSessions = useCallback(() => {
    return state.sessions;
  }, [state.sessions]);

  // Get sessions by agent
  const getSessionsByAgent = useCallback((agentId: string) => {
    return state.sessions.filter(s => s.agentId === agentId);
  }, [state.sessions]);

  // Get time by agent (total for all time)
  const getTimeByAgent = useCallback(() => {
    const agentTimes: Record<string, { agentName: string; totalSeconds: number }> = {};
    
    state.sessions.forEach(session => {
      if (!agentTimes[session.agentId]) {
        agentTimes[session.agentId] = {
          agentName: session.agentName,
          totalSeconds: 0,
        };
      }
      agentTimes[session.agentId].totalSeconds += session.duration;
    });
    
    return agentTimes;
  }, [state.sessions]);

  // Format seconds to HH:MM:SS
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning: state.isRunning,
    elapsedTime,
    startTimer,
    pauseTimer,
    stopTimer,
    getTodayTime,
    getAllSessions,
    getSessionsByAgent,
    getTimeByAgent,
    formatTime,
  };
}
